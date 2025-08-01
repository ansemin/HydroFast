#!/usr/bin/env python
"""
Test script for verifying depth processing fix
Tests the depth analysis endpoint after fixing normalization issue
"""

import os
import sys
import requests
import json
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_depth_processing():
    """Test depth processing with latest scan"""
    print("🚀 Testing depth processing fix...")
    
    # API base URL
    api_base = "http://172.30.1.61:8000/api"
    
    try:
        # Get the latest scan (scan ID 2 based on logs)
        scan_id = 2
        print(f"🆔 Testing with scan ID: {scan_id}")
        
        # Test depth analysis endpoint
        depth_url = f"{api_base}/ai-processing/{scan_id}/process_depth_analysis/"
        print(f"📡 Calling depth analysis: {depth_url}")
        
        response = requests.post(depth_url)
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Depth processing successful!")
            print(f"📦 Response keys: {list(data.keys())}")
            
            if 'depth_map_8bit' in data:
                print(f"🎯 8-bit depth map URL: {data['depth_map_8bit']}")
            if 'depth_map_16bit' in data:
                print(f"🎯 16-bit depth map URL: {data['depth_map_16bit']}")
            if 'volume_estimate' in data:
                print(f"📏 Volume estimate: {data['volume_estimate']}")
                
            return True
        else:
            print(f"❌ Depth processing failed: {response.status_code}")
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

def check_depth_files():
    """Check if depth map files were created properly"""
    print("\n🔍 Checking depth map files...")
    
    # Session directory from logs
    session_id = "115df6a5-528a-4e83-be86-f2eee63d2965"
    session_dir = Path(__file__).parent.parent / "media" / "temp" / "sessions" / session_id
    
    print(f"📁 Session directory: {session_dir}")
    
    if session_dir.exists():
        print("✅ Session directory exists")
        
        # Check depth map files
        depth_8bit = session_dir / "depth_map_8bit.png"
        depth_16bit = session_dir / "depth_map_16bit.png"
        
        if depth_8bit.exists():
            size_8bit = depth_8bit.stat().st_size
            print(f"📸 8-bit depth map: {size_8bit} bytes")
            if size_8bit > 1000:  # Should be larger than 342 bytes
                print("✅ 8-bit depth map looks good")
            else:
                print("⚠️ 8-bit depth map is too small")
        else:
            print("❌ 8-bit depth map not found")
            
        if depth_16bit.exists():
            size_16bit = depth_16bit.stat().st_size
            print(f"📸 16-bit depth map: {size_16bit} bytes")
            if size_16bit > 1000:  # Should be larger than 389 bytes
                print("✅ 16-bit depth map looks good")
            else:
                print("⚠️ 16-bit depth map is too small")
        else:
            print("❌ 16-bit depth map not found")
            
        # List all files in session
        print(f"\n📋 All files in session:")
        for file in session_dir.glob("*"):
            print(f"  📄 {file.name}: {file.stat().st_size} bytes")
    else:
        print(f"❌ Session directory not found: {session_dir}")

if __name__ == "__main__":
    print("=" * 60)
    print("DEPTH PROCESSING FIX TEST")
    print("=" * 60)
    
    # First check existing files
    check_depth_files()
    
    # Then test the processing
    print("\n" + "=" * 60)
    print("TESTING DEPTH PROCESSING ENDPOINT")
    print("=" * 60)
    
    success = test_depth_processing()
    
    if success:
        # Check files again after processing
        print("\n" + "=" * 60)
        print("POST-PROCESSING FILE CHECK")
        print("=" * 60)
        check_depth_files()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
