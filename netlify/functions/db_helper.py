import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
import tempfile
import shutil

# Determine if we're running in a Netlify Function environment
IS_NETLIFY = 'NETLIFY' in os.environ

def get_db_path():
    """
    Get the appropriate database path based on environment.
    
    In Netlify Functions, we need to use a temporary directory
    since the deployment environment has a read-only filesystem.
    """
    if IS_NETLIFY:
        # For Netlify, use a temp directory
        temp_dir = tempfile.gettempdir()
        db_path = os.path.join(temp_dir, 'barcode_v2.db')
        
        # If the database doesn't exist in the temp directory,
        # initialize it (in a real application, you'd want to connect
        # to a proper database service instead)
        if not os.path.exists(db_path):
            # Check if there's a source DB file in the repo and copy it to temp
            source_db = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'barcode_v2.db')
            if os.path.exists(source_db):
                try:
                    shutil.copy(source_db, db_path)
                except:
                    # If we can't copy, we'll create a new DB
                    pass
                    
        # Return the SQLAlchemy URI for the temp database
        return f'sqlite:///{db_path}'
    else:
        # For local development, use the original path
        return 'sqlite:///barcode_v2.db'

def get_db_engine():
    """
    Create and return a SQLAlchemy engine with proper configuration
    for the current environment.
    """
    return create_engine(get_db_path())

def get_db_session():
    """
    Create and return a SQLAlchemy scoped session.
    """
    engine = get_db_engine()
    session_factory = sessionmaker(bind=engine)
    return scoped_session(session_factory) 