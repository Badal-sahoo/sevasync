from django.db import models
from apps.users.models import User

    

class Need(models.Model):

    name = models.CharField(max_length=100)

    problem = models.TextField()

    NEED_TYPES = (
        ('food', 'Food'),
        ('medical', 'Medical'),
        ('water', 'Water'),
        ('shelter', 'Shelter'),
        ('electricity', 'Electricity'),
        ('general', 'General'),
    )
    need_type = models.CharField(max_length=50, choices=NEED_TYPES)
    ngo = models.ForeignKey(User, on_delete=models.CASCADE)

    pincode = models.CharField(max_length=10, null=True, blank=True)
    location_text = models.CharField(max_length=200, null=True, blank=True)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.need_type} - {self.location_text}"