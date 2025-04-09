from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import datetime

# Create a minimal app for database operations
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barcode_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    is_premium = db.Column(db.Boolean, default=False)
    subscription_expires = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    account_locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    api_key = db.Column(db.String(64), unique=True, nullable=True)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    encryption_key = db.Column(db.String(64), nullable=True)

with app.app_context():
    # Check if the admin already exists
    existing_admin = User.query.filter_by(email='admin@barcode.com').first()
    
    if existing_admin:
        print(f"Admin user with email {existing_admin.email} already exists!")
    else:
        # Create new admin user
        new_admin = User(
            email='admin@barcode.com',
            password_hash=generate_password_hash('Admin123!'),
            is_premium=True,
            is_admin=True
        )
        
        # Add to database
        db.session.add(new_admin)
        db.session.commit()
        
        print('Admin user created successfully!')
        print('Email: admin@barcode.com')
        print('Password: Admin123!') 