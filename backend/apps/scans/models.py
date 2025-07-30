from django.db import models
from django.contrib.auth.models import User
from apps.patients.models import Patient
import os

class Scan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="new_scans")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="new_scans")
    image = models.ImageField(upload_to="scans/")
    processed_image = models.ImageField(upload_to="processed_scans/", null=True, blank=True)
    bbox_data = models.JSONField(null=True, blank=True)  # To store bounding box coordinates
    created_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Scan for {self.patient} by {self.user.username} on {self.created_at}"
    
    @property
    def scan_attempt_number(self):
        """Get the scan attempt number for this patient"""
        if self.patient:
            return self.patient.new_scans.filter(
                created_at__lte=self.created_at
            ).count()
        return 0


def patient_scan_upload_to(instance, filename):
    """Generate upload path based on patient name and scan attempt number"""
    if instance.scan and instance.scan.patient:
        patient_name = f"{instance.scan.patient.first_name}_{instance.scan.patient.last_name}"
        # Remove special characters from patient name
        patient_name = "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
        
        # Get scan attempt number for this patient
        from django.db.models import Count
        patient_scan_count = instance.scan.patient.new_scans.filter(
            created_at__lt=instance.scan.created_at
        ).count() + 1
        
        # Extract file extension
        ext = filename.split('.')[-1] if '.' in filename else ''
        base_name = filename.rsplit('.', 1)[0] if '.' in filename else filename
        
        # Create filename with patient name and scan attempt number
        new_filename = f"{patient_name}_scan{patient_scan_count:03d}_{base_name}.{ext}" if ext else f"{patient_name}_scan{patient_scan_count:03d}_{base_name}"
        
        # Return path: /media/Alison_Turing/filename
        return f"{patient_name}/{new_filename}"
    return f"unknown_patient/{filename}"


class ScanResult(models.Model):
    scan = models.OneToOneField(Scan, on_delete=models.CASCADE, related_name='result')
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
