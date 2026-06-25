from django.db import models
from django.utils import timezone


class User(models.Model):
    class Role(models.TextChoices):
        NGO = 'NGO', 'NGO'
        VOLUNTEER = 'VOLUNTEER', 'Volunteer'

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    fcm_token = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.email

    @property
    def is_authenticated(self):
        # Required by DRF's authentication pipeline — Django's built-in User
        # provides this via AbstractBaseUser; our custom User model must do it manually.
        return True
