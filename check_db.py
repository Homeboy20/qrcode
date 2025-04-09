import sqlite3
import os

# Path to the database file
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'barcode_v2.db')

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print(f"Database: {db_path}")
print(f"Found {len(tables)} tables:")

# For each table, get schema
for table in tables:
    table_name = table[0]
    print(f"\n===== TABLE: {table_name} =====")
    
    # Get table schema
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    
    print("Columns:")
    for col in columns:
        col_id, name, type_, notnull, default_value, pk = col
        print(f"  {name} ({type_}), {'NOT NULL' if notnull else 'NULL'}, {'PK' if pk else ''}")
    
    # Count rows
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        row_count = cursor.fetchone()[0]
        print(f"Row count: {row_count}")
    except sqlite3.Error as e:
        print(f"Error counting rows: {e}")

# Close connection
conn.close() 