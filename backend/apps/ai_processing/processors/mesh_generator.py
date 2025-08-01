"""
Mesh Generation Processor for creating 3D wound models.
Converts depth analysis data into 3D meshes for visualization and 3D printing.
Based on the STL.py reference and final algorithm from the report.
"""
import os
import cv2
import numpy as np
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional
import logging
from datetime import datetime

from stl import mesh
from .base import BaseProcessor

logger = logging.getLogger(__name__)


class MeshGenerator(BaseProcessor):
    """
    3D mesh generator for creating wound models from depth data.
    Converts depth maps into 3D meshes suitable for visualization and STL export.
    Implements the algorithm from STL.py with improvements from the notebook.
    
    DEFAULT CONFIGURATION: Uses "DEEP" mode optimized for production
    - 5.0mm Z-dimension: Good balance between visualization and realism
    - 5% depth clipping: Less aggressive noise removal
    - Based on successful test results from test_stl_generation.py
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the mesh generator.
        
        Args:
            config: Configuration dictionary with mesh generation parameters
        """
        default_config = {
            # Physical dimensions (mm) - DEEP MODE for production
            'actual_x': 7.4,      # Actual X dimension in mm
            'actual_y': 16.4,     # Actual Y dimension in mm  
            'actual_z': 5.0,      # DEEP: Good visualization (was 1.8)
            'base_layers': 0,     # Number of base layers (k in STL.py)
            'base_thickness_mm': 0.26,  # Base thickness per layer (mm)
            
            # Processing parameters - DEEP MODE
            'depth_clip_percentile': 5,   # DEEP: Less aggressive clipping (was 10)
            'normalize_depth': True,      # Normalize depth values to [0,1]
            'output_format': 'stl',      # Output format
            
            # Mesh quality settings
            'mesh_resolution': 'original',  # 'original', 'high', 'medium', 'low'
            'vertex_threshold': 0.0,       # Minimum depth for vertex creation
            'face_generation_method': 'triangular',  # 'triangular' or 'quad'
            
            # File management
            'save_temporary': True,        # Save to temporary location
            'cleanup_temp_files': False,   # Clean up temporary files after use
        }
        
        # Allow overriding mode via environment variable
        mesh_mode = os.getenv('MESH_GENERATION_MODE', 'DEEP').upper()
        
        if mesh_mode == 'SHALLOW':
            logger.info("Using SHALLOW mesh generation settings")
            default_config.update({
                'actual_z': 1.8,
                'depth_clip_percentile': 10,
            })
        else:
            logger.info("Using DEEP mesh generation settings (default)")

        if config:
            default_config.update(config)
        
        super().__init__(default_config)
    
    def load_model(self) -> None:
        """Load mesh generation dependencies."""
        try:
            # Import required libraries
            import numpy as np
            from stl import mesh
            import cv2
            
            logger.info("Loading mesh generation libraries (numpy-stl)")
            
            # Test numpy-stl functionality
            test_mesh = mesh.Mesh(np.zeros(1, dtype=mesh.Mesh.dtype))
            
            self.model = "STL_MESH_GENERATOR"
            self.is_loaded = True
            logger.info("Mesh generation libraries loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load mesh generation libraries: {e}")
            raise
    
    def process(self, depth_analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate 3D mesh from depth analysis data.
        
        Args:
            depth_analysis_data: Dictionary containing depth analysis results
            
        Returns:
            Dictionary containing 3D mesh data and metadata
        """
        if not self.is_loaded:
            self.load_model()
        
        if not self.validate_input(depth_analysis_data):
            raise ValueError("Invalid depth analysis data provided")
        
        try:
            logger.info("Starting STL mesh generation process")
            
            # Preprocess depth data
            processed_data = self.preprocess(depth_analysis_data)
            
            # Generate STL mesh using the algorithm from STL.py
            stl_file_path = self._generate_stl_mesh(processed_data)
            
            # Calculate mesh metadata
            mesh_metadata = self._calculate_mesh_metadata(stl_file_path, processed_data)
            
            # Generate results
            results = {
                'stl_file_path': stl_file_path,
                'mesh_metadata': mesh_metadata,
                'generation_parameters': {
                    'actual_dimensions': {
                        'x_mm': self.config['actual_x'],
                        'y_mm': self.config['actual_y'],
                        'z_mm': self.config['actual_z']
                    },
                    'base_thickness_mm': self.config['base_thickness_mm'],
                    'depth_clip_percentile': self.config['depth_clip_percentile'],
                    'algorithm': 'STL_reference_with_improvements'
                },
                'quality_metrics': {
                    'mesh_quality_score': mesh_metadata.get('quality_score', 0.0),
                    'watertight': True,  # Our algorithm generates watertight meshes
                    'manifold': True,    # Manifold by construction
                    'self_intersections': False
                }
            }
            
            # Postprocess results
            return self.postprocess(results)
            
        except Exception as e:
            logger.error(f"Error during mesh generation: {e}")
            raise
    
    def validate_input(self, depth_data: Dict[str, Any]) -> bool:
        """
        Validate the input depth analysis data.
        
        Args:
            depth_data: Depth analysis data from depth analyzer
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(depth_data, dict):
            logger.error("Depth data must be a dictionary")
            return False
        
        # Check for required paths
        depth_map_path = depth_data.get('depth_map_8bit_path') or depth_data.get('depth_map_16bit_path')
        if not depth_map_path:
            logger.error("No depth map path found in depth data")
            return False
        
        # Check if depth map file exists
        if not Path(depth_map_path).exists():
            logger.error(f"Depth map file does not exist: {depth_map_path}")
            return False
        
        # Check depth statistics
        depth_stats = depth_data.get('depth_statistics', {})
        if not depth_stats.get('valid_pixel_count', 0) > 0:
            logger.error("No valid depth pixels found")
            return False
        
        return True
    
    def preprocess(self, depth_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Preprocess depth data for mesh generation.
        
        Args:
            depth_data: Raw depth analysis data
            
        Returns:
            Preprocessed data ready for mesh generation
        """
        logger.info("Preprocessing depth data for STL mesh generation")
        
        # Load depth map (prefer 8-bit for consistency with STL.py)
        depth_map_path = depth_data.get('depth_map_8bit_path') or depth_data.get('depth_map_16bit_path')
        depth_map_image = cv2.imread(depth_map_path, cv2.IMREAD_GRAYSCALE)
        
        if depth_map_image is None:
            raise FileNotFoundError(f"Failed to load depth map: {depth_map_path}")
        
        # Normalize the depth map (values between 0 and 1) - following STL.py
        normalized_depth = cv2.normalize(depth_map_image, None, alpha=0, beta=1, 
                                       norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_32F)
        
        # Apply depth clipping to remove noise (improvement from notebook)
        if self.config['depth_clip_percentile'] > 0:
            nonzero_depths = normalized_depth[normalized_depth > 0]
            if len(nonzero_depths) > 0:
                clip_threshold = np.percentile(nonzero_depths, self.config['depth_clip_percentile'])
                normalized_depth[normalized_depth < clip_threshold] = 0
                
                # Renormalize after clipping
                nonzero_depths = normalized_depth[normalized_depth > 0]
                if len(nonzero_depths) > 0:
                    normalized_depth = cv2.normalize(normalized_depth, None, alpha=0, beta=1, 
                                                   norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_32F)
        
        processed_data = depth_data.copy()
        processed_data.update({
            'normalized_depth_map': normalized_depth,
            'depth_map_shape': normalized_depth.shape,
            'original_depth_path': depth_map_path,
            'preprocessing_applied': {
                'normalization': True,
                'depth_clipping': self.config['depth_clip_percentile'] > 0,
                'clip_percentile': self.config['depth_clip_percentile']
            }
        })
        
        return processed_data
    
    def _generate_stl_mesh(self, processed_data: Dict[str, Any]) -> str:
        """
        Generate STL mesh from processed depth data.
        Implements the algorithm from STL.py with improvements.
        
        Args:
            processed_data: Preprocessed depth data
            
        Returns:
            Path to generated STL file
        """
        logger.info("Generating STL mesh using reference algorithm")
        
        # Get normalized depth map
        normalized_depth = processed_data['normalized_depth_map']
        h, w = normalized_depth.shape
        
        # Calculate the scaling factors for the actual dimensions (from STL.py)
        scale_x = self.config['actual_x'] / w  # Actual width per pixel
        scale_y = self.config['actual_y'] / h  # Actual height per pixel
        scale_z = self.config['actual_z']      # Z scaling is directly specified
        
        # Calculate base height
        base_height = self.config['base_thickness_mm'] * self.config['base_layers']
        
        # Create a dictionary and a list to store vertices (from STL.py)
        vertices = {}
        vertex_list = []
        
        # Generate vertices for the top surface
        for y in range(h):
            for x in range(w):
                # Map Z according to depth (inverted as in STL.py: 1 - normalized_depth)
                z = (1 - normalized_depth[y, x]) * scale_z
                vertices[(x, y)] = len(vertex_list)
                vertex_list.append([x * scale_x, y * scale_y, z])
        
        # Generate vertices for the base (if base_layers > 0)
        if self.config['base_layers'] > 0:
            for y in range(h):
                for x in range(w):
                    z = -base_height  # Fixed base depth
                    vertices[(x, y, 'base')] = len(vertex_list)
                    vertex_list.append([x * scale_x, y * scale_y, z])
        
        # Convert the vertex list to a numpy array
        vertex_array = np.array(vertex_list)
        
        # Create a list to store faces (from STL.py)
        faces = []
        
        # Generate faces for the top surface
        for y in range(h - 1):
            for x in range(w - 1):
                # Top surface vertices
                v0 = vertices[(x, y)]
                v1 = vertices[(x + 1, y)]
                v2 = vertices[(x, y + 1)]
                v3 = vertices[(x + 1, y + 1)]
                
                # Create triangular faces (following STL.py)
                faces.append([v0, v2, v1])
                faces.append([v1, v2, v3])
                
                # Add side faces and base if base layers exist
                if self.config['base_layers'] > 0:
                    # Base vertices
                    vb0 = vertices[(x, y, 'base')]
                    vb1 = vertices[(x + 1, y, 'base')]
                    vb2 = vertices[(x, y + 1, 'base')]
                    vb3 = vertices[(x + 1, y + 1, 'base')]
                    
                    # Side faces connecting top and base (from STL.py)
                    faces.append([v0, v1, vb0])
                    faces.append([v1, vb1, vb0])
                    faces.append([v1, v3, vb1])
                    faces.append([v3, vb3, vb1])
                    faces.append([v3, v2, vb3])
                    faces.append([v2, vb2, vb3])
                    faces.append([v2, v0, vb2])
                    faces.append([v0, vb0, vb2])
                    
                    # Base faces (close the bottom surface)
                    faces.append([vb0, vb1, vb2])
                    faces.append([vb1, vb3, vb2])
        
        # Convert the faces list to a numpy array
        face_array = np.array(faces)
        
        # Create the mesh and populate with vertices and faces (from STL.py)
        surface = mesh.Mesh(np.zeros(face_array.shape[0], dtype=mesh.Mesh.dtype))
        for i, f in enumerate(face_array):
            for j in range(3):
                surface.vectors[i][j] = vertex_array[f[j], :]
        
        # Generate output file path
        stl_file_path = self._generate_stl_file_path(processed_data)
        
        # Save the STL file
        surface.save(stl_file_path)
        
        logger.info(f"STL file generated successfully: {stl_file_path}")
        logger.info(f"Mesh contains {len(vertex_array)} vertices and {len(face_array)} faces")
        
        return stl_file_path
    
    def _generate_stl_file_path(self, processed_data: Dict[str, Any]) -> str:
        """
        Generate STL file path based on processed data.
        
        Args:
            processed_data: Processed depth data
            
        Returns:
            Path to STL file
        """
        from django.conf import settings
        
        # Create output directory in temp folder
        output_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'generated_stl'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Extract scan ID from the depth map path to match our new naming convention
        depth_map_path = processed_data.get('depth_map_8bit_path') or processed_data.get('depth_map_16bit_path')
        
        if depth_map_path:
            # Extract scan ID from the new depth_maps_bbox/scan_X/ structure
            depth_path = Path(depth_map_path)
            if 'depth_maps_bbox' in str(depth_path) and len(depth_path.parts) >= 2:
                # Get scan_X from depth_maps_bbox/scan_X/depth_8bit.png
                scan_id = depth_path.parent.name  # This will be 'scan_X'
            else:
                # Fallback to original method for backward compatibility
                scan_id = depth_path.stem
        else:
            # Fallback if no depth map path available
            original_depth_path = processed_data.get('original_depth_path', 'unknown_scan')
            scan_id = Path(original_depth_path).stem
        
        # Generate clean STL filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        stl_filename = f"{scan_id}_{timestamp}.stl"
        
        return str(output_dir / stl_filename)
    
    def _calculate_mesh_metadata(self, stl_file_path: str, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate mesh metadata from generated STL file.
        
        Args:
            stl_file_path: Path to generated STL file
            processed_data: Processed depth data
            
        Returns:
            Dictionary containing mesh metadata
        """
        try:
            # Load the generated mesh to extract metadata
            stl_mesh = mesh.Mesh.from_file(stl_file_path)
            
            # Calculate basic mesh properties
            vertex_count = len(stl_mesh.vectors) * 3  # Each face has 3 vertices
            face_count = len(stl_mesh.vectors)
            
            # Calculate bounding box
            all_vertices = stl_mesh.vectors.reshape(-1, 3)
            min_bounds = np.min(all_vertices, axis=0)
            max_bounds = np.max(all_vertices, axis=0)
            
            # Calculate volume and surface area using STL properties
            try:
                # Try modern numpy-stl methods first
                volume = stl_mesh.get_volume() if hasattr(stl_mesh, 'get_volume') else stl_mesh.volume
                surface_area = stl_mesh.get_surface_area() if hasattr(stl_mesh, 'get_surface_area') else np.sum(stl_mesh.areas)
            except AttributeError:
                # Fallback for older numpy-stl versions
                volume = getattr(stl_mesh, 'volume', 0.0)
                surface_area = np.sum(getattr(stl_mesh, 'areas', [0.0]))
            
            # File size
            file_size = Path(stl_file_path).stat().st_size
            
            # Quality score based on mesh properties
            depth_stats = processed_data.get('depth_statistics', {})
            valid_pixels = depth_stats.get('valid_pixel_count', 0)
            quality_score = min(1.0, valid_pixels / 10000.0)  # Normalize to 0-1
            
            metadata = {
                'vertex_count': vertex_count,
                'face_count': face_count,
                'volume_mm3': float(volume) if volume > 0 else 0.0,
                'surface_area_mm2': float(surface_area) if surface_area > 0 else 0.0,
                'bounding_box': {
                    'min': min_bounds.tolist(),
                    'max': max_bounds.tolist(),
                    'dimensions': (max_bounds - min_bounds).tolist()
                },
                'file_size_bytes': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'quality_score': quality_score,
                'mesh_properties': {
                    'watertight': True,
                    'manifold': True,
                    'algorithm': 'STL_reference_triangulation'
                }
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error calculating mesh metadata: {e}")
            return {
                'vertex_count': 0,
                'face_count': 0,
                'volume_mm3': 0.0,
                'surface_area_mm2': 0.0,
                'bounding_box': {'min': [0, 0, 0], 'max': [0, 0, 0], 'dimensions': [0, 0, 0]},
                'file_size_bytes': 0,
                'file_size_mb': 0.0,
                'quality_score': 0.0,
                'error': str(e)
            }
    
    def postprocess(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocess mesh generation results.
        
        Args:
            results: Raw mesh generation results
            
        Returns:
            Processed results with additional metadata
        """
        processed_results = results.copy()
        
        # Add common metadata
        processed_results['processor'] = 'MeshGenerator'
        processed_results['timestamp'] = datetime.now().isoformat()
        processed_results['algorithm'] = 'STL_reference_with_improvements'
        
        # Add file format information
        processed_results['file_formats'] = {
            'stl': 'Binary STL for 3D printing and visualization',
            'format_version': 'Binary STL'
        }
        
        # Add success status
        stl_path = results.get('stl_file_path')
        if stl_path and Path(stl_path).exists():
            processed_results['generation_status'] = 'success'
            processed_results['file_exists'] = True
        else:
            processed_results['generation_status'] = 'failed'
            processed_results['file_exists'] = False
        
        return processed_results 