"""
Serializers for Customer Reviews and Ratings System.
Enforces verified purchase checks, rating ranges (1-5), and image validations.
"""
import os
from django.db.models import Avg, Count
from rest_framework import serializers
from products.models import Product
from orders.models import Order
from .models import Review

# Image upload limits
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]


def validate_review_image(image_file):
    """
    Validate review photo size and format.
    """
    if not image_file:
        return image_file

    if image_file.size > MAX_IMAGE_SIZE_BYTES:
        raise serializers.ValidationError("Image file size must not exceed 5 MB.")

    ext = os.path.splitext(image_file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise serializers.ValidationError(
            f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    return image_file


class ReviewSerializer(serializers.ModelSerializer):
    """
    Output serializer for viewing customer reviews.
    Excludes sensitive customer data while showing helpful social proof.
    """
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    customer_name = serializers.CharField(source="user.full_name", read_only=True)
    image_url = serializers.SerializerMethodField()
    order_number = serializers.CharField(source="order.order_number", read_only=True, default=None)

    class Meta:
        model = Review
        fields = (
            "id",
            "product_id",
            "product_name",
            "customer_name",
            "rating",
            "comment",
            "image",
            "image_url",
            "order_number",
            "is_verified_purchase",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Input serializer for submitting a new verified purchase review.
    Validates order delivery status, product containment, and duplicate prevention.
    """
    product_id = serializers.IntegerField(required=True)
    order_id = serializers.IntegerField(required=False, allow_null=True)
    rating = serializers.IntegerField(required=True, min_value=1, max_value=5)
    comment = serializers.CharField(required=True, min_length=3)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Review
        fields = ("product_id", "order_id", "rating", "comment", "image")

    def validate_image(self, value):
        return validate_review_image(value)

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user
        product_id = attrs.get("product_id")
        order_id = attrs.get("order_id")

        # 1. Validate Product exists
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": f"Product with ID {product_id} does not exist."})
        attrs["_product"] = product

        # 2. Verified Purchase Validation: Customer must have purchased and received this product
        if order_id:
            try:
                order = Order.objects.get(id=order_id, user=user)
            except Order.DoesNotExist:
                raise serializers.ValidationError({"order_id": f"Order #{order_id} not found in your account."})

            if order.order_status != "delivered":
                raise serializers.ValidationError(
                    {"order_id": f"Order {order.order_number} has status '{order.get_order_status_display()}'. Only delivered orders can be reviewed."}
                )

            # Check if order contains the product
            has_product = order.items.filter(product=product).exists()
            if not has_product:
                raise serializers.ValidationError(
                    {"order_id": f"Order {order.order_number} does not contain product '{product.name}'."}
                )
            attrs["_order"] = order
        else:
            # Auto-detect delivered order for this user and product
            order = Order.objects.filter(
                user=user,
                order_status="delivered",
                items__product=product
            ).first()

            if not order:
                raise serializers.ValidationError(
                    "Only customers who have purchased and received this product (delivered order) can submit a review."
                )
            attrs["_order"] = order

        # 3. Duplicate Prevention: Check if already reviewed for this purchase
        if Review.objects.filter(user=user, product=product, order=attrs["_order"]).exists():
            raise serializers.ValidationError(
                f"You have already submitted a review for '{product.name}' from order {attrs['_order'].order_number}."
            )

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        return Review.objects.create(
            user=request.user,
            product=validated_data["_product"],
            order=validated_data["_order"],
            rating=validated_data["rating"],
            comment=validated_data["comment"],
            image=validated_data.get("image"),
            is_verified_purchase=True,
        )


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating an existing review (rating, comment, photo).
    """
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
    comment = serializers.CharField(required=False, min_length=3)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Review
        fields = ("rating", "comment", "image")

    def validate_image(self, value):
        return validate_review_image(value)
