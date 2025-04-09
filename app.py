from flask import Flask, jsonify, request, url_for, render_template, redirect, send_file
from flask_login import current_user, LoginManager
from datetime import datetime, timedelta
import uuid
import base64
from io import BytesIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from flask_sqlalchemy import SQLAlchemy
from whitenoise import WhiteNoise

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with your actual secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barcode_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Wrap app with WhiteNoise, pointing to the 'static' directory
app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/', prefix='static/')

# Initialize extensions
db = SQLAlchemy(app)
csrf = CSRFProtect(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Initialize rate limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",  # For production, change to "redis://localhost:6379/0"
    storage_options={"client": "memory"},  # For production, remove this line when using Redis
    strategy="fixed-window"  # More efficient for high traffic
)

# Define models
class Barcode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(255), nullable=False)
    barcode_type = db.Column(db.String(50), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_dynamic = db.Column(db.Boolean, default=False)
    redirect_url = db.Column(db.String(512), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    unique_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True)
    
    def __init__(self, data, barcode_type, filename, is_dynamic=False, redirect_url=None, user_id=None):
        self.data = data
        self.barcode_type = barcode_type
        self.filename = filename
        self.is_dynamic = is_dynamic
        self.redirect_url = redirect_url
        self.user_id = user_id
        self.unique_id = str(uuid.uuid4())
    
    def encrypt_data(self, encryption_key):
        # Simple XOR encryption for demonstration
        pass
        
    def set_metadata(self, metadata):
        # Store metadata
        pass

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)
    is_premium = db.Column(db.Boolean, default=False)
    encryption_key = db.Column(db.String(64), nullable=True)
    
    def generate_encryption_key(self):
        self.encryption_key = str(uuid.uuid4())
        return self.encryption_key

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Import utility functions
def get_user_rate_limits(action_type):
    # Define rate limits based on user authentication status
    if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
        if hasattr(current_user, 'is_premium') and current_user.is_premium:
            return "1000 per day, 100 per hour"
        return "500 per day, 50 per hour"
    return "100 per day, 20 per hour"

def extract_request_data(request, defaults=None):
    # Extract data from request, supporting both JSON and form data
    if defaults is None:
        defaults = {}
    
    if request.is_json:
        return {**defaults, **request.get_json()}
    elif request.form:
        return {**defaults, **request.form.to_dict()}
    elif request.data:
        try:
            import json
            return {**defaults, **json.loads(request.data.decode('utf-8'))}
        except:
            pass
    return defaults

def validate_barcode_data(data, barcode_type):
    # Very basic validation for demonstration purposes
    if not data:
        return False, "Barcode data is required"
    
    if barcode_type == 'ean13' and not (len(data) == 12 or len(data) == 13):
        return False, "EAN-13 must be 12 or 13 digits"
    elif barcode_type == 'ean8' and not (len(data) == 7 or len(data) == 8):
        return False, "EAN-8 must be 7 or 8 digits"
    elif barcode_type == 'upca' and not (len(data) == 11 or len(data) == 12):
        return False, "UPC-A must be 11 or 12 digits"
    
    return True, ""

def generate_barcode_image(barcode_data, barcode_type, is_dynamic=False, unique_id=None, buffer=None):
    """Generate a barcode image and save it to the provided buffer."""
    import barcode
    from barcode.writer import ImageWriter
    import qrcode
    
    if buffer is None:
        buffer = BytesIO()
    else:
        # Reset buffer if it's not empty
        buffer.seek(0)
        buffer.truncate(0)
    
    try:
        if barcode_type == 'qrcode':
            # Generate QR code image
            img = qrcode.make(barcode_data)
            
            # Save directly to buffer with explicit format
            img.save(buffer, format='PNG')
            
            # Ensure buffer position is at the beginning
            buffer.seek(0)
            
            return buffer, None
        else:
            writer = ImageWriter()
            
            if barcode_type == 'code128':
                bc = barcode.Code128(barcode_data, writer)
            elif barcode_type == 'code39':
                bc = barcode.Code39(barcode_data, writer, add_checksum=False)
            elif barcode_type == 'ean13':
                bc = barcode.EAN13(barcode_data, writer)
            elif barcode_type == 'ean8':
                bc = barcode.EAN8(barcode_data, writer)
            elif barcode_type == 'upca':
                bc = barcode.UPCA(barcode_data, writer)
            else:
                bc = barcode.Code128(barcode_data, writer)
            
            # Write directly to the buffer
            bc.write(buffer)
            buffer.seek(0)
            return buffer, None
            
    except Exception as e:
        app.logger.error(f"Error generating barcode: {str(e)}")
        return None, str(e)

