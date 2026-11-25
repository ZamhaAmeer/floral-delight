"""
Serializers for Personalized Flower Recommendation System.
"""
from decimal import Decimal
from rest_framework import serializers


class RecommendationRequestSerializer(serializers.Serializer):
    """
    Validates customer input preferences for generating recommendations.
    Accepts occasion, flower type, color, budget range, bouquet style, and recipient.
    """
    occasion = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text="Occasion slug: birthday, anniversary, wedding, graduation, valentines, mothers_day, just_because."
    )
    flower_type = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text="Preferred flower type slug: roses, tulips, lilies, orchids, sunflowers, etc."
    )
    color = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text="Preferred color: red, pink, white, yellow, purple, etc."
    )
    recipient = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text="Recipient: partner, friend, family, other."
    )
    bouquet_style = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text="Bouquet style: hand-tied, flower-box, flower-basket, premium."
    )
    budget_min = serializers.DecimalField(
        required=False,
        allow_null=True,
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
        help_text="Minimum price in LKR (cannot be negative)."
    )
    budget_max = serializers.DecimalField(
        required=False,
        allow_null=True,
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
        help_text="Maximum price in LKR (cannot be negative)."
    )
    limit = serializers.IntegerField(
        required=False,
        default=6,
        min_value=1,
        max_value=20,
        help_text="Maximum number of recommendations to return (default 6)."
    )

    def validate(self, attrs):
        budget_min = attrs.get("budget_min")
        budget_max = attrs.get("budget_max")

        if budget_min is not None and budget_max is not None:
            if budget_min > budget_max:
                raise serializers.ValidationError(
                    {"budget_min": "Minimum budget cannot be greater than maximum budget."}
                )

        return attrs


class RecommendedProductItemSerializer(serializers.Serializer):
    """
    Serializer representing an individual recommended flower product with justification.
    """
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    product_slug = serializers.CharField()
    product_description = serializers.CharField()
    product_image = serializers.CharField()
    category = serializers.CharField()
    flower_type = serializers.CharField()
    price = serializers.CharField()
    match_score = serializers.IntegerField()
    is_exact_match = serializers.BooleanField()
    recommendation_reason = serializers.CharField()


class RecommendationResponseSerializer(serializers.Serializer):
    """
    Full recommendation envelope response.
    """
    status = serializers.CharField()
    total_found = serializers.IntegerField()
    is_exact_match = serializers.BooleanField()
    summary_message = serializers.CharField()
    preferences_applied = serializers.DictField()
    recommendations = RecommendedProductItemSerializer(many=True)
