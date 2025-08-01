"""
Wound Detection Processor using YOLO model.
Detects and segments wounds in uploaded images.
"""
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional
import logging

import cv2
import numpy as np
from ultralytics import YOLO

from .base import BaseProcessor

logger = logging.getLogger(__name__)


class WoundDetector(BaseProcessor):
    """
    YOLO-based wound detection processor.
    Detects wounds in images and returns bounding boxes and segmentation masks.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the wound detector.
        
        Args:
            config: Configuration dictionary with model_path, confidence_threshold, etc.
        """
        # Get the project root directory (parent of backend)
        # Current file: backend/apps/ai_processing/processors/wound_detector.py
        # Need to go up 5 levels to get to Project-2/
        project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        weights_path = project_root / 'weights' / 'best.pt'
        print(f"🎯 Looking for weights at: {weights_path}")
        print(f"🔍 Weights file exists: {weights_path.exists()}")
        
        default_config = {
            'model_path': str(weights_path),
            'confidence_threshold': 0.5,
            'iou_threshold': 0.45,
            'image_size': 640
        }
        if config:
            default_config.update(config)
        
        super().__init__(default_config)
        self.model = self.load_model()
    
    def load_model(self, model_path=None):
        """Load the YOLO wound detection model."""
        # Use the configured model path if not provided
        if model_path is None:
            model_path = self.config.get('model_path', 'weights/best.pt')
        
        try:
            # Check if the model file exists
            if not os.path.exists(model_path):
                logger.warning(f"Model file not found at {model_path}, attempting to download YOLOv8 pretrained model")
                # Fall back to a pretrained model if custom weights don't exist
                model_path = 'yolov8n-seg.pt'  # This will auto-download if not present
            
            print(f"Loading YOLO model from {model_path}")
            model = YOLO(model_path)
            logger.info(f"Successfully loaded YOLO model from {model_path}")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {str(e)}")
            logger.info("Falling back to YOLOv8 nano segmentation model")
            try:
                # Ultimate fallback to nano model
                return YOLO('yolov8n-seg.pt')
            except Exception as fallback_error:
                logger.error(f"Failed to load fallback model: {str(fallback_error)}")
                raise RuntimeError(f"Could not load any YOLO model. Original error: {str(e)}, Fallback error: {str(fallback_error)}")
    
    def process(self, image_path: str) -> str:
        """
        Detect wounds in the input image.
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Path to the processed image file
        """
        self.validate_input(image_path)
        preprocessed = self.preprocess(image_path)
        results = self.model(image_path)  # Directly pass image_path to YOLO for inference
        return self.postprocess(results, image_path)
    
    def validate_input(self, image_path: str) -> bool:
        """
        Validate the input image path.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            True if valid, False otherwise
        """
        if not image_path:
            return False
        
        image_file = Path(image_path)
        if not image_file.exists():
            logger.warning(f"Image file does not exist: {image_path}")
            return False
        
        # Check file extension
        valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        if image_file.suffix.lower() not in valid_extensions:
            logger.warning(f"Invalid image format: {image_file.suffix}")
            return False
        
        return True
    
    def preprocess(self, image_path: str) -> str:
        """
        Preprocess the image for wound detection.
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Path to the preprocessed image
        """
        # TODO: Implement image preprocessing
        # - Resize image to model input size
        # - Normalize pixel values
        # - Apply any required transformations
        
        logger.info(f"Preprocessing image: {image_path}")
        return image_path  # Return original for now
    
    def postprocess(self, results, original_image_path, output_path=None):
        """
        Postprocess detection results.
        
        Args:
            results: Raw detection results from YOLO
            original_image_path: Path to the original image
            output_path: Optional custom output path, defaults to temp directory
            
        Returns:
            Path to the processed image
        """
        try:
            original_image = cv2.imread(original_image_path)
            if original_image is None:
                raise ValueError(f"Could not read original image from {original_image_path}")
            
            # Check if we have detection results with masks
            if not results or len(results) == 0:
                logger.warning("No detection results found, creating copy of original image")
                processed_image = original_image.copy()
            elif not hasattr(results[0], 'masks') or results[0].masks is None:
                logger.warning("No segmentation masks detected, creating copy of original image")
                processed_image = original_image.copy()
            else:
                # Process the segmentation mask
                mask = results[0].masks.data[0].cpu().numpy()  # Get the first mask
                mask = cv2.resize(mask, (original_image.shape[1], original_image.shape[0]))  # Resize to match original
                mask = (mask > 0).astype(np.uint8) * 255  # Binarize
                
                # Apply mask to create segmented image (keep wound against black background)
                processed_image = cv2.bitwise_and(original_image, original_image, mask=mask)
                logger.info("Successfully processed segmentation mask")
            
            # Use provided output path or create one in temp directory
            if output_path is None:
                from django.conf import settings
                
                # Create temp processed directory
                temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp', 'processed_scans')
                os.makedirs(temp_dir, exist_ok=True)
                
                # Generate filename based on original image
                original_filename = os.path.basename(original_image_path)
                name, ext = os.path.splitext(original_filename)
                processed_filename = f"{name}_segmented{ext}"
                
                # Full path for saving
                output_path = os.path.join(temp_dir, processed_filename)
            else:
                # Ensure the output directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the processed image
            success = cv2.imwrite(output_path, processed_image)
            if not success:
                raise RuntimeError(f"Failed to save processed image to {output_path}")
            
            logger.info(f"Successfully saved processed image to {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error in postprocessing: {str(e)}")
            raise
 