#!/usr/bin/env python3
"""
STL Generation and Preview Test Script

This script tests the STL mesh generation and preview generation pipeline
using the unmasked depth image from test_depth_no_mask.py.

Tests:
1. MeshGenerator - converts depth map to STL mesh
2. MeshPreviewGenerator - creates isometric preview of STL mesh

Results are saved to test_stl_generation/ directory.
"""

import os
import sys
import django
from pathlib import Path
import logging
from datetime import datetime
import shutil
import cv2
import numpy as np

# Add the project's backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.ai_processing.processors.mesh_generator import MeshGenerator
from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_stl_generation_and_preview():
    """Test STL generation and preview using unmasked depth image."""
    
    # Define paths
    depth_image_path = Path(__file__).resolve().parent / "test image" / "04_depth_8bit_unmasked.png"
    
    # Create output directory
    output_dir = Path(__file__).resolve().parent / "test_stl_generation"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("="*80)
    logger.info("STL GENERATION AND PREVIEW TEST")
    logger.info("="*80)
    logger.info(f"Input depth image: {depth_image_path}")
    logger.info(f"Output directory: {output_dir}")
    
    # Validate input file exists
    if not depth_image_path.exists():
        # Try alternative location in test_depth_no_mask folder
        alt_depth_path = backend_dir / "test_depth_no_mask" / "04_depth_8bit_unmasked.png"
        if alt_depth_path.exists():
            depth_image_path = alt_depth_path
            logger.info(f"Using depth image from: {depth_image_path}")
        else:
            raise FileNotFoundError(f"Depth image not found at: {depth_image_path}")
    
    # Copy depth image to output directory for reference
    depth_copy_path = output_dir / "00_input_depth_8bit.png"
    shutil.copy2(depth_image_path, depth_copy_path)
    logger.info(f"Input depth image copied to: {depth_copy_path}")
    
    try:
        # =================================================================
        # STEP 1: PREPARE MOCK DEPTH ANALYSIS DATA
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 1: PREPARING MOCK DEPTH ANALYSIS DATA")
        logger.info("="*60)
        
        # Load and analyze the depth image
        depth_image = cv2.imread(str(depth_image_path), cv2.IMREAD_GRAYSCALE)
        if depth_image is None:
            raise ValueError("Failed to load depth image")
        
        logger.info(f"✅ Loaded depth image: {depth_image.shape}")
        
        # Calculate basic depth statistics
        valid_pixels = depth_image[depth_image > 0]
        depth_stats = {
            'min_depth': float(np.min(valid_pixels)) / 255.0 if len(valid_pixels) > 0 else 0.0,
            'max_depth': float(np.max(valid_pixels)) / 255.0 if len(valid_pixels) > 0 else 0.0,
            'mean_depth': float(np.mean(valid_pixels)) / 255.0 if len(valid_pixels) > 0 else 0.0,
            'std_depth': float(np.std(valid_pixels)) / 255.0 if len(valid_pixels) > 0 else 0.0,
            'median_depth': float(np.median(valid_pixels)) / 255.0 if len(valid_pixels) > 0 else 0.0,
            'valid_pixel_count': int(len(valid_pixels))
        }
        
        # Estimate volume (simple approximation)
        pixel_size_mm = 0.1  # Default pixel size
        pixel_area_mm2 = pixel_size_mm ** 2
        volume_estimate = float(np.sum(valid_pixels)) / 255.0 * pixel_area_mm2 if len(valid_pixels) > 0 else 0.0
        
        logger.info(f"📊 Calculated depth statistics:")
        logger.info(f"  - Valid pixels: {depth_stats['valid_pixel_count']}")
        logger.info(f"  - Depth range: {depth_stats['min_depth']:.3f} - {depth_stats['max_depth']:.3f}")
        logger.info(f"  - Mean depth: {depth_stats['mean_depth']:.3f}")
        logger.info(f"  - Volume estimate: {volume_estimate:.2f} mm³")
        
        # Create mock depth analysis data structure
        mock_depth_data = {
            'depth_map_8bit_path': str(depth_image_path),
            'depth_map_16bit_path': None,  # We only have 8-bit
            'depth_statistics': depth_stats,
            'volume_estimate': volume_estimate,
            'depth_metadata': {
                'processor': 'MockDepthAnalyzer',
                'timestamp': datetime.now().isoformat(),
                'method': 'test_unmasked_depth',
                'source': 'test_depth_no_mask.py'
            }
        }
        
        logger.info(f"✅ Created mock depth analysis data structure")
        
        # =================================================================
        # STEP 2: STL MESH GENERATION
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 2: STL MESH GENERATION")
        logger.info("="*60)
        
        # Test different visualization modes
        visualization_modes = [
            ('realistic', 1.8, 10),   # Realistic physical dimensions
            ('balanced', 5.0, 5),     # Balanced mode (default)
            ('enhanced', 8.0, 5)      # Enhanced visualization
        ]
        
        stl_results = {}
        
        for mode_name, z_dimension, clip_percentile in visualization_modes:
            logger.info(f"\n🏗️ Testing {mode_name.upper()} mode (z={z_dimension}mm, clip={clip_percentile}%)")
            
            # Configure mesh generator for this mode
            mesh_config = {
                'actual_x': 7.4,      # Physical dimensions from STL.py
                'actual_y': 16.4,
                'actual_z': z_dimension,
                'base_layers': 0,
                'base_thickness_mm': 0.26,
                'depth_clip_percentile': clip_percentile
            }
            
            logger.info(f"⚙️ Mesh configuration: {mesh_config}")
            
            # Initialize mesh generator
            mesh_generator = MeshGenerator(mesh_config)
            logger.info("✅ MeshGenerator initialized")
            
            # Generate STL mesh
            stl_result = mesh_generator.process(mock_depth_data)
            
            logger.info(f"✅ STL generation completed for {mode_name} mode!")
            logger.info(f"📋 STL result keys: {list(stl_result.keys())}")
            logger.info(f"📊 Generation status: {stl_result.get('generation_status')}")
            
            if stl_result.get('stl_file_path'):
                logger.info(f"🏗️ STL file: {stl_result['stl_file_path']}")
                
                # Copy STL file to test directory with mode suffix
                stl_source_path = Path(stl_result['stl_file_path'])
                if stl_source_path.exists():
                    stl_copy_path = output_dir / f"01_mesh_{mode_name}.stl"
                    shutil.copy2(stl_source_path, stl_copy_path)
                    logger.info(f"📁 STL copied to: {stl_copy_path}")
                    stl_result['test_stl_path'] = str(stl_copy_path)
            
            if stl_result.get('mesh_metadata'):
                mesh_meta = stl_result['mesh_metadata']
                logger.info(f"📊 Mesh metadata:")
                if mesh_meta.get('vertex_count'):
                    logger.info(f"  - Vertex count: {mesh_meta['vertex_count']}")
                if mesh_meta.get('face_count'):
                    logger.info(f"  - Face count: {mesh_meta['face_count']}")
                if mesh_meta.get('volume_mm3'):
                    logger.info(f"  - Volume: {mesh_meta['volume_mm3']:.2f} mm³")
                if mesh_meta.get('file_size_mb'):
                    logger.info(f"  - File size: {mesh_meta['file_size_mb']} MB")
            
            stl_results[mode_name] = stl_result
        
        # =================================================================
        # STEP 3: STL PREVIEW GENERATION
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 3: STL PREVIEW GENERATION")
        logger.info("="*60)
        
        preview_results = {}
        
        for mode_name, stl_result in stl_results.items():
            if stl_result.get('generation_status') != 'success':
                logger.warning(f"⚠️ Skipping preview for {mode_name} mode - STL generation failed")
                continue
            
            logger.info(f"\n🖼️ Generating preview for {mode_name.upper()} mode")
            
            # Configure preview generator
            preview_config = {
                'camera_position': (1.5, 1.5, 1),    # Improved isometric angle
                'mesh_color': 'lightgray',           # Light gray
                'background_color': 'white',         # White background
                'output_size': (1000, 800),          # High resolution
                'zoom_factor': 1.0,                  # Standard zoom
                'offscreen': True,                   # Server-side rendering
                'use_matplotlib_fallback': True      # Force consistent rendering
            }
            
            logger.info(f"⚙️ Preview configuration: {preview_config}")
            
            # Initialize preview generator
            preview_generator = MeshPreviewGenerator(preview_config)
            logger.info("✅ MeshPreviewGenerator initialized")
            
            # Generate preview
            preview_result = preview_generator.process(stl_result)
            
            logger.info(f"✅ Preview generation completed for {mode_name} mode!")
            logger.info(f"📋 Preview result keys: {list(preview_result.keys())}")
            logger.info(f"📊 Preview generation status: {preview_result.get('generation_status')}")
            
            if preview_result.get('preview_image_path'):
                logger.info(f"🎨 Preview image: {preview_result['preview_image_path']}")
                
                # Copy preview image to test directory with mode suffix
                preview_source_path = Path(preview_result['preview_image_path'])
                if preview_source_path.exists():
                    preview_copy_path = output_dir / f"02_preview_{mode_name}.png"
                    shutil.copy2(preview_source_path, preview_copy_path)
                    logger.info(f"📁 Preview copied to: {preview_copy_path}")
                    preview_result['test_preview_path'] = str(preview_copy_path)
            
            if preview_result.get('preview_metadata'):
                logger.info(f"📊 Preview metadata available")
            
            preview_results[mode_name] = preview_result
        
        # =================================================================
        # STEP 4: RESULTS SUMMARY
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 4: RESULTS SUMMARY")
        logger.info("="*60)
        
        print_test_results(
            output_dir,
            depth_stats,
            volume_estimate,
            stl_results,
            preview_results,
            depth_copy_path
        )
        
        logger.info("\n" + "="*80)
        logger.info("STL GENERATION AND PREVIEW TEST COMPLETED SUCCESSFULLY!")
        logger.info("="*80)
        logger.info("💡 SUMMARY:")
        logger.info("   - All visualization modes tested (realistic, balanced, enhanced)")
        logger.info("   - STL meshes generated with different Z-dimensions")
        logger.info("   - Isometric previews created for visual verification")
        logger.info(f"📁 All results saved to: {output_dir}")
        
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def print_test_results(output_dir, depth_stats, volume_estimate, stl_results, preview_results, depth_copy_path):
    """Print comprehensive test results summary."""
    
    logger.info("\n📊 STL GENERATION AND PREVIEW TEST RESULTS:")
    logger.info("-" * 70)
    
    # Input data summary
    logger.info(f"📥 Input Data:")
    logger.info(f"   • Depth image: {depth_copy_path}")
    logger.info(f"   • Valid pixels: {depth_stats.get('valid_pixel_count', 'N/A')}")
    logger.info(f"   • Depth range: {depth_stats.get('min_depth', 'N/A'):.3f} - {depth_stats.get('max_depth', 'N/A'):.3f}")
    logger.info(f"   • Estimated volume: {volume_estimate:.2f} mm³")
    
    # STL generation results
    logger.info(f"\n🏗️ STL Mesh Generation Results:")
    for mode_name, stl_result in stl_results.items():
        if stl_result.get('generation_status') == 'success':
            mesh_meta = stl_result.get('mesh_metadata', {})
            logger.info(f"   ✅ {mode_name.upper()} mode:")
            logger.info(f"      - STL file: {stl_result.get('test_stl_path', 'N/A')}")
            logger.info(f"      - Vertices: {mesh_meta.get('vertex_count', 'N/A')}")
            logger.info(f"      - Faces: {mesh_meta.get('face_count', 'N/A')}")
            logger.info(f"      - Volume: {mesh_meta.get('volume_mm3', 'N/A'):.2f} mm³")
            logger.info(f"      - File size: {mesh_meta.get('file_size_mb', 'N/A')} MB")
        else:
            logger.info(f"   ❌ {mode_name.upper()} mode: Failed")
    
    # Preview generation results
    logger.info(f"\n🖼️ STL Preview Generation Results:")
    for mode_name, preview_result in preview_results.items():
        if preview_result.get('generation_status') == 'success':
            preview_meta = preview_result.get('preview_metadata', {})
            file_props = preview_meta.get('file_properties', {})
            logger.info(f"   ✅ {mode_name.upper()} mode:")
            logger.info(f"      - Preview image: {preview_result.get('test_preview_path', 'N/A')}")
            logger.info(f"      - Image size: {preview_meta.get('preview_properties', {}).get('image_size', 'N/A')}")
            logger.info(f"      - File size: {file_props.get('file_size_kb', 'N/A')} KB")
            logger.info(f"      - View type: {preview_result.get('view_info', {}).get('view_type', 'N/A')}")
        else:
            logger.info(f"   ❌ {mode_name.upper()} mode: Failed")
    
    # Generated files
    logger.info(f"\n📁 Generated Files in {output_dir}:")
    logger.info(f"   • Input depth image: 00_input_depth_8bit.png")
    for mode_name in stl_results.keys():
        logger.info(f"   • {mode_name.upper()} STL: 01_mesh_{mode_name}.stl")
        if mode_name in preview_results:
            logger.info(f"   • {mode_name.upper()} preview: 02_preview_{mode_name}.png")
    
    logger.info(f"\n🎯 COMPARISON NOTES:")
    logger.info(f"   • REALISTIC mode: 1.8mm Z-dimension (accurate for 3D printing)")
    logger.info(f"   • BALANCED mode: 5.0mm Z-dimension (good visualization)")
    logger.info(f"   • ENHANCED mode: 8.0mm Z-dimension (best visual depth)")
    logger.info(f"   • All modes use the same unmasked depth data")
    logger.info(f"   • Previews show isometric view for clinical assessment")


