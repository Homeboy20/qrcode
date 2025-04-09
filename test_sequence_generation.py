import requests
import json
import base64
from io import BytesIO
from PIL import Image

def test_sequence_generator():
    """Test the sequence generator endpoint"""
    print("Testing sequence generator...")
    
    # Define the API endpoint
    url = "http://127.0.0.1:5000/generate_sequence"
    
    # Define test data
    test_data = {
        "prefix": "TEST",
        "start": 1,
        "count": 3,
        "pad_length": 2,
        "barcode_type": "code128",
        "suffix": "-SEQ"
    }
    
    # Send the POST request
    response = requests.post(url, json=test_data)
    
    # Print the response status code
    print(f"Response status code: {response.status_code}")
    
    # If the response is successful, print the response JSON
    if response.status_code == 200:
        response_json = response.json()
        print("Response JSON:")
        print(json.dumps(response_json, indent=2))
        
        # Check if barcodes were generated
        if "barcodes" in response_json and len(response_json["barcodes"]) > 0:
            print(f"\nGenerated {len(response_json['barcodes'])} barcodes:")
            for i, barcode in enumerate(response_json["barcodes"]):
                print(f"Barcode {i+1}:")
                print(f"  Data: {barcode.get('data', 'N/A')}")
                print(f"  Type: {barcode.get('barcode_type', 'N/A')}")
                print(f"  ID: {barcode.get('id', 'N/A')}")
                
                # Check if image_data exists (for temporary barcodes)
                if "image_data" in barcode and barcode["image_data"]:
                    print("  Image data: Present (base64 encoded)")
                    
                    # Try to decode and verify the image
                    try:
                        # Extract the base64 part after the data:image/png;base64, prefix
                        base64_data = barcode["image_data"].split(",")[1]
                        image_data = base64.b64decode(base64_data)
                        img = Image.open(BytesIO(image_data))
                        print(f"  Image dimensions: {img.width}x{img.height}")
                    except Exception as e:
                        print(f"  Error decoding image: {str(e)}")
                
                # Check if image_url exists (for saved barcodes)
                elif "image_url" in barcode and barcode["image_url"]:
                    print(f"  Image URL: {barcode['image_url']}")
                else:
                    print("  No image data or URL found")
                
                print()
        else:
            print("\nNo barcodes were generated or found in the response")
    else:
        print("Error response content:")
        print(response.text)

if __name__ == "__main__":
    test_sequence_generator() 