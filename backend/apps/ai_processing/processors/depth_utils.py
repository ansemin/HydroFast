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
    Return raw ZoeDepth output without processing (simplified approach).
    
    Args:
        depth_map: Raw depth map from ZoeDepth
        mask: Optional wound mask (unused in simplified approach)
        contrast_alpha: Contrast adjustment factor (unused in simplified approach)
        brightness_beta: Brightness adjustment factor (unused in simplified approach)
        blur_kernel: Gaussian blur kernel size (unused in simplified approach)
        
    Returns:
        Raw depth map (unprocessed ZoeDepth output)
    """
    try:
        # Return raw ZoeDepth output directly - this produces the best results
        logger.info(f"Using raw ZoeDepth output (simplified approach). Output range: {depth_map.min():.3f} - {depth_map.max():.3f}")
        return depth_map
        
    except Exception as e:
        logger.error(f"Error in depth processing: {e}")
        return depth_map


def apply_sharp_depth_processing(depth_map: np.ndarray, mask: Optional[np.ndarray] = None,
                                contrast_alpha: float = 0.8, brightness_beta: float = 0, 
                                blur_kernel: int = 1) -> np.ndarray:
    """
    Apply SHARP post-processing to depth map with no blur for ultra-sharp results.
    Designed to produce crisp, well-defined depth maps like high-quality outputs.
    
    Args:
        depth_map: Raw depth map from ZoeDepth
        mask: Optional wound mask to limit processing to wound region
        contrast_alpha: Contrast adjustment factor (higher = more contrast)
        brightness_beta: Brightness adjustment factor
        blur_kernel: If 1, no smoothing is applied (sharp mode)
        
    Returns:
        Sharp processed depth map
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
        
        # Step 2: SHARP MODE - Skip blur entirely for sharp results
        if blur_kernel <= 1:
            # Use bilateral filter for edge-preserving smoothing (optional minimal smoothing)
            depth_smoothed = cv2.bilateralFilter(masked_depth.astype(np.float32), 5, 0.1, 0.1)
            logger.info("Applied edge-preserving bilateral filter for sharp processing")
        else:
            # Original smoothing for compatibility
            depth_smoothed = cv2.GaussianBlur(masked_depth, (blur_kernel, blur_kernel), sigmaX=2, sigmaY=2)
            logger.info(f"Applied Gaussian blur with kernel {blur_kernel}")
        
        # Step 3: Enhanced normalization for sharp contrast
        nonzero_mask = (mask_binary > 0) & (depth_smoothed > 0)
        
        if np.any(nonzero_mask):
            wound_vals = depth_smoothed[nonzero_mask]
            
            if wound_vals.max() > wound_vals.min():
                # Normalize with enhanced contrast stretching
                depth_norm = np.zeros_like(depth_smoothed)
                
                # Apply histogram equalization for better contrast
                wound_vals_eq = cv2.equalizeHist((wound_vals * 255).astype(np.uint8)).astype(np.float32) / 255.0
                depth_norm[nonzero_mask] = wound_vals_eq
                
                logger.info("Applied histogram equalization for enhanced contrast")
            else:
                depth_norm = np.zeros_like(depth_smoothed)
        else:
            depth_norm = np.zeros_like(depth_smoothed)
        
        # Step 4: Convert to 8-bit for final processing
        depth_gray = (depth_norm * 255).astype(np.uint8)
        
        # Step 5: Apply aggressive contrast and brightness for sharp results
        # Use higher contrast multiplier for sharpness
        enhanced_alpha = contrast_alpha * 2.0  # More aggressive contrast
        enhanced_beta = brightness_beta  # Keep brightness as specified
        depth_contrast = cv2.convertScaleAbs(depth_gray, alpha=enhanced_alpha, beta=enhanced_beta)
        
        # Step 6: Apply mask to zero out background
        depth_contrast[mask_binary == 0] = 0
        
        # Step 7: Minimal morphological operations for sharp results
        if blur_kernel <= 1:
            # Skip morphological operations for ultra-sharp results
            final_depth = depth_contrast
            logger.info("Skipped morphological operations for ultra-sharp results")
        else:
            # Apply minimal morphological operations (skip binary_fill_holes)
            binary_mask = depth_contrast > 0
            filled_mask = binary_mask
            
            # Use smaller kernel for minimal smoothing
            kernel_size = 1
            selem = morphology.disk(kernel_size)
            closed_mask = morphology.binary_closing(filled_mask, selem)
            
            # Remove very small objects only
            cleaned_mask = morphology.remove_small_objects(closed_mask, min_size=10)
            
            final_depth = np.where(cleaned_mask, depth_contrast, 0).astype(np.uint8)
        
        # Step 8: Apply final sharpening filter for ultra-crisp results
        if blur_kernel <= 1:
            # Create sharpening kernel
            sharpening_kernel = np.array([[-1, -1, -1],
                                        [-1,  9, -1],
                                        [-1, -1, -1]])
            
            # Apply sharpening only to non-zero regions
            final_depth_float = final_depth.astype(np.float32)
            sharpened = cv2.filter2D(final_depth_float, -1, sharpening_kernel)
            
            # Clamp values and apply mask
            sharpened = np.clip(sharpened, 0, 255)
            sharpened[mask_binary == 0] = 0
            final_depth = sharpened.astype(np.uint8)
            
            logger.info("Applied final sharpening filter for ultra-crisp results")
        
        # Convert to float for API consistency
        depth_final = final_depth.astype(np.float32) / 255.0
        
        logger.info(f"Applied SHARP depth processing. Output range: {depth_final.min():.3f} - {depth_final.max():.3f}")
        return depth_final
        
    except Exception as e:
        logger.error(f"Error in sharp depth processing: {e}")
        return depth_map


