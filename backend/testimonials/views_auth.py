from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers_auth import MeSerializer, profile_payload


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = profile_payload(request.user)
        serializer = MeSerializer(data)
        return Response(serializer.data)
