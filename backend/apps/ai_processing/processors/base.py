"""
Base processor class for AI processing pipeline.
All AI processors should inherit from this base class.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class BaseProcessor(ABC):
    """
    Abstract base class for all AI processors in the wound scanning pipeline.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the processor with optional configuration.
        
        Args:
            config: Dictionary containing processor-specific configuration
        """
        self.config = config or {}
        self.model = None
        self.is_loaded = False
    
    @abstractmethod
    def load_model(self) -> None:
        """Load the AI model for this processor."""
        pass
    
    @abstractmethod
    def process(self, input_data: Any) -> Dict[str, Any]:
        """
        Process the input data and return results.
        
        Args:
            input_data: Input data to process (image, scan, etc.)
            
        Returns:
            Dictionary containing processing results
        """
        pass
    
    def preprocess(self, input_data: Any) -> Any:
        """
        Preprocess input data before main processing.
        Override in subclasses if needed.
        
        Args:
            input_data: Raw input data
            
        Returns:
            Preprocessed data
        """
        return input_data
    
    def postprocess(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocess results after main processing.
        Override in subclasses if needed.
        
        Args:
            results: Raw processing results
            
        Returns:
            Postprocessed results
        """
        return results
    
    def validate_input(self, input_data: Any) -> bool:
        """
        Validate input data before processing.
        Override in subclasses with specific validation logic.
        
        Args:
            input_data: Input data to validate
            
        Returns:
            True if input is valid, False otherwise
        """
        return input_data is not None
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the processor.
        
        Returns:
            Dictionary containing processor status information
        """
        return {
            'processor_name': self.__class__.__name__,
            'model_loaded': self.is_loaded,
            'config': self.config
        } 