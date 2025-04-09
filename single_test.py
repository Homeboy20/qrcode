import requests
import json
import time

# Test only the barcode endpoint
URL = "http://127.0.0.1:5000/generate_barcode"
PAYLOAD = {
    "data": "123456789012",
    "barcode_type": "upc-a",
    "is_dynamic": False
}
HEADERS = {"Content-Type": "application/json", "X-CSRFToken": ""}

print(f"Testing barcode endpoint: {URL}")
print(f"Payload: {json.dumps(PAYLOAD)}")
print(f"Headers: {HEADERS}")

# Try the request
try:
    response = requests.post(URL, json=PAYLOAD, headers=HEADERS, timeout=15)
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Exception occurred: {str(e)}")
    
print("Test completed.") 