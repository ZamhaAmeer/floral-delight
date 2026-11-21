"""
API Views for Custom Bouquet Builder System.
Endpoints:
- GET    /api/bouquets/       -> List logged-in user's bouquets
- POST   /api/bouquets/       -> Create new custom bouquet
- GET    /api/bouquets/<id>/  -> Retrieve single bouquet (user-owned only)
- PUT    /api/bouquets/<id>/  -> Full update of bouquet
- PATCH  /api/bouquets/<id>/  -> Partial update of bouquet
- DELETE /api/bouquets/<id>/  -> Delete bouquet (user-owned only)
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CustomBouquet
from .serializers import CustomBouquetSerializer


class BouquetListCreateView(APIView):
    """
    GET  /api/bouquets/ -> View all saved bouquets designed by the authenticated user.
    POST /api/bouquets/ -> Create a new custom bouquet arrangement with server-side price calculation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bouquets = CustomBouquet.objects.filter(user=request.user).prefetch_related(
            "items",
            "items__product"
        )
        serializer = CustomBouquetSerializer(bouquets, many=True)
        return Response(
            {
                "status": "success",
                "count": bouquets.count(),
                "bouquets": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = CustomBouquetSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            bouquet = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": f"Custom bouquet '{bouquet.name}' created successfully! 🌸",
                    "bouquet": CustomBouquetSerializer(bouquet).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "status": "error",
                "message": "Failed to create custom bouquet.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class BouquetDetailView(APIView):
    """
    GET    /api/bouquets/<id>/ -> View a single saved bouquet (strictly user-owned)
    PUT    /api/bouquets/<id>/ -> Replace bouquet attributes / flowers
    PATCH  /api/bouquets/<id>/ -> Partial update of bouquet (e.g. style or name)
    DELETE /api/bouquets/<id>/ -> Delete bouquet
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        try:
            return CustomBouquet.objects.prefetch_related(
                "items",
                "items__product"
            ).get(pk=pk, user=request.user)
        except CustomBouquet.DoesNotExist:
            return None

    def get(self, request, pk):
        bouquet = self.get_object(request, pk)
        if not bouquet:
            return Response(
                {
                    "status": "error",
                    "message": f"Custom bouquet with ID {pk} not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CustomBouquetSerializer(bouquet)
        return Response(
            {
                "status": "success",
                "bouquet": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        bouquet = self.get_object(request, pk)
        if not bouquet:
            return Response(
                {
                    "status": "error",
                    "message": f"Custom bouquet with ID {pk} not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CustomBouquetSerializer(
            bouquet,
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            updated_bouquet = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Bouquet updated successfully.",
                    "bouquet": CustomBouquetSerializer(updated_bouquet).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "Failed to update bouquet.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        bouquet = self.get_object(request, pk)
        if not bouquet:
            return Response(
                {
                    "status": "error",
                    "message": f"Custom bouquet with ID {pk} not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CustomBouquetSerializer(
            bouquet,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        if serializer.is_valid():
            updated_bouquet = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Bouquet updated successfully.",
                    "bouquet": CustomBouquetSerializer(updated_bouquet).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "Failed to update bouquet.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        bouquet = self.get_object(request, pk)
        if not bouquet:
            return Response(
                {
                    "status": "error",
                    "message": f"Custom bouquet with ID {pk} not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        name = bouquet.name
        bouquet.delete()
        return Response(
            {
                "status": "success",
                "message": f"Custom bouquet '{name}' deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )
