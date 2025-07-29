from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import QuerySet
from .models import Patient
from .serializers import PatientSerializer
import logging
from typing import Any

logger = logging.getLogger(__name__)

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # type: ignore[override]
        user = self.request.user
        logger.debug(f"[PatientsAPI] Getting queryset for user: {user.username if user.is_authenticated else 'Anonymous'}")

        # Allow AnonymousUser during testing
        if not user.is_authenticated:
            logger.info("[PatientsAPI] ⚠️  Anonymous user accessing patients - returning all patients for testing")
            # return Patient.objects.none()
            # Return all patients or a specific set for testing
            queryset = Patient.objects.all()
            logger.debug(f"[PatientsAPI] Returning {queryset.count()} patients for anonymous user")
            return queryset

        # Handle authenticated users
        try:
            user_profile = getattr(user, 'new_userprofile', None)
            if user_profile and user_profile.is_admin:
                logger.info(f"[PatientsAPI] 👑 Admin user '{user.username}' accessing all patients")
                queryset = Patient.objects.all()
                logger.debug(f"[PatientsAPI] Admin user accessing {queryset.count()} total patients")
                return queryset
        except AttributeError:
            # User doesn't have a profile, treat as regular user
            pass
        
        logger.info(f"[PatientsAPI] 👤 Regular user '{user.username}' accessing their patients")
        queryset = Patient.objects.filter(user=user)
        logger.debug(f"[PatientsAPI] Regular user has access to {queryset.count()} patients")
        return queryset

    def list(self, request, *args, **kwargs):
        logger.info(f"[PatientsAPI] 📋 GET /patients/ - Fetching patients list")
        logger.debug(f"[PatientsAPI] Request from IP: {request.META.get('REMOTE_ADDR', 'Unknown')}")
        
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            patient_count = len(serializer.data)
            
            logger.info(f"[PatientsAPI] ✅ Successfully retrieved {patient_count} patients")
            
            # Log patient names for debugging (first 5)
            if patient_count > 0:
                patient_names = [f"{p.get('first_name', '')} {p.get('last_name', '')}" for p in serializer.data[:5]]
                names_preview = ", ".join(patient_names)
                if patient_count > 5:
                    names_preview += f"... and {patient_count - 5} more"
                logger.debug(f"[PatientsAPI] Patients preview: {names_preview}")
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"[PatientsAPI] ❌ Error fetching patients list: {str(e)}")
            return Response(
                {'error': 'Failed to fetch patients'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        patient_id = kwargs.get('pk')
        logger.info(f"[PatientsAPI] 👤 GET /patients/{patient_id}/ - Fetching patient details")
        logger.debug(f"[PatientsAPI] Request from IP: {request.META.get('REMOTE_ADDR', 'Unknown')}")
        
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            patient_name = f"{instance.first_name} {instance.last_name}"
            logger.info(f"[PatientsAPI] ✅ Successfully retrieved patient: {patient_name} (ID: {patient_id}, NRIC: {instance.nric})")
            logger.debug(f"[PatientsAPI] Patient details - Contact: {instance.contact_no or 'None'}, DOB: {instance.date_of_birth or 'None'}")
            
            return Response(serializer.data)
            
        except Patient.DoesNotExist:
            logger.warning(f"[PatientsAPI] ⚠️  Patient with ID {patient_id} not found")
            return Response(
                {'error': f'Patient with ID {patient_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"[PatientsAPI] ❌ Error fetching patient {patient_id}: {str(e)}")
            return Response(
                {'error': 'Failed to fetch patient details'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        logger.info("[PatientsAPI] 🆕 POST /patients/ - Creating new patient")
        logger.debug(f"[PatientsAPI] Request data keys: {list(request.data.keys())}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                patient_name = f"{serializer.data.get('first_name')} {serializer.data.get('last_name')}"
                logger.info(f"[PatientsAPI] ✅ Successfully created patient: {patient_name} (ID: {serializer.data.get('id')})")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.warning(f"[PatientsAPI] ⚠️  Patient creation failed - Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"[PatientsAPI] ❌ Error creating patient: {str(e)}")
            return Response(
                {'error': 'Failed to create patient'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        patient_id = kwargs.get('pk')
        logger.info(f"[PatientsAPI] ✏️  PUT /patients/{patient_id}/ - Updating patient")
        logger.debug(f"[PatientsAPI] Update data keys: {list(request.data.keys())}")
        
        try:
            instance = self.get_object()
            old_name = f"{instance.first_name} {instance.last_name}"
            
            serializer = self.get_serializer(instance, data=request.data)
            if serializer.is_valid():
                serializer.save()
                new_name = f"{serializer.data.get('first_name')} {serializer.data.get('last_name')}"
                logger.info(f"[PatientsAPI] ✅ Successfully updated patient: {new_name} (ID: {patient_id})")
                
                if old_name != new_name:
                    logger.debug(f"[PatientsAPI] Patient name changed from '{old_name}' to '{new_name}'")
                
                return Response(serializer.data)
            else:
                logger.warning(f"[PatientsAPI] ⚠️  Patient update failed - Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Patient.DoesNotExist:
            logger.warning(f"[PatientsAPI] ⚠️  Patient with ID {patient_id} not found for update")
            return Response(
                {'error': f'Patient with ID {patient_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"[PatientsAPI] ❌ Error updating patient {patient_id}: {str(e)}")
            return Response(
                {'error': 'Failed to update patient'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        patient_id = kwargs.get('pk')
        logger.info(f"[PatientsAPI] 🗑️  DELETE /patients/{patient_id}/ - Deleting patient")
        
        try:
            instance = self.get_object()
            patient_name = f"{instance.first_name} {instance.last_name}"
            
            self.perform_destroy(instance)
            logger.info(f"[PatientsAPI] ✅ Successfully deleted patient: {patient_name} (ID: {patient_id})")
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Patient.DoesNotExist:
            logger.warning(f"[PatientsAPI] ⚠️  Patient with ID {patient_id} not found for deletion")
            return Response(
                {'error': f'Patient with ID {patient_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"[PatientsAPI] ❌ Error deleting patient {patient_id}: {str(e)}")
            return Response(
                {'error': 'Failed to delete patient'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        if self.request.user.is_anonymous:
            logger.debug("[PatientsAPI] Creating patient for anonymous user - using default_user")
            # Using default user
            # Default user 'default_user' created with password 'default_password'.
            default_user = User.objects.get(username="default_user") 
            serializer.save(user=default_user)
        else:
            logger.debug(f"[PatientsAPI] Creating patient for authenticated user: {self.request.user.username}")
            serializer.save(user=self.request.user)
