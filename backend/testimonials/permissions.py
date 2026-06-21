from rest_framework.permissions import BasePermission, SAFE_METHODS

from .profile_utils import is_admin


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class ScholarPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_admin(request.user):
            return True
        from .profile_utils import get_assigned_region

        region = get_assigned_region(request.user)
        return region is not None and obj.region == region
