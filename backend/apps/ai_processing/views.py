from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from apps.patients.models import Patient
from apps.scans.models import Scan, ScanResult
import os
import traceback
import cv2
import numpy as np
import json
import shutil
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
        GRANULAR Step 1.1: Segments the full image, finds the bounding box,
        saves the bbox, and crops the *original* image.
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] GRANULAR Step 1.1: Starting Initial Crop for Scan ID: {scan.id}")
        try:
            from apps.ai_processing.processors.wound_detector import WoundDetector
            from apps.ai_processing.processors.depth_utils import detect_bounding_box_from_segmented, crop_image_with_bbox

            # 1. Segment the entire original image
            print("   - Step 1: Segmenting full original image...")
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path  # Save the full segmented image path
            print(f"   - Full segmented image saved to: {relative_path}")

            # 2. Detect bounding box from the full segmented image
            print("   - Step 2: Detecting bounding box...")
            bbox = detect_bounding_box_from_segmented(segmented_image_path)
            if bbox is None:
                raise ValueError("Could not detect bounding box from segmented image")
            scan.bbox_data = bbox  # Save bbox to the model
            scan.save()
            print(f"   - Bounding box detected and saved: {bbox}")

            # 3. Crop the original image using the bounding box
            print("   - Step 3: Cropping original image...")
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            os.makedirs(bbox_output_dir, exist_ok=True)
            cropped_image_path = os.path.join(bbox_output_dir, "cropped_wound.png")
            crop_success = crop_image_with_bbox(scan.image.path, bbox, cropped_image_path)
            if not crop_success:
                raise ValueError("Failed to crop original image")
            print(f"   - Cropped original image saved to: {cropped_image_path}")

            # 4. Build and return the response
            cropped_image_url = request.build_absolute_uri(settings.MEDIA_URL + os.path.relpath(cropped_image_path, settings.MEDIA_ROOT))
            response_data = {
                'status': 'Initial crop complete',
                'cropped_image_path': cropped_image_url,
                'scan_id': scan.id,
            }
            print("✅ [Backend] GRANULAR Step 1.1 successful.")
            return Response(response_data)

        except Exception as e:
            print(f"❌ [Backend] Error in initial crop: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_cropped_segmentation(self, request, pk=None):
        """
        GRANULAR Step 1.2: Uses the saved bounding box to crop the
        full segmented image.
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] GRANULAR Step 1.2: Starting Cropped Segmentation for Scan ID: {scan.id}")
        try:
            from apps.ai_processing.processors.depth_utils import crop_image_with_bbox

            # Use the saved bounding box
            bbox = scan.bbox_data
            if not bbox:
                raise ValueError("No bounding box data found. Run initial crop first.")
            print(f"   - Using saved bounding box: {bbox}")

            # Get the full segmented image path
            if not scan.processed_image:
                raise ValueError("No processed image found. Run initial crop first.")
            
            # Get the actual file path from the ImageFieldFile
            full_segmented_path = scan.processed_image.path
            if not os.path.exists(full_segmented_path):
                raise ValueError(f"Segmented image not found: {full_segmented_path}")
            print(f"   - Using full segmented image: {full_segmented_path}")

            # Crop the segmented image using the saved bounding box
            print("   - Step 1: Cropping full segmented image...")
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            os.makedirs(bbox_output_dir, exist_ok=True)
            cropped_segmented_path = os.path.join(bbox_output_dir, "cropped_segmented.png")
            crop_success = crop_image_with_bbox(full_segmented_path, bbox, cropped_segmented_path)
            if not crop_success:
                raise ValueError("Failed to crop segmented image")
            print(f"   - Cropped segmented image saved to: {cropped_segmented_path}")

            # Build and return the response
            cropped_segmented_url = request.build_absolute_uri(settings.MEDIA_URL + os.path.relpath(cropped_segmented_path, settings.MEDIA_ROOT))
            response_data = {
                'status': 'Cropped segmentation complete',
                'cropped_segmented_path': cropped_segmented_url,
                'scan_id': scan.id,
            }
            print("✅ [Backend] GRANULAR Step 1.2 successful.")
            return Response(response_data)

        except Exception as e:
            print(f"❌ [Backend] Error in cropped segmentation: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_depth_analysis(self, request, pk=None):
        """
        SIMPLIFIED Step 3: ZoeDepth processing only WITHOUT masking
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] SIMPLIFIED Step 3: Starting ZoeDepth analysis...")
        try:
            from apps.ai_processing.processors.zoedepth_processor import ZoeDepthProcessor
            from apps.ai_processing.processors.depth_utils import calculate_depth_statistics, estimate_volume_from_depth
            
            # Look for cropped original image from bbox detection
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            cropped_image_path = os.path.join(bbox_output_dir, "cropped_wound.png")
            
            if not os.path.exists(cropped_image_path):
                return Response({'error': 'Bbox detection must be completed first.'}, status=status.HTTP_400_BAD_REQUEST)
            
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
            
            # Save depth maps
            depth_8bit_path = os.path.join(bbox_output_dir, "depth_8bit.png")
            depth_16bit_path = os.path.join(bbox_output_dir, "depth_16bit.png")
            
            import cv2
            depth_8bit_normalized = cv2.normalize(raw_depth_map, None, 0, 255, cv2.NORM_MINMAX)
            cv2.imwrite(depth_8bit_path, depth_8bit_normalized.astype(np.uint8))
            
            depth_16bit_normalized = cv2.normalize(raw_depth_map, None, 0, 65535, cv2.NORM_MINMAX)
            cv2.imwrite(depth_16bit_path, depth_16bit_normalized.astype(np.uint16))
            
            # Build URLs
            depth_8bit_relative = os.path.relpath(depth_8bit_path, settings.MEDIA_ROOT)
            depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_relative)
            
            depth_16bit_relative = os.path.relpath(depth_16bit_path, settings.MEDIA_ROOT)
            depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_relative)
            
            # Save metadata
            depth_metadata = {
                'depth_statistics': depth_stats,
                'volume_estimate': volume_estimate,
                'processing_parameters': {
                    'model_type': processor.config['model_type'],
                    'masking_applied': False,
                    'pixel_size_mm': processor.config['pixel_size_mm']
                },
                'workflow_type': 'granular_cropped_no_mask',
                'processor': 'ZoeDepthProcessor'
            }
            
            metadata_path = os.path.join(bbox_output_dir, "metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(depth_metadata, f, indent=2, default=str)
            
            response_data = {
                'status': 'ZoeDepth analysis complete',
                'depth_map_8bit': depth_8bit_url,
                'depth_map_16bit': depth_16bit_url,
                'volume_estimate': volume_estimate,
                'depth_metadata': depth_metadata,
                'scan_id': scan.id,
                'step': 'depth_analysis',
                'processor': 'ZoeDepthProcessor'
            }
            
            print(f"✅ [Backend] SIMPLIFIED Step 3 completed successfully!")
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ [Backend] Error in ZoeDepth analysis: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_mesh_generation(self, request, pk=None):
        """
        SIMPLIFIED Step 4: Mesh and preview generation only (uses existing depth analysis)
        """
        scan = self.get_scan(pk)
        if not scan:
            return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        print(f"🚀 [Backend] SIMPLIFIED Step 4: Starting mesh generation...")
        try:
            from apps.ai_processing.processors.mesh_generator import MeshGenerator
            from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator
            
            # Check for existing depth analysis results
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            metadata_path = os.path.join(bbox_output_dir, 'metadata.json')
            depth_8bit_path = os.path.join(bbox_output_dir, 'depth_8bit.png')
            depth_16bit_path = os.path.join(bbox_output_dir, 'depth_16bit.png')
            
            if not all(os.path.exists(p) for p in [metadata_path, depth_8bit_path, depth_16bit_path]):
                return Response({'error': 'Depth analysis must be completed first.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Load existing depth analysis results
            with open(metadata_path, 'r') as f:
                depth_metadata = json.load(f)
            
            # Get visualization mode from request
            visualization_mode = request.data.get('visualization_mode', 'balanced')
            
            # Generate STL mesh using the correct method from MeshGenerator
            # Configure based on visualization mode
            if visualization_mode == 'realistic':
                # Realistic physical dimensions for 3D printing
                z_dimension = 1.8
                clip_percentile = 10
            elif visualization_mode == 'enhanced':
                # Enhanced visualization for better 3D preview
                z_dimension = 8.0
                clip_percentile = 5
            else:  # 'balanced' (PRODUCTION DEFAULT)
                # BALANCED MODE: Optimized for production use
                z_dimension = 5.0
                clip_percentile = 5
            
            mesh_config = {
                'actual_x': 7.4,      # Physical dimensions from STL.py
                'actual_y': 16.4,
                'actual_z': z_dimension,
                'base_layers': 0,
                'base_thickness_mm': 0.26,
                'depth_clip_percentile': clip_percentile
            }
            
            # Prepare depth_results structure for mesh generator (compatible format)
            depth_results = {
                'depth_map_8bit_path': depth_8bit_path,
                'depth_map_16bit_path': depth_16bit_path,
                'depth_statistics': depth_metadata.get('depth_statistics', {}),
                'volume_estimate': depth_metadata.get('volume_estimate', 0),
                'depth_metadata': depth_metadata
            }
            
            mesh_generator = MeshGenerator(mesh_config)
            stl_results = mesh_generator.process(depth_results)
            
            if stl_results.get('generation_status') != 'success':
                raise ValueError(f"STL generation failed: {stl_results.get('error', 'Unknown error')}")
            
            # Generate mesh preview using the correct method
            # Configure preview settings based on visualization mode
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
            
            # Save results to database
            scan_result, created = ScanResult.objects.get_or_create(scan=scan)
            
            # Copy files to patient-specific locations
            patient_name = f"{scan.patient.first_name}_{scan.patient.last_name}"
            patient_name = "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
            
            # Get scan attempt number for this patient using the correct relationship
            patient_scan_count = scan.patient.new_scans.filter(created_at__lte=scan.created_at).count()
            
            # Save with patient-specific naming
            import shutil
            
            # STL file
            stl_dest_path = f"{patient_name}/{patient_name}_scan{patient_scan_count:03d}_wound_model.stl"
            stl_full_dest_path = os.path.join(settings.MEDIA_ROOT, stl_dest_path)
            os.makedirs(os.path.dirname(stl_full_dest_path), exist_ok=True)
            shutil.copy2(stl_results['stl_file_path'], stl_full_dest_path)
            scan_result.stl_file = stl_dest_path
            
            # Preview image
            preview_dest_path = f"{patient_name}/{patient_name}_scan{patient_scan_count:03d}_stl_preview.png"
            preview_full_dest_path = os.path.join(settings.MEDIA_ROOT, preview_dest_path)
            shutil.copy2(preview_results['preview_image_path'], preview_full_dest_path)
            scan_result.preview_image = preview_dest_path
            
            # Depth maps
            depth_8bit_dest_path = f"{patient_name}/{patient_name}_scan{patient_scan_count:03d}_depth_map_8bit.png"
            depth_8bit_full_dest_path = os.path.join(settings.MEDIA_ROOT, depth_8bit_dest_path)
            shutil.copy2(depth_8bit_path, depth_8bit_full_dest_path)
            scan_result.depth_map_8bit = depth_8bit_dest_path
            
            depth_16bit_dest_path = f"{patient_name}/{patient_name}_scan{patient_scan_count:03d}_depth_map_16bit.png"
            depth_16bit_full_dest_path = os.path.join(settings.MEDIA_ROOT, depth_16bit_dest_path)
            shutil.copy2(depth_16bit_path, depth_16bit_full_dest_path)
            scan_result.depth_map_16bit = depth_16bit_dest_path
            
            # Save metadata - convert numpy types before saving to database
            volume_estimate = depth_metadata.get('volume_estimate')
            if volume_estimate is not None:
                volume_estimate = convert_numpy_types(volume_estimate)
            scan_result.volume_estimate = volume_estimate
            scan_result.processing_metadata = convert_numpy_types({
                'mesh_metadata': stl_results.get('mesh_metadata'),
                'preview_metadata': preview_results.get('preview_metadata'),
                'depth_metadata': depth_metadata
            })
            scan_result.save()
            
            # Mark scan as processed
            scan.is_processed = True
            scan.save()
            
            # Build URLs
            stl_file_url = request.build_absolute_uri(settings.MEDIA_URL + stl_dest_path)
            preview_image_url = request.build_absolute_uri(settings.MEDIA_URL + preview_dest_path)
            depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_dest_path)
            depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_dest_path)
            
            # Calculate file sizes
            stl_file_size_mb = round(os.path.getsize(stl_full_dest_path) / (1024 * 1024), 1)
            preview_file_size_mb = round(os.path.getsize(preview_full_dest_path) / (1024 * 1024), 1)
            
            response_data = convert_numpy_types({
                'status': 'Mesh generation complete',
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
                    'volume_estimate': depth_metadata.get('volume_estimate'),
                },
                'scan_id': scan.id,
                'patient_id': scan.patient.id,
                'step': 'mesh_generation',
                'processor': 'MeshGenerator + MeshPreviewGenerator'
            })
            
            print(f"✅ [Backend] SIMPLIFIED Step 4 completed successfully!")
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ [Backend] Error in mesh generation: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
