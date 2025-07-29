#!/usr/bin/env python
"""
Production server runner script.
Runs the Django server with appropriate settings for different environments.
"""
import os
import sys
import socket
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file at the project root
dotenv_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

# Add the parent directory to the Python path so we can import Django modules
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

def read_env_file():
    """Read the .env file from the frontend directory."""
    frontend_dir = BASE_DIR.parent / "frontend"
    env_file = frontend_dir / ".env"
    
    if not env_file.exists():
        return None
    
    env_vars = {}
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print(f"Error reading .env file: {e}")
        return None
    
    return env_vars

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
    
    # Read IP address from .env file
    env_vars = read_env_file()
    target_ip = None
    
    if env_vars and 'API_BASE_URL' in env_vars:
        target_ip = env_vars['API_BASE_URL']
        print(f"\nUsing IP address from .env file: {target_ip}")
        print(f"Mobile app API URL: http://{target_ip}:8000/api")
        
        print(f"\nCurrent frontend/.env configuration:")
        print(f"API_BASE_URL={target_ip}")
        
        # Verify the IP is accessible
        ip_addresses = get_local_ip_addresses()
        if target_ip not in ip_addresses:
            print(f"\nWarning: IP {target_ip} from .env file is not currently available")
            print("Available IP addresses:", ", ".join(ip_addresses) if ip_addresses else "None")
        else:
            print(f"\n✓ IP address {target_ip} is available and accessible")
    else:
        print("\nNo .env file found or API_BASE_URL not configured.")
        print("Available IP addresses:", ", ".join(get_local_ip_addresses()))
        print("Please create frontend/.env with API_BASE_URL=<your_ip_address>")
    
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