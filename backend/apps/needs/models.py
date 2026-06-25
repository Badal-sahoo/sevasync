import hashlib
from django.db import models
from apps.users.models import User


class Need(models.Model):
    class NeedType(models.TextChoices):
        FOOD = 'food', 'Food'
        MEDICAL = 'medical', 'Medical'
        WATER = 'water', 'Water'
        SHELTER = 'shelter', 'Shelter'
        ELECTRICITY = 'electricity', 'Electricity'
        GENERAL = 'general', 'General'

    name = models.CharField(max_length=100)
    problem = models.TextField()
    need_type = models.CharField(max_length=50, choices=NeedType.choices)
    ngo = models.ForeignKey(User, on_delete=models.CASCADE)
    location_text = models.CharField(max_length=200, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    row_hash = models.CharField(max_length=64, blank=True, default='', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_need'

    def __str__(self):
        return f"{self.need_type} - {self.location_text}"

    @staticmethod
    def compute_hash(name, pincode, problem):
        raw = f"{name.strip().lower()}|{pincode.strip().lower()}|{problem.strip().lower()}"
        return hashlib.sha256(raw.encode()).hexdigest()
