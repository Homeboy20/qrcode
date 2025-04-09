import requests
import json
import time

# API endpoint
BARCODE_URL = "http://127.0.0.1:5000/generate_barcode"
QRCODE_URL = "http://127.0.0.1:5000/generate_qrcode"

# Add a small delay for server startup
print("Waiting for server to be ready...")
time.sleep(2)

# Test barcode generation
print("\nTesting barcode generation API...")
barcode_payload = {
    "data": "123456789012",  # 12 digits for UPC-A
    "barcode_type": "upc-a",
    "is_dynamic": False
}

barcode_headers = {"Content-Type": "application/json", "X-CSRFToken": ""}

print(f"URL: {BARCODE_URL}")
print(f"Payload: {json.dumps(barcode_payload)}")
print(f"Headers: {barcode_headers}")

try:
    barcode_response = requests.post(BARCODE_URL, json=barcode_payload, headers=barcode_headers, timeout=10)
    print(f"Status Code: {barcode_response.status_code}")
    
    if barcode_response.status_code == 200:
        print("Response: Success!")
        data = barcode_response.json()
        print(json.dumps(data, indent=2))
        
        # Check if image URL exists in the response
        if "image_url" in data:
            image_url = data["image_url"]
            full_url = f"http://127.0.0.1:5000{image_url}"
            print(f"Image URL found: {full_url}")
            
            # Try to access the image
            img_response = requests.get(full_url)
            print(f"Image fetch status: {img_response.status_code}")
            print(f"Image content type: {img_response.headers.get('Content-Type', 'unknown')}")
            print(f"Image size: {len(img_response.content)} bytes")
        else:
            print("Error: No image_url in response")
    else:
        print(f"Error: {barcode_response.text}")
except Exception as e:
    print(f"Exception: {e}")

# Test QR code generation
print("\nTesting QR code generation API...")
qrcode_payload = {
    "data": "https://example.com",
    "is_dynamic": False
}

qrcode_headers = {"Content-Type": "application/json", "X-CSRFToken": ""}

print(f"URL: {QRCODE_URL}")
print(f"Payload: {json.dumps(qrcode_payload)}")
print(f"Headers: {qrcode_headers}")

try:
    qrcode_response = requests.post(QRCODE_URL, json=qrcode_payload, headers=qrcode_headers, timeout=10)
    print(f"Status Code: {qrcode_response.status_code}")
    
    if qrcode_response.status_code == 200:
        print("Response: Success!")
        data = qrcode_response.json()
        print(json.dumps(data, indent=2))
        
        # Check if image URL exists in the response
        if "image_url" in data:
            image_url = data["image_url"]
            full_url = f"http://127.0.0.1:5000{image_url}"
            print(f"Image URL found: {full_url}")
            
            # Try to access the image
            img_response = requests.get(full_url)
            print(f"Image fetch status: {img_response.status_code}")
            print(f"Image content type: {img_response.headers.get('Content-Type', 'unknown')}")
            print(f"Image size: {len(img_response.content)} bytes")
        else:
            print("Error: No image_url in response")
    else:
        print(f"Error: {qrcode_response.text}")
except Exception as e:
    print(f"Exception: {e}")

print("\nTests completed.") 