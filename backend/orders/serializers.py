"""
Serializers for Order Management System.
Handles validation of products/custom bouquets, calculation of subtotals and fees,
and creation of immutable order snapshots inside atomic database transactions.
"""
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from products.models import Product
from bouquets.models import CustomBouquet
from .models import (
    Order,
    OrderItem,
    STANDARD_DELIVERY_FEE,
    FREE_DELIVERY_THRESHOLD,
    PAYMENT_METHOD_CHOICES,
)


class OrderItemInputSerializer(serializers.Serializer):
    """
    Validates item selection when placing an order.
    Customers can order a standard catalog Product OR a saved Custom Bouquet.
    """
    product_id = serializers.IntegerField(required=False, allow_null=True)
    custom_bouquet_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(required=True, min_value=1)

    def validate(self, attrs):
        product_id = attrs.get("product_id")
        bouquet_id = attrs.get("custom_bouquet_id")

        if not product_id and not bouquet_id:
            raise serializers.ValidationError("Each item must provide either a 'product_id' or a 'custom_bouquet_id'.")
        if product_id and bouquet_id:
            raise serializers.ValidationError("Cannot provide both 'product_id' and 'custom_bouquet_id' in the same item line.")

        request = self.context.get("request")

        # Validate standard product
        if product_id:
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID {product_id} does not exist.")
            if not product.is_available:
                raise serializers.ValidationError(f"Flower product '{product.name}' is currently unavailable.")
            attrs["_resolved_product"] = product
            attrs["_unit_price"] = product.price
            attrs["_name"] = product.name

        # Validate custom bouquet
        if bouquet_id:
            try:
                bouquet = CustomBouquet.objects.get(id=bouquet_id)
            except CustomBouquet.DoesNotExist:
                raise serializers.ValidationError(f"Custom bouquet with ID {bouquet_id} does not exist.")
            # Verify customer owns this custom bouquet
            if bouquet.user != request.user:
                raise serializers.ValidationError("You can only order custom bouquets designed in your own account.")
            if bouquet.total_price <= Decimal("0.00"):
                raise serializers.ValidationError(f"Custom bouquet '{bouquet.name}' has no flowers selected or Rs. 0 price.")
            attrs["_resolved_bouquet"] = bouquet
            attrs["_unit_price"] = bouquet.total_price
            attrs["_name"] = f"Custom Bouquet: {bouquet.name} ({bouquet.get_style_display()})"

        return attrs


class OrderItemDetailSerializer(serializers.ModelSerializer):
    """
    Snapshot detail of an item in an order.
    """
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_id",
            "custom_bouquet_id",
            "product_name",
            "product_image",
            "quantity",
            "unit_price",
            "subtotal",
        )
        read_only_fields = fields

    def get_product_image(self, obj):
        if obj.product:
            return obj.product.image
        return "Images/hero-bouquet.jpg"


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for placing, viewing, and managing orders.
    Enforces server-side price computation and atomic order persistence.
    """
    items = OrderItemDetailSerializer(many=True, read_only=True)
    order_items = OrderItemInputSerializer(many=True, write_only=True, required=True)
    order_status_display = serializers.CharField(source="get_order_status_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    can_cancel = serializers.BooleanField(source="can_be_cancelled", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "full_name",
            "email",
            "phone_number",
            "delivery_address",
            "city",
            "postal_code",
            "order_notes",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "order_status",
            "order_status_display",
            "can_cancel",
            "subtotal",
            "delivery_fee",
            "total_amount",
            "created_at",
            "updated_at",
            "items",
            "order_items",
        )
        read_only_fields = (
            "id",
            "order_number",
            "payment_status",
            "payment_status_display",
            "order_status",
            "order_status_display",
            "can_cancel",
            "subtotal",
            "delivery_fee",
            "total_amount",
            "created_at",
            "updated_at",
            "items",
        )
        extra_kwargs = {
            "full_name": {"required": False, "allow_blank": True},
            "email": {"required": False, "allow_blank": True},
            "phone_number": {"required": False, "allow_blank": True},
            "delivery_address": {"required": True},
        }

    def validate_order_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one product or bouquet is required to place an order.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop("order_items")
        request = self.context.get("request")
        user = request.user

        with transaction.atomic():
            # 1. Compute subtotal directly from database prices
            subtotal = Decimal("0.00")
            prepared_items = []
            for item in items_data:
                qty = item["quantity"]
                unit_price = item["_unit_price"]
                line_subtotal = unit_price * Decimal(qty)
                subtotal += line_subtotal
                prepared_items.append({
                    "product": item.get("_resolved_product"),
                    "custom_bouquet": item.get("_resolved_bouquet"),
                    "product_name": item["_name"],
                    "quantity": qty,
                    "unit_price": unit_price,
                    "subtotal": line_subtotal,
                })

            # 2. Compute delivery fee: Free over Rs. 10,000, else standard Rs. 450
            if subtotal >= FREE_DELIVERY_THRESHOLD:
                delivery_fee = Decimal("0.00")
            else:
                delivery_fee = STANDARD_DELIVERY_FEE

            total_amount = subtotal + delivery_fee

            # 3. Create Order (fallback to logged-in customer's details if not provided)
            full_name = validated_data.get("full_name") or user.full_name or "Valued Customer"
            email = validated_data.get("email") or user.email
            phone_number = validated_data.get("phone_number") or getattr(user, "phone_number", "") or ""

            order = Order.objects.create(
                user=user,
                full_name=full_name,
                email=email,
                phone_number=phone_number,
                delivery_address=validated_data["delivery_address"],
                city=validated_data.get("city", "Colombo"),
                postal_code=validated_data.get("postal_code", ""),
                order_notes=validated_data.get("order_notes", ""),
                payment_method=validated_data.get("payment_method", "cod"),
                payment_status="pending",
                order_status="pending",
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total_amount=total_amount,
            )

            # 4. Create OrderItem snapshots
            for item_info in prepared_items:
                OrderItem.objects.create(
                    order=order,
                    product=item_info["product"],
                    custom_bouquet=item_info["custom_bouquet"],
                    product_name=item_info["product_name"],
                    quantity=item_info["quantity"],
                    unit_price=item_info["unit_price"],
                    subtotal=item_info["subtotal"],
                )

        return order
