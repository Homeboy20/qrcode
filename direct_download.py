import requests
import os

# The ID of the QR code to download (from the previous test)
QR_ID = 51 
IMAGE_URL = f"http://127.0.0.1:5000/barcode/{QR_ID}"
OUTPUT_FILE = "direct_qr_download.png"

print(f"Attempting to download QR code image directly from: {IMAGE_URL}")

try:
    # Make the request with a large timeout
    response = requests.get(
        IMAGE_URL, 
        headers={
            "Cache-Control": "no-cache",
            "User-Agent": "Mozilla/5.0"  # Pretend to be a browser
        },
        timeout=60,
        stream=True  # Use streaming mode
    )
    
    print(f"Response status code: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        # Get Content-Type and Content-Length
        content_type = response.headers.get('Content-Type', 'unknown')
        content_length = response.headers.get('Content-Length', 'unknown')
        
        print(f"Content-Type: {content_type}")
        print(f"Content-Length: {content_length}")
        
        # Save the response content to a file
        print(f"Saving content to {OUTPUT_FILE}...")
        
        # Use binary mode and chunked downloading to handle potential issues
        with open(OUTPUT_FILE, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:  # filter out keep-alive chunks
                    f.write(chunk)
        
        # Check the saved file
        if os.path.exists(OUTPUT_FILE):
            file_size = os.path.getsize(OUTPUT_FILE)
            print(f"File successfully saved: {OUTPUT_FILE}")
            print(f"File size: {file_size} bytes")
            
            if file_size < 100:
                print("Warning: File is very small, likely not a valid image")
                with open(OUTPUT_FILE, 'rb') as f:
                    content = f.read()
                    print(f"File content (hex): {content.hex()}")
        else:
            print(f"Error: File was not created")
    else:
        print(f"Error: Failed to download image. Response: {response.text}")
        
except Exception as e:
    print(f"Exception occurred: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc() 