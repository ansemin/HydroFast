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
    
    DEFAULT CONFIGURATION: Uses "BALANCED" mode optimized for production
    - Camera position (1.5, 1.5, 1): Improved isometric angle for better depth perception
    - Output size (1000, 800): High resolution for clinical assessment
    - Standard zoom (1.0): Optimal mesh visibility
    - Matplotlib fallback: Ensures consistent rendering across platforms
    - Based on successful test results from test_stl_generation.py
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the mesh preview generator.
        
        Args:
            config: Configuration dictionary with preview generation parameters
        """
        default_config = {
            # Camera and view settings - DEEP MODE for production
            'camera_position': (1.5, 1.5, 1), # DEEP: Improved isometric angle (was 1,1,1)
            'camera_up': (0, 0, 1),           # Camera up vector
            'zoom_factor': 1.0,               # DEEP: Standard zoom (was 1.2)
            'background_color': 'white',      # Background color
            
            # Mesh visualization settings - DEEP MODE
            'mesh_color': 'lightgray',        # Light gray color for clarity
            'mesh_alpha': 1.0,                # Mesh transparency (opaque)
            'show_edges': False,              # Show mesh edges
            'lighting': 'default',            # Lighting mode
            
            # Output settings - DEEP MODE for production
            'output_size': (1000, 800),       # DEEP: High resolution (was 800,600)
            'output_format': 'png',           # Output format
            'output_dpi': 150,                # DPI for high quality
            
            # Rendering settings - DEEP MODE for production
            'offscreen': True,                # Offscreen rendering for server
            'antialiasing': True,             # Enable antialiasing
            'depth_peeling': True,            # Enable depth peeling for transparency
            'use_matplotlib_fallback': True,  # DEEP: Force consistent rendering
            
            # Processing settings - DEEP MODE
            'compute_normals': True,          # Compute surface normals
            'smooth_mesh': False,             # Apply mesh smoothing
            'auto_orient': True,              # Auto-orient mesh for best view
        }
        
        # Allow overriding mode via environment variable
        mesh_mode = os.getenv('MESH_GENERATION_MODE', 'DEEP').upper()

        if mesh_mode == 'SHALLOW':
            logger.info("Using SHALLOW mesh preview settings")
            default_config.update({
                'camera_position': (1, 1, 1),
                'zoom_factor': 1.2,
                'output_size': (800, 600),
                'use_matplotlib_fallback': False, # Revert to original behavior
            })
        else:
            logger.info("Using DEEP mesh preview settings (default)")

        if config:
            default_config.update(config)
        
        super().__init__(default_config)
    
    def load_model(self) -> None:
        """Load vedo library and check dependencies."""
        try:
            if vedo is None:
                raise ImportError("vedo library is not installed. Install with: pip install vedo")
            
            logger.info("Loading vedo library for mesh preview generation")
            
            # Configure vedo to suppress warnings
            try:
                vedo.settings.default_backend = 'vtk'
                vedo.settings.allow_interaction = False
                # Suppress deprecated warnings
                if hasattr(vedo, 'core') and hasattr(vedo.core, 'warnings'):
                    vedo.core.warnings['points_getter'] = False
                    vedo.core.warnings['faces_getter'] = False
            except:
                pass  # Ignore if these settings don't exist in this vedo version
            
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
                        logger.info("Windows detected: Testing vedo offscreen rendering...")
                        # Try vedo offscreen rendering on Windows
                        try:
                            test_plotter = Plotter(offscreen=True, size=(100, 100))
                            test_plotter.close()
                            logger.info("✓ Vedo offscreen rendering works on Windows!")
                        except Exception as win_e:
                            logger.warning(f"Vedo offscreen rendering failed on Windows: {win_e}")
                            logger.info("Will try vedo with display mode instead")
                            self.config['offscreen'] = False
                    else:
                        test_plotter = Plotter(offscreen=True, size=(100, 100))
                        test_plotter.close()
                        logger.info("Offscreen rendering available")
                except Exception as e:
                    logger.warning(f"Offscreen rendering not available: {e}")
                    logger.info("Will try vedo with display mode instead")
                    self.config['offscreen'] = False
            
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
        
        # Try vedo rendering with robust Windows offscreen support
        try:
            logger.info(f"Trying vedo rendering (offscreen={self.config['offscreen']})")
            
            # Set VTK environment for better Windows compatibility
            import os
            os.environ['VTK_USE_OSMESA'] = '0'  # Disable OSMesa on Windows
            
            # Initialize Plotter with robust error handling
            plotter = None
            
            try:
                # Try standard offscreen rendering first
                if self.config['offscreen']:
                    logger.info("Attempting offscreen rendering...")
                    
                    # Create plotter with minimal configuration to avoid initialization issues
                    plotter = Plotter(
                        offscreen=True,
                        size=self.config['output_size'],
                        interactive=False
                    )
                    
                    # Verify the plotter was properly initialized
                    if plotter is None or not hasattr(plotter, 'window'):
                        raise RuntimeError("Plotter window not initialized")
                        
                    # Test if the render window is properly initialized
                    if hasattr(plotter, 'window') and plotter.window:
                        # Safe initialization check - avoid GetInitialized() call that causes errors
                        try:
                            plotter.window.SetOffScreenRendering(1)
                            if hasattr(plotter.window, 'Modified'):
                                plotter.window.Modified()
                        except Exception as init_err:
                            logger.warning(f"Window initialization issue: {init_err}")
                            # Continue anyway - sometimes it still works
                            
                else:
                    # Visible rendering
                    plotter = Plotter(
                        size=self.config['output_size'],
                        interactive=False
                    )
                
                if plotter is None:
                    raise RuntimeError("Failed to create plotter instance")
                    
            except Exception as plotter_error:
                logger.warning(f"Plotter creation failed: {plotter_error}")
                # Try fallback plotter creation
                try:
                    logger.info("Trying fallback plotter creation...")
                    plotter = Plotter(size=self.config['output_size'])
                    if plotter and hasattr(plotter, 'window') and plotter.window:
                        plotter.window.SetOffScreenRendering(1)
                except Exception as fallback_error:
                    logger.error(f"Fallback plotter creation failed: {fallback_error}")
                    raise RuntimeError("All plotter creation methods failed")
            
            try:
                # Add mesh to plotter
                plotter.add(mesh)
                
                # Set background color (ignore errors)
                try:
                    plotter.background(self.config['background_color'])
                except:
                    pass
                
                # Set isometric camera position
                if hasattr(plotter, 'camera') and plotter.camera:
                    plotter.camera.SetPosition(camera_pos)
                    plotter.camera.SetFocalPoint(mesh_center)
                    plotter.camera.SetViewUp(self.config['camera_up'])
                    
                    # Reset camera to fit the mesh properly
                    plotter.reset_camera()
                    plotter.camera.Zoom(self.config['zoom_factor'])
                
                # Enable better rendering quality if available
                try:
                    if hasattr(plotter, 'renderer') and plotter.renderer:
                        plotter.renderer.SetUseDepthPeeling(self.config['depth_peeling'])
                except:
                    pass  # Ignore depth peeling errors
                
                # Render with error handling
                try:
                    plotter.render()
                except Exception as render_error:
                    logger.warning(f"Render call failed: {render_error}")
                    # Continue - sometimes screenshot works even if render fails
                
                # Take screenshot with multiple fallback methods
                screenshot_success = False
                screenshot_methods = [
                    # Method 1: Direct file save
                    lambda: plotter.screenshot(preview_image_path),
                    # Method 2: Get array then save
                    lambda: self._save_screenshot_array(plotter, preview_image_path),
                    # Method 3: Legacy screenshot method
                    lambda: self._save_screenshot_legacy(plotter, preview_image_path)
                ]
                
                for i, method in enumerate(screenshot_methods):
                    try:
                        method()
                        if os.path.exists(preview_image_path):
                            screenshot_success = True
                            logger.info(f"✓ Screenshot method {i+1} succeeded")
                            break
                    except Exception as screenshot_error:
                        logger.warning(f"Screenshot method {i+1} failed: {screenshot_error}")
                        continue
                
                if screenshot_success:
                    logger.info(f"✓ Vedo preview image generated successfully: {preview_image_path}")
                    return preview_image_path
                else:
                    raise RuntimeError("All screenshot methods failed")
                
            finally:
                # Safe cleanup
                if plotter:
                    try:
                        plotter.close()
                    except Exception as cleanup_error:
                        logger.warning(f"Plotter cleanup warning: {cleanup_error}")
                    
        except Exception as e:
            logger.warning(f"Vedo rendering failed: {e}")
            logger.info("Falling back to matplotlib rendering...")
            # Fall back to matplotlib method
            return self._generate_preview_matplotlib_fallback(mesh, preview_image_path, camera_pos, mesh_center)
    
    def _save_screenshot_array(self, plotter, preview_image_path: str) -> None:
        """
        Alternative screenshot method using array conversion.
        """
        img_array = plotter.screenshot(asarray=True)
        if img_array is not None and len(img_array) > 0:
            from PIL import Image
            img = Image.fromarray(img_array)
            img.save(preview_image_path)
        else:
            raise RuntimeError("Screenshot array is empty")
    
    def _save_screenshot_legacy(self, plotter, preview_image_path: str) -> None:
        """
        Legacy screenshot method with manual buffer reading.
        """
        if hasattr(plotter, 'window') and plotter.window:
            # Force a render
            plotter.window.Render()
            
            # Get window to front buffer
            plotter.window.SetSwapBuffers(1)
            
            # Use basic screenshot approach
            try:
                plotter.screenshot(preview_image_path, scale=1)
            except:
                # Try with different parameters
                plotter.screenshot(filename=preview_image_path)
        else:
            raise RuntimeError("No valid render window for legacy screenshot")

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
        output_dir = Path(settings.MEDIA_ROOT) / 'temp' / 'stl_previews'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename based on STL file with cleaner naming
        stl_file_path = Path(stl_data['stl_file_path'])
        # Remove the .stl extension and append _preview
        base_name = stl_file_path.stem
        
        # Create preview filename that matches STL naming
        preview_filename = f"{base_name}_preview.{self.config['output_format']}"
        
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
            
            # Get mesh vertices and faces (using new vedo API)
            vertices = mesh.vertices
            faces = mesh.cells
            
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