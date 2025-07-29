from django.db import models
from django.contrib.auth.models import User
from apps.patients.models import Patient

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
