#!/usr/bin/env python3
"""
Depth Processing WITHOUT Masking Test Script

This script tests depth processing using ONLY the cropped original image,
WITHOUT applying the wound mask from the segmented image.

This allows comparison between:
- Masked depth processing (full pipeline)
- Unmasked depth processing (this script)

Results are saved to test_depth_no_mask/ directory.
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
import torch

# Add the project's backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.ai_processing.processors.wound_detector import WoundDetector
from apps.ai_processing.processors.depth_utils import (
    detect_bounding_box_from_segmented,
    crop_image_with_bbox,
    visualize_bounding_box,
    calculate_depth_statistics,
    estimate_volume_from_depth
)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_zoedepth_model():
    """Load ZoeDepth model directly."""
    try:
        logger.info("Loading ZoeDepth model...")
        
        # Determine device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {device}")
        
        # Load ZoeD_NK model from torch hub
        try:
            model = torch.hub.load('isl-org/ZoeDepth', 'ZoeD_NK', pretrained=True)
            logger.info("Successfully loaded ZoeD_NK model from torch hub")
        except Exception as hub_error:
            logger.warning(f"Failed to load ZoeD_NK, trying ZoeD_N: {hub_error}")
            model = torch.hub.load('isl-org/ZoeDepth', 'ZoeD_N', pretrained=True)
            logger.info("Successfully loaded ZoeD_N model as fallback")
        
        # Move model to device and set to eval mode
        model.to(device)
        model.eval()
        logger.info("ZoeDepth model loaded successfully")
        
        return model, device
        
    except Exception as e:
        logger.error(f"Failed to load ZoeDepth model: {e}")
        raise


def preprocess_image_for_zoedepth(image_path, device):
    """Preprocess image for ZoeDepth processing."""
    try:
        # Load image
        image = cv2.imread(image_path)
        original_size = (image.shape[1], image.shape[0])  # (width, height)
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize to ZoeDepth input size (384, 512)
        input_height, input_width = 384, 512
        image_resized = cv2.resize(image_rgb, (input_width, input_height))
        
        # Normalize to [0, 1] range
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Convert to tensor and add batch dimension
        image_tensor = torch.from_numpy(image_normalized).permute(2, 0, 1).unsqueeze(0)
        
        # Move to device
        image_tensor = image_tensor.to(device)
        
        logger.info(f"Preprocessed image from {original_size} to ({input_height}, {input_width})")
        
        return image_tensor, original_size
        
    except Exception as e:
        logger.error(f"Error in preprocessing: {e}")
        raise


def generate_depth_map_with_zoedepth(model, image_tensor):
    """Generate depth map using ZoeDepth model."""
    try:
        with torch.no_grad():
            # Generate depth map using infer method
            model_output = model.infer(image_tensor)
            
            # Handle different output formats from ZoeDepth
            if isinstance(model_output, dict):
                if 'metric_depth' in model_output:
                    depth_tensor = model_output['metric_depth']
                elif 'depth' in model_output:
                    depth_tensor = model_output['depth']
                else:
                    depth_tensor = list(model_output.values())[0]
                    logger.warning("Unknown ZoeDepth output format, using first value")
            elif isinstance(model_output, torch.Tensor):
                depth_tensor = model_output
            else:
                raise ValueError(f"Unexpected model output type: {type(model_output)}")
            
            # Convert to numpy array
            depth_map = depth_tensor.squeeze().cpu().numpy()
            depth_map = depth_map.astype(np.float32)
            
            logger.info(f"Generated depth map with shape: {depth_map.shape}")
            logger.info(f"Depth range: {depth_map.min():.4f} - {depth_map.max():.4f}")
            
            return depth_map
            
    except Exception as e:
        logger.error(f"Error generating depth map: {e}")
        raise


def test_depth_no_mask():
    """Test depth processing WITHOUT masking using only cropped original."""
    
    # Define paths - same image as full pipeline test
    original_image_path = Path(__file__).resolve().parent / "test image" / "scan_1753445089110.jpg"
    
    # Create output directory
    output_dir = Path(__file__).resolve().parent / "test_depth_no_mask"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("="*80)
    logger.info("DEPTH PROCESSING WITHOUT MASKING TEST")
    logger.info("="*80)
    logger.info(f"Original image: {original_image_path}")
    logger.info(f"Output directory: {output_dir}")
    logger.info("NOTE: This test generates depth maps WITHOUT wound masking")
    
    # Validate input file exists
    if not original_image_path.exists():
        raise FileNotFoundError(f"Original image not found: {original_image_path}")
    
    # Copy original image to output directory for reference
    original_copy_path = output_dir / "00_original.jpg"
    shutil.copy2(original_image_path, original_copy_path)
    logger.info(f"Original image copied to: {original_copy_path}")
    
    try:
        # =================================================================
        # STEP 1: WOUND DETECTION (for bbox detection only)
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 1: WOUND DETECTION (for bounding box only)")
        logger.info("="*60)
        
        wound_detector = WoundDetector()
        logger.info("✓ Wound detector initialized")
        
        segmented_image_path = wound_detector.process(str(original_image_path))
        if not segmented_image_path or not Path(segmented_image_path).exists():
            raise ValueError("Wound segmentation failed")
        
        # Copy segmented image to output directory (for reference only)
        segmented_copy_path = output_dir / "01_segmented.jpg"
        shutil.copy2(segmented_image_path, segmented_copy_path)
        logger.info(f"✓ Wound segmentation completed: {segmented_copy_path}")
        logger.info("NOTE: Segmented image used ONLY for bbox detection, NOT for masking")
        
        # =================================================================
        # STEP 2: BBOX DETECTION AND CROPPING
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 2: BBOX DETECTION AND CROPPING")
        logger.info("="*60)
        
        # Detect bounding box from segmented image
        bbox = detect_bounding_box_from_segmented(segmented_image_path)
        if bbox is None:
            raise ValueError("Could not detect bounding box from segmented image")
        
        logger.info(f"✓ Detected bounding box: {bbox}")
        
        # Visualize bounding box on original image
        bbox_viz_path = output_dir / "02_bbox_visualization.png"
        visualize_success = visualize_bounding_box(str(original_image_path), bbox, str(bbox_viz_path))
        if visualize_success:
            logger.info(f"✓ Bbox visualization saved: {bbox_viz_path}")
        
        # Crop original image using bounding box
        cropped_image_path = output_dir / "03_cropped_original.png"
        crop_success = crop_image_with_bbox(str(original_image_path), bbox, str(cropped_image_path))
        if not crop_success:
            raise ValueError("Failed to crop original image using bounding box")
        
        logger.info(f"✓ Cropped original image saved: {cropped_image_path}")
        
        # =================================================================
        # STEP 3: ZOEDEPTH WITHOUT MASKING
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 3: ZOEDEPTH PROCESSING WITHOUT MASKING")
        logger.info("="*60)
        
        # Load ZoeDepth model
        model, device = load_zoedepth_model()
        logger.info("✓ ZoeDepth model loaded")
        
        # Preprocess the cropped original image
        logger.info("🔍 Processing ZoeDepth on cropped original image (NO MASKING)")
        processed_image, original_size = preprocess_image_for_zoedepth(str(cropped_image_path), device)
        
        # Generate depth map using ZoeDepth
        raw_depth_map = generate_depth_map_with_zoedepth(model, processed_image)
        
        # Resize depth map to cropped image size if needed
        if original_size is not None:
            raw_depth_map = cv2.resize(raw_depth_map, original_size, interpolation=cv2.INTER_LINEAR)
            logger.info(f"Resized depth map to original size: {original_size}")
        
        logger.info("⚠️  IMPORTANT: NO WOUND MASK APPLIED - using full depth map")
        
        # Save unmasked depth maps
        depth_8bit_path = output_dir / "04_depth_8bit_unmasked.png"
        depth_16bit_path = output_dir / "04_depth_16bit_unmasked.png"
        
        # Save 8-bit depth map (unmasked)
        depth_8bit_normalized = cv2.normalize(raw_depth_map, None, 0, 255, cv2.NORM_MINMAX)
        cv2.imwrite(str(depth_8bit_path), depth_8bit_normalized.astype(np.uint8))
        logger.info(f"✓ Unmasked 8-bit depth map saved: {depth_8bit_path}")
        
        # Save 16-bit depth map (unmasked)
        depth_16bit_normalized = cv2.normalize(raw_depth_map, None, 0, 65535, cv2.NORM_MINMAX)
        cv2.imwrite(str(depth_16bit_path), depth_16bit_normalized.astype(np.uint16))
        logger.info(f"✓ Unmasked 16-bit depth map saved: {depth_16bit_path}")
        
        # Calculate depth statistics for full depth map (no mask)
        depth_stats = calculate_depth_statistics(raw_depth_map, mask=None)  # No mask
        
        # Estimate volume for full depth map (no mask)
        pixel_size_mm = 0.1  # Default pixel size
        volume_estimate = estimate_volume_from_depth(
            raw_depth_map, 
            mask=None,  # No mask
            pixel_size_mm=pixel_size_mm
        )
        
        # =================================================================
        # STEP 4: RESULTS COMPARISON
        # =================================================================
        logger.info("\n" + "="*60)
        logger.info("STEP 4: RESULTS SUMMARY (UNMASKED)")
        logger.info("="*60)
        
        print_unmasked_results(
            output_dir,
            bbox,
            depth_stats,
            volume_estimate,
            original_copy_path,
            segmented_copy_path,
            cropped_image_path,
            depth_8bit_path,
            depth_16bit_path
        )
        
        logger.info("\n" + "="*80)
        logger.info("UNMASKED DEPTH PROCESSING COMPLETED SUCCESSFULLY!")
        logger.info("="*80)
        logger.info("💡 COMPARISON TIP:")
        logger.info("   Compare this output with test_full_pipeline/ results")
        logger.info("   to see the difference between masked vs unmasked depth processing")
        
        return True
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def print_unmasked_results(output_dir, bbox, depth_stats, volume_estimate, 
                          original_path, segmented_path, cropped_path,
                          depth_8bit_path, depth_16bit_path):
    """Print comprehensive results summary for unmasked processing."""
    
    logger.info("\n📊 UNMASKED DEPTH PROCESSING RESULTS:")
    logger.info("-" * 50)
    
    # Bounding box info
    logger.info(f"🔲 Bounding Box: x={bbox.get('x')}, y={bbox.get('y')}, "
               f"width={bbox.get('width')}, height={bbox.get('height')}")
    
    # Depth statistics (full depth map, no masking)
    logger.info(f"📏 Depth Statistics (FULL DEPTH MAP - NO MASK):")
    logger.info(f"   • Min depth: {depth_stats.get('min_depth', 'N/A'):.4f}")
    logger.info(f"   • Max depth: {depth_stats.get('max_depth', 'N/A'):.4f}")
    logger.info(f"   • Mean depth: {depth_stats.get('mean_depth', 'N/A'):.4f}")
    logger.info(f"   • Valid pixels: {depth_stats.get('valid_pixel_count', 'N/A')}")
    
    # Volume estimate (full depth map, no masking)
    logger.info(f"📐 Volume Estimate (FULL AREA - NO MASK): {volume_estimate:.2f} mm³")
    
    # Processing info
    logger.info(f"⚠️  Processing Method: RAW ZoeDepth output (NO wound mask applied)")
    logger.info(f"🎯 Difference: This includes background + wound areas")
    
    # Generated files
    logger.info(f"\n📁 Generated Files:")
    logger.info(f"   • Original: {original_path}")
    logger.info(f"   • Segmented (reference): {segmented_path}")
    logger.info(f"   • Bbox visualization: {output_dir / '02_bbox_visualization.png'}")
    logger.info(f"   • Cropped original: {cropped_path}")
    logger.info(f"   • Depth map 8-bit (unmasked): {depth_8bit_path}")
    logger.info(f"   • Depth map 16-bit (unmasked): {depth_16bit_path}")
    
    logger.info(f"\n🎯 COMPARISON NOTE:")
    logger.info(f"   This processing used NO wound mask - depth includes entire cropped area")
    logger.info(f"   Compare with test_full_pipeline/ to see masked vs unmasked differences")
    logger.info(f"\n🎉 All unmasked results saved to: {output_dir}")


def clear_test_directory():
    """Clear the test_depth_no_mask directory."""
    test_dir = backend_dir / "test_depth_no_mask"
    
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
    """Main function to run the unmasked depth processing test."""
    import argparse
    
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Depth processing WITHOUT masking test",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_depth_no_mask.py           # Run unmasked depth processing test
  python test_depth_no_mask.py --clear   # Clear test directory and run test

Comparison:
  Run this script, then compare results with test_full_pipeline/ to see
  the difference between masked vs unmasked depth processing.
        """
    )
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear the test_depth_no_mask directory before running the test'
    )
    
    args = parser.parse_args()
    
    # Handle clear command
    if args.clear:
        clear_test_directory()
    
    logger.info("Starting unmasked depth processing test...")
    
    success = test_depth_no_mask()
    
    if success:
        logger.info("\n✅ UNMASKED DEPTH PROCESSING TEST COMPLETED SUCCESSFULLY!")
        logger.info("Check the test_depth_no_mask/ directory for all generated files.")
        logger.info("💡 Compare with test_full_pipeline/ to see masked vs unmasked differences.")
        sys.exit(0)
    else:
        logger.error("\n❌ UNMASKED DEPTH PROCESSING TEST FAILED!")
        sys.exit(1)


if __name__ == "__main__":
    main() 