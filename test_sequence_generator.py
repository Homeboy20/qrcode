import requests
import json
import time
import webbrowser
import pprint

def test_sequence_generator():
    print("Testing sequence generator functionality...")
    
    # Verify server is running
    try:
        response = requests.get('http://127.0.0.1:5000/', timeout=5)
        if response.status_code != 200:
            print(f"Server returned unexpected status code: {response.status_code}")
            return False
        print("Server is running")
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to server: {e}")
        return False
    
    # Test 1: Generate temporary sequence of barcodes
    print("\nTest 1: Generating temporary barcodes...")
    test_data = {
        'prefix': 'TEST',
        'start': 1,
        'count': 5,
        'pad_length': 3,
        'barcode_type': 'code128',
        'suffix': '-TEMP',
        'save_to_system': False  # Important: don't save to system
    }
    
    try:
        response = requests.post(
            'http://127.0.0.1:5000/generate_sequence',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"Error: API returned status code {response.status_code}")
            print(response.text)
            return False
        
        data = response.json()
        print("API Response received")
        
        # Print detailed response structure
        print("\nAPI Response Structure:")
        print("------------------------")
        print(f"Status: {data.get('status')}")
        print(f"Success: {data.get('success')}")
        print(f"Count: {data.get('count')}")
        print(f"Message: {data.get('message')}")
        print(f"Temp barcodes: {data.get('temp_barcodes')}")
        print(f"Saved to system: {data.get('saved_to_system')}")
        print(f"Saved to account: {data.get('saved_to_account')}")
        
        # Check sequence data
        sequence_data = data.get('sequence_data', [])
        print(f"\nSequence data count: {len(sequence_data)}")
        if sequence_data:
            print("\nFirst barcode:")
            for key, value in sequence_data[0].items():
                if key == 'image_data':
                    print(f"- {key}: [Base64 data truncated]")
                else:
                    print(f"- {key}: {value}")
        
        # Verify response structure
        if not data.get('success'):
            print(f"Error: API returned success=False")
            print(data)
            return False
        
        # Check count
        if data.get('count') != 5:
            print(f"Error: Expected 5 barcodes, got {data.get('count')}")
            return False
            
        # Check that barcodes are temporary
        if not data.get('temp_barcodes'):
            print("Error: Expected temp_barcodes=True in response")
            return False
            
        if data.get('saved_to_system'):
            print("Error: Barcodes were saved to system despite save_to_system=False")
            return False
        
        # Verify sequence_data contains expected values
        sequence_data = data.get('sequence_data', [])
        if len(sequence_data) != 5:
            print(f"Error: Expected 5 items in sequence_data, got {len(sequence_data)}")
            return False
            
        # Check first barcode data
        first_barcode = sequence_data[0]
        expected_data = "TEST001-TEMP"
        if first_barcode.get('data') != expected_data:
            print(f"Error: Expected first barcode data to be {expected_data}, got {first_barcode.get('data')}")
            return False
            
        # Check that image_data (base64) is present
        if not first_barcode.get('image_data') or not first_barcode['image_data'].startswith('data:image/png;base64,'):
            print("Error: Base64 image data not found or invalid format")
            return False
            
        print("✓ Temporary barcode generation successful")
        print(f"✓ First barcode data: {first_barcode.get('data')}")
        print("✓ Base64 image data present")
        
        # Open the browser to test UI
        print("\nOpening browser to test the sequence tab in the UI...")
        webbrowser.open('http://127.0.0.1:5000/#sequence-tab')
        
        return True
        
    except Exception as e:
        print(f"Error testing sequence generation: {e}")
        return False
        
if __name__ == "__main__":
    success = test_sequence_generator()
    if success:
        print("\nAll tests completed successfully!")
    else:
        print("\nTests failed. Please check the errors above.") 