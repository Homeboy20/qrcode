import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def get_csrf_token():
    """Get a CSRF token from the server"""
    try:
        response = requests.get(f"{BASE_URL}/test_barcode_generation")
        if response.status_code == 200:
            print("Successfully retrieved page to get CSRF token")
            # Extract CSRF token from the HTML
            html = response.text
            csrf_token = None
            for line in html.split('\n'):
                if 'csrf_token' in line and 'value' in line:
                    start = line.find('value="') + 7
                    end = line.find('"', start)
                    if start > 7 and end > start:
                        csrf_token = line[start:end]
                        break
            
            if csrf_token:
                print(f"CSRF token obtained: {csrf_token[:10]}...")
                return csrf_token
            else:
                print("CSRF token not found in the page")
                return None
        else:
            print(f"Failed to get page for CSRF token: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting CSRF token: {e}")
        return None

def test_generate_barcode():
    """Test the generate_barcode endpoint"""
    print("\nTesting generate_barcode endpoint...")
    url = f"{BASE_URL}/generate_barcode"
    
    payload = {
        "data": "123456789012",  # 12 digits for UPC-A
        "barcode_type": "upc-a",
        "is_dynamic": False
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": ""  # Empty CSRF token header
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Generate Barcode Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we can get the barcode by ID
            if "id" in data:
                barcode_id = data["id"]
                img_url = f"{BASE_URL}/barcode/{barcode_id}"
                img_response = requests.get(img_url)
                print(f"Image URL: {img_url}")
                print(f"Image fetch status: {img_response.status_code}")
            
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_generate_qrcode():
    """Test the generate_qrcode endpoint"""
    print("\nTesting generate_qrcode endpoint...")
    url = f"{BASE_URL}/generate_qrcode"
    
    payload = {
        "data": "https://example.com",
        "is_dynamic": False
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": ""  # Empty CSRF token header
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Generate QR Code Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we can get the QR code by ID
            if "id" in data:
                qrcode_id = data["id"]
                img_url = f"{BASE_URL}/barcode/{qrcode_id}"
                img_response = requests.get(img_url)
                print(f"Image URL: {img_url}")
                print(f"Image fetch status: {img_response.status_code}")
            
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_generate_sequence():
    """Test the generate_sequence endpoint"""
    print("\nTesting generate_sequence endpoint...")
    url = f"{BASE_URL}/generate_sequence"
    
    payload = {
        "prefix": "TEST",
        "start": 1,
        "count": 5,
        "barcode_type": "code128",
        "suffix": "END"
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": ""  # Empty CSRF token header
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Generate Sequence Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we can get one of the generated barcodes
            if "ids" in data and data["ids"]:
                barcode_id = data["ids"][0]
                img_url = f"{BASE_URL}/barcode/{barcode_id}"
                img_response = requests.get(img_url)
                print(f"First image URL: {img_url}")
                print(f"Image fetch status: {img_response.status_code}")
            
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_batch_generate():
    """Test the batch_generate_barcodes endpoint"""
    print("\nTesting batch_generate_barcodes endpoint...")
    url = f"{BASE_URL}/batch_generate_barcodes"
    
    payload = {
        "items": [
            {
                "data": "123456789012",
                "barcode_type": "upc-a",
                "is_dynamic": False
            },
            {
                "data": "ABCDEF123456",
                "barcode_type": "code128",
                "is_dynamic": False
            }
        ]
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": ""  # Empty CSRF token header
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Batch Generate Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we can get one of the generated barcodes
            if "results" in data and data["results"]:
                barcode_id = data["results"][0].get("id")
                if barcode_id:
                    img_url = f"{BASE_URL}/barcode/{barcode_id}"
                    img_response = requests.get(img_url)
                    print(f"First image URL: {img_url}")
                    print(f"Image fetch status: {img_response.status_code}")
            
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def try_api_without_csrf():
    """Try API endpoints with X-Csrf-Token header set to empty"""
    print("\nTrying API without CSRF token but with X-Csrf-Token header...")
    
    # Test barcode endpoint
    url = f"{BASE_URL}/generate_barcode"
    payload = {
        "barcode_data": "123456789012",
        "barcode_type": "upc-a",
        "is_dynamic": False
    }
    headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": ""  # Empty CSRF token header
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Generate Barcode with X-CSRFToken: {response.status_code}")
        
        if response.status_code == 200:
            print("Success! API works with X-CSRFToken header")
            return True
        else:
            print(f"Still failed with X-CSRFToken header: {response.text[:100]}...")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def main():
    """Run all the tests"""
    print("Starting API tests...")
    
    # First check if Flask app is running
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print(f"Flask app is not running or returned status {response.status_code}. Please start the app first.")
            return
    except Exception:
        print("Flask app is not running. Please start the app first.")
        return
    
    # Wait for server to be fully ready
    print("Waiting for server to be fully ready...")
    time.sleep(2)
    
    # Run tests
    success1 = test_generate_barcode()
    time.sleep(1)  # Add small delay between tests
    
    success2 = test_generate_qrcode()
    time.sleep(1)
    
    success3 = test_generate_sequence()
    time.sleep(1)
    
    success4 = test_batch_generate()
    
    # Print summary
    print("\nTest Summary:")
    print(f"Barcode Generation: {'SUCCESS' if success1 else 'FAILED'}")
    print(f"QR Code Generation: {'SUCCESS' if success2 else 'FAILED'}")
    print(f"Sequence Generation: {'SUCCESS' if success3 else 'FAILED'}")
    print(f"Batch Generation: {'SUCCESS' if success4 else 'FAILED'}")
    print(f"All tests passed: {success1 and success2 and success3 and success4}")

if __name__ == "__main__":
    main() 