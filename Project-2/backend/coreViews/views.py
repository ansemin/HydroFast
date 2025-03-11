from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Patient, Scan, AIModel
from .serializers import PatientSerializer, ScanSerializer, AIModelSerializer
from django.contrib.auth.models import User


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
    
    
    @action(detail=True, methods=['post'])
    def process_scan(self, request, pk=None):
        scan = self.get_object()
        # Placeholder for AI processing logic
        # After processing, save the processed image file and update is_processed
        scan.is_processed = True
        scan.save()
        return Response({'status': 'Processing complete'})


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
