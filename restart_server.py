import os
import sys
import subprocess
import time
import signal
import platform

def kill_flask_process():
    """Kill any running Flask process on port 5000"""
    print("Stopping any existing Flask server...")
    
    # Different commands based on OS
    if platform.system() == "Windows":
        # On Windows
        try:
            # Find processes using port 5000
            result = subprocess.run(
                ["netstat", "-ano", "|", "findstr", ":5000"], 
                shell=True, 
                capture_output=True, 
                text=True
            )
            
            if result.stdout:
                for line in result.stdout.splitlines():
                    if "LISTENING" in line:
                        # Extract PID
                        pid = line.strip().split()[-1]
                        try:
                            # Kill the process
                            subprocess.run(["taskkill", "/F", "/PID", pid], check=True)
                            print(f"Killed process with PID {pid}")
                        except subprocess.CalledProcessError:
                            print(f"Failed to kill process with PID {pid}")
            else:
                print("No Flask server running on port 5000")
        except Exception as e:
            print(f"Error stopping Flask server: {str(e)}")
    else:
        # On Unix-like systems
        try:
            result = subprocess.run(
                ["lsof", "-i", ":5000", "-t"], 
                capture_output=True, 
                text=True
            )
            if result.stdout:
                pid = result.stdout.strip()
                try:
                    os.kill(int(pid), signal.SIGTERM)
                    print(f"Killed process with PID {pid}")
                except ProcessLookupError:
                    print(f"No process with PID {pid}")
            else:
                print("No Flask server running on port 5000")
        except Exception as e:
            print(f"Error stopping Flask server: {str(e)}")

def start_flask_server():
    """Start the Flask server"""
    print("Starting Flask server...")
    
    try:
        # Start Flask server in the background
        if platform.system() == "Windows":
            subprocess.Popen(["python", "app.py"], creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            subprocess.Popen(["python3", "app.py"], 
                            stdout=subprocess.DEVNULL, 
                            stderr=subprocess.DEVNULL)
            
        # Wait for server to start
        print("Waiting for server to start...")
        time.sleep(3)
        print("Flask server should be running now.")
    except Exception as e:
        print(f"Error starting Flask server: {str(e)}")

if __name__ == "__main__":
    kill_flask_process()
    start_flask_server()
    print("\nYou can now run test scripts to verify QR code and barcode generation.") 