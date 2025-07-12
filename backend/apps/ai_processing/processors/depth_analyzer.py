"""
Depth Analysis Processor for wound depth estimation using ZoeDepth.
Analyzes wound segmentation to estimate depth and volume using ZoeD_NK model.
"""
import numpy as np
from pathlib import Path
from typing import Any, Dict, List, Tuple
import logging

from .base import BaseProcessor
from .zoedepth_processor import ZoeDepthProcessor

logger = logging.getLogger(__name__)


class DepthAnalyzer(BaseProcessor):
    """
    Depth analysis processor for wound depth and volume estimation.
    Now powered by ZoeDepth for monocular depth estimation.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the depth analyzer with ZoeDepth processor.
        
        Args:
            config: Configuration dictionary with depth estimation parameters
        """
        default_config = {
            'model_type': 'ZoeD_NK',  # ZoeD_NK for better detail preservation
            'contrast_alpha': 0.3,    # Contrast adjustment from research
            'brightness_beta': -40,   # Brightness adjustment from research
            'blur_kernel': 9,         # Gaussian blur kernel size (improved from notebook)
            'mask_extraction_method': 'non_black_regions',  # 'non_black_regions' or 'auto_threshold'
            'pixel_size_mm': 0.1,     # Pixel size in mm for volume calculation
            'save_16bit': True,       # Save 16-bit depth maps for precision
            'save_8bit': True,        # Save 8-bit depth maps for visualization
            'save_metadata': True,    # Save processing metadata
            'reference_object_size': None,  # Size in mm for scale reference (legacy)
            'analysis_method': 'ZoeDepth_monocular',  # Updated method name
            'output_format': 'depth_map'  # 'depth_map', 'point_cloud', 'volume_estimate'
        }
        
        if config:
            default_config.update(config)
        
        super().__init__(default_config)
        
        # Initialize ZoeDepth processor
        self.zoedepth_processor = ZoeDepthProcessor(self.config)
    
    def load_model(self) -> None:
        """Load the ZoeDepth model."""
        try:
            logger.info("Loading ZoeDepth model for depth analysis")
            
            # Load ZoeDepth model
            self.zoedepth_processor.load_model()
            
            self.model = self.zoedepth_processor.model
            self.is_loaded = True
            logger.info("ZoeDepth model loaded successfully for depth analysis")
            
        except Exception as e:
            logger.error(f"Failed to load ZoeDepth model: {e}")
            raise
    
    def process(self, segmented_image_path: str) -> Dict[str, Any]:
        """
        Analyze wound depth from segmented image using ZoeDepth.
        
        Args:
            segmented_image_path: Path to segmented wound image from wound detector
            
        Returns:
            Dictionary containing depth analysis results
        """
        if not self.is_loaded:
            self.load_model()
        
        if not self.validate_input(segmented_image_path):
            raise ValueError("Invalid segmented image path provided")
        
        try:
            logger.info(f"Processing depth analysis for: {segmented_image_path}")
            
            # Use ZoeDepth processor to generate depth map
            zoedepth_results = self.zoedepth_processor.process(segmented_image_path)
            
            # Convert ZoeDepth results to legacy format for backward compatibility
            results = {
                'depth_map_8bit_path': zoedepth_results.get('depth_map_8bit_path'),
                'depth_map_16bit_path': zoedepth_results.get('depth_map_16bit_path'),
                'volume_estimate': zoedepth_results.get('volume_estimate', {}),
                'depth_statistics': zoedepth_results.get('depth_statistics', {}),
                'surface_area': self._calculate_surface_area(zoedepth_results),
                'analysis_method': self.config['analysis_method'],
                'reference_scale': self.config.get('reference_object_size'),
                'wound_severity': zoedepth_results.get('wound_severity', 'unknown'),
                'processing_confidence': zoedepth_results.get('processing_confidence', 0.0),
                'wound_mask_extracted': zoedepth_results.get('wound_mask_extracted', False),
                'processing_parameters': zoedepth_results.get('processing_parameters', {}),
                'metadata_path': zoedepth_results.get('metadata_path')
            }
            
            # Postprocess results
            return self.postprocess(results)
            
        except Exception as e:
            logger.error(f"Error during ZoeDepth analysis: {e}")
            raise
    
    def validate_input(self, segmented_image_path: str) -> bool:
        """
        Validate the input segmented image path.
        
        Args:
            segmented_image_path: Path to segmented wound image
            
        Returns:
            True if valid, False otherwise
        """
        # Delegate to ZoeDepth processor validation
        return self.zoedepth_processor.validate_input(segmented_image_path)
    
    def preprocess(self, segmented_image_path: str) -> str:
        """
        Preprocess segmented image for depth analysis (delegated to ZoeDepth processor).
        
        Args:
            segmented_image_path: Path to segmented image
            
        Returns:
            Preprocessed image path (unchanged for ZoeDepth)
        """
        logger.info(f"Preprocessing for ZoeDepth analysis: {segmented_image_path}")
        # ZoeDepth processor handles preprocessing internally
        return segmented_image_path
    
    def postprocess(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocess depth analysis results.
        
        Args:
            results: Raw depth analysis results
            
        Returns:
            Processed results with additional metadata
        """
        processed_results = results.copy()
        processed_results['timestamp'] = logger.handlers[0].formatter.formatTime if logger.handlers else None
        processed_results['processor'] = 'DepthAnalyzer'
        processed_results['units'] = {
            'depth': 'normalized_units',
            'volume': 'cubic_mm',
            'area': 'square_mm'
        }
        
        # Surface area calculation
        if 'surface_area' not in processed_results:
            processed_results['surface_area'] = self._calculate_surface_area(results)
        
        return processed_results
    
    def _calculate_surface_area(self, results: Dict[str, Any]) -> float:
        """
        Calculate surface area from depth analysis results.
        
        Args:
            results: ZoeDepth processing results
            
        Returns:
            Surface area in square mm
        """
        try:
            # Extract depth statistics
            depth_stats = results.get('depth_statistics', {})
            valid_pixel_count = depth_stats.get('valid_pixel_count', 0)
            
            # Get pixel size from processing parameters
            processing_params = results.get('processing_parameters', {})
            pixel_size_mm = processing_params.get('pixel_size_mm', 0.1)
            
            # Calculate surface area
            pixel_area_mm2 = pixel_size_mm ** 2
            surface_area = valid_pixel_count * pixel_area_mm2
            
            logger.info(f"Calculated surface area: {surface_area} mm²")
            return surface_area
            
        except Exception as e:
            logger.error(f"Error calculating surface area: {e}")
            return 0.0 