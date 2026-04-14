from rest_framework import serializers
from .models import NGOData

class NGODataSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGOData
        fields = '__all__'