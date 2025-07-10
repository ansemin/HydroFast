from django.db import models

class AIModel(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    model_file = models.FileField(upload_to="ai_models/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
