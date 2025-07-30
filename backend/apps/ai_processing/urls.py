from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Commented out unused AIModelViewSet
# from .views import AIModelViewSet

router = DefaultRouter()
# Commented out unused aimodels endpoint - not used by frontend
# router.register(r'aimodels', AIModelViewSet, basename='aimodels')

urlpatterns = [
    path('', include(router.urls)),
]
