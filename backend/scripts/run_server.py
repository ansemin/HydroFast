#!/usr/bin/env python
"""
Production server runner script.
Runs the Django server with appropriate settings for different environments.
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the Python path so we can import Django modules
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

if __name__ == "__main__":
    # Set default Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Run the server
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000']) 