#!/usr/bin/env python
"""
Direct test of depth processing logic without API
Tests just the depth map generation and saving
"""

import os
import sys
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, str(Path(__file__).parent.parent))
django.setup()

import numpy as np
import cv2
from apps.ai_processing.session_manager import SessionManager
from apps.ai_processing.processors.zoedepth_processor import ZoeDepthProcessor

def test_depth_processing_direct():
    """Test depth processing directly without API"""
    print("🚀 Testing depth processing logic directly...")
    
    # Session from logs
    session_id = "115df6a5-528a-4e83-be86-f2eee63d2965"
    session = SessionManager.get_session(session_id)
    
    # Check if cropped original exists
    cropped_image_path = session.get_file_path("cropped_original.png")
    print(f"🖼️ Cropped image path: {cropped_image_path}")
    
    if not session.file_exists("cropped_original.png"):
        print("❌ Cropped original image not found")
        return False
    
    print("✅ Cropped original image found")
    
    try:
        # Initialize ZoeDepth processor
        processor = ZoeDepthProcessor()
        processor.load_model()
        print("✅ ZoeDepth model loaded")
        
        # Process image
        processed_image, original_size = processor.preprocess(cropped_image_path)
        print(f"✅ Image preprocessed: {processed_image.shape}")
        
        # Generate depth map
        raw_depth_map = processor._generate_depth_map(processed_image)
        print(f"✅ Raw depth map generated: {raw_depth_map.shape}")
        print(f"📊 Depth range: {np.min(raw_depth_map):.3f} to {np.max(raw_depth_map):.3f}")
        
        # Resize if needed
        if processor.config['output_size'] is None and original_size is not None:
            raw_depth_map = cv2.resize(raw_depth_map, original_size, interpolation=cv2.INTER_LINEAR)
            print(f"✅ Depth map resized to: {raw_depth_map.shape}")
        
        # Test new normalization approach
        depth_8bit_path = session.get_file_path("depth_map_8bit_test.png")
        depth_16bit_path = session.get_file_path("depth_map_16bit_test.png")
        
        # Ensure depth map is numpy array and normalize to 0-1 range
        depth_array = np.array(raw_depth_map, dtype=np.float32)
        depth_min = float(np.min(depth_array))
        depth_max = float(np.max(depth_array))
        print(f"📊 Depth stats: min={depth_min:.3f}, max={depth_max:.3f}")
        
        if depth_max > depth_min:
            depth_normalized = (depth_array - depth_min) / (depth_max - depth_min)
            print(f"✅ Normalized depth range: {np.min(depth_normalized):.3f} to {np.max(depth_normalized):.3f}")
            
            # Save 8-bit depth map (for visualization)
            depth_8bit = (depth_normalized * 255).astype(np.uint8)
            cv2.imwrite(depth_8bit_path, depth_8bit)
            print(f"✅ 8-bit depth map saved: {depth_8bit_path}")
            
            # Save 16-bit depth map (for precision)
            depth_16bit = (depth_normalized * 65535).astype(np.uint16)
            cv2.imwrite(depth_16bit_path, depth_16bit)
            print(f"✅ 16-bit depth map saved: {depth_16bit_path}")
            
            # Check file sizes
            if os.path.exists(depth_8bit_path):
                size_8bit = os.path.getsize(depth_8bit_path)
                print(f"📏 8-bit file size: {size_8bit} bytes")
            
            if os.path.exists(depth_16bit_path):
                size_16bit = os.path.getsize(depth_16bit_path)
                print(f"📏 16-bit file size: {size_16bit} bytes")
            
            return True
        else:
            print(f"❌ Invalid depth range: min={depth_min}, max={depth_max}")
            return False
            
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("DIRECT DEPTH PROCESSING TEST")
    print("=" * 60)
    
    success = test_depth_processing_direct()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    
    if success:
        print("✅ Depth processing logic is working")
    else:
        print("❌ Depth processing logic failed")
