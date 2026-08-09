from django.db import models
from django.utils import timezone
from apps.needs.models import Need
from apps.volunteers.models import Volunteer
from apps.users.models import User


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        REQUESTED = 'requested', 'Requested'
        ASSIGNED = 'assigned', 'Assigned'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class Urgency(models.TextChoices):
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    ngo = models.ForeignKey(User, on_delete=models.CASCADE)
    need_type = models.CharField(max_length=50, choices=Need.NeedType.choices)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_name = models.CharField(max_length=250, null=True, blank=True)
    urgency = models.CharField(max_length=20, choices=Urgency.choices)
    people_count = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    description = models.TextField(blank=True, default='')
    instructions = models.TextField(blank=True, default='')
    source_needs = models.ManyToManyField(Need, blank=True, related_name='source_tasks')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['ngo', 'status']),
        ]


class Assignment(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        COMPLETED = 'completed', 'Completed'
        WITHDRAWN = 'withdrawn', 'Withdrawn'
        CANCELLED = 'cancelled', 'Cancelled'

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="assignments")
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


class ProgressUpdate(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
