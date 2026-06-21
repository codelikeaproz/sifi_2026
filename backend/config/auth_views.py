from rest_framework_simplejwt.views import TokenObtainPairView

from config.throttling import LoginRateThrottle
from testimonials.serializers_auth import CustomTokenObtainPairSerializer


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer
