from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def api_health_check(request):
    """
    Initial health check and status endpoint for Floral Delight API.
    Verifies that Django REST Framework and the server are operational.
    """
    return Response({
        "status": "online",
        "message": "Floral Delight API is running smoothly! 🌸",
        "service": "Floral Delight Boutique Florist Backend",
        "version": "1.0.0",
        "timestamp": timezone.now().isoformat(),
        "endpoints": {
            "health_check": "/api/health/",
            "admin": "/admin/",
        }
    })
