#!/usr/bin/env python
"""
Test script to verify the new comprehensive temp cleanup functionality.
"""

import os
import sys
import django
from pathlib import Path

# Add the Django project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai_processing.session_manager import SessionManager, ProcessingSession
from django.conf import settings

def main():
    print("============================================================")
    print("COMPREHENSIVE TEMP CLEANUP TEST")
    print("============================================================")
    
    # Check current temp directory contents
    temp_root = os.path.join(settings.MEDIA_ROOT, 'temp')
    print(f"📁 Temp root directory: {temp_root}")
    
    temp_dirs = ['generated_stl', 'stl_previews', 'processed_scans']
    
    print("\n🔍 Current temp directory contents:")
    total_files = 0
    for temp_dir in temp_dirs:
        temp_path = os.path.join(temp_root, temp_dir)
        if os.path.exists(temp_path):
            files = os.listdir(temp_path)
            file_count = len(files)
            total_files += file_count
            print(f"   📂 {temp_dir}: {file_count} files")
            for file in files[:3]:  # Show first 3 files
                print(f"      - {file}")
            if file_count > 3:
                print(f"      ... and {file_count - 3} more files")
        else:
            print(f"   📂 {temp_dir}: Directory doesn't exist")
    
    print(f"\n📊 Total files in temp directories: {total_files}")
    
    if total_files == 0:
        print("✅ No temp files to clean up")
        return
    
    # Test the comprehensive cleanup
    print("\n🧹 Testing comprehensive temp cleanup...")
    try:
        cleaned_count = SessionManager.cleanup_all_temp_directories()
        print(f"✅ Cleanup completed. Cleaned {cleaned_count} files/directories")
        
        # Verify cleanup
        print("\n🔍 Verifying cleanup...")
        remaining_files = 0
        for temp_dir in temp_dirs:
            temp_path = os.path.join(temp_root, temp_dir)
            if os.path.exists(temp_path):
                files = os.listdir(temp_path)
                remaining_files += len(files)
                if files:
                    print(f"   📂 {temp_dir}: {len(files)} files remaining")
                else:
                    print(f"   📂 {temp_dir}: Clean ✅")
        
        if remaining_files == 0:
            print("✅ All temp directories successfully cleaned!")
        else:
            print(f"⚠️ {remaining_files} files still remain")
            
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("============================================================")
    print("TEST COMPLETE")
    print("============================================================")

if __name__ == "__main__":
    main()
