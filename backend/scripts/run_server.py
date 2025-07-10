#!/usr/bin/env python
"""
Production server runner script.
Runs the Django server with appropriate settings for different environments.
"""
import os
import sys
import socket
from pathlib import Path

# Add the parent directory to the Python path so we can import Django modules
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

def get_local_ip_addresses():
    """Get all local IP addresses for this machine."""
    ip_addresses = []
    try:
        # Get hostname
        hostname = socket.gethostname()
        
        # Get all IP addresses associated with this hostname
        ip_info = socket.getaddrinfo(hostname, None)
        
        for info in ip_info:
            ip = info[4][0]
            # Filter out loopback and IPv6 addresses
            if not ip.startswith('127.') and not ip.startswith('::') and '.' in ip:
                if ip not in ip_addresses:
                    ip_addresses.append(ip)
    except Exception as e:
        print(f"Error getting IP addresses: {e}")
    
    return ip_addresses

def display_network_info():
    """Display network information for mobile app configuration."""
    print("\n" + "="*60)
    print("NETWORK CONFIGURATION FOR MOBILE APP")
    print("="*60)
    
    ip_addresses = get_local_ip_addresses()
    
    # Prioritize the preferred IP address
    preferred_ip = "172.28.96.144"
    target_ip = preferred_ip if preferred_ip in ip_addresses else (ip_addresses[0] if ip_addresses else None)
    
    if target_ip:
        print(f"\nUsing IP address: {target_ip}")
        print(f"Mobile app API URL: http://{target_ip}:8000/api")
        
        print(f"\nCurrent frontend/.env configuration:")
        print(f"API_BASE_URL={target_ip}")
        
        if target_ip != preferred_ip:
            print(f"\nNote: Preferred IP {preferred_ip} not available, using {target_ip}")
    else:
        print("\nNo network IP addresses found.")
        print("Make sure you're connected to a network.")
    
    print("\n" + "="*60)
    print("Starting Django development server...")
    print("="*60 + "\n")

if __name__ == "__main__":
    # Set default Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Only display network info once by checking if we're not in a Django reload
    if not os.environ.get('RUN_MAIN'):
        display_network_info()
    
    # Run the server
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000']) 