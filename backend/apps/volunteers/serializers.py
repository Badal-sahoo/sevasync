from rest_framework import serializers
from core.constants.skills import ALL_SKILL_IDS
from .models import Volunteer

class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = '__all__'
        # Rewards are awarded only by the server (task completion). These must never
        # be settable via the profile-update endpoint, or a volunteer could inflate
        # their own points. `user` is set from the auth token, never the request body.
        read_only_fields = ['user', 'total_points', 'tasks_completed']

    def validate_skills(self, value):
        # Skills must come from the fixed taxonomy (core/constants/skills.py) —
        # matching does an exact set lookup against it, so a free-text or
        # misspelled skill would silently score zero instead of erroring loudly.
        if not isinstance(value, list):
            raise serializers.ValidationError("Skills must be a list of skill IDs.")
        invalid = sorted(set(value) - ALL_SKILL_IDS)
        if invalid:
            raise serializers.ValidationError(f"Unknown skill id(s): {', '.join(invalid)}")
        return value