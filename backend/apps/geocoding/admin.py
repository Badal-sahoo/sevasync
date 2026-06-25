from django.contrib import admin
from .models import GeocodedLocation


@admin.register(GeocodedLocation)
class GeocodedLocationAdmin(admin.ModelAdmin):
    list_display = ('query', 'latitude', 'longitude', 'source', 'created_at')
    search_fields = ('query',)
    readonly_fields = ('created_at',)
