from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScanViewSet, ScanResultViewSet

router = DefaultRouter()
router.register(r'scans', ScanViewSet, basename='scans')
router.register(r'scan-results', ScanResultViewSet, basename='scan-results')

urlpatterns = [
    path('', include(router.urls)),
]
