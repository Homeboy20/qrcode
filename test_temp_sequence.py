import requests
import json
import time
import webbrowser

def test_temporary_sequence():
    """
    Test that temporary barcodes are generated but not saved to the system.
    """
    print("Testing Temporary Sequence Generation")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get('http://127.0.0.1:5000/')
        if response.status_code != 200:
            print(f"✗ Server is not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Server is not running: {e}")
        return False
    
    print("✓ Server is running")
    
    # Make a request to generate temporary barcodes
    try:
        test_data = {
            'prefix': 'TEST',
            'start': 1,
            'count': 5,
            'barcode_type': 'code128',
            'suffix': '-TEMP',
            'save_to_system': False  # This should make the barcodes temporary
        }
        
        print(f"Sending request to generate {test_data['count']} temporary barcodes...")
        
        response = requests.post(
            'http://127.0.0.1:5000/generate_sequence',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"✗ Request failed with status code: {response.status_code}")
            print(response.text)
            return False
        
        data = response.json()
        
        # Check if temporary barcodes were generated successfully
        if data.get('success') and data.get('temp_barcodes'):
            print(f"✓ Successfully generated {data.get('count')} temporary barcodes")
            
            # Check sequence data
            sequence_data = data.get('sequence_data', [])
            if sequence_data:
                print("Sample barcode data:")
                for i, barcode in enumerate(sequence_data[:2]):  # Show first 2 samples
                    print(f"  - {barcode.get('data')}")
                    
                # Check for base64 image data
                has_images = all('image_data' in barcode for barcode in sequence_data)
                if has_images:
                    print("✓ All barcodes contain base64 image data")
                else:
                    print("✗ Some barcodes are missing image data")
            
            # Check that temp barcodes are not saved to system
            if not data.get('saved_to_system'):
                print("✓ Barcodes were NOT saved to the system (as requested)")
            else:
                print("✗ Barcodes were unexpectedly saved to the system")
                
            # Open browser
            print("\nOpening browser to test the sequence tab in the UI...")
            webbrowser.open('http://127.0.0.1:5000/')
            print("In the browser, click on the 'Sequence' tab to verify the UI works correctly.")
            
            return True
        else:
            print(f"✗ Failed to generate temporary barcodes: {data.get('error', 'Unknown error')}")
            return False
    
    except Exception as e:
        print(f"✗ Error during test: {e}")
        return False

if __name__ == "__main__":
    success = test_temporary_sequence()
    
    if success:
        print("\n✓ Test completed successfully")
    else:
        print("\n✗ Test failed") 