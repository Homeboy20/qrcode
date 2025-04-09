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