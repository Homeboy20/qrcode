import sys
import os

# Add the parent directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(parent_dir)

from app import db
from db_helper import get_db_path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

def init_db():
    """
    Initialize the database with all models from the app.
    This should be called when running in the Netlify Functions environment
    to ensure the database tables exist.
    """
    # Create engine with the path from our helper
    engine = create_engine(get_db_path())
    
    # Create all tables
    db.metadata.create_all(engine)
    
    print(f"Database initialized at {get_db_path()}")
    
    return True 