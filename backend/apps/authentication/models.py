from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='new_userprofile')
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
