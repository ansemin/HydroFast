from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="new_patients")
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    nric = models.CharField(max_length=9, unique=True) 
    date_of_birth = models.DateField(blank=True, null=True)
    contact_no = models.CharField(max_length=15, blank=True, null=True)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
