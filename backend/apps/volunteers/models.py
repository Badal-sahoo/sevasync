from django.db import models
from django.utils import timezone
from apps.users.models import User


class Volunteer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    skills = models.JSONField()
    location = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    availability = models.BooleanField(default=True)
    total_points = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    fcm_token = models.CharField(max_length=255, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
