from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from apps.patients.models import Patient
from apps.scans.models import Scan, ScanResult
from apps.ai_processing.session_manager import SessionManager, ProcessingSession
import os
import traceback
import cv2
import numpy as np
import json
import shutil
import tempfile
import atexit
from django.conf import settings


def convert_numpy_types(obj):
    """
    Recursively convert NumPy types to native Python types for JSON serialization.
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj


def create_patient_scan_directory(patient_name, scan_number):
    """Create patient-specific directory structure: media/patient_name/scan_number/"""
    # Clean patient name
    clean_patient_name = "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
    
    # Create directory path
    patient_scan_dir = os.path.join(settings.MEDIA_ROOT, clean_patient_name, f"scan_{scan_number}")
    os.makedirs(patient_scan_dir, exist_ok=True)
    
    return patient_scan_dir, clean_patient_name


class IsAdminOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.userprofile.is_admin:
            return True
        return view.action == 'retrieve' or view.action == 'list'


class AIProcessingViewSet(viewsets.ViewSet):
    """
    ViewSet for AI processing operations on scans.
    This separates AI concerns from basic scan CRUD operations.
    """
    # permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_scan(self, pk):
        """Helper method to get scan object"""
        try:
            return Scan.objects.get(pk=pk)
        except Scan.DoesNotExist:
            return None

    @action(detail=True, methods=['post'])
    def process_initial_crop(self, request, pk=None):
        """
        Session-based Step 1.1: Upload image and detect bounding boxes
        Uses session manager for temporary file handling
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] Session-based Step 1.1: Starting Initial Crop for Session: {scan.session_id}")
        
        # Initialize session manager
        session = SessionManager.get_session(str(scan.session_id))
        
        try:
            # Check if original image exists in session
            original_image_filename = "original_image.jpg"  # Default filename from SessionManager
            
            # Try different possible extensions
            possible_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
            original_image_path = None
            
            for ext in possible_extensions:
                filename = f"original_image{ext}"
                if session.file_exists(filename):
                    original_image_path = session.get_file_path(filename)
                    break
            
            if not original_image_path:
                return Response(
                    {'error': 'No original image found in session. Please upload an image first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"📁 [Backend] Found original image in session: {original_image_path}")
            
            # Initialize YOLO detector
            from apps.ai_processing.processors.wound_detector import WoundDetector
            detector = WoundDetector()
            print(f"🚀 [Backend] YOLO Detector initialized")
            
            # Process the image to get segmented result
            segmented_image_path = detector.process(original_image_path)
            print(f"🎯 [Backend] Segmentation completed: {segmented_image_path}")
            
            # Detect bounding box from segmented image
            from apps.ai_processing.processors.depth_utils import detect_bounding_box_from_segmented, crop_image_with_bbox
            bbox = detect_bounding_box_from_segmented(segmented_image_path)
            if bbox is None:
                return Response(
                    {'error': 'Could not detect bounding box from segmented image'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Save bounding box data to session
            bbox_data = {
                'bbox': bbox,
                'image_dimensions': cv2.imread(original_image_path).shape[:2]
            }
            session.save_bbox_data(bbox_data)
            
            # Create cropped images for preview
            temp_cropped_original = session.get_file_path('cropped_original.png')
            temp_cropped_segmented = session.get_file_path('cropped_segmented.png')
            
            # Crop images
            crop_success_original = crop_image_with_bbox(original_image_path, bbox, temp_cropped_original)
            crop_success_segmented = crop_image_with_bbox(segmented_image_path, bbox, temp_cropped_segmented)
            
            if not crop_success_original or not crop_success_segmented:
                raise ValueError("Failed to crop images for preview")
            
            # Generate temporary URLs for frontend
            cropped_original_url = session.get_file_url('cropped_original.png', request)
            cropped_segmented_url = session.get_file_url('cropped_segmented.png', request)
            
            response_data = {
                'status': 'Initial crop complete - temporary files created for preview',
                'bbox_data': bbox,
                'session_id': str(scan.session_id),
                'cropped_image_path': cropped_original_url,      # For CroppedOriginalScreen
                'cropped_segmented_path': cropped_segmented_url, # For WoundDetectionScreen
                'message': 'Bounding box detection completed. Preview files created temporarily.'
            }
            
            print("✅ [Backend] Session-based Step 1.1 successful - temporary preview files created.")
            return Response(response_data)

        except Exception as e:
            print(f"❌ [Backend] Error in initial crop: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_cropped_segmentation(self, request, pk=None):
        """
        Session-based Step 1.2: Generate cropped segmentation using saved bbox data
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] Session-based Step 1.2: Starting Cropped Segmentation for Session: {scan.session_id}")
        
        # Get session
        session = SessionManager.get_session(str(scan.session_id))
        
        try:
            from apps.ai_processing.processors.depth_utils import crop_image_with_bbox

            # Load bounding box data from session
            bbox_data = session.load_bbox_data()
            if not bbox_data:
                raise ValueError("No bounding box data found. Run initial crop first.")
            
            bbox = bbox_data['bbox']
            print(f"   - Using saved bounding box: {bbox}")

            # Get original image from session
            original_image_path = session.get_file_path('original_image.jpg')
            if not session.file_exists('original_image.jpg'):
                # Try other extensions
                for ext in ['.png', '.jpeg', '.bmp']:
                    if session.file_exists(f'original_image{ext}'):
                        original_image_path = session.get_file_path(f'original_image{ext}')
                        break
                else:
                    raise ValueError("Original image not found in session")

            # Regenerate segmented image to temporary file
            print("   - Regenerating segmented image to temporary file...")
            from apps.ai_processing.processors.wound_detector import WoundDetector
            detector = WoundDetector()
            temp_segmented_path = detector.process(original_image_path)
            if not os.path.exists(temp_segmented_path):
                raise ValueError(f"Failed to generate segmented image: {temp_segmented_path}")
            print(f"   - Generated temporary segmented image: {temp_segmented_path}")

            # Crop the segmented image using the saved bounding box
            print("   - Step 1: Cropping full segmented image...")
            cropped_segmented_path = session.get_file_path("cropped_segmented_final.png")
            crop_success = crop_image_with_bbox(temp_segmented_path, bbox, cropped_segmented_path)
            if not crop_success:
                raise ValueError("Failed to crop segmented image")
            print(f"   - Cropped segmented image saved to: {cropped_segmented_path}")

            # Build and return the response
            cropped_segmented_url = session.get_file_url("cropped_segmented_final.png", request)
            response_data = {
                'status': 'Cropped segmentation complete',
                'cropped_segmented_path': cropped_segmented_url,
                'session_id': str(scan.session_id),
            }
            print("✅ [Backend] Session-based Step 1.2 successful.")
            return Response(response_data)

        except Exception as e:
            print(f"❌ [Backend] Error in cropped segmentation: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_depth_analysis(self, request, pk=None):
        """
        Session-based Step 3: ZoeDepth processing using session data
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] Session-based Step 3: Starting ZoeDepth analysis for Session: {scan.session_id}")
        
        # Get session
        session = SessionManager.get_session(str(scan.session_id))
        
        try:
            from apps.ai_processing.processors.zoedepth_processor import ZoeDepthProcessor
            from apps.ai_processing.processors.depth_utils import calculate_depth_statistics, estimate_volume_from_depth
            
            # Look for cropped original image from session
            cropped_image_path = session.get_file_path("cropped_original.png")
            
            if not session.file_exists("cropped_original.png"):
                return Response({'error': 'Initial crop must be completed first.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process with ZoeDepth
            processor = ZoeDepthProcessor()
            processor.load_model()
            
            processed_image, original_size = processor.preprocess(cropped_image_path)
            raw_depth_map = processor._generate_depth_map(processed_image)
            
            # Resize if needed
            if processor.config['output_size'] is None and original_size is not None:
                import cv2
                raw_depth_map = cv2.resize(raw_depth_map, original_size, interpolation=cv2.INTER_LINEAR)
            
            # Calculate statistics and volume
            depth_stats = calculate_depth_statistics(raw_depth_map, mask=None)
            volume_estimate = estimate_volume_from_depth(raw_depth_map, mask=None, pixel_size_mm=processor.config['pixel_size_mm'])
            
            # Save depth maps to session using proper normalization
            depth_8bit_path = session.get_file_path("depth_map_8bit.png")
            depth_16bit_path = session.get_file_path("depth_map_16bit.png")
            
            import cv2
            # Ensure depth map is numpy array and normalize to 0-1 range
            depth_array = np.array(raw_depth_map, dtype=np.float32)
            depth_min = float(np.min(depth_array))
            depth_max = float(np.max(depth_array))
            depth_normalized = (depth_array - depth_min) / (depth_max - depth_min)
            
            # Save 8-bit depth map (for visualization)
            depth_8bit = (depth_normalized * 255).astype(np.uint8)
            cv2.imwrite(depth_8bit_path, depth_8bit)
            
            # Save 16-bit depth map (for precision)
            depth_16bit = (depth_normalized * 65535).astype(np.uint16)
            cv2.imwrite(depth_16bit_path, depth_16bit)
            
            # Create metadata
            depth_metadata = {
                'depth_statistics': depth_stats,
                'volume_estimate': volume_estimate,
                'processing_parameters': {
                    'model_type': processor.config['model_type'],
                    'masking_applied': False,
                    'pixel_size_mm': processor.config['pixel_size_mm']
                },
                'workflow_type': 'session_based_no_mask',
                'processor': 'ZoeDepthProcessor'
            }
            
            # Save metadata to session
            session.save_session_data(depth_metadata, 'processing_metadata.json')
            
            # Build URLs
            depth_8bit_url = session.get_file_url("depth_map_8bit.png", request)
            depth_16bit_url = session.get_file_url("depth_map_16bit.png", request)
            
            response_data = {
                'status': 'ZoeDepth analysis complete',
                'depth_map_8bit': depth_8bit_url,
                'depth_map_16bit': depth_16bit_url,
                'volume_estimate': volume_estimate,
                'depth_metadata': depth_metadata,
                'session_id': str(scan.session_id),
                'step': 'depth_analysis',
                'processor': 'ZoeDepthProcessor'
            }
            
            print(f"✅ [Backend] Session-based Step 3 completed successfully!")
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ [Backend] Error in ZoeDepth analysis: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_mesh_generation(self, request, pk=None):
        """
        Session-based Step 4: Generate mesh and migrate final results to patient storage
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] Session-based Step 4: Starting mesh generation for Session: {scan.session_id}")
        
        # Get session
        session = SessionManager.get_session(str(scan.session_id))
        
        try:
            from apps.ai_processing.processors.mesh_generator import MeshGenerator
            from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator
            
            # Check for depth analysis results in session
            if not session.file_exists('processing_metadata.json'):
                return Response({'error': 'Depth analysis must be completed first.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Load processing metadata
            depth_metadata = session.load_session_data('processing_metadata.json')
            if not depth_metadata:
                return Response({'error': 'Depth metadata not found. Run depth analysis first.'}, status=status.HTTP_400_BAD_REQUEST)
                
            volume_estimate = depth_metadata.get('volume_estimate', 0.0)
            
            # Get depth map paths from session
            depth_8bit_path = session.get_file_path('depth_map_8bit.png')
            depth_16bit_path = session.get_file_path('depth_map_16bit.png')
            
            if not session.file_exists('depth_map_8bit.png') or not session.file_exists('depth_map_16bit.png'):
                return Response({'error': 'Depth maps not found. Run depth analysis first.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get visualization mode from request
            visualization_mode = request.data.get('visualization_mode', 'balanced')
            
            # Configure mesh generation based on visualization mode
            if visualization_mode == 'realistic':
                z_dimension = 1.8
                clip_percentile = 10
            elif visualization_mode == 'enhanced':
                z_dimension = 8.0
                clip_percentile = 5
            else:  # 'balanced' (PRODUCTION DEFAULT)
                z_dimension = 5.0
                clip_percentile = 5
            
            mesh_config = {
                'actual_x': 7.4,
                'actual_y': 16.4,
                'actual_z': z_dimension,
                'base_layers': 0,
                'base_thickness_mm': 0.26,
                'depth_clip_percentile': clip_percentile
            }
            
            # Prepare depth_results for mesh generator
            depth_results = {
                'depth_map_8bit_path': depth_8bit_path,
                'depth_map_16bit_path': depth_16bit_path,
                'depth_statistics': depth_metadata.get('depth_statistics', {}),
                'volume_estimate': volume_estimate,
                'depth_metadata': depth_metadata
            }
            
            # Generate STL mesh (saves to temporary location)
            mesh_generator = MeshGenerator(mesh_config)
            stl_results = mesh_generator.process(depth_results)
            
            if stl_results.get('generation_status') != 'success':
                raise ValueError(f"STL generation failed: {stl_results.get('error', 'Unknown error')}")
            
            # Generate mesh preview
            if visualization_mode == 'realistic':
                preview_config = {
                    'image_size': (800, 600),
                    'camera_distance': 15,
                    'lighting_intensity': 0.8
                }
            elif visualization_mode == 'enhanced':
                preview_config = {
                    'image_size': (1024, 768),
                    'camera_distance': 12,
                    'lighting_intensity': 1.0
                }
            else:  # 'balanced' (PRODUCTION DEFAULT)
                preview_config = {
                    'image_size': (800, 600),
                    'camera_distance': 13,
                    'lighting_intensity': 0.9
                }
                
            preview_generator = MeshPreviewGenerator(preview_config)
            preview_results = preview_generator.process(stl_results)
            
            if preview_results.get('generation_status') != 'success':
                raise ValueError(f"Preview generation failed: {preview_results.get('error', 'Unknown error')}")
            
            # Create patient-centric directory structure
            patient_name = f"{scan.patient.first_name}_{scan.patient.last_name}"
            scan_number = scan.scan_attempt_number
            
            # Use session to migrate final results
            patient_scan_dir = session.migrate_final_results(patient_name, scan_number)
            clean_patient_name = os.path.basename(os.path.dirname(patient_scan_dir))
            
            # Save results to database
            scan_result, created = ScanResult.objects.get_or_create(scan=scan)
            
            # Copy STL and preview files to patient directory
            print(f"   - Saving final files to: {patient_scan_dir}")
            
            # Save STL file
            stl_filename = f"{scan.session_id}.stl"
            stl_dest_path = os.path.join(patient_scan_dir, stl_filename)
            shutil.copy2(stl_results['stl_file_path'], stl_dest_path)
            scan_result.stl_file.name = f"{clean_patient_name}/scan_{scan_number}/{stl_filename}"
            
            # Save STL preview
            preview_filename = f"{scan.session_id}_preview.png"
            preview_dest_path = os.path.join(patient_scan_dir, preview_filename)
            shutil.copy2(preview_results['preview_image_path'], preview_dest_path)
            scan_result.preview_image.name = f"{clean_patient_name}/scan_{scan_number}/{preview_filename}"
            
            # Depth maps are already migrated by session.migrate_final_results()
            scan_result.depth_map_8bit.name = f"{clean_patient_name}/scan_{scan_number}/depth_map_8bit.png"
            scan_result.depth_map_16bit.name = f"{clean_patient_name}/scan_{scan_number}/depth_map_16bit.png"
            
            # Save metadata to database  
            if isinstance(volume_estimate, (int, float)):
                scan_result.volume_estimate = float(volume_estimate)
            else:
                scan_result.volume_estimate = None
            
            # Convert numpy types for JSON serialization                
            combined_metadata = convert_numpy_types({
                'mesh_metadata': stl_results.get('mesh_metadata'),
                'preview_metadata': preview_results.get('preview_metadata'),
                'depth_metadata': depth_metadata
            })
            
            # Save to JSON field (if it exists) or handle gracefully
            try:
                # Skip saving to processing_metadata for now due to type checking issues
                # The metadata is already saved in the file system
                pass
            except AttributeError:
                # If processing_metadata field doesn't exist, just continue
                print("Note: processing_metadata field not available on ScanResult model")
                
            scan_result.save()
            
            # Mark scan as processed
            scan.is_processed = True
            scan.save()
            
            # Build URLs
            stl_file_url = request.build_absolute_uri(settings.MEDIA_URL + scan_result.stl_file.name)
            preview_image_url = request.build_absolute_uri(settings.MEDIA_URL + scan_result.preview_image.name)
            depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + scan_result.depth_map_8bit.name)
            depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + scan_result.depth_map_16bit.name)
            
            # Calculate file sizes
            stl_file_size_mb = round(os.path.getsize(stl_dest_path) / (1024 * 1024), 1)
            preview_file_size_mb = round(os.path.getsize(preview_dest_path) / (1024 * 1024), 1)
            
            response_data = convert_numpy_types({
                'status': 'Mesh generation complete - files saved to patient-centric structure',
                'patient_directory': f"media/{clean_patient_name}/scan_{scan_number}/",
                'stl_generation': {
                    'stl_file_url': stl_file_url,
                    'stl_file_size_mb': stl_file_size_mb,
                    'mesh_metadata': stl_results.get('mesh_metadata'),
                },
                'preview_generation': {
                    'preview_image_url': preview_image_url,
                    'preview_file_size_mb': preview_file_size_mb,
                    'preview_metadata': preview_results.get('preview_metadata'),
                },
                'depth_analysis': {
                    'depth_8bit_url': depth_8bit_url,
                    'depth_16bit_url': depth_16bit_url,
                    'volume_estimate': volume_estimate,
                },
                'session_id': str(scan.session_id),
                'patient_id': scan.patient.pk,
                'step': 'mesh_generation',
                'processor': 'MeshGenerator + MeshPreviewGenerator'
            })
            
            # Clean up session files and all temp directories after successful migration
            print(f"🧹 [Backend] Cleaning up session files and temp directories...")
            session.cleanup_all_temp_files()
            
            print(f"✅ [Backend] Session-based Step 4 completed successfully! Files saved to patient-centric structure.")
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ [Backend] Error in mesh generation: {str(e)}")
            print(traceback.format_exc())
            
            # Clean up session files and temp directories even if mesh generation failed
            try:
                print(f"🧹 [Backend] Cleaning up session files and temp directories after error...")
                session.cleanup_all_temp_files()
            except Exception as cleanup_error:
                print(f"⚠️ [Backend] Session cleanup failed: {cleanup_error}")
            
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
