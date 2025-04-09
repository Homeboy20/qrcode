import requests
import time
import webbrowser
import os

def test_sequence_generator():
    print("Testing Sequence Generator")
    print("="*50)
    
    # Check if the server is running
    try:
        response = requests.get('http://127.0.0.1:5000/sequence_generator')
        if response.status_code == 200:
            print("✓ Sequence generator page is accessible")
        else:
            print(f"✗ Could not access sequence generator page: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Server is not running: {str(e)}")
        print("Please start the Flask server with 'python app.py'")
        return False
    
    # Test sequence generation API
    try:
        # Create test payload
        test_payload = {
            'prefix': 'TEST-',
            'start': 1,
            'count': 3,
            'pad_length': 3,
            'barcode_type': 'code128',
            'suffix': '-ABC'
        }
        
        # Make API request
        response = requests.post(
            'http://127.0.0.1:5000/generate_sequence',
            json=test_payload
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✓ Successfully generated sequence with {data.get('count')} barcodes")
                if 'sequence_data' in data:
                    print("  Generated barcodes:")
                    for barcode in data.get('sequence_data', [])[:3]:
                        print(f"  - {barcode.get('data')} (ID: {barcode.get('id')})")
            else:
                print(f"✗ Failed to generate sequence: {data.get('error')}")
                return False
        else:
            print(f"✗ API request failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error during API test: {str(e)}")
        return False
    
    # Open sequence generator in browser if successful
    try:
        print("\nOpening sequence generator in browser...")
        webbrowser.open('http://127.0.0.1:5000/sequence_generator')
        return True
    except Exception as e:
        print(f"✗ Could not open browser: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_sequence_generator()
    if success:
        print("\n✓ All tests completed successfully")
        print("Please check your browser to view the sequence generator interface")
    else:
        print("\n✗ Test failed") 