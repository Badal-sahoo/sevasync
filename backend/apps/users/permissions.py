from rest_framework.permissions import BasePermission


class IsNGO(BasePermission):
    """Allows access only to users with the NGO role."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'NGO')


class IsVolunteer(BasePermission):
    """Allows access only to users with the VOLUNTEER role."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'VOLUNTEER')
