from django.db.models import Count, F, Min, Window
from django.db.models.functions import Coalesce
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Degree, Region, Scholar, School
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
        qs = Scholar.objects.select_related("school_ref", "degree_ref").all()
        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(region=region)

        user = self.request.user
        if user.is_authenticated and not is_admin(user):
            assigned = get_assigned_region(user)
            if assigned:
                qs = qs.filter(region=assigned)

        if getattr(self, "action", None) == "list":
            qs = self._apply_school_block_ordering(qs)

        return qs

    def _apply_school_block_ordering(self, qs):
        """Group scholars by school; school order follows each group's min global order."""
        return (
            qs.annotate(_school=Coalesce("school_ref__name", "school"))
            .annotate(
                _school_block_order=Window(
                    expression=Min("order"),
                    partition_by=[F("region"), F("_school")],
                )
            )
            .order_by("_school_block_order", "order", "-created_at")
        )

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and not is_admin(user):
            assigned = get_assigned_region(user)
            if assigned:
                serializer.save(region=assigned)
                return
        serializer.save()

    def _analytics_queryset(self, user, region_param=None):
        qs = Scholar.objects.all()
        if is_admin(user):
            if region_param:
                qs = qs.filter(region=region_param)
            return qs, region_param

        assigned = get_assigned_region(user)
        if not assigned:
            return qs.none(), None
        return qs.filter(region=assigned), assigned

    @action(
        detail=False,
        methods=["get"],
        url_path="analytics",
        permission_classes=[IsAuthenticated],
    )
    def analytics(self, request):
        region_param = request.query_params.get("region")
        qs, scope_region = self._analytics_queryset(request.user, region_param)

        if scope_region:
            scope_label = Region(scope_region).label
        else:
            scope_label = "All regions"

        total = qs.count()
        with_year_set = qs.filter(year_graduated__isnull=False).count()

        region_counts = {
            row["region"]: row["count"]
            for row in qs.values("region").annotate(count=Count("id"))
        }

        if is_admin(request.user) and not scope_region:
            by_region = [
                {
                    "region": value,
                    "regionLabel": label,
                    "count": region_counts.get(value, 0),
                }
                for value, label in Region.choices
            ]
        else:
            by_region = [
                {
                    "region": row["region"],
                    "regionLabel": Region(row["region"]).label,
                    "count": row["count"],
                }
                for row in qs.values("region")
                .annotate(count=Count("id"))
                .order_by("region")
            ]

        by_year = [
            {
                "year": row["year_graduated"],
                "yearLabel": (
                    str(row["year_graduated"])
                    if row["year_graduated"] is not None
                    else "Not set"
                ),
                "count": row["count"],
            }
            for row in qs.values("year_graduated")
            .annotate(count=Count("id"))
            .order_by("year_graduated")
        ]

        return Response(
            {
                "scope": {
                    "region": scope_region,
                    "regionLabel": scope_label,
                },
                "total": total,
                "withYearSet": with_year_set,
                "byRegion": by_region,
                "byYear": by_year,
            }
        )


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