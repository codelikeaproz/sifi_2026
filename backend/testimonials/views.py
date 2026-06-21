from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Scholar
from .pagination import OptionalPageNumberPagination
from .permissions import ScholarPermission
from .profile_utils import get_assigned_region, is_admin
from .serializers import ScholarSerializer


class ScholarViewSet(viewsets.ModelViewSet):
    queryset = Scholar.objects.all()
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
        "degree_name",
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
