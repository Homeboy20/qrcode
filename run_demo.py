import subprocess
import time
import webbrowser
import os
import sys
import signal
import threading
import atexit

def check_server_running():
    """Check if the server is already running on port 5000"""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect(('127.0.0.1', 5000))
        s.close()
        return True
    except:
        return False

def start_server():
    """Start the Flask server in a subprocess"""
    print("Starting Flask server...")
    
    # Use pythonw.exe on Windows to avoid opening a console window
    python_executable = 'pythonw' if sys.platform == 'win32' else 'python'
    
    # Start the server process
    server_process = subprocess.Popen(
        [python_executable, 'app.py'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    )
    
    # Register function to terminate server on exit
    atexit.register(lambda: server_process.terminate())
    
    # Wait for server to start
    max_attempts = 10
    for i in range(max_attempts):
        if check_server_running():
            print(f"Server started successfully on http://127.0.0.1:5000/")
            break
        print(f"Waiting for server to start... ({i+1}/{max_attempts})")
        time.sleep(1)
    else:
        print("Failed to start server after multiple attempts.")
        sys.exit(1)
    
    return server_process

def open_demo_page():
    """Open the integration test page in the default browser"""
    demo_path = os.path.abspath('test_integration.html')
    demo_url = f'file:///{demo_path}'
    print(f"Opening demo page: {demo_url}")
    webbrowser.open(demo_url)

def main():
    print("Barcode & QR Code Generator Demo")
    print("-" * 40)
    
    # Check if server is already running
    if check_server_running():
        print("Server is already running on http://127.0.0.1:5000/")
    else:
        # Start server in background
        server_process = start_server()
    
    # Wait a moment to ensure server is ready
    time.sleep(2)
    
    # Open the demo page in default browser
    open_demo_page()
    
    print("\nDemo is now running.")
    print("Press Ctrl+C to stop the server and exit.")
    
    try:
        # Keep script running until interrupted
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")

if __name__ == "__main__":
    main()