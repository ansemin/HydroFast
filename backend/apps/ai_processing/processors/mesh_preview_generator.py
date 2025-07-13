"""
Mesh Preview Generator for creating isometric 3D mesh visualizations.
Converts STL files into preview images using vedo library with offscreen rendering.
Based on Algorithm 2 from the final report: STL Mesh Preview Generation.
"""

import os
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import logging
from datetime import datetime

try:
    import vedo
    from vedo import Mesh, Plotter
except ImportError:
    vedo = None
    Mesh = None
    Plotter = None

from .base import BaseProcessor

logger = logging.getLogger(__name__)


class MeshPreviewGenerator(BaseProcessor):
    """
    3D mesh preview generator for creating isometric visualizations from STL files.
    Implements Algorithm 2 from the final report using vedo library.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the mesh preview generator.
        
        Args:
            config: Configuration dictionary with preview generation parameters
        """
        default_config = {
            # Camera and view settings
            'camera_position': (1, 1, 1),     # Isometric view position (1,1,1)
            'camera_up': (0, 0, 1),           # Camera up vector
            'zoom_factor': 1.2,               # Fixed zoom for consistency
            'background_color': 'white',      # Background color
            
            # Mesh visualization settings
            'mesh_color': 'lightgray',        # Light gray color for clarity
            'mesh_alpha': 1.0,                # Mesh transparency (opaque)
            'show_edges': False,              # Show mesh edges
            'lighting': 'default',            # Lighting mode
            
            # Output settings
            'output_size': (800, 600),        # Image dimensions (width, height)
            'output_format': 'png',           # Output format
            'output_dpi': 150,                # DPI for high quality
            
            # Rendering settings
            'offscreen': True,                # Offscreen rendering for server
            'antialiasing': True,             # Enable antialiasing
            'depth_peeling': True,            # Enable depth peeling for transparency
            
            # Processing settings
            'compute_normals': True,          # Compute surface normals
            'smooth_mesh': False,             # Apply mesh smoothing
            'auto_orient': True,              # Auto-orient mesh for best view
            'use_matplotlib_fallback': False, # Use matplotlib fallback for Windows
        }
        
        if config:
            default_config.update(config)
        
        super().__init__(default_config)
    
    def load_model(self) -> None:
        """Load vedo library and check dependencies."""
        try:
            if vedo is None:
                raise ImportError("vedo library is not installed. Install with: pip install vedo")
            
            logger.info("Loading vedo library for mesh preview generation")
            
            # Test vedo functionality
            test_mesh = vedo.Sphere(r=1.0)
            if test_mesh is None:
                raise RuntimeError("Failed to create test mesh with vedo")
            
            # Check if offscreen rendering is available
            if self.config['offscreen']:
                try:
                    # Test offscreen rendering capability
                    import platform
                    if platform.system() == 'Windows':
                        # Windows has issues with offscreen rendering, use alternative approach
                        logger.warning("Windows detected: Using alternative rendering approach")
                        self.config['offscreen'] = False
                        self.config['use_matplotlib_fallback'] = True
                    else:
                        test_plotter = Plotter(offscreen=True, size=(100, 100))
                        test_plotter.close()
                        logger.info("Offscreen rendering available")
                except Exception as e:
                    logger.warning(f"Offscreen rendering not available: {e}")
                    self.config['offscreen'] = False
                    self.config['use_matplotlib_fallback'] = True
            
            self.model = "VEDO_MESH_PREVIEW_GENERATOR"
            self.is_loaded = True
            logger.info("Vedo mesh preview generator loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load vedo library: {e}")
            raise
    
    def process(self, stl_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate mesh preview from STL file data.
        
        Args:
            stl_data: Dictionary containing STL file information
            
        Returns:
            Dictionary containing preview image data and metadata
        """
        if not self.is_loaded:
            self.load_model()
        
        if not self.validate_input(stl_data):
            raise ValueError("Invalid STL data provided")
        
        try:
            logger.info("Starting STL mesh preview generation")
            
            # Get STL file path
            stl_file_path = stl_data.get('stl_file_path')
            if not stl_file_path or not Path(stl_file_path).exists():
                raise FileNotFoundError(f"STL file not found: {stl_file_path}")
            
            # Load STL mesh and compute normals
            mesh = self._load_stl_mesh(stl_file_path)
            
            # Generate preview image using isometric view
            preview_image_path = self._generate_preview_image(mesh, stl_data)
            
            # Calculate preview metadata
            preview_metadata = self._calculate_preview_metadata(mesh, preview_image_path)
            
            # Generate results
            results = {
                'preview_image_path': preview_image_path,
                'preview_metadata': preview_metadata,
                'generation_parameters': {
                    'camera_position': self.config['camera_position'],
                    'mesh_color': self.config['mesh_color'],
                    'output_size': self.config['output_size'],
                    'algorithm': 'vedo_isometric_preview'
                },
                'stl_source': {
                    'stl_file_path': stl_file_path,
                    'stl_exists': True
                }
            }
            
            # Postprocess results
            return self.postprocess(results)
            
        except Exception as e:
            logger.error(f"Error during mesh preview generation: {e}")
            raise
    
    def validate_input(self, stl_data: Dict[str, Any]) -> bool:
        """
        Validate the input STL data.
        
        Args:
            stl_data: STL data from mesh generator
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(stl_data, dict):
            logger.error("STL data must be a dictionary")
            return False
        
        # Check for required STL file path
        stl_file_path = stl_data.get('stl_file_path')
        if not stl_file_path:
            logger.error("No STL file path found in data")
            return False
        
        # Check if STL file exists
        if not Path(stl_file_path).exists():
            logger.error(f"STL file does not exist: {stl_file_path}")
            return False
        
        # Check file extension
        if not stl_file_path.lower().endswith('.stl'):
            logger.error(f"File is not an STL file: {stl_file_path}")
            return False
        
        return True
    
    def _load_stl_mesh(self, stl_file_path: str) -> vedo.Mesh:
        """
        Load STL mesh and compute normals.
        
        Args:
            stl_file_path: Path to STL file
            
        Returns:
            vedo.Mesh object with computed normals
        """
        logger.info(f"Loading STL mesh from: {stl_file_path}")
        
        # Load STL file using vedo
        mesh = vedo.load(stl_file_path)
        
        if mesh is None:
            raise RuntimeError(f"Failed to load STL mesh: {stl_file_path}")
        
        # Compute surface normals for accurate shading
        if self.config['compute_normals']:
            mesh = mesh.compute_normals()
            logger.info("Surface normals computed")
        
        # Apply mesh smoothing if enabled
        if self.config['smooth_mesh']:
            mesh = mesh.smooth()
            logger.info("Mesh smoothing applied")
        
        # Set mesh color and properties
        mesh.color(self.config['mesh_color'])
        mesh.alpha(self.config['mesh_alpha'])
        
        logger.info(f"STL mesh loaded successfully with {mesh.npoints} vertices and {mesh.ncells} faces")
        
        return mesh
    
    def _generate_preview_image(self, mesh: vedo.Mesh, stl_data: Dict[str, Any]) -> str:
        """
        Generate preview image using isometric view.
        Implements Algorithm 2 from the final report.
        
        Args:
            mesh: vedo.Mesh object
            stl_data: STL data for generating file names
            
        Returns:
            Path to generated preview image
        """
        logger.info("Generating isometric mesh preview")
        
        # Calculate mesh center and diagonal size for camera positioning
        mesh_center = mesh.center_of_mass()
        mesh_bounds = mesh.bounds()
        
        # Calculate diagonal size for camera distance
        diagonal_size = np.sqrt(
            (mesh_bounds[1] - mesh_bounds[0])**2 +
            (mesh_bounds[3] - mesh_bounds[2])**2 +
            (mesh_bounds[5] - mesh_bounds[4])**2
        )
        
        # Set camera distance based on diagonal size
        camera_distance = diagonal_size * 2.0
        
        # Calculate isometric camera position (1,1,1) relative to mesh center
        camera_pos = np.array(self.config['camera_position'])
        camera_pos = camera_pos / np.linalg.norm(camera_pos)  # Normalize
        camera_pos = mesh_center + camera_pos * camera_distance
        
        # Generate output file path
        preview_image_path = self._generate_preview_file_path(stl_data)
        
        # Use fallback method for Windows or if offscreen fails
        if self.config.get('use_matplotlib_fallback', False) or not self.config['offscreen']:
            return self._generate_preview_matplotlib_fallback(mesh, preview_image_path, camera_pos, mesh_center)
        
        # Try offscreen rendering
        try:
            # Initialize offscreen Plotter
            plotter = Plotter(
                offscreen=True,
                size=self.config['output_size'],
                bg=self.config['background_color']
            )
            
            try:
                # Add mesh to plotter
                plotter.add(mesh)
                
                # Set isometric camera position
                if plotter.camera:
                    plotter.camera.SetPosition(camera_pos)
                    plotter.camera.SetFocalPoint(mesh_center)
                    plotter.camera.SetViewUp(self.config['camera_up'])
                    plotter.camera.Zoom(self.config['zoom_factor'])
                
                # Render and capture screenshot
                plotter.render()
                plotter.screenshot(preview_image_path)
                
                logger.info(f"Preview image generated: {preview_image_path}")
                return preview_image_path
                
            finally:
                # Always close the plotter
                if plotter:
                    plotter.close()
                    
        except Exception as e:
            logger.warning(f"Offscreen rendering failed: {e}")
            # Fall back to matplotlib method
            return self._generate_preview_matplotlib_fallback(mesh, preview_image_path, camera_pos, mesh_center)
    
    def _generate_preview_file_path(self, stl_data: Dict[str, Any]) -> str:
        """
        Generate preview image file path.
        
        Args:
            stl_data: STL data for generating file names
            
        Returns:
            Path to preview image file
        """
        from django.conf import settings
        
        # Create output directory
        output_dir = Path(settings.MEDIA_ROOT) / 'stl_previews'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename based on STL file
        stl_file_path = Path(stl_data['stl_file_path'])
        base_name = stl_file_path.stem
        
        # Create timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        preview_filename = f"{base_name}_preview_{timestamp}.{self.config['output_format']}"
        
        return str(output_dir / preview_filename)
    
    def _generate_preview_matplotlib_fallback(self, mesh: vedo.Mesh, preview_image_path: str, 
                                            camera_pos: np.ndarray, mesh_center: np.ndarray) -> str:
        """
        Generate preview using matplotlib as fallback for Windows.
        
        Args:
            mesh: vedo.Mesh object
            preview_image_path: Output path for preview image
            camera_pos: Camera position
            mesh_center: Mesh center
            
        Returns:
            Path to generated preview image
        """
        try:
            import matplotlib.pyplot as plt
            from mpl_toolkits.mplot3d import Axes3D
            from mpl_toolkits.mplot3d.art3d import Poly3DCollection
            
            logger.info("Using matplotlib fallback for preview generation")
            
            # Get mesh vertices and faces
            vertices = mesh.points()
            faces = mesh.faces()
            
            # Create 3D plot
            fig = plt.figure(figsize=(10, 8))
            ax = fig.add_subplot(111, projection='3d')
            
            # Create face collection
            face_collection = []
            for face in faces:
                if len(face) >= 3:  # Ensure it's a valid triangle
                    triangle = vertices[face[:3]]  # Take first 3 vertices
                    face_collection.append(triangle)
            
            # Add faces to plot
            poly_collection = Poly3DCollection(face_collection, 
                                             facecolors='lightgray', 
                                             edgecolors='none',
                                             alpha=0.8)
            ax.add_collection3d(poly_collection)
            
            # Set isometric view
            ax.view_init(elev=30, azim=45)  # Approximate isometric view
            
            # Set equal aspect ratio
            max_range = np.array([vertices[:,0].max()-vertices[:,0].min(),
                                vertices[:,1].max()-vertices[:,1].min(),
                                vertices[:,2].max()-vertices[:,2].min()]).max() / 2.0
            
            mid_x = (vertices[:,0].max()+vertices[:,0].min()) * 0.5
            mid_y = (vertices[:,1].max()+vertices[:,1].min()) * 0.5
            mid_z = (vertices[:,2].max()+vertices[:,2].min()) * 0.5
            
            ax.set_xlim(mid_x - max_range, mid_x + max_range)
            ax.set_ylim(mid_y - max_range, mid_y + max_range)
            ax.set_zlim(mid_z - max_range, mid_z + max_range)
            
            # Hide axes for clean look
            ax.set_axis_off()
            
            # Set background color
            fig.patch.set_facecolor('white')
            ax.set_facecolor('white')
            
            # Save figure
            plt.savefig(preview_image_path, 
                       dpi=self.config['output_dpi'],
                       bbox_inches='tight',
                       facecolor='white',
                       edgecolor='none')
            plt.close()
            
            logger.info(f"Matplotlib fallback preview generated: {preview_image_path}")
            return preview_image_path
            
        except Exception as e:
            logger.error(f"Matplotlib fallback also failed: {e}")
            # Create a simple placeholder image
            return self._create_placeholder_image(preview_image_path)
    
    def _create_placeholder_image(self, preview_image_path: str) -> str:
        """Create a placeholder image if all rendering methods fail."""
        try:
            from PIL import Image, ImageDraw, ImageFont
            
            # Create a simple placeholder
            img = Image.new('RGB', self.config['output_size'], color='white')
            draw = ImageDraw.Draw(img)
            
            # Add text
            try:
                font = ImageFont.truetype("arial.ttf", 40)
            except:
                font = ImageFont.load_default()
            
            text = "STL Mesh Preview\n(Rendering Issue)"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (self.config['output_size'][0] - text_width) // 2
            y = (self.config['output_size'][1] - text_height) // 2
            
            draw.text((x, y), text, fill='gray', font=font)
            
            img.save(preview_image_path)
            logger.info(f"Placeholder image created: {preview_image_path}")
            return preview_image_path
            
        except Exception as e:
            logger.error(f"Failed to create placeholder image: {e}")
            raise
    
    def _calculate_preview_metadata(self, mesh: vedo.Mesh, preview_image_path: str) -> Dict[str, Any]:
        """
        Calculate preview metadata.
        
        Args:
            mesh: vedo.Mesh object
            preview_image_path: Path to generated preview image
            
        Returns:
            Dictionary containing preview metadata
        """
        try:
            # Basic mesh properties
            vertex_count = mesh.npoints
            face_count = mesh.ncells
            
            # Mesh bounds
            bounds = mesh.bounds()
            dimensions = [
                bounds[1] - bounds[0],  # X dimension
                bounds[3] - bounds[2],  # Y dimension  
                bounds[5] - bounds[4]   # Z dimension
            ]
            
            # File properties
            file_size = Path(preview_image_path).stat().st_size if Path(preview_image_path).exists() else 0
            
            metadata = {
                'vertex_count': vertex_count,
                'face_count': face_count,
                'mesh_dimensions': dimensions,
                'mesh_center': mesh.center_of_mass().tolist(),
                'mesh_bounds': bounds,
                'preview_properties': {
                    'image_size': self.config['output_size'],
                    'camera_position': self.config['camera_position'],
                    'mesh_color': self.config['mesh_color'],
                    'background_color': self.config['background_color']
                },
                'file_properties': {
                    'file_size_bytes': file_size,
                    'file_size_kb': round(file_size / 1024, 2),
                    'output_format': self.config['output_format'],
                    'output_dpi': self.config['output_dpi']
                },
                'generation_quality': {
                    'antialiasing': self.config['antialiasing'],
                    'depth_peeling': self.config['depth_peeling'],
                    'normals_computed': self.config['compute_normals']
                }
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error calculating preview metadata: {e}")
            return {
                'vertex_count': 0,
                'face_count': 0,
                'mesh_dimensions': [0, 0, 0],
                'mesh_center': [0, 0, 0],
                'error': str(e)
            }
    
    def postprocess(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocess preview generation results.
        
        Args:
            results: Raw preview generation results
            
        Returns:
            Processed results with additional metadata
        """
        processed_results = results.copy()
        
        # Add common metadata
        processed_results['processor'] = 'MeshPreviewGenerator'
        processed_results['timestamp'] = datetime.now().isoformat()
        processed_results['algorithm'] = 'vedo_isometric_preview'
        
        # Add success status
        preview_path = results.get('preview_image_path')
        if preview_path and Path(preview_path).exists():
            processed_results['generation_status'] = 'success'
            processed_results['file_exists'] = True
            processed_results['preview_url'] = None  # Will be set by the view
        else:
            processed_results['generation_status'] = 'failed'
            processed_results['file_exists'] = False
        
        # Add view information
        processed_results['view_info'] = {
            'view_type': 'isometric',
            'camera_angle': '(1,1,1)',
            'optimized_for': 'clinical_visualization'
        }
        
        return processed_results 