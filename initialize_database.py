from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import datetime
import uuid
from werkzeug.security import generate_password_hash

# Create a minimal Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barcode_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define all models
class Barcode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(255), nullable=False)
    barcode_type = db.Column(db.String(50), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_dynamic = db.Column(db.Boolean, default=False)
    redirect_url = db.Column(db.String(512), nullable=True)
    unique_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True)

class ScanEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode_id = db.Column(db.Integer, db.ForeignKey('barcode.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    referrer = db.Column(db.String(255), nullable=True)
    barcode = db.relationship('Barcode', backref=db.backref('scans', lazy=True))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    subscription_expires = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)

    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    is_donation = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref=db.backref('payments', lazy=True))

class ScanLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode_id = db.Column(db.Integer, db.ForeignKey('barcode.id'), nullable=False)
    scan_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    barcode = db.relationship('Barcode', backref=db.backref('scan_logs', lazy=True))

def init_db():
    """Initialize the database with all tables and test users"""
    
    print("Creating database tables...")
    with app.app_context():
        db.create_all()

        # Create test admin and user if they don't exist
        if not User.query.filter_by(email='admin@test.com').first():
            print("Creating admin user...")
            admin_user = User(
                email='admin@test.com',
                password_hash=generate_password_hash('adminpass'),
                is_premium=True,
                is_admin=True
            )
            db.session.add(admin_user)

        if not User.query.filter_by(email='user@test.com').first():
            print("Creating test user...")
            test_user = User(
                email='user@test.com',
                password_hash=generate_password_hash('userpass'),
                is_premium=False
            )
            db.session.add(test_user)

        # Create a test payment to ensure the schema is working
        print("Creating a test payment record...")
        admin = User.query.filter_by(email='admin@test.com').first()
        if admin:
            test_payment = Payment(
                user_id=admin.id,
                amount=10.0,
                currency='USD',
                payment_method='test',
                transaction_id='test-transaction-123',
                status='completed',
                is_donation=False
            )
            db.session.add(test_payment)

        db.session.commit()
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_db() 