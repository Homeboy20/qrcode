import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import datetime
import uuid
import json
from werkzeug.security import check_password_hash, generate_password_hash

# Create a minimal app just for database operations
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barcode_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define models
class Barcode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(255), nullable=False)
    barcode_type = db.Column(db.String(50), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_dynamic = db.Column(db.Boolean, default=False)
    redirect_url = db.Column(db.String(512), nullable=True)
    unique_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True)
    meta_data = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    is_encrypted = db.Column(db.Boolean, default=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)  # Allow nullable for phone-only auth
    phone_number = db.Column(db.String(20), unique=True, nullable=True)  # Add phone number for auth
    password_hash = db.Column(db.String(255), nullable=True)  # Allow nullable for Firebase auth
    is_premium = db.Column(db.Boolean, default=False)
    subscription_expires = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    account_locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    api_key = db.Column(db.String(64), unique=True, nullable=True)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)  # Add Firebase UID
    encryption_key = db.Column(db.String(64), nullable=True)

class ScanEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode_id = db.Column(db.Integer, db.ForeignKey('barcode.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    referrer = db.Column(db.String(255), nullable=True)
    barcode = db.relationship('Barcode', backref=db.backref('scans', lazy=True))

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

class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref=db.backref('reset_tokens', lazy=True))

def recreate_db():
    """Drop all tables and recreate them with test data"""
    
    # First backup the database
    if os.path.exists('barcode_v2.db'):
        print("Creating backup of existing database...")
        try:
            import shutil
            shutil.copy2('barcode_v2.db', 'barcode_v2_backup.db')
            print("Backup created as barcode_v2_backup.db")
        except Exception as e:
            print(f"Warning: Failed to create backup: {str(e)}")
    
    print("Dropping all tables...")
    with app.app_context():
        db.drop_all()
        
        print("Creating tables with updated schema...")
        db.create_all()

        # Create test admin and user
        print("Creating admin user...")
        admin_user = User(
            email='admin@test.com',
            password_hash=generate_password_hash('adminpass'),
            is_premium=True,
            is_admin=True
        )
        db.session.add(admin_user)

        print("Creating test user...")
        test_user = User(
            email='user@test.com',
            password_hash=generate_password_hash('userpass'),
            is_premium=False
        )
        db.session.add(test_user)
        
        # Create Firebase test user
        print("Creating Firebase test user...")
        firebase_user = User(
            firebase_uid="test-firebase-uid",
            email="firebase@test.com",
            is_premium=False
        )
        db.session.add(firebase_user)
        
        # Create phone test user
        print("Creating phone test user...")
        phone_user = User(
            firebase_uid="test-phone-uid",
            phone_number="+1234567890",
            is_premium=False
        )
        db.session.add(phone_user)
        
        db.session.flush()  # Get IDs without committing

        # Create a test payment
        print("Creating a test payment record...")
        test_payment = Payment(
            user_id=admin_user.id,
            amount=10.0,
            currency='USD',
            payment_method='test',
            transaction_id='test-transaction-123',
            status='completed',
            is_donation=False
        )
        db.session.add(test_payment)

        db.session.commit()
        print("Database recreated successfully!")

if __name__ == "__main__":
    recreate_db() 