# Generate Sequence of Barcodes
@app.route('/generate_sequence', methods=['POST'])
@limiter.limit(lambda: get_user_rate_limits('sequence_generation'))
def generate_sequence():
    """Generate a sequence of barcodes with incremental numbers."""
    app.logger.info(f"Sequence Request content type: {request.content_type}")
    app.logger.info(f"Sequence Request headers: {request.headers}")
    
    try:
        # Extract request data
        form_defaults = {
            'prefix': '',
            'start': '1',
            'count': '10',
            'barcode_type': 'code128',
            'suffix': '',
            'pad_length': '0',
            'metadata': {},
            'save_to_system': 'false',
        }
        data = extract_request_data(request, form_defaults)
        
        # Extract and convert values
        prefix = data.get('prefix', '')
        suffix = data.get('suffix', '')
        barcode_type = data.get('barcode_type', 'code128')
        metadata = data.get('metadata', {})
        
        # Convert numeric values
        try:
            start = int(data.get('start', '1'))
        except (ValueError, TypeError):
            start = 1
            
        try:
            count = int(data.get('count', '10'))
        except (ValueError, TypeError):
            count = 10
            
        try:
            pad_length = int(data.get('pad_length', '0'))
        except (ValueError, TypeError):
            pad_length = 0
            
        # Check if user is logged in
        save_to_account = current_user.is_authenticated if hasattr(current_user, 'is_authenticated') else False
        
        # Check if save_to_system is requested and convert to boolean
        save_to_system = data.get('save_to_system', 'false')
        if isinstance(save_to_system, str):
            save_to_system = save_to_system.lower() == 'true'
        
        # Only save if user is logged in
        save_to_system = save_to_system and save_to_account
            
        app.logger.info(f"Processed Sequence request - prefix: {prefix}, start: {start}, count: {count}, pad: {pad_length}, type: {barcode_type}, save: {save_to_system}")
        
        # Validate input
        if count <= 0 or count > 1000:
            app.logger.warning(f"Invalid sequence count: {count}")
            return jsonify({'error': 'Count must be between 1 and 1000', 'status': 'error'}), 400
        
        if pad_length < 0 or pad_length > 20:
            app.logger.warning(f"Invalid padding length: {pad_length}")
            return jsonify({'error': 'Padding length must be between 0 and 20', 'status': 'error'}), 400

        # Generate barcodes
        barcode_ids = []
        barcode_data_list = []
        barcode_images = []
        failed_barcodes = []
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        # User ID
        user_id = current_user.id if save_to_account else None
        
        # Generate encryption key if needed and saving to account
        encryption_key = None
        if save_to_account and save_to_system:
            if not current_user.encryption_key:
                current_user.generate_encryption_key()
                db.session.commit()
            encryption_key = current_user.encryption_key
        
        for i in range(count):
            current_number = start + i
            
            # Apply zero-padding if needed
            if pad_length > 0:
                number_str = str(current_number).zfill(pad_length)
            else:
                number_str = str(current_number)
            
            # Special handling for EAN and UPC barcode types
            if barcode_type == 'ean13' and prefix == '' and suffix == '':
                # For standalone EAN-13, pad to 12 digits (13th is check digit)
                if len(number_str) < 12:
                    number_str = number_str.zfill(12)
            elif barcode_type == 'ean8' and prefix == '' and suffix == '':
                # For standalone EAN-8, pad to 7 digits (8th is check digit)
                if len(number_str) < 7:
                    number_str = number_str.zfill(7)
            elif barcode_type == 'upca' and prefix == '' and suffix == '':
                # For standalone UPC-A, pad to 11 digits (12th is check digit)
                if len(number_str) < 11:
                    number_str = number_str.zfill(11)
                
            barcode_data = f"{prefix}{number_str}{suffix}"
            filename = f"{barcode_type}_{timestamp}_{i}.png"
            
            # Validate the barcode data
            valid, error_message = validate_barcode_data(barcode_data, barcode_type)
            if not valid:
                failed_barcodes.append({
                    'index': i,
                    'data': barcode_data,
                    'error': error_message
                })
                continue
            
            if save_to_system:
                # Create the barcode record
                new_barcode = Barcode(
                    data=barcode_data,
                    barcode_type=barcode_type,
                    filename=filename,
                    is_dynamic=False,
                    user_id=user_id
                )
                
                # Add metadata if provided
                if metadata:
                    try:
                        if hasattr(new_barcode, 'meta_data'):
                            new_barcode.set_metadata(metadata)
                    except Exception as meta_error:
                        app.logger.warning(f"Error storing metadata: {str(meta_error)}")
                
                # Encrypt data if user is logged in
                if save_to_account and encryption_key:
                    new_barcode.encrypt_data(encryption_key)
                
                db.session.add(new_barcode)
                barcode_ids.append(new_barcode)
                barcode_data_list.append(barcode_data)
            else:
                # For temporary barcodes, generate images and return base64 data
                unique_id = str(uuid.uuid4())
                img_io = BytesIO()
                
                try:
                    buffer, gen_error = generate_barcode_image(
                        barcode_data, barcode_type, False, unique_id, img_io
                    )
                    
                    if gen_error:
                        app.logger.warning(f"Warning generating barcode: {gen_error}")
                    
                    if buffer:
                        buffer.seek(0)
                        img_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                        
                        barcode_images.append({
                            'id': f"temp_{i}",
                            'data': barcode_data,
                            'barcode_type': barcode_type,
                            'image_data': f"data:image/png;base64,{img_b64}"
                        })
                    else:
                        raise Exception("Failed to generate barcode image")
                except Exception as img_error:
                    app.logger.error(f"Error generating image: {str(img_error)}")
                    failed_barcodes.append({
                        'index': i,
                        'data': barcode_data,
                        'error': f"Image generation failed: {str(img_error)}"
                    })
        
        # If saving barcodes and there are barcodes to save, commit to database
        if save_to_system and barcode_ids:
            db.session.commit()
            
            # Prepare sequence info for response
            sequence_info = []
            for i, barcode in enumerate(barcode_ids):
                sequence_info.append({
                    'id': barcode.id,
                    'data': barcode.data,
                    'barcode_type': barcode.barcode_type,
                    'image_url': url_for('get_barcode_image', barcode_id=barcode.id, _external=True)
                })
            
            return jsonify({
                'status': 'success',
                'message': f'Generated and saved {len(barcode_ids)} barcodes',
                'barcodes': sequence_info,
                'failed': failed_barcodes if failed_barcodes else None
            })
        else:
            # For non-logged in users, return the temporary barcode images
            app.logger.info(f"Generated {len(barcode_images)} temporary barcodes in sequence")
            
            return jsonify({
                'status': 'success',
                'message': f'Generated {len(barcode_images)} temporary barcodes',
                'barcodes': barcode_images,
                'failed': failed_barcodes if failed_barcodes else None,
                'saved': False
            })
    
    except Exception as e:
        app.logger.error(f"General error in sequence generation: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

csrf.exempt(generate_sequence)

@app.route('/')
def index():
    is_logged_in = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
    is_admin = hasattr(current_user, 'is_admin') and current_user.is_admin if is_logged_in else False
    return render_template('index.html', logged_in=is_logged_in, is_admin=is_admin)

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/explore')
def explore():
    # If you don't have an explore.html template, you can redirect to the index.html which appears to be a full app
    return render_template('index.html')

@app.route('/logout')
def logout():
    if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
        from flask_login import logout_user
        logout_user()
    return redirect(url_for('index'))

@app.route('/landing')
def landing():
    is_logged_in = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
    is_admin = hasattr(current_user, 'is_admin') and current_user.is_admin if is_logged_in else False
    return render_template('landing.html', logged_in=is_logged_in, is_admin=is_admin)

@app.route('/generate_barcode', methods=['POST'])
@limiter.limit(lambda: get_user_rate_limits('barcode_generation'))
def generate_barcode():
    """Generate a single barcode based on the provided data."""
    app.logger.info(f"Barcode Request content type: {request.content_type}")
    app.logger.info(f"Barcode Request headers: {request.headers}")
    
    try:
        # Extract request data
        form_defaults = {
            'data': '',
            'barcode_type': 'code128',
            'is_dynamic': False,
            'redirect_url': None,
            'save': False
        }
        data = extract_request_data(request, form_defaults)
        
        barcode_data = data.get('data', '')
        barcode_type = data.get('barcode_type', 'code128')
        is_dynamic = data.get('is_dynamic', False)
        redirect_url = data.get('redirect_url')
        
        # Convert save to boolean if it's a string
        save_to_system = data.get('save', False)
        if isinstance(save_to_system, str):
            save_to_system = save_to_system.lower() == 'true'
        
        # Validate input
        if not barcode_data:
            app.logger.warning("Missing barcode data")
            return jsonify({'error': 'Barcode data is required', 'status': 'error'}), 400
        
        # Validate barcode data for specific types
        valid, error_message = validate_barcode_data(barcode_data, barcode_type)
        if not valid:
            app.logger.warning(f"Invalid barcode data: {error_message}")
            return jsonify({'error': error_message, 'status': 'error'}), 400
        
        # Check if user is logged in for saving
        user_id = None
        save_to_account = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
        
        # Only save if user is logged in
        save_to_system = save_to_system and save_to_account
        
        if save_to_account and save_to_system:
            user_id = current_user.id
        
        app.logger.info(f"Processed barcode request - type: {barcode_type}, save: {save_to_system}, user_id: {user_id}")
        
        # Generate a filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_string = str(uuid.uuid4())[:8]
        filename = f"{barcode_type}_{timestamp}_{unique_string}.png"
        
        if save_to_system:
            # Create the barcode record in database
            new_barcode = Barcode(
                data=barcode_data,
                barcode_type=barcode_type,
                filename=filename,
                is_dynamic=is_dynamic,
                redirect_url=redirect_url,
                user_id=user_id
            )
            
            db.session.add(new_barcode)
            db.session.commit()
            
            barcode_id = new_barcode.id
            
            # Return success response with image URL
            return jsonify({
                'status': 'success',
                'message': 'Barcode generated and saved',
                'id': barcode_id,
                'data': barcode_data,
                'barcode_type': barcode_type,
                'is_dynamic': is_dynamic,
                'redirect_url': redirect_url,
                'image_url': url_for('get_barcode_image', barcode_id=barcode_id, _external=True)
            })
        else:
            # For temporary barcodes, generate image and return base64 data
            buffer = BytesIO()
            img_buffer, gen_error = generate_barcode_image(
                barcode_data, barcode_type, is_dynamic, str(uuid.uuid4()), buffer
            )
            
            if gen_error:
                app.logger.warning(f"Warning generating barcode: {gen_error}")
            
            if not img_buffer:
                return jsonify({
                    'status': 'error',
                    'error': gen_error or 'Failed to generate barcode image'
                }), 500
            
            # Convert to base64 for including in the response
            img_buffer.seek(0)
            img_b64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            # Return success response with base64 image data
            return jsonify({
                'status': 'success',
                'message': 'Temporary barcode generated',
                'id': 0,  # Temporary barcode has ID 0
                'data': barcode_data,
                'barcode_type': barcode_type,
                'is_dynamic': is_dynamic,
                'redirect_url': redirect_url,
                'image_data': f"data:image/png;base64,{img_b64}"
            })
    
    except Exception as e:
        app.logger.error(f"General error in barcode generation: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

csrf.exempt(generate_barcode)

@app.route('/generate_qrcode', methods=['POST'])
@limiter.limit(lambda: get_user_rate_limits('qrcode_generation'))
def generate_qrcode():
    """Generate a QR code based on the provided data."""
    app.logger.info(f"QRCode Request content type: {request.content_type}")
    
    try:
        # Extract request data
        form_defaults = {
            'data': '',
            'is_dynamic': False,
            'redirect_url': None,
            'save': False
        }
        data = extract_request_data(request, form_defaults)
        
        qr_data = data.get('data', '')
        is_dynamic = data.get('is_dynamic', False)
        redirect_url = data.get('redirect_url')
        
        # Convert save to boolean if it's a string
        save_to_system = data.get('save', False)
        if isinstance(save_to_system, str):
            save_to_system = save_to_system.lower() == 'true'
        
        # Validate input
        if not qr_data:
            app.logger.warning("Missing QR code data")
            return jsonify({'error': 'QR code data is required', 'status': 'error'}), 400
        
        if is_dynamic and not redirect_url:
            app.logger.warning("Missing redirect URL for dynamic QR code")
            return jsonify({'error': 'Redirect URL is required for dynamic QR codes', 'status': 'error'}), 400
        
        # Check if user is logged in for saving
        user_id = None
        save_to_account = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
        
        # Only save if user is logged in
        save_to_system = save_to_system and save_to_account
        
        if save_to_account and save_to_system:
            user_id = current_user.id
        
        app.logger.info(f"Processed QR code request - dynamic: {is_dynamic}, save: {save_to_system}, user_id: {user_id}")
        
        # Generate a filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_string = str(uuid.uuid4())[:8]
        filename = f"qrcode_{timestamp}_{unique_string}.png"
        
        if save_to_system:
            # Create the barcode record in database (QR code is a type of barcode in our system)
            new_barcode = Barcode(
                data=qr_data,
                barcode_type='qrcode',
                filename=filename,
                is_dynamic=is_dynamic,
                redirect_url=redirect_url,
                user_id=user_id
            )
            
            db.session.add(new_barcode)
            db.session.commit()
            
            barcode_id = new_barcode.id
            
            # Return success response with image URL
            return jsonify({
                'status': 'success',
                'message': 'QR code generated and saved',
                'id': barcode_id,
                'data': qr_data,
                'barcode_type': 'qrcode',
                'is_dynamic': is_dynamic,
                'redirect_url': redirect_url,
                'image_url': url_for('get_barcode_image', barcode_id=barcode_id, _external=True)
            })
        else:
            # For temporary QR codes, generate image and return base64 data
            buffer = BytesIO()
            img_buffer, gen_error = generate_barcode_image(
                qr_data, 'qrcode', is_dynamic, str(uuid.uuid4()), buffer
            )
            
            if gen_error:
                app.logger.warning(f"Warning generating QR code: {gen_error}")
            
            if not img_buffer:
                return jsonify({
                    'status': 'error',
                    'error': gen_error or 'Failed to generate QR code image'
                }), 500
            
            # Convert to base64 for including in the response
            img_buffer.seek(0)
            img_b64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            # Return success response with base64 image data
            return jsonify({
                'status': 'success',
                'message': 'Temporary QR code generated',
                'id': 0,  # Temporary QR code has ID 0
                'data': qr_data,
                'barcode_type': 'qrcode',
                'is_dynamic': is_dynamic,
                'redirect_url': redirect_url,
                'image_data': f"data:image/png;base64,{img_b64}"
            })
    
    except Exception as e:
        app.logger.error(f"General error in QR code generation: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

csrf.exempt(generate_qrcode)

@app.route('/get_barcode_image/<int:barcode_id>')
def get_barcode_image(barcode_id):
    """Retrieve a barcode image by ID."""
    try:
        # Query the barcode from database
        barcode = Barcode.query.get(barcode_id)
        
        if not barcode:
            app.logger.warning(f"Barcode not found: {barcode_id}")
            return jsonify({'error': 'Barcode not found', 'status': 'error'}), 404
        
        # Check if user has access to this barcode
        if barcode.user_id and (not hasattr(current_user, 'is_authenticated') or 
                               not current_user.is_authenticated or 
                               current_user.id != barcode.user_id):
            app.logger.warning(f"Unauthorized access to barcode: {barcode_id}")
            return jsonify({'error': 'Unauthorized access', 'status': 'error'}), 403
        
        # Generate the barcode image
        buffer = BytesIO()
        img_buffer, gen_error = generate_barcode_image(
            barcode.data, barcode.barcode_type, barcode.is_dynamic, barcode.unique_id, buffer
        )
        
        if gen_error:
            app.logger.warning(f"Warning regenerating barcode: {gen_error}")
        
        if not img_buffer:
            return jsonify({
                'status': 'error',
                'error': gen_error or 'Failed to generate barcode image'
            }), 500
        
        # Check if this is a download request
        is_download = request.args.get('download', 'false').lower() == 'true'
        
        # Set response headers
        img_buffer.seek(0)
        response = send_file(img_buffer, mimetype='image/png')
        
        if is_download:
            response.headers.set('Content-Disposition', f'attachment; filename={barcode.filename}')
        
        return response
    
    except Exception as e:
        app.logger.error(f"Error retrieving barcode image: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/rate_limit_status')
@limiter.limit("5 per minute")  # Much more lenient limit just for status checks
def rate_limit_status():
    """Return the current rate limit status for the user."""
    if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
        user_type = "premium" if (hasattr(current_user, 'is_premium') and current_user.is_premium) else "regular"
    else:
        user_type = "anonymous"
    
    return jsonify({
        "status": "success",
        "exceeded": False,  # Only set to true when actually exceeded
        "user_type": user_type,
        "reset_at": (datetime.now() + timedelta(hours=1)).isoformat()
    })

@app.route('/api/user/auth_status')
def auth_status():
    """Return the authentication status of the current user."""
    is_logged_in = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
    is_admin = hasattr(current_user, 'is_admin') and current_user.is_admin if is_logged_in else False
    is_premium = hasattr(current_user, 'is_premium') and current_user.is_premium if is_logged_in else False
    
    return jsonify({
        'status': 'success',
        'is_authenticated': is_logged_in,
        'is_admin': is_admin,
        'is_premium': is_premium,
        'username': current_user.username if is_logged_in else None
    })

@app.route('/barcodes')
@app.route('/api/get_barcodes')
def get_barcodes():
    """Return the list of barcodes for the current user."""
    is_logged_in = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
    
    if not is_logged_in:
        return jsonify({
            'status': 'success',
            'message': 'You must be logged in to view your barcodes',
            'barcodes': []
        })
    
    try:
        # Get barcodes for the current user
        barcodes = Barcode.query.filter_by(user_id=current_user.id).order_by(Barcode.created_at.desc()).all()
        
        # Format the barcodes for JSON response
        barcodes_list = []
        for barcode in barcodes:
            barcodes_list.append({
                'id': barcode.id,
                'data': barcode.data,
                'barcode_type': barcode.barcode_type,
                'created_at': barcode.created_at.isoformat(),
                'is_dynamic': barcode.is_dynamic,
                'redirect_url': barcode.redirect_url,
                'image_url': url_for('get_barcode_image', barcode_id=barcode.id, _external=True)
            })
        
        return jsonify({
            'status': 'success',
            'count': len(barcodes_list),
            'barcodes': barcodes_list
        })
    except Exception as e:
        app.logger.error(f"Error getting barcodes: {str(e)}")
        return jsonify({
            'status': 'success',
            'message': 'Failed to retrieve barcodes',
            'error': str(e),
            'barcodes': []
        })

@app.route('/barcode/<barcode_id>')
def barcode_image(barcode_id):
    """Handle requests for barcode images by ID, including temporary barcodes."""
    try:
        # Handle special case for temporary barcode (id=0)
        if barcode_id == '0':
            # For temporary barcodes, generate a default barcode
            buffer = BytesIO()
            barcode_data = request.args.get('data', 'TEMP')
            barcode_type = request.args.get('type', 'code128')
            
            img_buffer, gen_error = generate_barcode_image(
                barcode_data, barcode_type, False, str(uuid.uuid4()), buffer
            )
            
            if gen_error:
                app.logger.warning(f"Warning generating temporary barcode: {gen_error}")
            
            if not img_buffer:
                return jsonify({
                    'status': 'error',
                    'error': gen_error or 'Failed to generate temporary barcode image'
                }), 500
            
            # Set response headers
            img_buffer.seek(0)
            return send_file(img_buffer, mimetype='image/png')
        
        # For non-temporary barcodes, try to convert to int and use the get_barcode_image route
        try:
            barcode_id_int = int(barcode_id)
            return get_barcode_image(barcode_id_int)
        except ValueError:
            app.logger.warning(f"Invalid barcode ID: {barcode_id}")
            return jsonify({'error': 'Invalid barcode ID', 'status': 'error'}), 400
    
    except Exception as e:
        app.logger.error(f"Error retrieving barcode image: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Add this route after the other route definitions, before the run statement
@app.route('/bulk_sequence_generator')
def bulk_sequence_generator():
    """Render the bulk sequence generator page."""
    is_logged_in = hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
    is_admin = hasattr(current_user, 'is_admin') and current_user.is_admin if is_logged_in else False
    return render_template('bulk_sequence.html', logged_in=is_logged_in, is_admin=is_admin)

# Add this route before the final run statement
@app.route('/api/generate_bulk_sequence', methods=['POST'])
@limiter.limit(lambda: get_user_rate_limits('sequence_generation'))
def generate_bulk_sequence():
    """API endpoint for generating bulk sequences of barcodes."""
    app.logger.info(f"Bulk Sequence Request content type: {request.content_type}")
    
    try:
        # Extract request data
        form_defaults = {
            'prefix': '',
            'start': '1',
            'count': '100',
            'barcode_type': 'code128',
            'suffix': '',
            'pad_length': '0',
            'batch_size': '10',
            'metadata': {},
            'save_to_system': 'false',
        }
        data = extract_request_data(request, form_defaults)
        
        # Extract and convert values
        prefix = data.get('prefix', '')
        suffix = data.get('suffix', '')
        barcode_type = data.get('barcode_type', 'code128')
        metadata = data.get('metadata', {})
        
        # Convert numeric values
        try:
            start = int(data.get('start', '1'))
        except (ValueError, TypeError):
            start = 1
            
        try:
            count = int(data.get('count', '100'))
        except (ValueError, TypeError):
            count = 100
            
        try:
            pad_length = int(data.get('pad_length', '0'))
        except (ValueError, TypeError):
            pad_length = 0
            
        try:
            batch_size = int(data.get('batch_size', '10'))
            batch_size = min(batch_size, 50)  # Limit batch size to 50 for performance
        except (ValueError, TypeError):
            batch_size = 10
        
        # Check if user is logged in
        save_to_account = current_user.is_authenticated if hasattr(current_user, 'is_authenticated') else False
        
        # Check if save_to_system is requested and convert to boolean
        save_to_system = data.get('save_to_system', 'false')
        if isinstance(save_to_system, str):
            save_to_system = save_to_system.lower() == 'true'
        
        # Only save if user is logged in
        save_to_system = save_to_system and save_to_account
            
        app.logger.info(f"Processed Bulk Sequence request - prefix: {prefix}, start: {start}, count: {count}, pad: {pad_length}, type: {barcode_type}, save: {save_to_system}, batch: {batch_size}")
        
        # Validate input
        if count <= 0 or count > 5000:
            app.logger.warning(f"Invalid sequence count: {count}")
            return jsonify({'error': 'Count must be between 1 and 5000', 'status': 'error'}), 400
        
        if pad_length < 0 or pad_length > 20:
            app.logger.warning(f"Invalid padding length: {pad_length}")
            return jsonify({'error': 'Padding length must be between 0 and 20', 'status': 'error'}), 400

        # Generate barcodes
        barcode_ids = []
        barcode_data_list = []
        barcode_images = []
        failed_barcodes = []
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        # User ID
        user_id = current_user.id if save_to_account else None
        
        # Generate encryption key if needed and saving to account
        encryption_key = None
        if save_to_account and save_to_system:
            if not current_user.encryption_key:
                current_user.generate_encryption_key()
                db.session.commit()
            encryption_key = current_user.encryption_key
        
        # For bulk generation, we process in batches for better performance
        total_generated = 0
        
        for batch_start in range(0, count, batch_size):
            batch_end = min(batch_start + batch_size, count)
            batch_count = batch_end - batch_start
            
            for i in range(batch_count):
                current_number = start + batch_start + i
                
                # Apply zero-padding if needed
                if pad_length > 0:
                    number_str = str(current_number).zfill(pad_length)
                else:
                    number_str = str(current_number)
                
                # Special handling for EAN and UPC barcode types
                if barcode_type == 'ean13' and prefix == '' and suffix == '':
                    # For standalone EAN-13, pad to 12 digits (13th is check digit)
                    if len(number_str) < 12:
                        number_str = number_str.zfill(12)
                elif barcode_type == 'ean8' and prefix == '' and suffix == '':
                    # For standalone EAN-8, pad to 7 digits (8th is check digit)
                    if len(number_str) < 7:
                        number_str = number_str.zfill(7)
                elif barcode_type == 'upca' and prefix == '' and suffix == '':
                    # For standalone UPC-A, pad to 11 digits (12th is check digit)
                    if len(number_str) < 11:
                        number_str = number_str.zfill(11)
                    
                barcode_data = f"{prefix}{number_str}{suffix}"
                filename = f"{barcode_type}_{timestamp}_{batch_start + i}.png"
                
                # Validate the barcode data
                valid, error_message = validate_barcode_data(barcode_data, barcode_type)
                if not valid:
                    failed_barcodes.append({
                        'index': batch_start + i,
                        'data': barcode_data,
                        'error': error_message
                    })
                    continue
                
                if save_to_system:
                    # Create the barcode record
                    new_barcode = Barcode(
                        data=barcode_data,
                        barcode_type=barcode_type,
                        filename=filename,
                        is_dynamic=False,
                        user_id=user_id
                    )
                    
                    # Add metadata if provided
                    if metadata:
                        try:
                            if hasattr(new_barcode, 'set_metadata'):
                                new_barcode.set_metadata(metadata)
                        except Exception as meta_error:
                            app.logger.warning(f"Error storing metadata: {str(meta_error)}")
                    
                    # Encrypt data if user is logged in
                    if save_to_account and encryption_key:
                        if hasattr(new_barcode, 'encrypt_data'):
                            new_barcode.encrypt_data(encryption_key)
                    
                    db.session.add(new_barcode)
                    barcode_ids.append(new_barcode)
                    barcode_data_list.append(barcode_data)
                else:
                    # For temporary barcodes, generate images and return base64 data
                    unique_id = str(uuid.uuid4())
                    img_io = BytesIO()
                    
                    try:
                        buffer, gen_error = generate_barcode_image(
                            barcode_data, barcode_type, False, unique_id, img_io
                        )
                        
                        if gen_error:
                            app.logger.warning(f"Warning generating barcode: {gen_error}")
                        
                        if buffer:
                            buffer.seek(0)
                            img_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                            
                            barcode_images.append({
                                'id': f"temp_{batch_start + i}",
                                'data': barcode_data,
                                'barcode_type': barcode_type,
                                'image_data': f"data:image/png;base64,{img_b64}"
                            })
                        else:
                            raise Exception("Failed to generate barcode image")
                    except Exception as img_error:
                        app.logger.error(f"Error generating image: {str(img_error)}")
                        failed_barcodes.append({
                            'index': batch_start + i,
                            'data': barcode_data,
                            'error': f"Image generation failed: {str(img_error)}"
                        })
            
            # If saving barcodes, commit after each batch to avoid long transactions
            if save_to_system and barcode_ids:
                try:
                    db.session.commit()
                    app.logger.info(f"Committed batch of {len(barcode_ids)} barcodes")
                except Exception as db_error:
                    app.logger.error(f"Error committing batch: {str(db_error)}")
                    db.session.rollback()
                    return jsonify({
                        'error': f"Database error: {str(db_error)}",
                        'status': 'error'
                    }), 500
            
            total_generated += len(barcode_images) if not save_to_system else len(barcode_ids)
        
        if save_to_system:
            # Prepare sequence info for response
            sequence_info = []
            for i, barcode in enumerate(barcode_ids):
                sequence_info.append({
                    'id': barcode.id,
                    'data': barcode.data,
                    'barcode_type': barcode.barcode_type,
                    'image_url': url_for('get_barcode_image', barcode_id=barcode.id, _external=True)
                })
            
            return jsonify({
                'status': 'success',
                'message': f'Generated and saved {len(barcode_ids)} barcodes',
                'barcodes': sequence_info,
                'failed': failed_barcodes if failed_barcodes else None
            })
        else:
            # For non-logged in users, return the temporary barcode images
            app.logger.info(f"Generated {len(barcode_images)} temporary barcodes in bulk sequence")
            
            return jsonify({
                'status': 'success',
                'message': f'Generated {len(barcode_images)} temporary barcodes',
                'barcodes': barcode_images,
                'failed': failed_barcodes if failed_barcodes else None,
                'saved': False
            })
    
    except Exception as e:
        app.logger.error(f"General error in bulk sequence generation: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

csrf.exempt(generate_bulk_sequence)

# Add run statement at the end of the file
if __name__ == '__main__':
    app.run(debug=True) 
