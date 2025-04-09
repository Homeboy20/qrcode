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
    meta_data = db.Column(db.Text, nullable=True)  # Explicit column name 'meta_data'
    
    def get_metadata(self):
        """Parse and return the metadata as a dictionary."""
        if not self.meta_data:
            return {}
        try:
            return json.loads(self.meta_data)
        except:
            return {}
            
    def set_metadata(self, data):
        """Set metadata from a dictionary."""
        if data and isinstance(data, dict):
            self.meta_data = json.dumps(data)
        else:
            self.meta_data = None

# Scan Analytics Model
class ScanEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode_id = db.Column(db.Integer, db.ForeignKey('barcode.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    referrer = db.Column(db.String(255), nullable=True)
    
    # Relationship
    barcode = db.relationship('Barcode', backref=db.backref('scans', lazy=True))

# User Data Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    subscription_expires = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    account_locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    api_key = db.Column(db.String(64), unique=True, nullable=True)

# Password Reset Token model
class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Create all tables
with app.app_context():
    # Drop all tables first to ensure clean slate
    db.drop_all()
    print("Dropped all existing tables.")
    
    # Create tables
    db.create_all()
    print("Database tables created successfully!")
    
    # Print table schema to verify meta_data column is created
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    print("\nCreated tables:")
    for table in tables:
        print(f"- {table}")
        columns = inspector.get_columns(table)
        for column in columns:
            print(f"  * {column['name']} ({column['type']})")
    
    # Verify barcode columns explicitly
    print("\nBarcode table columns:")
    for column in inspector.get_columns('barcode'):
        print(f"  * {column['name']} ({column['type']})")
            
print("\nDatabase setup complete!") 