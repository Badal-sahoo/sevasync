from django.db import models
from apps.ai.models import Need
from apps.volunteers.models import Volunteer
from apps.users.models import User 

class Task(models.Model):

    STATUS = (
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
    )
    ngo = models.ForeignKey(User, on_delete=models.CASCADE)
    need_type = models.CharField(max_length=50)  # 🔥 ADD THIS
    location = models.CharField(max_length=100)
    urgency = models.CharField(max_length=20)
    total_needs = models.IntegerField(default=1)  # 🔥 ADD THIS

    status = models.CharField(max_length=20, choices=STATUS, default='pending')


class Assignment(models.Model):
    task = models.OneToOneField(Task, on_delete=models.CASCADE)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='assigned')