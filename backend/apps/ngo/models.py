from django.db import models
from apps.users.models import User

class NGOData(models.Model):
    ngo = models.ForeignKey(User, on_delete=models.CASCADE)
    raw_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


