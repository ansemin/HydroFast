#!/usr/bin/env python
"""
Helper script to run the Django server on all network interfaces
This makes it accessible from mobile devices on the same network
"""
import os
import sys
import subprocess

def run_server():
    print("Starting Django server on all network interfaces (0.0.0.0:8000)...")
    print("This will make the server accessible from your mobile device")
    print("Use the same IP address that your computer has on the WiFi network")
    
    # Get the IP address (for informational purposes)
    try:
        import socket
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        print(f"Your computer's IP address might be: {ip_address}")
        print("If this doesn't work, check your IP address using 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)")
    except:
        print("Could not determine IP address automatically.")
    
    print("\nAccess the API from your mobile app using: http://YOUR_IP_ADDRESS:8000/api")
    print("Where YOUR_IP_ADDRESS is your computer's IP on the WiFi network")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Run the Django server on all interfaces
    cmd = [sys.executable, "manage.py", "runserver", "0.0.0.0:8000"]
    subprocess.call(cmd)

if __name__ == "__main__":
    # Make sure we're in the right directory
    if not os.path.exists("manage.py"):
        print("Error: This script must be run from the Django project root directory")
        print("Please run this script from the directory containing manage.py")
        sys.exit(1)
    
    run_server() 