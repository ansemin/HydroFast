from django.db import models
from django.contrib.auth.models import User
from apps.patients.models import Patient
import os
import uuid

class Scan(models.Model):
    """Lightweight processing session tracker - uses session files for temporary data"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="new_scans")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="new_scans")
    # Session ID for tracking temporary files (instead of storing file paths)
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Processing session for {self.patient} by {self.user.username} on {self.created_at}"
    
    def get_session_dir(self):
        """Get the temporary session directory for this scan"""
        from django.conf import settings
        import os
        return os.path.join(settings.MEDIA_ROOT, 'temp', 'sessions', str(self.session_id))
    
    def cleanup_session(self):
        """Clean up temporary session files"""
        import shutil
        import os
        session_dir = self.get_session_dir()
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
            print(f"🧹 Cleaned up session directory: {session_dir}")
    
    @property
    def scan_attempt_number(self):
        """Get the scan attempt number for this patient"""
        if self.patient:
            return self.patient.new_scans.filter(
                created_at__lte=self.created_at
            ).count()
        return 0


def patient_scan_upload_to(instance, filename):
    """Generate upload path based on patient name and scan number: patient_name/scan_number/filename"""
    if instance.scan and instance.scan.patient:
        patient_name = f"{instance.scan.patient.first_name}_{instance.scan.patient.last_name}"
        # Remove special characters from patient name
        patient_name = "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
        
        # Get scan attempt number for this patient  
        patient_scan_count = instance.scan.patient.new_scans.filter(
            created_at__lte=instance.scan.created_at
        ).count()
        
        # Return path: /media/patient_name/scan_number/filename
        return f"{patient_name}/scan_{instance.scan.id}/{filename}"
    return f"unknown_patient/{filename}"


class ScanResult(models.Model):
    scan = models.OneToOneField(Scan, on_delete=models.CASCADE, related_name='result')
    # Add patient_name field for better organization and future CRUD operations
    patient_name = models.CharField(max_length=100, blank=True)
    # File paths - using dynamic upload_to function
    stl_file = models.FileField(upload_to=patient_scan_upload_to, null=True, blank=True)
    depth_map_8bit = models.FileField(upload_to=patient_scan_upload_to, null=True, blank=True)
    depth_map_16bit = models.FileField(upload_to=patient_scan_upload_to, null=True, blank=True)
    preview_image = models.FileField(upload_to=patient_scan_upload_to, null=True, blank=True)
    # Metadata
    volume_estimate = models.FloatField(null=True, blank=True)
    processing_metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Results for Scan #{self.scan.id} - {self.scan.patient}"
    
    def save(self, *args, **kwargs):
        """Auto-populate patient_name field when saving"""
        if self.scan and self.scan.patient and not self.patient_name:
            self.patient_name = f"{self.scan.patient.first_name}_{self.scan.patient.last_name}"
            # Remove special characters from patient name
            self.patient_name = "".join(c for c in self.patient_name if c.isalnum() or c in ['_', '-'])
        super().save(*args, **kwargs)
    
    @property
    def patient_folder(self):
        """Get the patient folder name"""
        if self.scan and self.scan.patient:
            patient_name = f"{self.scan.patient.first_name}_{self.scan.patient.last_name}"
            return "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
        return "unknown"
    
    @property 
    def scan_folder(self):
        """Get the scan folder name"""
        return f"scan_{self.scan.id}" if self.scan else "scan_unknown"
