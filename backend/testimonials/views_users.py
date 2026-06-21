from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import UserProfile, UserRole
from .permissions import IsAdminRole
from .serializers_auth import ManagedUserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("profile").order_by("username")
    serializer_class = ManagedUserSerializer
    permission_classes = [IsAdminRole]

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("You cannot delete your own account.")
        if (
            hasattr(instance, "profile")
            and instance.profile.role == UserRole.ADMIN
            and UserProfile.objects.filter(role=UserRole.ADMIN).count() <= 1
        ):
            raise PermissionDenied("Cannot delete the only admin account.")
        instance.delete()
