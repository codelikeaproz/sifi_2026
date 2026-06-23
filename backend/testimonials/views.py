from rest_framework import mixins, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Degree, Scholar, School
from .pagination import OptionalPageNumberPagination
from .permissions import RegionScopedMasterPermission, ScholarPermission
from .profile_utils import get_assigned_region, is_admin
from .serializers import DegreeSerializer, ScholarSerializer, SchoolSerializer


class ScholarViewSet(viewsets.ModelViewSet):
    queryset = Scholar.objects.select_related("school_ref", "degree_ref").all()
    serializer_class = ScholarSerializer
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = OptionalPageNumberPagination
    permission_classes = [ScholarPermission]
    filter_backends = [SearchFilter]
    search_fields = [
        "first_name",
        "last_name",
        "middle_initial",
        "suffix",
        "school",
        "school_ref__name",
        "degree_name",
        "degree_ref__name",
        "message",
        "region",
    ]

    def get_queryset(self):
        qs = Scholar.objects.all()
        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(region=region)

        user = self.request.user
        if user.is_authenticated and not is_admin(user):
            assigned = get_assigned_region(user)
            if assigned:
                qs = qs.filter(region=assigned)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and not is_admin(user):
            assigned = get_assigned_region(user)
            if assigned:
                serializer.save(region=assigned)
                return
        serializer.save()


class RegionScopedMasterViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [RegionScopedMasterPermission]
    filter_backends = [SearchFilter]
    search_fields = ["name"]
    pagination_class = None

    def get_queryset(self):
        qs = self.queryset.order_by("name")
        region = self.request.query_params.get("region")

        user = self.request.user
        if user.is_authenticated and not is_admin(user):
            assigned = get_assigned_region(user)
            if assigned:
                return qs.filter(region=assigned)

        if region:
            qs = qs.filter(region=region)
        return qs

    def perform_destroy(self, instance):
        if instance.scholars.exists():
            raise PermissionDenied("Cannot delete a record that is in use by scholars.")
        instance.delete()


class SchoolViewSet(RegionScopedMasterViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer


class DegreeViewSet(RegionScopedMasterViewSet):
    queryset = Degree.objects.all()
    serializer_class = DegreeSerializer