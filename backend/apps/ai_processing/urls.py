from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIModelViewSet

router = DefaultRouter()
router.register(r'aimodels', AIModelViewSet, basename='aimodels')

urlpatterns = [
    path('', include(router.urls)),
]
