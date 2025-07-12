"""
Utility functions for ZoeDepth depth processing.
Includes mask extraction, image processing, and depth map utilities.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
import logging
from skimage import morphology

logger = logging.getLogger(__name__)


def extract_wound_mask_from_segmented(image_path: str, method: str = 'non_black_regions') -> Optional[np.ndarray]:
    """
    Extract wound mask from segmented image using specified method.
    
    Args:
        image_path: Path to segmented image
        method: Method to use ('non_black_regions', 'auto_threshold')
        
    Returns:
        Binary mask as numpy array or None if extraction fails
    """
    try:
        # Load the segmented image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image from {image_path}")
            return None
            
        if method == 'non_black_regions':
            return _extract_non_black_mask(image)
        elif method == 'auto_threshold':
            return _extract_auto_threshold_mask(image)
        else:
            logger.warning(f"Unknown mask extraction method: {method}")
            return None
            
    except Exception as e:
        logger.error(f"Error extracting wound mask: {e}")
        return None


def _extract_non_black_mask(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract wound mask by detecting non-black regions in segmented image.
    
    Args:
        image: Input segmented image (BGR format)
        
    Returns:
        Binary mask or None if extraction fails
    """
    try:
        # Convert to grayscale for easier processing
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Create mask for non-black regions
        # Use a small threshold to account for slight variations in "black" (e.g., [1,1,1] vs [0,0,0])
        black_threshold = 10  # Pixels with intensity > 10 are considered non-black
        mask = cv2.threshold(gray, black_threshold, 255, cv2.THRESH_BINARY)[1]
        
        # Apply morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # Fill small holes in the mask
        mask = cv2.medianBlur(mask, 3)
        
        # Check if we found any non-black regions
        non_black_pixels = cv2.countNonZero(mask)
        if non_black_pixels == 0:
            logger.warning("No non-black regions found in segmented image")
            return None
            
        logger.info(f"Found {non_black_pixels} non-black pixels in wound region")
        return mask
        
    except Exception as e:
        logger.error(f"Error in non-black region extraction: {e}")
        return None


