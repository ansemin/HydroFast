from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, ScanViewSet, AIModelViewSet, CustomAuthToken, register_user, get_user_info

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patients')
router.register(r'scans', ScanViewSet, basename='scans')
router.register(r'aimodels', AIModelViewSet, basename='aimodels')

urlpatterns = [
    path('', include(router.urls)),
    # Authentication endpoints
    path('login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('register/', register_user, name='register'),
    path('user-info/', get_user_info, name='user_info'),
]
