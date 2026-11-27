"""
Serializers for Flower Products and Categories.
"""
from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description")


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "category_name",
            "category_slug",
            "price",
            "image",
            "description",
            "tagline",
            "flower_type",
            "color",
            "meaning",
            "season",
            "stem_length",
            "fragrance",
            "occasions",
            "is_available",
            "created_at",
        )
