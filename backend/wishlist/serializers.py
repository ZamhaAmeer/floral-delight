"""
Serializers for Smart Wishlist API.
"""
from rest_framework import serializers
from products.models import Product
from .models import Wishlist


class WishlistProductDetailSerializer(serializers.ModelSerializer):
    """
    Serializer providing clean product details for wishlist item view.
    Excludes sensitive user or backend details.
    """
    category = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = ("id", "name", "image", "price", "category")


class WishlistItemSerializer(serializers.ModelSerializer):
    """
    Serializer representing a wishlist entry with all requested product info:
    - Product ID
    - Product Name
    - Product Image
    - Price
    - Category
    - Date Added
    """
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.CharField(source="product.image", read_only=True)
    price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    category = serializers.CharField(source="product.category.name", read_only=True)

    class Meta:
        model = Wishlist
        fields = (
            "id",
            "product_id",
            "product_name",
            "product_image",
            "price",
            "category",
            "added_date",
        )
        read_only_fields = fields


class AddToWishlistSerializer(serializers.Serializer):
    """
    Serializer validating product_id when adding to wishlist.
    """
    product_id = serializers.IntegerField(required=True)

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Product with ID {value} does not exist.")
        return value
