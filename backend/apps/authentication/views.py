from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from .models import UserProfile
import logging

logger = logging.getLogger(__name__)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username', 'Unknown')
        client_ip = request.META.get('REMOTE_ADDR', 'Unknown')
        
        logger.info(f"[AuthAPI] 🔑 POST /auth/login/ - Login attempt for username: '{username}'")
        logger.debug(f"[AuthAPI] Login request from IP: {client_ip}")
        
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        if serializer.is_valid():
            validated_data = serializer.validated_data or {}
            if isinstance(validated_data, dict):
                user = validated_data.get('user')
            else:
                user = getattr(validated_data, 'user', None)
            if user is None:
                logger.warning(f"[AuthAPI] ❌ Login failed for username: '{username}' - User not found in validated data")
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
            token, created = Token.objects.get_or_create(user=user)
            
            is_admin = hasattr(user, 'new_userprofile') and user.new_userprofile.is_admin
            logger.info(f"[AuthAPI] ✅ Login successful for user: '{user.username}' (Admin: {is_admin})")
            
            if created:
                logger.debug(f"[AuthAPI] New auth token created for user: {user.username}")
            else:
                logger.debug(f"[AuthAPI] Existing auth token reused for user: {user.username}")
            
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'username': user.username,
                'is_admin': is_admin
            })
        else:
            logger.warning(f"[AuthAPI] ❌ Login failed for username: '{username}' - Invalid credentials")
            logger.debug(f"[AuthAPI] Validation errors: {serializer.errors}")
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
    client_ip = request.META.get('REMOTE_ADDR', 'Unknown')
    
    logger.info(f"[AuthAPI] 🆕 POST /auth/register/ - Registration attempt for username: '{username}'")
    logger.debug(f"[AuthAPI] Registration request from IP: {client_ip}")
    
    if not username or not email or not password:
        logger.warning(f"[AuthAPI] ❌ Registration failed - Missing required fields (username: {'✓' if username else '✗'}, email: {'✓' if email else '✗'}, password: {'✓' if password else '✗'})")
        return Response({'error': 'Please provide username, email and password'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        logger.warning(f"[AuthAPI] ❌ Registration failed - Username '{username}' already exists")
        return Response({'error': 'Username already exists'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        logger.warning(f"[AuthAPI] ❌ Registration failed - Email '{email}' already exists")
        return Response({'error': 'Email already exists'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user, is_admin=False)
        
        token, created = Token.objects.get_or_create(user=user)
        
        logger.info(f"[AuthAPI] ✅ Registration successful for user: '{username}' (ID: {user.pk})")
        logger.debug(f"[AuthAPI] Created user profile and auth token for: {username}")
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'username': user.username,
            'is_admin': False
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"[AuthAPI] ❌ Registration failed for username: '{username}' - Error: {str(e)}")
        return Response({'error': 'Failed to create user account'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user_info(request):
    """
    Get information about the current user
    """
    user = request.user
    logger.info(f"[AuthAPI] 👤 GET /auth/user/ - User info requested by: '{user.username if user.is_authenticated else 'Anonymous'}'")
    
    if not user.is_authenticated:
        logger.warning("[AuthAPI] ❌ User info request failed - User not authenticated")
        return Response({'error': 'Authentication required'}, 
                        status=status.HTTP_401_UNAUTHORIZED)
    
    is_admin = hasattr(user, 'new_userprofile') and user.new_userprofile.is_admin
    logger.debug(f"[AuthAPI] ✅ Returning user info for: {user.username} (Admin: {is_admin})")
    
    return Response({
        'user_id': user.pk,
        'email': user.email,
        'username': user.username,
        'is_admin': is_admin
    })
