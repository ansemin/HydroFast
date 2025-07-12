"""
Utility functions for ZoeDepth depth processing.
Includes mask extraction, image processing, and depth map utilities.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def extract_wound_mask_from_segmented(image_path: str, method: str = 'green_contour') -> Optional[np.ndarray]:
    """
    Extract wound mask from segmented image using specified method.
    
    Args:
        image_path: Path to segmented image
        method: Method to use ('green_contour', 'auto_threshold')
        
    Returns:
        Binary mask as numpy array or None if extraction fails
    """
    try:
        # Load the segmented image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image from {image_path}")
            return None
            
        if method == 'green_contour':
            return _extract_green_contour_mask(image)
        elif method == 'auto_threshold':
            return _extract_auto_threshold_mask(image)
        else:
            logger.warning(f"Unknown mask extraction method: {method}")
            return None
            
    except Exception as e:
        logger.error(f"Error extracting wound mask: {e}")
        return None


def _extract_green_contour_mask(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract wound mask using green contour detection in HSV color space.
    
    Args:
        image: Input segmented image (BGR format)
        
    Returns:
        Binary mask or None if extraction fails
    """
    try:
        # Convert BGR to HSV for better color detection
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define range for green color in HSV
        # Green hue ranges from 35-85 in OpenCV HSV
        lower_green = np.array([35, 50, 50])
        upper_green = np.array([85, 255, 255])
        
        # Create mask for green areas
        mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Apply morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # Fill holes in the mask
        mask = cv2.medianBlur(mask, 5)
        
        # Check if we found any green regions
        if cv2.countNonZero(mask) == 0:
            logger.warning("No green regions found in segmented image")
            return None
            
        return mask
        
    except Exception as e:
        logger.error(f"Error in green contour extraction: {e}")
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


def apply_depth_processing(depth_map: np.ndarray, contrast_alpha: float = 0.3, 
                          brightness_beta: float = -40, blur_kernel: int = 5) -> np.ndarray:
    """
    Apply post-processing to depth map according to Algorithm 1.
    
    Args:
        depth_map: Raw depth map from ZoeDepth
        contrast_alpha: Contrast adjustment factor (0.3 from research)
        brightness_beta: Brightness adjustment factor (-40 from research)
        blur_kernel: Gaussian blur kernel size (5 from research)
        
    Returns:
        Processed depth map
    """
    try:
        # Normalize depth map to 0-1 range
        depth_normalized = cv2.normalize(depth_map, None, 0, 1, cv2.NORM_MINMAX, dtype=cv2.CV_32F)
        
        # Apply Gaussian blur
        if blur_kernel > 0:
            depth_blurred = cv2.GaussianBlur(depth_normalized, (blur_kernel, blur_kernel), 0)
        else:
            depth_blurred = depth_normalized
            
        # Apply contrast and brightness adjustment
        # Formula: new_image = alpha * image + beta
        depth_adjusted = cv2.convertScaleAbs(depth_blurred, alpha=contrast_alpha, beta=brightness_beta)
        
        # Convert back to float and normalize again
        depth_final = depth_adjusted.astype(np.float32) / 255.0
        
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