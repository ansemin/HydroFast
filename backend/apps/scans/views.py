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
    def process_scan(self, request, pk=None):
        scan = self.get_object()
        try:
            from apps.ai_processing.processors.wound_detector import WoundDetector
            detector = WoundDetector()
            output_path = detector.process(scan.image.path)
            
            # Convert absolute path to relative path for Django FileField
            import os
            from django.conf import settings
            
            # Get relative path from MEDIA_ROOT
            relative_path = os.path.relpath(output_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path
            scan.is_processed = True
            scan.save()
            
            # Build full URL for the processed image
            processed_image_url = request.build_absolute_uri(scan.processed_image.url) if scan.processed_image else None
            
            return Response({
                'status': 'Processing complete', 
                'processed_image': processed_image_url
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