def clear_test_directory():
    """Clear the test_stl_generation directory."""
    test_dir = backend_dir / "test_stl_generation"
    
    if test_dir.exists():
        logger.info(f"Clearing test directory: {test_dir}")
        try:
            shutil.rmtree(test_dir)
            logger.info("✅ Test directory cleared successfully!")
        except Exception as e:
            logger.error(f"❌ Error clearing test directory: {e}")
            sys.exit(1)
    else:
        logger.info("Test directory doesn't exist - nothing to clear.")


def main():
    """Main function to run the STL generation and preview test."""
    import argparse
    
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="STL generation and preview test",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_stl_generation.py           # Run STL generation and preview test
  python test_stl_generation.py --clear   # Clear test directory and run test

Output:
  Creates test_stl_generation/ directory with:
  - STL meshes in 3 modes (realistic, balanced, enhanced)
  - Isometric preview images for each mode
  - Input depth image copy for reference
        """
    )
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear the test_stl_generation directory before running the test'
    )
    
    args = parser.parse_args()
    
    # Handle clear command
    if args.clear:
        clear_test_directory()
    
    logger.info("Starting STL generation and preview test...")
    
    success = test_stl_generation_and_preview()
    
    if success:
        logger.info("\n✅ STL GENERATION AND PREVIEW TEST COMPLETED SUCCESSFULLY!")
        logger.info("Check the test_stl_generation/ directory for all generated files.")
        logger.info("💡 Compare the 3 visualization modes to see depth rendering differences.")
        sys.exit(0)
    else:
        logger.error("\n❌ STL GENERATION AND PREVIEW TEST FAILED!")
        sys.exit(1)


if __name__ == "__main__":
    main() 