from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class IntelligenceOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "status": "active",
            "module": "intelligence",
            "message": "AI Intelligence Center Operational",
            "user": request.user.email,
        }, status=status.HTTP_200_OK)
