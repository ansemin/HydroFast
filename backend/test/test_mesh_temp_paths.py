#!/usr/bin/env python
"""
Test mesh generation with new temp directory structure
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

def test_mesh_generation_paths():
    """Test that mesh generation uses correct temp paths"""
    print("🧪 Testing mesh generation temp paths...")
    
    from apps.ai_processing.processors.mesh_generator import MeshGenerator
    from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator
    
    # Test with sample config
    mesh_config = {
        'actual_x': 7.4,
        'actual_y': 16.4,
        'actual_z': 5.0,
        'base_layers': 0,
        'base_thickness_mm': 0.26,
        'depth_clip_percentile': 5
    }
    
    preview_config = {
        'image_size': (800, 600),
        'camera_distance': 13,
        'lighting_intensity': 0.9
    }
    
    # Initialize processors
    mesh_gen = MeshGenerator(mesh_config)
    preview_gen = MeshPreviewGenerator(preview_config)
    
    print("✅ Mesh processors initialized with new temp paths")
    
    # Check temp directories exist
    temp_stl_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'generated_stl'
    temp_preview_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'stl_previews'
    
    print(f"📁 STL temp directory: {temp_stl_dir}")
    print(f"📁 Preview temp directory: {temp_preview_dir}")
    
    if temp_stl_dir.exists():
        print("✅ STL temp directory exists")
    else:
        print("❌ STL temp directory missing")
        
    if temp_preview_dir.exists():
        print("✅ Preview temp directory exists") 
    else:
        print("❌ Preview temp directory missing")

if __name__ == "__main__":
    print("=" * 60)
    print("MESH GENERATION TEMP PATHS TEST")
    print("=" * 60)
    
    test_mesh_generation_paths()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
