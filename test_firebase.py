import firebase_admin
from firebase_admin import credentials
import json

try:
    print("Testing Firebase credential loading...")
    
    # Let's first check if the JSON file can be properly parsed
    with open('firebase-key.json', 'r') as f:
        key_json = json.load(f)
        print("JSON file parsed successfully")
        
        # Print key properties to verify content
        print(f"- project_id: {key_json.get('project_id')}")
        print(f"- client_email: {key_json.get('client_email')}")
        
        # Check if private_key is properly formatted
        private_key = key_json.get('private_key', '')
        if private_key:
            print(f"- private_key: starts with {private_key[:25]}...")
            print(f"- private_key: ends with ...{private_key[-25:]}")
            
            # Common issue: Check for literal \n vs actual newlines
            if "\\n" in private_key and "\n" not in private_key:
                print("ISSUE DETECTED: Private key contains literal \\n sequences instead of newlines")
                
                # Fix the private key format
                fixed_key = private_key.replace("\\n", "\n")
                key_json['private_key'] = fixed_key
                
                # Write the fixed JSON back
                with open('firebase-key-fixed.json', 'w') as f_fixed:
                    json.dump(key_json, f_fixed, indent=2)
                print("Created firebase-key-fixed.json with corrected private key format")
    
    # Try to initialize Firebase
    try:
        cred = credentials.Certificate('firebase-key.json')
        firebase_app = firebase_admin.initialize_app(cred)
        print("Successfully initialized Firebase with original key file")
    except Exception as e:
        print(f"Error initializing Firebase with original key: {str(e)}")
        
        # Try with fixed key if available
        try:
            if 'fixed_key' in locals():
                cred = credentials.Certificate('firebase-key-fixed.json')
                firebase_app = firebase_admin.initialize_app(cred, name='fixed_app')
                print("Successfully initialized Firebase with fixed key file")
        except Exception as e2:
            print(f"Error initializing Firebase with fixed key: {str(e2)}")
    
except Exception as e:
    print(f"Error in test script: {str(e)}") 