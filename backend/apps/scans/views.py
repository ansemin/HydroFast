from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from apps.patients.models import Patient
from .models import Scan, ScanResult
from .serializers import ScanSerializer, ScanResultSerializer
import numpy as np


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


class ScanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for basic scan CRUD operations.
    
    AI Processing methods have been moved to apps.ai_processing.views.AIProcessingViewSet
    Available at endpoints: /api/ai-processing/{scan_id}/process_*
    """
    serializer_class = ScanSerializer
    # permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        queryset = Scan.objects.all()

        # Allow AnonymousUser during testing
        if not user.is_authenticated:
            queryset = Scan.objects.all()
        # Handle authenticated users
        elif hasattr(user, 'userprofile') and user.userprofile.is_admin:
            queryset = Scan.objects.all()  # Admin users see all scans
        else:
            queryset = Scan.objects.filter(user=user)
        
        # Filter by patient if patient parameter is provided
        patient_id = self.request.query_params.get('patient', None)
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Order by created_at descending (newest first)
        return queryset.order_by('-created_at') 
    
    def perform_create(self, serializer):
        if self.request.user.is_anonymous:
            # Using default user for anonymous uploads
            # Default user 'default_user' created with password 'default_password'.
            try:
                default_user = User.objects.get(username="default_user") 
                serializer.save(user=default_user)
                print(f"👤 [Backend] Using default_user for anonymous upload")
            except User.DoesNotExist:
                print(f"❌ [Backend] Error: default_user not found in database")
                raise ValueError("Default user not found. Please contact administrator.")
        else:
            serializer.save(user=self.request.user)
            print(f"👤 [Backend] Using authenticated user: {self.request.user.username}")
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request):
        """
        Upload an image for a patient - Basic scan creation only
        
        For AI processing, use the dedicated endpoints:
        - /api/ai-processing/{scan_id}/process_initial_crop/
        - /api/ai-processing/{scan_id}/process_cropped_segmentation/
        - /api/ai-processing/{scan_id}/process_depth_analysis/
        - /api/ai-processing/{scan_id}/process_mesh_generation/
        """
        print(f"🚀 [Backend] Step 1: Starting image upload process...")
        print(f"📥 [Backend] Request method: {request.method}")
        print(f"📋 [Backend] Request data keys: {list(request.data.keys())}")
        
        try:
            patient_id = request.data.get('patient')
            print(f"👤 [Backend] Patient ID from request: {patient_id}")
            
            if not patient_id:
                print(f"❌ [Backend] Error: Patient ID is required")
                return Response({'error': 'Patient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if patient exists
            print(f"🔍 [Backend] Checking if patient exists...")
            try:
                patient = Patient.objects.get(id=patient_id)
                print(f"✅ [Backend] Patient found: {patient}")
            except Patient.DoesNotExist:
                print(f"❌ [Backend] Error: Patient not found with ID {patient_id}")
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get the image from the request
            image = request.data.get('image')
            print(f"📷 [Backend] Image from request: {type(image)}")
            
            if not image:
                print(f"❌ [Backend] Error: Image is required")
                return Response({'error': 'Image is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Log image details for debugging
            print(f"📊 [Backend] Image details:")
            print(f"  - Type: {type(image)}")
            print(f"  - Size: {image.size} bytes")
            print(f"  - Name: {image.name}")
            print(f"  - Content type: {image.content_type}")
            
            # Create the scan data
            scan_data = {
                'patient': patient_id,
                'image': image
            }
            print(f"📦 [Backend] Creating scan with data:")
            print(f"  - Patient: {patient_id}")
            print(f"  - Image: {image.name}")
            
            # Validate and save the scan
            print(f"⚙️ [Backend] Validating scan data...")
            serializer = self.get_serializer(data=scan_data)
            if serializer.is_valid():
                print(f"✅ [Backend] Scan data validation successful")
                print(f"💾 [Backend] Saving scan to database...")
                self.perform_create(serializer)  # Use perform_create to handle anonymous users
                
                scan_id = serializer.data.get('id')
                image_url = serializer.data.get('image')
                print(f"✅ [Backend] Scan created successfully!")
                print(f"🆔 [Backend] Generated scan ID: {scan_id}")
                print(f"🔗 [Backend] Image URL: {image_url}")
                print(f"📤 [Backend] Returning scan data to frontend")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ [Backend] Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print(f"❌ [Backend] Error in image upload process:")
            print(f"❌ [Backend] Error message: {str(e)}")
            import traceback
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ScanResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing scan results"""
    serializer_class = ScanResultSerializer
    # permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ScanResult.objects.all()
        
        # Allow AnonymousUser during testing
        if not user.is_authenticated:
            queryset = ScanResult.objects.all()
        elif hasattr(user, 'userprofile') and user.userprofile.is_admin:
            queryset = ScanResult.objects.all()
        else:
            queryset = ScanResult.objects.filter(scan__user=user)
        
        # Filter by patient if patient parameter is provided
        patient_id = self.request.query_params.get('patient', None)
        if patient_id is not None:
            queryset = queryset.filter(scan__patient_id=patient_id)
        
        # Order by created_at descending (newest first)
        return queryset.order_by('-created_at')


# ================================================================
# AI PROCESSING METHODS MOVED TO: apps.ai_processing.views.py
# ================================================================
# 
# The following AI processing methods have been moved to improve
# code organization and reduce file size:
#
# FROM: /api/scans/{scan_id}/process_*
# TO:   /api/ai-processing/{scan_id}/process_*
#
# Available AI Processing Endpoints:
# - process_initial_crop/         (Step 1.1: Segment & crop original)
# - process_cropped_segmentation/ (Step 1.2: Crop segmented image)  
# - process_depth_analysis/       (Step 3: ZoeDepth processing)
# - process_mesh_generation/      (Step 4: STL & preview generation)
#
# For implementation details, see:
# apps.ai_processing.views.AIProcessingViewSet
# ================================================================
