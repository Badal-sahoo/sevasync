from rest_framework import serializers
from .models import Volunteer

class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = '__all__'
        # Rewards are awarded only by the server (task completion). These must never
        # be settable via the profile-update endpoint, or a volunteer could inflate
        # their own points. `user` is set from the auth token, never the request body.
        read_only_fields = ['user', 'total_points', 'tasks_completed']