from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from apps.patients.models import Patient
from .models import Scan
from .serializers import ScanSerializer

class ScanViewSet(viewsets.ModelViewSet):
    serializer_class = ScanSerializer
    # permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user

        # Allow AnonymousUser during testing
        if not user.is_authenticated:
            # return Scan.objects.none()
            # Return all Scans or a specific set for testing
            return Scan.objects.all()

        # Handle authenticated users
        if hasattr(user, 'userprofile') and user.userprofile.is_admin:
            return Scan.objects.all()  # Admin users see all patients
        return Scan.objects.filter(user=user) 
    
    def perform_create(self, serializer):
        if self.request.user.is_anonymous:
            # Using default user
            # Default user 'default_user' created with password 'default_password'.
            default_user = User.objects.get(username="default_user") 
            serializer.save(user=default_user)
        else:
            serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def process_wound_detection(self, request, pk=None):
        """Step 1: Process wound detection only"""
        scan = self.get_object()
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.wound_detector import WoundDetector
            
            # Step 1: Wound Detection only
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            
            # Convert absolute path to relative path for Django FileField
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path
            scan.save()
            
            # Build full URL for the processed image
            processed_image_url = request.build_absolute_uri(scan.processed_image.url) if scan.processed_image else None
            
            response_data = {
                'status': 'Wound detection complete',
                'processed_image': processed_image_url,
                'scan_id': scan.id,
                'step': 'wound_detection'
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'wound_detection'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def process_depth_analysis(self, request, pk=None):
        """Step 2: Process depth analysis using ZoeDepth"""
        scan = self.get_object()
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.depth_analyzer import DepthAnalyzer
            
            # Check if wound detection was done first
            if not scan.processed_image:
                return Response(
                    {'error': 'Wound detection must be completed first'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the segmented image path
            segmented_image_path = scan.processed_image.path
            
            # Step 2: ZoeDepth Processing
            depth_analyzer = DepthAnalyzer()
            depth_results = depth_analyzer.process(segmented_image_path)
            
            # Build URLs for depth maps
            depth_8bit_url = None
            depth_16bit_url = None
            
            if depth_results.get('depth_map_8bit_path'):
                depth_8bit_relative = os.path.relpath(depth_results['depth_map_8bit_path'], settings.MEDIA_ROOT)
                depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_relative)
            
            if depth_results.get('depth_map_16bit_path'):
                depth_16bit_relative = os.path.relpath(depth_results['depth_map_16bit_path'], settings.MEDIA_ROOT)
                depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_relative)
            
            response_data = {
                'status': 'Depth analysis complete',
                'depth_map_8bit': depth_8bit_url,
                'depth_map_16bit': depth_16bit_url,
                'depth_metadata': {
                    'depth_statistics': depth_results.get('depth_statistics', {}),
                    'volume_estimate': depth_results.get('volume_estimate', {}),
                    'wound_severity': depth_results.get('wound_severity', 'unknown'),
                    'processing_confidence': depth_results.get('processing_confidence', 0.0),
                    'surface_area': depth_results.get('surface_area', 0.0),
                    'wound_mask_extracted': depth_results.get('wound_mask_extracted', False),
                    'analysis_method': depth_results.get('analysis_method', 'ZoeDepth_monocular'),
                    'processor': depth_results.get('processor', 'DepthAnalyzer'),
                    'timestamp': depth_results.get('timestamp'),
                    'units': depth_results.get('units', {})
                },
                'scan_id': scan.id,
                'step': 'depth_analysis'
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'depth_analysis'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_mesh_generation(self, request, pk=None):
        """Step 3: Process mesh generation with STL and preview"""
        scan = self.get_object()
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.depth_analyzer import DepthAnalyzer
            from apps.ai_processing.processors.mesh_generator import MeshGenerator
            from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator
            
            # Check if depth analysis was done first
            if not scan.processed_image:
                return Response(
                    {'error': 'Wound detection must be completed first. Run /process_wound_detection/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the segmented image path for depth analysis
            segmented_image_path = scan.processed_image.path
            
            # Step 3a: Generate depth analysis (if not already done)
            print("🔍 Generating depth analysis for mesh generation...")
            depth_analyzer = DepthAnalyzer()
            depth_results = depth_analyzer.process(segmented_image_path)
            
            # Step 3b: Generate STL mesh
            print("🏗️ Generating STL mesh...")
            
            # Get visualization mode from request (default: balanced)
            viz_mode = request.data.get('visualization_mode', 'balanced')
            
            # Configure based on visualization mode
            if viz_mode == 'realistic':
                # Realistic physical dimensions for 3D printing
                z_dimension = 1.8
                clip_percentile = 10
            elif viz_mode == 'enhanced':
                # Enhanced visualization for better 3D preview
                z_dimension = 8.0
                clip_percentile = 5
            else:  # 'balanced' (default)
                # Balanced between realism and visualization
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
            
            mesh_generator = MeshGenerator(mesh_config)
            stl_results = mesh_generator.process(depth_results)
            
            if stl_results['generation_status'] != 'success':
                return Response(
                    {'error': f'STL generation failed: {stl_results.get("error", "Unknown error")}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Step 3c: Generate mesh preview
            print("🖼️ Generating mesh preview...")
            
            # Enhanced preview configuration based on testing results
            preview_config = {
                'camera_position': (1.5, 1.5, 1),    # Improved isometric angle for better depth view
                'mesh_color': 'lightgray',           # Light gray as in report
                'background_color': 'white',         # White background
                'output_size': (1000, 800),          # Higher resolution for better quality
                'zoom_factor': 1.0,                  # Less zoom to show more context
                'offscreen': True,                   # Server-side rendering
                'use_matplotlib_fallback': True      # Force consistent rendering on Windows
            }
            
            preview_generator = MeshPreviewGenerator(preview_config)
            preview_results = preview_generator.process(stl_results)
            
            # Build URLs for generated files
            stl_file_url = None
            preview_image_url = None
            
            if stl_results.get('stl_file_path'):
                stl_relative = os.path.relpath(stl_results['stl_file_path'], settings.MEDIA_ROOT)
                stl_file_url = request.build_absolute_uri(settings.MEDIA_URL + stl_relative)
            
            if preview_results.get('preview_image_path'):
                preview_relative = os.path.relpath(preview_results['preview_image_path'], settings.MEDIA_ROOT)
                preview_image_url = request.build_absolute_uri(settings.MEDIA_URL + preview_relative)
            
            # Prepare response data
            response_data = {
                'status': 'Mesh generation complete',
                'scan_id': scan.id,
                'step': 'mesh_generation',
                'stl_generation': {
                    'status': stl_results['generation_status'],
                    'stl_file_url': stl_file_url,
                    'mesh_metadata': stl_results['mesh_metadata'],
                    'algorithm': stl_results.get('algorithm', 'STL_reference'),
                    'visualization_mode': viz_mode,
                    'z_dimension_mm': z_dimension,
                    'configuration_notes': {
                        'realistic': 'Accurate 1.8mm depth for 3D printing',
                        'enhanced': 'Enhanced 8.0mm depth for better visualization', 
                        'balanced': 'Balanced 5.0mm depth (default)'
                    }.get(viz_mode, 'Balanced configuration')
                },
                'preview_generation': {
                    'status': preview_results['generation_status'],
                    'preview_image_url': preview_image_url,
                    'preview_metadata': preview_results['preview_metadata'],
                    'view_info': preview_results['view_info']
                },
                'depth_analysis': {
                    'volume_estimate': depth_results.get('volume_estimate', {}),
                    'depth_statistics': depth_results.get('depth_statistics', {})
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'mesh_generation'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_scan(self, request, pk=None):
        """Legacy endpoint: Complete processing pipeline (for backwards compatibility)"""
        scan = self.get_object()
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.wound_detector import WoundDetector
            from apps.ai_processing.processors.depth_analyzer import DepthAnalyzer
            
            # Step 1: Wound Detection
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            
            # Convert absolute path to relative path for Django FileField
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path
            scan.is_processed = True
            scan.save()
            
            # Build full URL for the processed image
            processed_image_url = request.build_absolute_uri(scan.processed_image.url) if scan.processed_image else None
            
            # Step 2: ZoeDepth Processing
            depth_analyzer = DepthAnalyzer()
            depth_results = depth_analyzer.process(segmented_image_path)
            
            # Build URLs for depth maps
            depth_8bit_url = None
            depth_16bit_url = None
            
            if depth_results.get('depth_map_8bit_path'):
                depth_8bit_relative = os.path.relpath(depth_results['depth_map_8bit_path'], settings.MEDIA_ROOT)
                depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_relative)
            
            if depth_results.get('depth_map_16bit_path'):
                depth_16bit_relative = os.path.relpath(depth_results['depth_map_16bit_path'], settings.MEDIA_ROOT)
                depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_relative)
            
            # Prepare comprehensive response
            response_data = {
                'status': 'Processing complete', 
                'processed_image': processed_image_url,
                'depth_map_8bit': depth_8bit_url,
                'depth_map_16bit': depth_16bit_url,
                'depth_metadata': {
                    'depth_statistics': depth_results.get('depth_statistics', {}),
                    'volume_estimate': depth_results.get('volume_estimate', {}),
                    'wound_severity': depth_results.get('wound_severity', 'unknown'),
                    'processing_confidence': depth_results.get('processing_confidence', 0.0),
                    'surface_area': depth_results.get('surface_area', 0.0),
                    'wound_mask_extracted': depth_results.get('wound_mask_extracted', False),
                    'analysis_method': depth_results.get('analysis_method', 'ZoeDepth_monocular'),
                    'processor': depth_results.get('processor', 'DepthAnalyzer'),
                    'timestamp': depth_results.get('timestamp'),
                    'units': depth_results.get('units', {})
                },
                'processing_pipeline': ['WoundDetector', 'ZoeDepth', 'DepthAnalyzer'],
                'scan_id': scan.id
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request):
        """
        Upload an image for a patient
        """
        try:
            patient_id = request.data.get('patient')
            if not patient_id:
                return Response({'error': 'Patient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if patient exists
            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get the image from the request
            image = request.data.get('image')
            if not image:
                return Response({'error': 'Image is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Log information about the received image for debugging
            print(f"Received image: Type: {type(image)}, Size: {getattr(image, 'size', 'unknown')}")
            
            # Create a new scan object
            scan_data = {
                'patient': patient_id,
                'image': image
            }
            
            serializer = self.get_serializer(data=scan_data)
            if serializer.is_valid():
                self.perform_create(serializer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # If validation failed, log the errors
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print(f"Upload error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
