from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, ScanViewSet, AIModelViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patients')
router.register(r'scans', ScanViewSet, basename='scans')
router.register(r'aimodels', AIModelViewSet, basename='aimodels')

urlpatterns = [
    path('', include(router.urls)),
]
