from django.db import models
from apps.users.models import User

class Volunteer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    skills = models.JSONField()
    location = models.CharField(max_length=100)
    availability = models.BooleanField(default=True)
    points = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)