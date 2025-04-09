import sys
import os

# Add the parent directory to sys.path to import the Flask app
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(parent_dir)
sys.path.append(current_dir)  # Add current directory to path to find db_helper

# Import the database helper and init modules
import db_helper
from init_db import init_db

# Set environment variables for configuration
# For a real application, you should set these in the Netlify dashboard
if 'NETLIFY' in os.environ:
    # This is just a placeholder - in a real app, you'd set these in Netlify's environment variables
    os.environ['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'temporary_netlify_secret_key')
    
    # Set the database URI using our helper
    os.environ['SQLALCHEMY_DATABASE_URI'] = db_helper.get_db_path()

# Import the Flask app after setting env vars
from app import app

# Initialize the database if running in Netlify
if 'NETLIFY' in os.environ:
    try:
        init_db()
    except Exception as e:
        print(f"Error initializing database: {str(e)}")

# Import serverless_wsgi handler
from serverless_wsgi import handle_request

def handler(event, context):
    """
    AWS Lambda / Netlify Function handler for the Flask app
    """
    return handle_request(app, event, context) 