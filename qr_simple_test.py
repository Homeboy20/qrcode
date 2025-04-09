import requests
import json
import time
import traceback

# Test QR code endpoint
print("Testing QR code endpoint...")
URL = "http://127.0.0.1:5000/generate_qrcode"
payload = {
    "data": "https://example.com/test123",
    "is_dynamic": False
}
headers = {"Content-Type": "application/json", "X-CSRFToken": ""}

try:
    # Wait a moment to ensure server is ready
    time.sleep(1)
    
    # Make the request
    print(f"Sending POST request to {URL}")
    response = requests.post(URL, json=payload, headers=headers, timeout=15)
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        print("Response data:")
        print(json.dumps(data, indent=2))
        
        # Get the image URL and try to access it
        if "image_url" in data:
            image_url = data["image_url"]
            full_url = f"http://127.0.0.1:5000{image_url}"
            print(f"\nAttempting to access image at: {full_url}")
            
            # Try to download the image with explicit timeout and no streaming
            try:
                img_response = requests.get(full_url, timeout=30)
                print(f"Image response status: {img_response.status_code}")
                
                if img_response.status_code == 200:
                    # Check content type
                    content_type = img_response.headers.get('Content-Type', '')
                    print(f"Content-Type: {content_type}")
                    
                    # Get content length
                    content_length = len(img_response.content)
                    print(f"Content length: {content_length} bytes")
                    
                    # Print first few bytes for debugging
                    print(f"First 20 bytes (hex): {img_response.content[:20].hex()}")
                    
                    # Save the image to disk for inspection
                    print("Saving image to qr_test.png...")
                    with open("qr_test.png", "wb") as f:
                        f.write(img_response.content)
                    
                    print("\nSuccess! QR code image saved to qr_test.png")
                else:
                    print(f"Failed to get image: {img_response.text[:100]}")
            except Exception as img_err:
                print(f"Error downloading image: {str(img_err)}")
                traceback.print_exc()
        else:
            print("Error: No image_url in response")
    else:
        print(f"Error response: {response.text}")
except Exception as e:
    print(f"Exception occurred: {str(e)}")
    traceback.print_exc()

print("\nTest completed.") 