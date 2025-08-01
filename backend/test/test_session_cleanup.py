#!/usr/bin/env python
"""
Test script for session cleanup functionality
"""

import os
import sys
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, str(Path(__file__).parent.parent))
django.setup()

from apps.ai_processing.session_manager import SessionManager

def test_session_cleanup():
    """Test session cleanup functionality"""
    print("🧹 Testing session cleanup...")
    
    # Check existing sessions
    sessions_dir = Path(__file__).parent.parent / "media" / "temp" / "sessions"
    print(f"📁 Sessions directory: {sessions_dir}")
    
    if sessions_dir.exists():
        existing_sessions = list(sessions_dir.iterdir())
        print(f"📋 Found {len(existing_sessions)} existing sessions:")
        for session_path in existing_sessions:
            if session_path.is_dir():
                print(f"  📂 {session_path.name}")
                
                # Test individual session cleanup
                session = SessionManager.get_session(session_path.name)
                print(f"    📊 Session directory exists: {os.path.exists(session.session_dir)}")
                
                try:
                    print(f"    🧹 Attempting cleanup...")
                    session.cleanup()
                    print(f"    ✅ Cleanup completed")
                    print(f"    📊 Session directory exists after cleanup: {os.path.exists(session.session_dir)}")
                except Exception as e:
                    print(f"    ❌ Cleanup failed: {e}")
    else:
        print("❌ Sessions directory not found")

def test_cleanup_expired_sessions():
    """Test expired session cleanup"""
    print("\n🕒 Testing expired session cleanup...")
    
    try:
        # Test with very short max age to clean up all sessions
        SessionManager.cleanup_expired_sessions(max_age_hours=0)
        print("✅ Expired session cleanup completed")
        
        # Check if sessions were cleaned up
        sessions_dir = Path(__file__).parent.parent / "media" / "temp" / "sessions"
        if sessions_dir.exists():
            remaining_sessions = list(sessions_dir.iterdir())
            print(f"📋 Remaining sessions after cleanup: {len(remaining_sessions)}")
            for session_path in remaining_sessions:
                if session_path.is_dir():
                    print(f"  📂 {session_path.name}")
        else:
            print("📁 Sessions directory not found after cleanup")
            
    except Exception as e:
        print(f"❌ Expired cleanup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("SESSION CLEANUP TEST")
    print("=" * 60)
    
    test_session_cleanup()
    test_cleanup_expired_sessions()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
