from django.db import models


class GeocodedLocation(models.Model):
    query      = models.CharField(max_length=255, unique=True, db_index=True)
    latitude   = models.FloatField()
    longitude  = models.FloatField()
    source     = models.CharField(max_length=20, default='nominatim')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'geocoded_location'

    def __str__(self):
        return f"{self.query} → ({self.latitude}, {self.longitude})"
