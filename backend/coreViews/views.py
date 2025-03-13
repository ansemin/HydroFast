from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import authenticate

from .models import Patient, Scan, AIModel, UserProfile
from .serializers import PatientSerializer, ScanSerializer, AIModelSerializer
from django.contrib.auth.models import User

# Authentication Views
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'username': user.username,
                'is_admin': hasattr(user, 'userprofile') and user.userprofile.is_admin
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Register a new user
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not email or not password:
        return Response({'error': 'Please provide username, email and password'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, is_admin=False)
    
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user_id': user.pk,
        'email': user.email,
        'username': user.username,
        'is_admin': False
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_user_info(request):
    """
    Get information about the current user
    """
    user = request.user
    return Response({
        'user_id': user.pk,
        'email': user.email,
        'username': user.username,
        'is_admin': hasattr(user, 'userprofile') and user.userprofile.is_admin
    })

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Allow AnonymousUser during testing
        if not user.is_authenticated:
            # return Patient.objects.none()
            # Return all patients or a specific set for testing
            return Patient.objects.all()

        # Handle authenticated users
        if hasattr(user, 'userprofile') and user.userprofile.is_admin:
            return Patient.objects.all()  # Admin users see all patients
        return Patient.objects.filter(user=user)  # Regular users see only their patients

    def perform_create(self, serializer):
        if self.request.user.is_anonymous:
            # Useing default user
            # Default user 'default_user' created with password 'default_password'.
            default_user = User.objects.get(username="default_user") 
            serializer.save(user=default_user)
        else:
            serializer.save(user=self.request.user)

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
        # Placeholder for AI processing logic
        # After processing, save the processed image file and update is_processed
        scan.is_processed = True
        scan.save()
        return Response({'status': 'Processing complete'})
    
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


class AIModelViewSet(viewsets.ModelViewSet):
    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer
    # permission_classes = [permissions.IsAuthenticated]




class IsAdminOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.userprofile.is_admin:
            return True
        return view.action == 'retrieve' or view.action == 'list'

    def has_object_permission(self, request, view, obj):
        if request.user.userprofile.is_admin:
            return True
        return obj.user == request.user
