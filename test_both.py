import requests
import json
import time
import os

print("Testing barcode and QR code generation...")

# Test parameters
BASE_URL = "http://127.0.0.1:5000"
HEADERS = {"Content-Type": "application/json", "X-CSRFToken": ""}

def test_endpoint(endpoint, payload, image_filename):
    """Test a specific endpoint and save the resulting image"""
    print(f"\n\n=== Testing {endpoint} endpoint ===")
    url = f"{BASE_URL}/{endpoint}"
    
    try:
        # Make the API request
        print(f"Sending request to: {url}")
        print(f"Payload: {json.dumps(payload)}")
        
        response = requests.post(url, json=payload, headers=HEADERS, timeout=15)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            # Get the response data
            data = response.json()
            print(f"Response success: {data.get('success', False)}")
            
            # Extract image URL
            if "image_url" in data:
                image_url = data["image_url"]
                full_url = f"{BASE_URL}{image_url}"
                print(f"Image URL: {full_url}")
                
                # Download the image
                print(f"Downloading image...")
                img_response = requests.get(full_url, timeout=30)
                
                if img_response.status_code == 200:
                    content_length = len(img_response.content)
                    print(f"Image size: {content_length} bytes")
                    
                    # Save the image
                    with open(image_filename, "wb") as f:
                        f.write(img_response.content)
                    
                    print(f"Image saved to {image_filename}")
                    
                    # Check if file exists and has content
                    if os.path.exists(image_filename) and os.path.getsize(image_filename) > 0:
                        print(f"✅ SUCCESS: Valid image generated")
                        return True
                    else:
                        print(f"❌ ERROR: Image file is empty or not created")
                        return False
                else:
                    print(f"❌ ERROR: Failed to download image: {img_response.status_code}")
                    return False
            else:
                print(f"❌ ERROR: No image_url in response: {json.dumps(data)}")
                return False
        else:
            print(f"❌ ERROR: API request failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: Exception during test: {str(e)}")
        return False

# Wait for server to be ready
print("Waiting for server to be ready...")
time.sleep(2)

# Test 1: QR Code generation
qr_success = test_endpoint(
    "generate_qrcode", 
    {
        "data": "https://example.com/test_qr",
        "is_dynamic": False
    },
    "test_qrcode.png"
)

# Test 2: Code128 Barcode generation
code128_success = test_endpoint(
    "generate_barcode", 
    {
        "data": "TEST12345678",
        "barcode_type": "code128",
        "is_dynamic": False
    },
    "test_code128.png"
)

# Test 3: UPC-A Barcode generation
upca_success = test_endpoint(
    "generate_barcode", 
    {
        "data": "123456789012",
        "barcode_type": "upca",
        "is_dynamic": False
    },
    "test_upca.png"
)

# Print summary
print("\n\n=== Test Summary ===")
print(f"QR Code Generation: {'✅ SUCCESS' if qr_success else '❌ FAILED'}")
print(f"Code128 Generation: {'✅ SUCCESS' if code128_success else '❌ FAILED'}")
print(f"UPC-A Generation: {'✅ SUCCESS' if upca_success else '❌ FAILED'}")
print(f"Overall Result: {'✅ SUCCESS' if (qr_success and code128_success and upca_success) else '❌ FAILED'}")

print("\nTest completed.") 