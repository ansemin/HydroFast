#!/usr/bin/env python3
"""
Full Pipeline Test Script

This script tests the complete wound processing pipeline:
1. Wound Detection & Segmentation
2. ZoeDepth Processing with Bbox Crop Workflow  
3. STL Mesh Generation
4. STL Preview Generation

Results are saved to test_full_pipeline/ directory.
"""

import os
import sys
import django
from pathlib import Path
import logging
from datetime import datetime
import shutil
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project's backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.ai_processing.processors.wound_detector import WoundDetector
from apps.ai_processing.processors.zoedepth_processor import ZoeDepthProcessor
from apps.ai_processing.processors.mesh_generator import MeshGenerator
from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_full_pipeline():
    """Test the complete wound processing pipeline."""
    
    # Define paths
    original_image_path = Path(__file__).resolve().parent / "test image" / "scan_1753445089110.jpg"
    
    # Create output directory
    output_dir = Path(__file__).resolve().parent / "test_full_pipeline"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("="*80)
    logger.info("STARTING FULL WOUND PROCESSING PIPELINE TEST")
    logger.info("="*80)
    logger.info(f"Original image: {original_image_path}")
    logger.info(f"Output directory: {output_dir}")
    
    # Validate input file exists
    if not original_image_path.exists():
        raise FileNotFoundError(f"Original image not found: {original_image_path}")
    
    # Copy original image to output directory for reference
    original_copy_path = output_dir / "00_original.jpg"
    shutil.copy2(original_image_path, original_copy_path)
    logger.info(f"Original image copied to: {original_copy_path}")
    
    try:
        # =================================================================
        # STEP 1: WOUND DETECTION & SEGMENTATION
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 1: WOUND DETECTION & SEGMENTATION")
        logger.info("="*60)
        
        wound_detector = WoundDetector()
        logger.info("✓ Wound detector initialized")
        
        segmented_image_path = wound_detector.process(str(original_image_path))
        if not segmented_image_path or not Path(segmented_image_path).exists():
            raise ValueError("Wound segmentation failed")
        
        # Copy segmented image to output directory
        segmented_copy_path = output_dir / "01_segmented.jpg"
        shutil.copy2(segmented_image_path, segmented_copy_path)
        logger.info(f"✓ Wound segmentation completed: {segmented_copy_path}")
        
        # =================================================================
        # STEP 2: ZOEDEPTH PROCESSING WITH BBOX CROP WORKFLOW
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 2: ZOEDEPTH PROCESSING WITH BBOX CROP")
        logger.info("="*60)
        
        zoedepth_processor = ZoeDepthProcessor()
        logger.info("✓ ZoeDepth processor initialized")
        
        # Create subdirectory for depth processing results
        depth_output_dir = output_dir / "02_depth_processing"
        
        depth_results = zoedepth_processor.process_with_bbox_crop(
            original_image_path=str(original_image_path),
            segmented_image_path=segmented_image_path,
            output_dir=str(depth_output_dir)
        )
        logger.info("✓ ZoeDepth processing with bbox crop completed")
        
        # =================================================================
        # STEP 3: STL MESH GENERATION
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 3: STL MESH GENERATION")
        logger.info("="*60)
        
        mesh_generator = MeshGenerator()
        logger.info("✓ Mesh generator initialized")
        
        # Prepare depth analysis data for mesh generation
        mesh_input_data = {
            'depth_map_8bit_path': depth_results.get('depth_map_8bit_path'),
            'depth_map_16bit_path': depth_results.get('depth_map_16bit_path'),
            'depth_statistics': depth_results.get('depth_statistics', {}),
            'volume_estimate': depth_results.get('volume_estimate', {}),
            'wound_mask_extracted': depth_results.get('wound_mask_extracted', False),
            'processing_parameters': depth_results.get('processing_parameters', {})
        }
        
        stl_results = mesh_generator.process(mesh_input_data)
        logger.info(f"✓ STL mesh generation completed: {stl_results.get('stl_file_path')}")
        
        # Copy STL file to test directory for easier access
        stl_source_path = Path(stl_results.get('stl_file_path'))
        if stl_source_path.exists():
            stl_copy_path = output_dir / "03_mesh.stl"
            shutil.copy2(stl_source_path, stl_copy_path)
            logger.info(f"✓ STL file copied to test directory: {stl_copy_path}")
            # Update results to include test directory path
            stl_results['test_stl_path'] = str(stl_copy_path)
        
        # =================================================================
        # STEP 4: STL PREVIEW GENERATION
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 4: STL PREVIEW GENERATION")
        logger.info("="*60)
        
        mesh_preview_generator = MeshPreviewGenerator()
        logger.info("✓ Mesh preview generator initialized")
        
        # Prepare STL data for preview generation
        preview_input_data = {
            'stl_file_path': stl_results.get('stl_file_path'),
            'mesh_metadata': stl_results.get('mesh_metadata', {}),
            'generation_parameters': stl_results.get('generation_parameters', {})
        }
        
        preview_results = mesh_preview_generator.process(preview_input_data)
        logger.info(f"✓ STL preview generation completed: {preview_results.get('preview_image_path')}")
        
        # Copy STL preview to test directory for easier access
        preview_source_path = Path(preview_results.get('preview_image_path'))
        if preview_source_path.exists():
            preview_copy_path = output_dir / "04_stl_preview.png"
            shutil.copy2(preview_source_path, preview_copy_path)
            logger.info(f"✓ STL preview copied to test directory: {preview_copy_path}")
            # Update results to include test directory path
            preview_results['test_preview_path'] = str(preview_copy_path)
        
        # =================================================================
        # STEP 5: RESULTS SUMMARY
        # =================================================================
        logger.info("\n" + "="*80)
        logger.info("PIPELINE COMPLETED SUCCESSFULLY!")
        logger.info("="*80)
        
        # Print comprehensive results summary
        print_results_summary(
            output_dir,
            depth_results,
            stl_results, 
            preview_results,
            original_copy_path,
            segmented_copy_path
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Pipeline failed at some step: {e}")
        import traceback
        traceback.print_exc()
        return False


def print_results_summary(output_dir, depth_results, stl_results, preview_results, 
                         original_path, segmented_path):
    """Print comprehensive results summary."""
    
    logger.info("\n📊 RESULTS SUMMARY:")
    logger.info("-" * 50)
    
    # Bounding box info
    bbox = depth_results.get('bbox', {})
    logger.info(f"🔲 Bounding Box: x={bbox.get('x')}, y={bbox.get('y')}, "
               f"width={bbox.get('width')}, height={bbox.get('height')}")
    
    # Depth statistics
    depth_stats = depth_results.get('depth_statistics', {})
    logger.info(f"📏 Depth Statistics:")
    logger.info(f"   • Min depth: {depth_stats.get('min_depth', 'N/A'):.4f}")
    logger.info(f"   • Max depth: {depth_stats.get('max_depth', 'N/A'):.4f}")
    logger.info(f"   • Mean depth: {depth_stats.get('mean_depth', 'N/A'):.4f}")
    logger.info(f"   • Valid pixels: {depth_stats.get('valid_pixel_count', 'N/A')}")
    
    # Volume estimate
    volume_info = depth_results.get('volume_estimate', {})
    logger.info(f"📐 Volume Estimate: {volume_info.get('total_volume', 'N/A'):.2f} mm³")
    
    # STL mesh info
    mesh_metadata = stl_results.get('mesh_metadata', {})
    logger.info(f"🎭 STL Mesh Properties:")
    logger.info(f"   • Vertices: {mesh_metadata.get('vertex_count', 'N/A')}")
    logger.info(f"   • Faces: {mesh_metadata.get('face_count', 'N/A')}")
    logger.info(f"   • Volume: {mesh_metadata.get('volume_mm3', 'N/A'):.2f} mm³")
    logger.info(f"   • Surface area: {mesh_metadata.get('surface_area_mm2', 'N/A'):.2f} mm²")
    logger.info(f"   • File size: {mesh_metadata.get('file_size_mb', 'N/A')} MB")
    
    # Preview info
    preview_metadata = preview_results.get('preview_metadata', {})
    logger.info(f"🖼️  Preview Properties:")
    logger.info(f"   • Image size: {preview_metadata.get('preview_properties', {}).get('image_size', 'N/A')}")
    logger.info(f"   • File size: {preview_metadata.get('file_properties', {}).get('file_size_kb', 'N/A')} KB")
    
    # Generated files
    logger.info(f"\n📁 Generated Files:")
    logger.info(f"   • Original: {original_path}")
    logger.info(f"   • Segmented: {segmented_path}")
    logger.info(f"   • Bbox visualization: {depth_results.get('bbox_visualization_path')}")
    logger.info(f"   • Cropped image: {depth_results.get('cropped_image_path')}")
    logger.info(f"   • Depth map (8-bit): {depth_results.get('depth_map_8bit_path')}")
    logger.info(f"   • Depth map (16-bit): {depth_results.get('depth_map_16bit_path')}")
    logger.info(f"   • STL file (original): {stl_results.get('stl_file_path')}")
    logger.info(f"   • STL file (test copy): {stl_results.get('test_stl_path', 'Not copied')}")
    logger.info(f"   • STL preview (original): {preview_results.get('preview_image_path')}")
    logger.info(f"   • STL preview (test copy): {preview_results.get('test_preview_path', 'Not copied')}")
    logger.info(f"   • Metadata: {depth_results.get('metadata_path')}")
    
    logger.info(f"\n🎉 All results saved to: {output_dir}")


def clear_test_directory():
    """Clear the test_full_pipeline directory."""
    test_dir = backend_dir / "test_full_pipeline"
    
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
    """Main function to run the full pipeline test."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Full wound processing pipeline test",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_full_pipeline.py           # Run the full pipeline test
  python test_full_pipeline.py --clear   # Clear test directory and run pipeline
        """
    )
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear the test_full_pipeline directory before running the pipeline'
    )
    
    args = parser.parse_args()
    
    # Handle clear command (clear directory first, then continue with pipeline)
    if args.clear:
        clear_test_directory()
    
    logger.info("Starting full wound processing pipeline test...")
    
    success = test_full_pipeline()
    
    if success:
        logger.info("\n✅ FULL PIPELINE TEST COMPLETED SUCCESSFULLY!")
        logger.info("Check the test_full_pipeline/ directory for all generated files.")
        sys.exit(0)
    else:
        logger.error("\n❌ FULL PIPELINE TEST FAILED!")
        sys.exit(1)


if __name__ == "__main__":
    main() 