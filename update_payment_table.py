from app import app, db, Payment
import sqlite3

def add_missing_columns():
    """Add missing columns to the payment table"""
    
    print("Updating payment table schema...")
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect('barcode_v2.db')
        cursor = conn.cursor()
        
        # Check if transaction_id column exists
        cursor.execute("PRAGMA table_info(payment)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add transaction_id if it doesn't exist
        if 'transaction_id' not in columns:
            print("Adding transaction_id column...")
            cursor.execute("ALTER TABLE payment ADD COLUMN transaction_id VARCHAR(100)")
            
        # Add status if it doesn't exist
        if 'status' not in columns:
            print("Adding status column...")
            cursor.execute("ALTER TABLE payment ADD COLUMN status VARCHAR(20) DEFAULT 'pending'")
            
        # Add is_donation if it doesn't exist
        if 'is_donation' not in columns:
            print("Adding is_donation column...")
            cursor.execute("ALTER TABLE payment ADD COLUMN is_donation BOOLEAN DEFAULT 0")
        
        conn.commit()
        print("Payment table updated successfully!")
        
    except Exception as e:
        print(f"Error updating payment table: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_missing_columns() 