import sqlite3
import os

# Path to the database file
DB_PATH = 'barcode_v2.db'

def add_columns():
    """Add new columns to the user table"""
    print(f"Updating database schema in {DB_PATH}...")
    
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(user)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add phone_number column if it doesn't exist
        if 'phone_number' not in columns:
            print("Adding phone_number column to user table...")
            cursor.execute("ALTER TABLE user ADD COLUMN phone_number VARCHAR(20)")
        else:
            print("phone_number column already exists.")
        
        # Add firebase_uid column if it doesn't exist
        if 'firebase_uid' not in columns:
            print("Adding firebase_uid column to user table...")
            cursor.execute("ALTER TABLE user ADD COLUMN firebase_uid VARCHAR(128)")
        else:
            print("firebase_uid column already exists.")
        
        # Make existing columns nullable if they are not already
        # For email field
        try:
            print("Making email and password_hash columns nullable...")
            # SQLite doesn't support ALTER COLUMN, so we need a workaround
            cursor.execute("PRAGMA foreign_keys=off")
            cursor.execute("BEGIN TRANSACTION")
            
            # Get column definitions
            cursor.execute("PRAGMA table_info(user)")
            columns = cursor.fetchall()
            
            # Create new table with updated column definitions
            new_columns = []
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                
                # Make email and password_hash nullable
                if col_name in ('email', 'password_hash'):
                    new_columns.append(f"{col_name} {col_type}")
                else:
                    not_null = "NOT NULL" if col[3] else ""
                    new_columns.append(f"{col_name} {col_type} {not_null}")
            
            # Create new table
            cursor.execute(f"""
                CREATE TABLE user_new (
                    {', '.join(new_columns)}
                )
            """)
            
            # Copy data from old table to new table
            cursor.execute("INSERT INTO user_new SELECT * FROM user")
            
            # Drop old table and rename new table
            cursor.execute("DROP TABLE user")
            cursor.execute("ALTER TABLE user_new RENAME TO user")
            
            # Commit transaction
            cursor.execute("COMMIT")
            cursor.execute("PRAGMA foreign_keys=on")
            print("Email and password_hash columns updated to be nullable.")
        except Exception as e:
            cursor.execute("ROLLBACK")
            cursor.execute("PRAGMA foreign_keys=on")
            print(f"Failed to make columns nullable: {str(e)}")
        
        # Commit changes
        conn.commit()
        print("Database schema updated successfully!")
    except Exception as e:
        print(f"Error updating database schema: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_columns() 