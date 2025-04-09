import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import datetime
import uuid
import json
from werkzeug.security import check_password_hash, generate_password_hash
import secrets
from sqlalchemy import text

# Create a minimal app just for database operations
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barcode_v2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define models without the columns to add
class BarcodeOld(db.Model):
    __tablename__ = 'barcode'
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(255), nullable=False)
    barcode_type = db.Column(db.String(50), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_dynamic = db.Column(db.Boolean, default=False)
    redirect_url = db.Column(db.String(512), nullable=True)
    unique_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True)
    meta_data = db.Column(db.Text, nullable=True)

class UserOld(db.Model):
    __tablename__ = 'user'
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

def main():
    # Connect to the database
    with app.app_context():
        # Check if columns exist first
        conn = db.engine.connect()
        
        # Check if user_id column exists in barcode table
        barcode_user_id_exists = False
        barcode_is_encrypted_exists = False
        try:
            result = conn.execute(text("PRAGMA table_info(barcode)"))
            columns = [row[1] for row in result]
            barcode_user_id_exists = 'user_id' in columns
            barcode_is_encrypted_exists = 'is_encrypted' in columns
            print(f"Barcode table columns: {columns}")
        except Exception as e:
            print(f"Error checking barcode table: {e}")
        
        # Check if encryption_key column exists in user table
        user_encryption_key_exists = False
        try:
            result = conn.execute(text("PRAGMA table_info(user)"))
            columns = [row[1] for row in result]
            user_encryption_key_exists = 'encryption_key' in columns
            print(f"User table columns: {columns}")
        except Exception as e:
            print(f"Error checking user table: {e}")
        
        # Add columns if they don't exist
        try:
            if not barcode_user_id_exists:
                print("Adding user_id column to barcode table...")
                conn.execute(text("ALTER TABLE barcode ADD COLUMN user_id INTEGER REFERENCES user(id)"))
            
            if not barcode_is_encrypted_exists:
                print("Adding is_encrypted column to barcode table...")
                conn.execute(text("ALTER TABLE barcode ADD COLUMN is_encrypted BOOLEAN DEFAULT 0"))
            
            if not user_encryption_key_exists:
                print("Adding encryption_key column to user table...")
                conn.execute(text("ALTER TABLE user ADD COLUMN encryption_key VARCHAR(64)"))
                
                # Generate encryption keys for existing users
                users = UserOld.query.all()
                for user in users:
                    # Add encryption key to the user
                    conn.execute(
                        text("UPDATE user SET encryption_key = :key WHERE id = :id"),
                        {"key": secrets.token_hex(16), "id": user.id}
                    )
                    print(f"Generated encryption key for user: {user.email}")
            
            # Check if the is_encrypted column was successfully added
            if not barcode_is_encrypted_exists:
                result = conn.execute(text("PRAGMA table_info(barcode)"))
                columns = [row[1] for row in result]
                if 'is_encrypted' not in columns:
                    print("Retrying adding is_encrypted column...")
                    conn.execute(text("ALTER TABLE barcode ADD COLUMN is_encrypted INTEGER DEFAULT 0"))
            
            # Commit changes
            db.session.commit()
            print("Database schema updated successfully!")
            
        except Exception as e:
            print(f"Error updating database schema: {e}")
            return
        
        conn.close()

if __name__ == "__main__":
    main() 