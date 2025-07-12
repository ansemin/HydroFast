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
        """Step 3: Process mesh generation (placeholder)"""
        scan = self.get_object()
        try:
            # Check if depth analysis was done first
            # For now, we'll skip this check but it can be added later
            
            # TODO: Implement actual mesh generation in future phase
            # This will include:
            # 1. Loading depth maps from previous step
            # 2. Generating 3D mesh using depth data
            # 3. Creating mesh file (PLY, OBJ, etc.)
            # 4. Saving mesh file to media storage
            
            response_data = {
                'status': 'Mesh generation complete',
                'mesh_file_url': None,  # Will be implemented later
                'scan_id': scan.id,
                'step': 'mesh_generation',
                'note': 'Mesh generation placeholder - will be implemented in future phase',
                'ready_for_implementation': True
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
