"""
ZoeDepth Processor for monocular depth estimation.
Implements ZoeD_NK model for converting segmented wound images to depth maps.
"""

import torch
import numpy as np
import cv2
from pathlib import Path
from typing import Dict, Any, Optional, Union
import logging
import json
from datetime import datetime

from .base import BaseProcessor
from .depth_utils import (
    save_depth_maps,
    calculate_depth_statistics,
    estimate_volume_from_depth,
    detect_bounding_box_from_segmented,
    crop_image_with_bbox,
    visualize_bounding_box
)

logger = logging.getLogger(__name__)


class ZoeDepthProcessor(BaseProcessor):
    """
    ZoeDepth processor for monocular depth estimation.
    Uses ZoeD_NK model to generate depth maps from segmented wound images.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the ZoeDepth processor.
        
        Args:
            config: Configuration dictionary with ZoeDepth parameters
        """
        default_config = {
            'model_type': 'ZoeD_NK',  # ZoeD_NK for better detail preservation
            'device': 'cuda' if torch.cuda.is_available() else 'cpu',
            'model_precision': 'fp32',  # 'fp16' or 'fp32'
            'input_size': (384, 512),   # (height, width) for ZoeDepth
            'output_size': None,        # If None, uses input image size
            'contrast_alpha': 0.3,      # Contrast adjustment from research
            'brightness_beta': -40,     # Brightness adjustment from research
            'blur_kernel': 9,           # Gaussian blur kernel size (improved from notebook)
            'mask_extraction_method': 'non_black_regions',  # 'non_black_regions' or 'auto_threshold'
            'pixel_size_mm': 0.1,      # Pixel size in mm for volume calculation
            'save_16bit': True,         # Save 16-bit depth maps for precision
            'save_8bit': True,          # Save 8-bit depth maps for visualization
            'save_metadata': True       # Save processing metadata
        }
        
        if config:
            default_config.update(config)
        
        super().__init__(default_config)
        
        # Initialize model variable
        self.model = None
        self.device = torch.device(self.config['device'])
        
        logger.info(f"ZoeDepth processor initialized with device: {self.device}")
        
    def load_model(self) -> None:
        """Load the ZoeDepth model."""
        try:
            logger.info("Loading ZoeDepth model...")
            
            # Import ZoeDepth here to avoid import errors if not installed
            try:
                import torch.hub
                # Load ZoeD_NK model from torch hub
                self.model = torch.hub.load('isl-org/ZoeDepth', 'ZoeD_NK', pretrained=True)
                logger.info("Successfully loaded ZoeD_NK model from torch hub")
            except Exception as hub_error:
                logger.warning(f"Failed to load from torch hub: {hub_error}")
                try:
                    # Fallback: try to load ZoeD_N model
                    self.model = torch.hub.load('isl-org/ZoeDepth', 'ZoeD_N', pretrained=True)
                    logger.info("Successfully loaded ZoeD_N model as fallback")
                except Exception as fallback_error:
                    logger.error(f"Failed to load ZoeDepth model: {fallback_error}")
                    raise RuntimeError(f"Could not load ZoeDepth model. Hub error: {hub_error}, Fallback error: {fallback_error}")
            
            # Move model to device
            self.model.to(self.device)
            self.model.eval()
            
            # Set precision
            if self.config['model_precision'] == 'fp16' and self.device.type == 'cuda':
                self.model.half()
                logger.info("Model set to half precision (fp16)")
            else:
                logger.info("Model using full precision (fp32)")
            
            self.is_loaded = True
            logger.info("ZoeDepth model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load ZoeDepth model: {e}")
            raise
    
    def process(self, segmented_image_path: str) -> Dict[str, Any]:
        """
        Process segmented wound image to generate depth map WITHOUT masking.
        
        IMPORTANT: This method now processes the input image directly with ZoeDepth
        without applying any wound masking. The raw ZoeDepth output is used.
        
        Args:
            segmented_image_path: Path to the segmented wound image
            
        Returns:
            Dictionary containing depth analysis results with raw ZoeDepth output
        """
        if not self.is_loaded:
            self.load_model()
        
        if not self.validate_input(segmented_image_path):
            raise ValueError(f"Invalid input image path: {segmented_image_path}")
        
        try:
            logger.info(f"Processing depth for image: {segmented_image_path}")
            
            # Preprocess the image
            processed_image, original_size = self.preprocess(segmented_image_path)
            
            # Generate depth map using ZoeDepth
            raw_depth_map = self._generate_depth_map(processed_image)
            
            # Resize depth map to original image size if needed
            if self.config['output_size'] is None and original_size is not None:
                raw_depth_map = cv2.resize(raw_depth_map, original_size, interpolation=cv2.INTER_LINEAR)
            
            # Use raw depth map directly (NO MASKING APPLIED)
            logger.info("⚠️  NO WOUND MASKING APPLIED - using raw ZoeDepth output directly")
            processed_depth_map = raw_depth_map  # Use raw depth map directly
            logger.info("Using RAW ZoeDepth output without any masking")
            
            # Calculate depth statistics (no mask applied)
            depth_stats = calculate_depth_statistics(processed_depth_map, mask=None)
            
            # Estimate volume (no mask applied)
            volume_estimate = estimate_volume_from_depth(
                processed_depth_map, 
                mask=None, 
                pixel_size_mm=self.config['pixel_size_mm']
            )
            
            # Save depth maps
            depth_map_paths = self._save_depth_maps(processed_depth_map, segmented_image_path)
            
            # Create results dictionary
            results = {
                'depth_map_8bit_path': depth_map_paths.get('depth_8bit_path'),
                'depth_map_16bit_path': depth_map_paths.get('depth_16bit_path'),
                'depth_statistics': depth_stats,
                'volume_estimate': {
                    'total_volume': volume_estimate,  # cubic mm
                    'confidence': 0.8,  # Confidence score (can be improved with validation)
                    'method': 'ZoeDepth_raw_no_mask'
                },
                'wound_mask_extracted': False,  # No masking applied
                'processing_parameters': {
                    'model_type': self.config['model_type'],
                    'masking_applied': False,  # Updated to reflect no masking
                    'pixel_size_mm': self.config['pixel_size_mm']
                }
            }
            
            # Save metadata if configured
            if self.config['save_metadata']:
                metadata_path = self._save_metadata(results, segmented_image_path)
                results['metadata_path'] = metadata_path
            
            # Postprocess results
            return self.postprocess(results)
            
        except Exception as e:
            logger.error(f"Error during ZoeDepth processing: {e}")
            raise

    def process_with_bbox_crop(self, original_image_path: str, segmented_image_path: str, output_dir: str) -> Dict[str, Any]:
        """
        Process wound image using simplified bbox crop workflow WITHOUT masking.
        
        IMPORTANT: ZoeDepth processing is performed on the CROPPED ORIGINAL image only.
        No wound masking is applied - the raw ZoeDepth output is used directly.
        
        Simplified Workflow:
        1. Detect bounding box from segmented image
        2. Crop original image using bounding box  
        3. Perform ZoeDepth on CROPPED ORIGINAL image
        4. Save raw depth map without any masking applied
        
        Args:
            original_image_path: Path to the original image
            segmented_image_path: Path to the segmented wound image (used only for bbox detection)
            output_dir: Directory to save intermediate and final results
            
        Returns:
            Dictionary containing depth analysis results with simplified workflow
        """
        if not self.is_loaded:
            self.load_model()
        
        if not self.validate_input(segmented_image_path):
            raise ValueError(f"Invalid segmented image path: {segmented_image_path}")
        
        if not self.validate_input(original_image_path):
            raise ValueError(f"Invalid original image path: {original_image_path}")
        
        try:
            logger.info(f"Processing depth with bbox crop workflow")
            logger.info(f"Original image: {original_image_path}")
            logger.info(f"Segmented image: {segmented_image_path}")
            
            # Create output directory
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Step 1: Detect bounding box from segmented image
            bbox = detect_bounding_box_from_segmented(segmented_image_path)
            if bbox is None:
                raise ValueError("Could not detect bounding box from segmented image")
            
            # Step 2: Visualize bounding box on original image
            bbox_viz_path = output_path / "bbox_visualization.png"
            visualize_bounding_box(original_image_path, bbox, str(bbox_viz_path))
            
            # Step 3: Crop original image using bounding box
            cropped_image_path = output_path / "cropped_wound.png"
            crop_success = crop_image_with_bbox(original_image_path, bbox, str(cropped_image_path))
            if not crop_success:
                raise ValueError("Failed to crop image using bounding box")
            
            # Step 4: Preprocess the cropped original image
            logger.info("IMPORTANT: Using CROPPED ORIGINAL image for ZoeDepth processing (NO MASKING)")
            logger.info(f"ZoeDepth input: {cropped_image_path} (cropped original)")
            processed_image, original_size = self.preprocess(str(cropped_image_path))
            
            # Step 5: Generate depth map using ZoeDepth on cropped original image
            logger.info("Generating raw depth map from cropped ORIGINAL image using ZoeDepth...")
            raw_depth_map = self._generate_depth_map(processed_image)
            
            # Step 6: Resize depth map to cropped image size if needed
            if self.config['output_size'] is None and original_size is not None:
                raw_depth_map = cv2.resize(raw_depth_map, original_size, interpolation=cv2.INTER_LINEAR)
            
            # Step 7: Use raw depth map directly (NO MASKING APPLIED)
            logger.info("⚠️  NO WOUND MASKING APPLIED - using raw ZoeDepth output directly")
            logger.info("Simplified Flow: ZoeDepth(cropped_original) = Final depth map")
            processed_depth_map = raw_depth_map  # Use raw depth map directly
            logger.info("Using RAW ZoeDepth output without any masking")
            
            # Step 8: Calculate depth statistics (no mask applied)
            depth_stats = calculate_depth_statistics(processed_depth_map, mask=None)
            
            # Step 9: Estimate volume (no mask applied)
            volume_estimate = estimate_volume_from_depth(
                processed_depth_map, 
                mask=None, 
                pixel_size_mm=self.config['pixel_size_mm']
            )
            
            # Step 10: Save depth maps with custom naming
            depth_8bit_path = output_path / "depth_8bit.png"
            depth_16bit_path = output_path / "depth_16bit.png"
            
            # Save 8-bit depth map
            depth_8bit_normalized = cv2.normalize(processed_depth_map, None, 0, 255, cv2.NORM_MINMAX)
            cv2.imwrite(str(depth_8bit_path), depth_8bit_normalized.astype(np.uint8))
            
            # Save 16-bit depth map  
            depth_16bit_normalized = cv2.normalize(processed_depth_map, None, 0, 65535, cv2.NORM_MINMAX)
            cv2.imwrite(str(depth_16bit_path), depth_16bit_normalized.astype(np.uint16))
            
            # Step 11: Create results dictionary
            results = {
                'workflow_type': 'bbox_crop_no_mask',
                'original_image_path': original_image_path,
                'segmented_image_path': segmented_image_path,
                'bbox': bbox,
                'bbox_visualization_path': str(bbox_viz_path),
                'cropped_image_path': str(cropped_image_path),
                'depth_map_8bit_path': str(depth_8bit_path),
                'depth_map_16bit_path': str(depth_16bit_path),
                'depth_statistics': depth_stats,
                'volume_estimate': {
                    'total_volume': volume_estimate,  # cubic mm
                    'confidence': 0.8,  # Confidence score (can be improved with validation)
                    'method': 'ZoeDepth_raw_no_mask'
                },
                'wound_mask_extracted': False,  # No masking applied
                'processing_parameters': {
                    'model_type': self.config['model_type'],
                    'masking_applied': False,  # Updated to reflect no masking
                    'pixel_size_mm': self.config['pixel_size_mm']
                }
            }
            
            # Step 12: Save metadata
            metadata_path = output_path / "metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            results['metadata_path'] = str(metadata_path)
            
            logger.info(f"Successfully completed simplified bbox crop workflow (NO MASKING)")
            return results
            
        except Exception as e:
            logger.error(f"Error in bbox crop workflow: {e}")
            raise
    
    def validate_input(self, image_path: str) -> bool:
        """
        Validate the input image path.
        
        Args:
            image_path: Path to the segmented image
            
        Returns:
            True if valid, False otherwise
        """
        if not image_path:
            logger.error("Empty image path provided")
            return False
        
        image_file = Path(image_path)
        if not image_file.exists():
            logger.error(f"Image file does not exist: {image_path}")
            return False
        
        # Check file extension
        valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        if image_file.suffix.lower() not in valid_extensions:
            logger.error(f"Invalid image format: {image_file.suffix}")
            return False
        
        # Check if image can be loaded
        try:
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"Could not load image: {image_path}")
                return False
        except Exception as e:
            logger.error(f"Error loading image: {e}")
            return False
        
        return True
    
    def preprocess(self, image_path: str) -> tuple:
        """
        Preprocess image for ZoeDepth processing.
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Tuple of (processed_image_tensor, original_size)
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            original_size = (image.shape[1], image.shape[0])  # (width, height)
            
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Resize to model input size
            input_height, input_width = self.config['input_size']
            image_resized = cv2.resize(image_rgb, (input_width, input_height))
            
            # Normalize to [0, 1] range
            image_normalized = image_resized.astype(np.float32) / 255.0
            
            # Convert to tensor and add batch dimension
            image_tensor = torch.from_numpy(image_normalized).permute(2, 0, 1).unsqueeze(0)
            
            # Move to device
            image_tensor = image_tensor.to(self.device)
            
            # Apply half precision if configured
            if self.config['model_precision'] == 'fp16' and self.device.type == 'cuda':
                image_tensor = image_tensor.half()
            
            logger.info(f"Preprocessed image from {original_size} to {self.config['input_size']}")
            
            return image_tensor, original_size
            
        except Exception as e:
            logger.error(f"Error in preprocessing: {e}")
            raise
    
    def _generate_depth_map(self, image_tensor: torch.Tensor) -> np.ndarray:
        """
        Generate depth map using ZoeDepth model.
        
        Args:
            image_tensor: Preprocessed image tensor
            
        Returns:
            Depth map as numpy array
        """
        try:
            with torch.no_grad():
                # Generate depth map using infer method for better results
                model_output = self.model.infer(image_tensor)
                
                # Handle different output formats from ZoeDepth
                if isinstance(model_output, dict):
                    # ZoeDepth returns a dict with 'metric_depth' key
                    if 'metric_depth' in model_output:
                        depth_tensor = model_output['metric_depth']
                    elif 'depth' in model_output:
                        depth_tensor = model_output['depth']
                    else:
                        # Take the first value if no known keys
                        depth_tensor = list(model_output.values())[0]
                        logger.warning("Unknown ZoeDepth output format, using first value")
                elif isinstance(model_output, torch.Tensor):
                    depth_tensor = model_output
                else:
                    raise ValueError(f"Unexpected model output type: {type(model_output)}")
                
                # Convert to numpy array
                depth_map = depth_tensor.squeeze().cpu().numpy()
                
                # Ensure depth map is in float32 format
                depth_map = depth_map.astype(np.float32)
                
                logger.info(f"Generated depth map with shape: {depth_map.shape}")
                logger.info(f"Model output type: {type(model_output)}")
                
                return depth_map
                
        except Exception as e:
            logger.error(f"Error generating depth map: {e}")
            logger.error(f"Model output type: {type(model_output) if 'model_output' in locals() else 'Unknown'}")
            if 'model_output' in locals() and isinstance(model_output, dict):
                logger.error(f"Dict keys: {list(model_output.keys())}")
            raise
    
    def _save_depth_maps(self, depth_map: np.ndarray, original_image_path: str) -> Dict[str, str]:
        """
        Save depth maps to disk.
        
        Args:
            depth_map: Processed depth map
            original_image_path: Path to original image (for generating output names)
            
        Returns:
            Dictionary with paths to saved depth maps
        """
        try:
            # Extract scan ID from the image path - get the actual database scan ID
            # Instead of using filename stem, extract scan ID from the path structure
            original_path = Path(original_image_path)
            
            # Try to get scan ID from database by matching the image path
            from django.conf import settings
            from apps.scans.models import Scan
            
            try:
                # Get scan from database by image path
                relative_image_path = str(original_path.relative_to(Path(settings.MEDIA_ROOT)))
                scan = Scan.objects.get(image=relative_image_path)
                scan_id = f"scan_{scan.id}"
            except (ValueError, Scan.DoesNotExist):
                # Fallback to filename-based approach if database lookup fails
                scan_id = original_path.stem
            
            # Use consistent storage path - always use depth_maps_bbox structure
            output_dir = Path(settings.MEDIA_ROOT) / 'depth_maps_bbox' / scan_id
            
            # Save depth maps with clean naming (remove redundant _segmented suffix)
            return save_depth_maps(depth_map, output_dir, scan_id)
            
        except Exception as e:
            logger.error(f"Error saving depth maps: {e}")
            raise
    
    def _save_metadata(self, results: Dict[str, Any], original_image_path: str) -> str:
        """
        Save processing metadata to JSON file.
        
        Args:
            results: Processing results
            original_image_path: Path to original image
            
        Returns:
            Path to saved metadata file
        """
        try:
            # Get scan ID from original image path
            original_path = Path(original_image_path)
            scan_id = original_path.stem
            
            # Create metadata
            metadata = {
                'scan_id': scan_id,
                'timestamp': datetime.now().isoformat(),
                'processor': 'ZoeDepthProcessor',
                'model_type': self.config['model_type'],
                'device': str(self.device),
                'input_image_path': original_image_path,
                'processing_parameters': results.get('processing_parameters', {}),
                'depth_statistics': results.get('depth_statistics', {}),
                'volume_estimate': results.get('volume_estimate', {}),
                'wound_mask_extracted': results.get('wound_mask_extracted', False)
            }
            
            # Save metadata
            from django.conf import settings
            output_dir = Path(settings.MEDIA_ROOT) / 'depth_maps'
            output_dir.mkdir(parents=True, exist_ok=True)
            
            metadata_path = output_dir / f"{scan_id}_depth_metadata.json"
            
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Saved metadata to: {metadata_path}")
            
            return str(metadata_path)
            
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")
            raise
    
    def postprocess(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocess ZoeDepth results.
        
        Args:
            results: Raw processing results
            
        Returns:
            Postprocessed results with additional metadata
        """
        processed_results = results.copy()
        
        # Add common metadata
        processed_results['processor'] = 'ZoeDepthProcessor'
        processed_results['timestamp'] = datetime.now().isoformat()
        processed_results['units'] = {
            'depth': 'normalized_units',
            'volume': 'cubic_mm',
            'pixel_size': 'mm'
        }
        
        # Add severity classification based on depth
        depth_stats = results.get('depth_statistics', {})
        max_depth = depth_stats.get('max_depth', 0)
        
        if max_depth < 0.2:
            severity = 'superficial'
        elif max_depth < 0.5:
            severity = 'moderate'
        else:
            severity = 'deep'
        
        processed_results['wound_severity'] = severity
        
        # Add confidence score based on processing quality
        confidence_factors = []
        
        # Factor 1: Successful mask extraction
        if results.get('wound_mask_extracted', False):
            confidence_factors.append(0.3)
        
        # Factor 2: Valid depth statistics
        if depth_stats.get('valid_pixel_count', 0) > 100:
            confidence_factors.append(0.4)
        
        # Factor 3: Reasonable depth range
        if 0.01 < depth_stats.get('max_depth', 0) < 2.0:
            confidence_factors.append(0.3)
        
        # Calculate overall confidence
        overall_confidence = min(sum(confidence_factors), 1.0)
        processed_results['processing_confidence'] = overall_confidence
        
        return processed_results 