def apply_notebook_depth_processing(depth_map: np.ndarray, mask: Optional[np.ndarray] = None,
                                   contrast_alpha: float = 0.3, brightness_beta: float = -40, 
                                   blur_kernel: int = 9, skip_blur: bool = False) -> np.ndarray:
    """
    Apply depth processing following the exact notebook approach.
    Based on the original deepskin.ipynb implementation.
    
    Args:
        depth_map: Raw depth map from ZoeDepth
        mask: Optional wound mask to limit processing to wound region
        contrast_alpha: Contrast adjustment factor (0.3 from notebook)
        brightness_beta: Brightness adjustment factor (-40 from notebook)
        blur_kernel: Gaussian blur kernel size (9 from notebook)
        skip_blur: If True, skip Gaussian blur for ultra-sharp results
        
    Returns:
        Processed depth map following notebook approach
    """
    try:
        logger.info("Applying notebook-style depth processing")
        
        # Step 1: Extract wound-only depth (following notebook Step 5)
        if mask is not None:
            # Ensure mask is binary
            mask_binary = (mask > 0).astype(np.uint8)
            masked_depth = np.zeros_like(depth_map)
            masked_depth[mask_binary > 0] = depth_map[mask_binary > 0]
        else:
            masked_depth = depth_map.copy()
            mask_binary = (depth_map > 0).astype(np.uint8)
        
        logger.info("Extracted wound-only depth")
        
        # Step 2: Smooth wound depth map (following notebook Step 6)
        if skip_blur:
            depth_smoothed = masked_depth  # Skip blur for ultra-sharp results
            logger.info("Skipped Gaussian blur for ultra-sharp processing")
        else:
            depth_smoothed = cv2.GaussianBlur(masked_depth, (blur_kernel, blur_kernel), sigmaX=2, sigmaY=2)
            logger.info(f"Applied Gaussian blur with kernel {blur_kernel}")
        
        # Step 3: Normalize wound depth ONLY (following notebook Step 7)
        nonzero_mask = (mask_binary > 0) & (depth_smoothed > 0)
        
        if np.any(nonzero_mask):
            wound_vals = depth_smoothed[nonzero_mask]
            
            if wound_vals.max() > wound_vals.min():
                # Normalize using notebook approach: (depth - min) / (max - min)
                depth_norm = np.zeros_like(depth_smoothed)
                normalized_vals = (wound_vals - wound_vals.min()) / (wound_vals.max() - wound_vals.min())
                depth_norm[nonzero_mask] = normalized_vals
                logger.info("Applied notebook-style normalization to wound region only")
            else:
                depth_norm = np.zeros_like(depth_smoothed)
        else:
            depth_norm = np.zeros_like(depth_smoothed)
        
        # Step 4: Convert to 8-bit grayscale (following notebook)
        depth_gray = (depth_norm * 255).astype(np.uint8)
        
        # Step 5: Apply contrast & brightness adjustment (following notebook Step 8)
        # Formula from notebook: new_pixel = alpha * old_pixel + beta
        depth_contrast = cv2.convertScaleAbs(depth_gray, alpha=contrast_alpha, beta=brightness_beta)
        logger.info(f"Applied contrast (alpha={contrast_alpha}) and brightness (beta={brightness_beta})")
        
        # Step 6: Apply mask again to zero out background (following notebook)
        depth_contrast[mask_binary == 0] = 0
        
        # Step 7: Clean up small objects (following notebook morphological cleaning)
        if not skip_blur:  # Only apply morphological operations if we're not in ultra-sharp mode
            # Convert depth image to binary mask
            binary_mask = depth_contrast > 0
            
            # Remove small specks/noise (< 100 pixels) following notebook
            cleaned_mask = morphology.remove_small_objects(binary_mask, min_size=100)
            
            # Apply cleaned mask to original depth_contrast
            final_depth = np.where(cleaned_mask, depth_contrast, 0).astype(np.uint8)
            logger.info("Applied morphological cleaning to remove small objects")
        else:
            final_depth = depth_contrast
            logger.info("Skipped morphological operations for ultra-sharp results")
        
        # Convert to float for API consistency
        depth_final = final_depth.astype(np.float32) / 255.0
        
        logger.info(f"Notebook-style depth processing complete. Output range: {depth_final.min():.3f} - {depth_final.max():.3f}")
        return depth_final
        
    except Exception as e:
        logger.error(f"Error in notebook-style depth processing: {e}")
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
        
        # Generate clean filenames - avoid redundant scan_id prefix since it's in the directory
        depth_8bit_path = output_dir / "depth_8bit.png"
        depth_16bit_path = output_dir / "depth_16bit.png"
        
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
    Estimate wound volume from depth map using the trapezoid rule.
    
    Args:
        depth_map: 2D numpy array representing depth values
        mask: Optional binary mask to limit volume calculation to wound region
        pixel_size_mm: Size of each pixel in millimeters
        
    Returns:
        Estimated volume in cubic millimeters
    """
    try:
        if mask is not None:
            # Apply mask to depth map
            masked_depth = depth_map * mask
            valid_depth = masked_depth[mask > 0]
        else:
            valid_depth = depth_map[depth_map > 0]
        
        if len(valid_depth) == 0:
            logger.warning("No valid depth values found")
            return 0.0
        
        # Calculate volume using numerical integration
        # Each pixel represents a small volume element
        pixel_area_mm2 = pixel_size_mm ** 2
        total_volume = np.sum(valid_depth) * pixel_area_mm2
        
        logger.info(f"Estimated volume: {total_volume:.2f} mm³")
        return float(total_volume)
        
    except Exception as e:
        logger.error(f"Error estimating volume: {e}")
        return 0.0


def detect_bounding_box_from_segmented(segmented_image_path: str) -> Optional[Dict[str, int]]:
    """
    Detect bounding box of non-black pixels in a segmented image.
    
    Args:
        segmented_image_path: Path to the segmented image
        
    Returns:
        Dictionary with bounding box coordinates (x, y, width, height) or None if failed
    """
    try:
        # Load the segmented image
        image = cv2.imread(segmented_image_path)
        if image is None:
            logger.error(f"Could not load segmented image from {segmented_image_path}")
            return None
        
        # Convert to grayscale for easier processing
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Find non-black pixels (assuming black background is 0)
        non_black_mask = gray > 0
        
        # Find coordinates of non-black pixels
        coords = np.column_stack(np.where(non_black_mask))
        
        if len(coords) == 0:
            logger.warning("No non-black pixels found in segmented image")
            return None
        
        # Get bounding box coordinates
        y_min, x_min = coords.min(axis=0)
        y_max, x_max = coords.max(axis=0)
        
        # Convert to bounding box format (x, y, width, height)
        bbox = {
            'x': int(x_min),
            'y': int(y_min), 
            'width': int(x_max - x_min + 1),
            'height': int(y_max - y_min + 1)
        }
        
        logger.info(f"Detected bounding box: {bbox}")
        return bbox
        
    except Exception as e:
        logger.error(f"Error detecting bounding box: {e}")
        return None


def crop_image_with_bbox(image_path: str, bbox: Dict[str, int], output_path: str) -> bool:
    """
    Crop an image using the provided bounding box.
    
    Args:
        image_path: Path to the original image
        bbox: Dictionary with bounding box coordinates (x, y, width, height)
        output_path: Path to save the cropped image
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image from {image_path}")
            return False
        
        # Extract bounding box coordinates
        x, y, width, height = bbox['x'], bbox['y'], bbox['width'], bbox['height']
        
        # Validate bounding box
        if x < 0 or y < 0 or width <= 0 or height <= 0:
            logger.error(f"Invalid bounding box: {bbox}")
            return False
        
        if x + width > image.shape[1] or y + height > image.shape[0]:
            logger.error(f"Bounding box exceeds image dimensions: {bbox}")
            return False
        
        # Crop the image
        cropped_image = image[y:y+height, x:x+width]
        
        # Save the cropped image
        success = cv2.imwrite(output_path, cropped_image)
        if success:
            logger.info(f"Successfully cropped image and saved to {output_path}")
            return True
        else:
            logger.error(f"Failed to save cropped image to {output_path}")
            return False
        
    except Exception as e:
        logger.error(f"Error cropping image: {e}")
        return False


def visualize_bounding_box(image_path: str, bbox: Dict[str, int], output_path: str) -> bool:
    """
    Visualize the bounding box on the original image.
    
    Args:
        image_path: Path to the original image
        bbox: Dictionary with bounding box coordinates (x, y, width, height)
        output_path: Path to save the visualization
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image from {image_path}")
            return False
        
        # Extract bounding box coordinates
        x, y, width, height = bbox['x'], bbox['y'], bbox['width'], bbox['height']
        
        # Draw bounding box (green rectangle)
        cv2.rectangle(image, (x, y), (x + width, y + height), (0, 255, 0), 2)
        
        # Save the visualization
        success = cv2.imwrite(output_path, image)
        if success:
            logger.info(f"Successfully saved bounding box visualization to {output_path}")
            return True
        else:
            logger.error(f"Failed to save bounding box visualization to {output_path}")
            return False
        
    except Exception as e:
        logger.error(f"Error visualizing bounding box: {e}")
        return False 