from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScanViewSet

router = DefaultRouter()
router.register(r'scans', ScanViewSet, basename='scans')

urlpatterns = [
    path('', include(router.urls)),
]
