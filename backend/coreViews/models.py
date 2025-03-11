from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="patients")
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    nric = models.CharField(max_length=9, unique=True) 
    date_of_birth = models.DateField(blank=True, null=True)
    contact_no = models.CharField(max_length=15, blank=True, null=True)  # Optional field
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Scan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="scans")  # Add user field
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="scans")
    image = models.ImageField(upload_to="scans/")
    processed_image = models.ImageField(upload_to="processed_scans/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Scan for {self.patient} by {self.user.username} on {self.created_at}"

class AIModel(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    model_file = models.FileField(upload_to="ai_models/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

