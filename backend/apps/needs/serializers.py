from rest_framework import serializers
from .models import Need


class NeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Need
        fields = '__all__'


class ManualNeedCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    problem = serializers.CharField()
    pincode = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    location = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    need_type = serializers.ChoiceField(choices=Need.NeedType.choices)
