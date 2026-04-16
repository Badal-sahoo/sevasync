from django.db import models

class User(models.Model):
    ROLE_CHOICES = (
        ('NGO', 'NGO'),
        ('VOLUNTEER', 'VOLUNTEER'),
    )

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return self.email
    @property
    def is_authenticated(self):
        return True