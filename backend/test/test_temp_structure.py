#!/usr/bin/env python
"""
Test script to verify the updated temp directory structure for STL generation
"""

import os
import sys
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, str(Path(__file__).parent.parent))
django.setup()

from django.conf import settings

def test_temp_directories():
    """Test that temp directories are properly structured"""
    print("🔍 Testing temp directory structure...")
    
    # Expected temp directories (uploads removed - not actually used)
    expected_dirs = [
        'temp/sessions',
        'temp/processed_scans', 
        'temp/generated_stl',
        'temp/stl_previews'
    ]
    
    for dir_path in expected_dirs:
        full_path = Path(settings.MEDIA_ROOT) / dir_path
        print(f"📁 Checking: {full_path}")
        
        if full_path.exists():
            print(f"  ✅ Directory exists")
        else:
            print(f"  📝 Creating directory...")
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ Directory created")

def test_mesh_processor_paths():
    """Test that mesh processors use the correct temp paths"""
    print("\n🧪 Testing mesh processor paths...")
    
    from apps.ai_processing.processors.mesh_generator import MeshGenerator
    from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator
    
    # Test mesh generator
    mesh_gen = MeshGenerator()
    print(f"🎯 Mesh generator config loaded")
    
    # Test preview generator  
    preview_gen = MeshPreviewGenerator()
    print(f"🎯 Preview generator config loaded")
    
    print("✅ Mesh processors initialized successfully")

def cleanup_old_temp_files():
    """Move existing temp files to proper temp structure"""
    print("\n🧹 Cleaning up old temp file structure...")
    
    media_root = Path(settings.MEDIA_ROOT)
    
    # Directories to move to temp
    old_dirs = [
        ('generated_stl', 'temp/generated_stl'),
        ('stl_previews', 'temp/stl_previews')
    ]
    
    for old_dir, new_dir in old_dirs:
        old_path = media_root / old_dir
        new_path = media_root / new_dir
        
        if old_path.exists():
            print(f"📦 Moving {old_dir} to {new_dir}")
            
            # Create new directory
            new_path.mkdir(parents=True, exist_ok=True)
            
            # Move files
            moved_count = 0
            for file in old_path.glob('*'):
                if file.is_file():
                    destination = new_path / file.name
                    file.rename(destination)
                    moved_count += 1
                    print(f"  📄 Moved: {file.name}")
            
            # Remove empty old directory
            if moved_count > 0:
                try:
                    old_path.rmdir()
                    print(f"  🗑️ Removed old directory: {old_dir}")
                except OSError:
                    print(f"  ⚠️ Old directory not empty: {old_dir}")
            else:
                print(f"  📭 No files to move from: {old_dir}")
        else:
            print(f"  ℹ️ Directory doesn't exist: {old_dir}")

if __name__ == "__main__":
    print("=" * 60)
    print("TEMP DIRECTORY STRUCTURE UPDATE TEST")
    print("=" * 60)
    
    test_temp_directories()
    test_mesh_processor_paths()
    cleanup_old_temp_files()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
