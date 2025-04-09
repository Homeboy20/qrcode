import requests
import json
import time
import os
import traceback

print("=== QR Code Generation and Download Test ===")

# Test parameters
QR_URL = "http://127.0.0.1:5000/generate_qrcode"
BASE_URL = "http://127.0.0.1:5000"
HEADERS = {"Content-Type": "application/json", "X-CSRFToken": ""}
TEST_DATA = "https://example.com/test-qr-download"

# Test QR code generation and download
try:
    # Step 1: Generate QR code
    print("\nStep 1: Generating QR code...")
    payload = {"data": TEST_DATA, "is_dynamic": False}
    
    print(f"Sending request to: {QR_URL}")
    print(f"Payload: {json.dumps(payload)}")
    
    response = requests.post(QR_URL, json=payload, headers=HEADERS, timeout=15)
    print(f"Status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Failed to generate QR code: {response.text}")
        exit(1)
    
    # Step 2: Analyze response
    print("\nStep 2: Analyzing response...")
    try:
        data = response.json()
        print(f"Response received: {json.dumps(data, indent=2)}")
        
        # Verify success status
        if not data.get('success', False):
            print(f"API reported failure: {data.get('error', 'Unknown error')}")
            exit(1)
        
        # Get image URL
        if "image_url" not in data:
            print("No image_url in response")
            exit(1)
            
        image_url = data["image_url"]
        full_url = f"{BASE_URL}{image_url}"
        print(f"QR code image URL: {full_url}")
        
        # Step 3: Download the QR code image
        print("\nStep 3: Downloading QR code image...")
        print(f"Requesting: {full_url}")
        
        # Set headers to force no caching
        download_headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        
        # First try - standard download
        img_response = requests.get(full_url, headers=download_headers, timeout=30)
        print(f"Response status: {img_response.status_code}")
        
        if img_response.status_code != 200:
            print(f"Failed to download image: {img_response.text[:100]}")
            exit(1)
        
        # Check content type
        content_type = img_response.headers.get('Content-Type', '')
        print(f"Content-Type: {content_type}")
        
        if 'image/png' not in content_type:
            print(f"Warning: Unexpected content type: {content_type}")
        
        # Check content length
        content_length = len(img_response.content)
        print(f"Content length: {content_length} bytes")
        
        if content_length < 100:
            print("Warning: Very small image size, possibly corrupt")
            print(f"Content (hex): {img_response.content.hex()}")
        
        # Step 4: Save the image for inspection
        print("\nStep 4: Saving QR code image...")
        output_filename = "download_qr_test.png"
        
        with open(output_filename, "wb") as f:
            f.write(img_response.content)
        
        # Verify file was created
        if os.path.exists(output_filename):
            file_size = os.path.getsize(output_filename)
            print(f"File saved: {output_filename} ({file_size} bytes)")
            
            if file_size != content_length:
                print(f"Warning: File size ({file_size}) doesn't match content length ({content_length})")
        else:
            print(f"Error: Failed to create file {output_filename}")
            exit(1)
            
        print("\n✅ Test completed successfully!")
        print(f"QR code image saved to {output_filename}")
        print("You should be able to open this image to verify it's a valid QR code.")
        
    except json.JSONDecodeError:
        print("Error: Invalid JSON response")
        print(f"Raw response: {response.text[:200]}")
        traceback.print_exc()
        
except Exception as e:
    print(f"Exception: {type(e).__name__}: {str(e)}")
    traceback.print_exc() 