def _extract_auto_threshold_mask(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract wound mask using automatic thresholding as fallback method.
    
    Args:
        image: Input segmented image (BGR format)
        
    Returns:
        Binary mask or None if extraction fails
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Use Otsu's thresholding to automatically find threshold
        _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Remove small noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        return mask
        
    except Exception as e:
        logger.error(f"Error in auto threshold extraction: {e}")
        return None


def apply_depth_processing(depth_map: np.ndarray, mask: Optional[np.ndarray] = None,
                          contrast_alpha: float = 0.3, brightness_beta: float = -40, 
                          blur_kernel: int = 9) -> np.ndarray:
    """
    Apply post-processing to depth map following the notebook's improved approach.
    
    Args:
        depth_map: Raw depth map from ZoeDepth
        mask: Optional wound mask to limit processing to wound region
        contrast_alpha: Contrast adjustment factor (0.3 from research)
        brightness_beta: Brightness adjustment factor (-40 from research)
        blur_kernel: Gaussian blur kernel size (9 from notebook)
        
    Returns:
        Processed depth map
    """
    try:
        # Step 1: Extract wound-only depth if mask is provided
        if mask is not None:
            # Ensure mask is binary
            mask_binary = (mask > 0).astype(np.uint8)
            masked_depth = np.zeros_like(depth_map)
            masked_depth[mask_binary > 0] = depth_map[mask_binary > 0]
        else:
            masked_depth = depth_map.copy()
            mask_binary = (depth_map > 0).astype(np.uint8)
        
        # Step 2: Smooth the depth map with Gaussian blur
        depth_smoothed = cv2.GaussianBlur(masked_depth, (blur_kernel, blur_kernel), sigmaX=2, sigmaY=2)
        
        # Step 3: Normalize wound depth values only (not entire image)
        nonzero_mask = (mask_binary > 0) & (depth_smoothed > 0)
        
        if np.any(nonzero_mask):
            wound_vals = depth_smoothed[nonzero_mask]
            
            if wound_vals.max() > wound_vals.min():
                # Normalize only the wound region
                depth_norm = np.zeros_like(depth_smoothed)
                depth_norm[nonzero_mask] = (wound_vals - wound_vals.min()) / (wound_vals.max() - wound_vals.min())
            else:
                depth_norm = np.zeros_like(depth_smoothed)
        else:
            depth_norm = np.zeros_like(depth_smoothed)
        
        # Step 4: Convert to 8-bit for contrast adjustment
        depth_gray = (depth_norm * 255).astype(np.uint8)
        
        # Step 5: Apply contrast and brightness adjustment
        # More moderate adjustments to preserve depth gradients
        enhanced_alpha = contrast_alpha * 1.5  # Moderate contrast increase (0.3 * 1.5 = 0.45)
        enhanced_beta = brightness_beta + 50   # Moderate brightness increase (-40 + 50 = +10)
        depth_contrast = cv2.convertScaleAbs(depth_gray, alpha=enhanced_alpha, beta=enhanced_beta)
        
        # Step 6: Apply mask again to zero out background
        depth_contrast[mask_binary == 0] = 0
        
        # Step 7: Remove black speckles and holes using morphological operations
        # Create binary mask from depth image
        binary_mask = depth_contrast > 0
        
        # Fill holes inside the wound region (removes black speckles)
        filled_mask = morphology.binary_fill_holes(binary_mask)
        
        # Apply morphological closing to smooth the shape and fill small gaps
        kernel_size = 3
        selem = morphology.disk(kernel_size)
        closed_mask = morphology.binary_closing(filled_mask, selem)
        
        # Remove small objects/noise
        cleaned_mask = morphology.remove_small_objects(closed_mask, min_size=100)
        
        # Apply the cleaned mask to the depth image
        final_depth = np.where(cleaned_mask, depth_contrast, 0).astype(np.uint8)
        
        # Keep as 8-bit to match notebook output (avoid double conversion)
        # Convert to float only for consistency with existing API
        depth_final = final_depth.astype(np.float32) / 255.0
        
        logger.info(f"Applied improved depth processing with smoothing, normalization, and cleaning. Output range: {depth_final.min():.3f} - {depth_final.max():.3f}")
        return depth_final
        
    except Exception as e:
        logger.error(f"Error in depth processing: {e}")
        return depth_map


def save_depth_maps(depth_map: np.ndarray, output_dir: Path, scan_id: str) -> Dict[str, str]:
    """
    Save depth maps in both 8-bit and 16-bit formats.
    
    Args:
        depth_map: Processed depth map (0-1 range)
        output_dir: Directory to save depth maps
        scan_id: Scan identifier for filename
        
    Returns:
        Dictionary with paths to saved files
    """
    try:
        # Ensure output directory exists
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filenames
        depth_8bit_path = output_dir / f"{scan_id}_depth_8bit.png"
        depth_16bit_path = output_dir / f"{scan_id}_depth_16bit.png"
        
        # Save 8-bit depth map (for visualization)
        depth_8bit = (depth_map * 255).astype(np.uint8)
        cv2.imwrite(str(depth_8bit_path), depth_8bit)
        
        # Save 16-bit depth map (for precision)
        depth_16bit = (depth_map * 65535).astype(np.uint16)
        cv2.imwrite(str(depth_16bit_path), depth_16bit)
        
        logger.info(f"Saved depth maps: {depth_8bit_path} and {depth_16bit_path}")
        
        return {
            'depth_8bit_path': str(depth_8bit_path),
            'depth_16bit_path': str(depth_16bit_path)
        }
        
    except Exception as e:
        logger.error(f"Error saving depth maps: {e}")
        raise


def calculate_depth_statistics(depth_map: np.ndarray, mask: Optional[np.ndarray] = None) -> Dict[str, float]:
    """
    Calculate depth statistics from depth map.
    
    Args:
        depth_map: Depth map array
        mask: Optional mask to limit calculation to wound region
        
    Returns:
        Dictionary with depth statistics
    """
    try:
        # Apply mask if provided
        if mask is not None:
            # Ensure mask is binary
            mask_binary = (mask > 0).astype(np.uint8)
            depth_masked = depth_map * mask_binary
            valid_depths = depth_masked[mask_binary > 0]
        else:
            valid_depths = depth_map.flatten()
            
        # Remove zero values (background)
        valid_depths = valid_depths[valid_depths > 0]
        
        if len(valid_depths) == 0:
            logger.warning("No valid depth values found")
            return {
                'max_depth': 0.0,
                'mean_depth': 0.0,
                'min_depth': 0.0,
                'std_depth': 0.0,
                'median_depth': 0.0,
                'valid_pixel_count': 0
            }
            
        # Calculate statistics
        stats = {
            'max_depth': float(np.max(valid_depths)),
            'mean_depth': float(np.mean(valid_depths)),
            'min_depth': float(np.min(valid_depths)),
            'std_depth': float(np.std(valid_depths)),
            'median_depth': float(np.median(valid_depths)),
            'valid_pixel_count': len(valid_depths)
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error calculating depth statistics: {e}")
        return {
            'max_depth': 0.0,
            'mean_depth': 0.0,
            'min_depth': 0.0,
            'std_depth': 0.0,
            'median_depth': 0.0,
            'valid_pixel_count': 0
        }


def estimate_volume_from_depth(depth_map: np.ndarray, mask: Optional[np.ndarray] = None, 
                              pixel_size_mm: float = 0.1) -> float:
    """
    Estimate volume from depth map using trapezoidal rule approximation.
    
    Args:
        depth_map: Depth map in normalized units
        mask: Optional mask to limit calculation to wound region
        pixel_size_mm: Size of each pixel in mm
        
    Returns:
        Estimated volume in cubic mm
    """
    try:
        # Apply mask if provided
        if mask is not None:
            mask_binary = (mask > 0).astype(np.uint8)
            depth_masked = depth_map * mask_binary
            valid_depths = depth_masked[mask_binary > 0]
        else:
            valid_depths = depth_map[depth_map > 0]
            
        if len(valid_depths) == 0:
            return 0.0
            
        # Calculate volume using pixel area * depth
        # Each pixel represents pixel_size_mm^2 area
        pixel_area_mm2 = pixel_size_mm ** 2
        
        # Sum all depth values and multiply by pixel area
        total_volume = np.sum(valid_depths) * pixel_area_mm2
        
        return float(total_volume)
        
    except Exception as e:
        logger.error(f"Error estimating volume: {e}")
        return 0.0 