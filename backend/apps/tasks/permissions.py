from rest_framework.permissions import BasePermission


class IsTaskOwnerNGO(BasePermission):
    """Allows access only to the NGO that owns the task."""

    def has_object_permission(self, request, view, obj):
        return obj.ngo == request.user
