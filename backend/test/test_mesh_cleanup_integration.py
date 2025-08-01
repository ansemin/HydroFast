#!/usr/bin/env python
"""
Test script to verify that temp cleanup happens automatically after mesh generation.
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
    print("MESH GENERATION CLEANUP INTEGRATION TEST")
    print("============================================================")
    
    # Create a test session
    session = SessionManager.create_session()
    print(f"📝 Created test session: {session.session_id}")
    
    # Create some test files in temp directories to simulate processing
    temp_root = os.path.join(settings.MEDIA_ROOT, 'temp')
    test_files = [
        ('generated_stl', 'test_mesh.stl'),
        ('stl_previews', 'test_preview.png'),
        ('processed_scans', 'test_scan.jpg')
    ]
    
    print("\n📁 Creating test files to simulate processing...")
    for dir_name, filename in test_files:
        dir_path = os.path.join(temp_root, dir_name)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, filename)
        with open(file_path, 'w') as f:
            f.write("test content")
        print(f"   ✅ Created: {dir_name}/{filename}")
    
    # Create some session files too
    session.save_session_data({'test': 'data'}, 'test_metadata.json')
    session.save_session_data({'test': 'bbox'}, 'bbox_data.json')
    print(f"   ✅ Created session files in: {session.session_dir}")
    
    # Verify files exist before cleanup
    print("\n🔍 Verifying files exist before cleanup...")
    total_files_before = 0
    for dir_name, filename in test_files:
        file_path = os.path.join(temp_root, dir_name, filename)
        if os.path.exists(file_path):
            total_files_before += 1
            print(f"   ✅ {dir_name}/{filename} exists")
        else:
            print(f"   ❌ {dir_name}/{filename} missing")
    
    session_files = len(os.listdir(session.session_dir))
    print(f"   📂 Session directory has {session_files} files")
    
    # Test the comprehensive cleanup (simulating mesh generation completion)
    print(f"\n🧹 Testing comprehensive cleanup (simulating mesh generation completion)...")
    try:
        cleaned_count = session.cleanup_all_temp_files()
        print(f"✅ Cleanup completed. Cleaned {cleaned_count} files/directories")
        
        # Verify all files are gone
        print("\n🔍 Verifying cleanup...")
        total_files_after = 0
        for dir_name, filename in test_files:
            file_path = os.path.join(temp_root, dir_name, filename)
            if os.path.exists(file_path):
                total_files_after += 1
                print(f"   ❌ {dir_name}/{filename} still exists")
            else:
                print(f"   ✅ {dir_name}/{filename} cleaned")
        
        # Check session directory
        if os.path.exists(session.session_dir):
            print(f"   ❌ Session directory still exists")
        else:
            print(f"   ✅ Session directory cleaned")
        
        if total_files_after == 0 and not os.path.exists(session.session_dir):
            print("✅ Complete cleanup successful! All files and session removed.")
        else:
            print(f"⚠️ Cleanup incomplete. {total_files_after} temp files and session directory may still exist")
            
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("============================================================")
    print("INTEGRATION TEST COMPLETE")
    print("============================================================")

if __name__ == "__main__":
    main()
