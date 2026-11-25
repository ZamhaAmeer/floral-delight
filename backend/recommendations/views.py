"""
API Views for Personalized Flower Recommendation System.
Endpoints:
- POST /api/recommendations/             -> Generate personalized recommendations
- GET  /api/recommendations/occasions/   -> Retrieve supported occasions with descriptions
- GET  /api/recommendations/preferences/ -> Retrieve available flower types, colours, styles, recipients
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .engine import (
    FlowerRecommendationEngine,
    OCCASION_METADATA,
    SUPPORTED_FLOWER_TYPES,
    SUPPORTED_COLORS,
    SUPPORTED_BOUQUET_STYLES,
    RECIPIENT_METADATA,
)
from .serializers import RecommendationRequestSerializer


class RecommendationView(APIView):
    """
    POST /api/recommendations/
    Generate personalized flower recommendations using our rule-based scoring engine.
    Publicly accessible to both registered customers and guest visitors.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "status": "error",
                    "message": "Invalid preference parameters.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        preferences = serializer.validated_data
        limit = preferences.pop("limit", 6)

        results = FlowerRecommendationEngine.recommend(preferences=preferences, limit=limit)
        return Response(results, status=status.HTTP_200_OK)


class OccasionsListView(APIView):
    """
    GET /api/recommendations/occasions/
    Returns supported occasions and their botanical symbolism.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        occasions_list = []
        for slug, data in OCCASION_METADATA.items():
            occasions_list.append({
                "slug": slug,
                "title": data["title"],
                "description": data["description"],
                "symbolism": data["symbolism"],
                "preferred_flowers": data["preferred_flower_types"],
            })

        return Response(
            {
                "status": "success",
                "count": len(occasions_list),
                "occasions": occasions_list,
            },
            status=status.HTTP_200_OK,
        )


class PreferencesMetadataView(APIView):
    """
    GET /api/recommendations/preferences/
    Returns all supported customer preference options for building recommendation filters.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        recipients_list = [
            {"slug": slug, "title": data["title"], "tone": data["tone"]}
            for slug, data in RECIPIENT_METADATA.items()
        ]

        return Response(
            {
                "status": "success",
                "flower_types": SUPPORTED_FLOWER_TYPES,
                "colors": SUPPORTED_COLORS,
                "bouquet_styles": SUPPORTED_BOUQUET_STYLES,
                "recipients": recipients_list,
                "budget_presets": [
                    {"label": "Under Rs. 4,200", "min": 0, "max": 4200},
                    {"label": "Rs. 4,200 – Rs. 5,000", "min": 4200, "max": 5000},
                    {"label": "Above Rs. 5,000", "min": 5000, "max": None},
                    {"label": "All Price Ranges", "min": 0, "max": None},
                ]
            },
            status=status.HTTP_200_OK,
        )
