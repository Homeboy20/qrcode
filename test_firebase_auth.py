import requests
import json
import base64
import hmac
import hashlib
import time
import re

# This is a test script to simulate Firebase authentication
# In a real environment, this token would come from Firebase client SDK

# Create a mock Firebase ID token for testing
def create_mock_firebase_token(uid, email=None, phone_number=None):
    """
    Create a mock Firebase token for testing purposes.
    This is NOT a real Firebase token, just a simulation for testing.
    """
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    
    # Current time and expiration
    now = int(time.time())
    
    # Create payload
    payload = {
        "iss": "https://securetoken.google.com/ndosa-barcode",
        "aud": "ndosa-barcode",
        "auth_time": now,
        "sub": uid,
        "iat": now,
        "exp": now + 3600,  # 1 hour from now
        "user_id": uid,
        "firebase": {
            "identities": {},
            "sign_in_provider": "custom"
        }
    }
    
    # Add email or phone if provided
    if email:
        payload["email"] = email
        payload["email_verified"] = True
        payload["firebase"]["identities"]["email"] = [email]
        payload["firebase"]["sign_in_provider"] = "password"
    
    if phone_number:
        payload["phone_number"] = phone_number
        payload["firebase"]["identities"]["phone"] = [phone_number]
        payload["firebase"]["sign_in_provider"] = "phone"
    
    # Encode header and payload
    header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    # Create signature (in real life, this would be signed by Firebase)
    secret = "test_secret_key"
    message = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
    signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    # Combine to form JWT
    token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    
    return token

def extract_csrf_token(html):
    """Extract CSRF token from HTML"""
    # Look for the CSRF token in the HTML
    csrf_match = re.search(r'<input[^>]*name="csrf_token"[^>]*value="([^"]*)"', html)
    if csrf_match:
        return csrf_match.group(1)
    return None

# Test all auth flows in sequence to maintain the same session
def test_all_auth_flows():
    # Create session to handle cookies and CSRF
    session = requests.Session()
    
    # Test email registration
    test_email_registration(session)
    
    # Test phone registration
    test_phone_registration(session)
    
    # Test email login
    test_email_login(session)

# Send a request to register with email
def test_email_registration(session=None):
    if session is None:
        session = requests.Session()
        
    # Create mock token for email user
    uid = "test_uid_1234"
    email = "test_firebase@example.com"
    token = create_mock_firebase_token(uid, email=email)
    
    print("Testing Firebase email authentication (Registration)...")
    
    # Get CSRF token
    response = session.get("http://localhost:5000/register")
    html = response.text
    
    # Extract CSRF token
    csrf_token = extract_csrf_token(html)
    
    if not csrf_token:
        print("Failed to extract CSRF token")
        return False
    
    print(f"Found CSRF token: {csrf_token[:10]}...")
    
    # Register with Firebase token
    data = {
        'csrf_token': csrf_token,
        'firebase_token': token,
        'auth_method': 'email'
    }
    
    response = session.post("http://localhost:5000/register", data=data, allow_redirects=True)
    
    # Check if registration was successful
    if response.status_code == 200 or response.status_code == 302:
        print(f"Email registration successful: {response.status_code}")
        print(f"Response URL: {response.url}")
        return True
    else:
        print(f"Email registration failed: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        return False

# Send a request to register with phone
def test_phone_registration(session=None):
    if session is None:
        session = requests.Session()
        
    # Create mock token for phone user
    uid = "test_uid_5678"
    phone = "+19876543210"
    token = create_mock_firebase_token(uid, phone_number=phone)
    
    print("\nTesting Firebase phone authentication (Registration)...")
    
    # Get CSRF token
    response = session.get("http://localhost:5000/register")
    html = response.text
    
    # Extract CSRF token
    csrf_token = extract_csrf_token(html)
    
    if not csrf_token:
        print("Failed to extract CSRF token")
        return False
    
    print(f"Found CSRF token: {csrf_token[:10]}...")
    
    # Register with Firebase token
    data = {
        'csrf_token': csrf_token,
        'firebase_token': token,
        'auth_method': 'phone'
    }
    
    response = session.post("http://localhost:5000/register", data=data, allow_redirects=True)
    
    # Check if registration was successful
    if response.status_code == 200 or response.status_code == 302:
        print(f"Phone registration successful: {response.status_code}")
        print(f"Response URL: {response.url}")
        return True
    else:
        print(f"Phone registration failed: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        return False

# Test login with email
def test_email_login(session=None):
    if session is None:
        session = requests.Session()
        
    # Create mock token for email user (same as registration to reuse account)
    uid = "test_uid_1234"
    email = "test_firebase@example.com"
    token = create_mock_firebase_token(uid, email=email)
    
    print("\nTesting Firebase email authentication (Login)...")
    
    # Get CSRF token
    response = session.get("http://localhost:5000/login")
    html = response.text
    
    # Extract CSRF token
    csrf_token = extract_csrf_token(html)
    
    if not csrf_token:
        print("Failed to extract CSRF token")
        return False
    
    print(f"Found CSRF token: {csrf_token[:10]}...")
    
    # Login with Firebase token
    data = {
        'csrf_token': csrf_token,
        'firebase_token': token,
        'auth_method': 'email'
    }
    
    response = session.post("http://localhost:5000/login", data=data, allow_redirects=True)
    
    # Check if login was successful
    if response.status_code == 200 or response.status_code == 302:
        print(f"Email login successful: {response.status_code}")
        print(f"Response URL: {response.url}")
        return True
    else:
        print(f"Email login failed: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        return False

if __name__ == "__main__":
    # Test all authentication flows with the same session
    test_all_auth_flows() 