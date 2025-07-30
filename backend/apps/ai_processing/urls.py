from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIProcessingViewSet

router = DefaultRouter()
router.register(r'ai-processing', AIProcessingViewSet, basename='ai-processing')

urlpatterns = [
    path('', include(router.urls)),
]
