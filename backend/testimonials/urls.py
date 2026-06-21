from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ScholarViewSet
from .views_auth import MeView
from .views_users import UserViewSet

router = DefaultRouter()
router.register("scholars", ScholarViewSet, basename="scholar")
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("", include(router.urls)),
]
