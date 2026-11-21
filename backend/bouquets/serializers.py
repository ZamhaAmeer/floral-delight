"""
Serializers for Custom Bouquet Builder System.
Enforces backend pricing calculation, database transactions, and quantity validation.
"""
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from products.models import Product
from .models import CustomBouquet, BouquetItem, BOUQUET_STYLE_CHOICES


class BouquetItemInputSerializer(serializers.Serializer):
    """
    Input serializer for selecting flower items and quantities.
    Validates product availability and quantity constraints.
    """
    product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError(f"Product with ID {value} does not exist.")

        if not product.is_available:
            raise serializers.ValidationError(f"Flower '{product.name}' is currently unavailable.")

        return value


class BouquetItemDetailSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for items within a custom bouquet response.
    """
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.CharField(source="product.image", read_only=True)
    flower_type = serializers.CharField(source="product.flower_type", read_only=True)

    class Meta:
        model = BouquetItem
        fields = (
            "id",
            "product_id",
            "product_name",
            "product_image",
            "flower_type",
            "quantity",
            "unit_price",
            "subtotal",
        )
        read_only_fields = fields


class CustomBouquetSerializer(serializers.ModelSerializer):
    """
    Full serializer for CustomBouquet.
    Handles nested creation and atomic updates with server-side price calculation.
    """
    items = BouquetItemDetailSerializer(many=True, read_only=True)
    selected_flowers = BouquetItemInputSerializer(many=True, write_only=True, required=False)
    style_display = serializers.CharField(source="get_style_display", read_only=True)

    class Meta:
        model = CustomBouquet
        fields = (
            "id",
            "name",
            "style",
            "style_display",
            "total_price",
            "special_instructions",
            "created_at",
            "updated_at",
            "items",
            "selected_flowers",
        )
        read_only_fields = ("id", "total_price", "created_at", "updated_at", "style_display")

    def validate_selected_flowers(self, value):
        if not value:
            raise serializers.ValidationError("At least one flower product must be selected.")

        # Ensure no duplicate product_ids in the same request payload
        seen_products = set()
        for item in value:
            p_id = item["product_id"]
            if p_id in seen_products:
                raise serializers.ValidationError(
                    f"Product ID {p_id} appears multiple times in selected flowers. Combine quantities into a single entry."
                )
            seen_products.add(p_id)

        return value

    def create(self, validated_data):
        selected_flowers = validated_data.pop("selected_flowers", [])
        if not selected_flowers:
            raise serializers.ValidationError({"selected_flowers": "At least one flower item is required to create a bouquet."})

        request = self.context.get("request")
        user = request.user

        # Execute atomically to ensure either entire bouquet + items are created or rolled back
        with transaction.atomic():
            bouquet = CustomBouquet.objects.create(
                user=user,
                name=validated_data.get("name", "My Custom Bouquet"),
                style=validated_data.get("style", "hand-tied"),
                special_instructions=validated_data.get("special_instructions", ""),
                total_price=Decimal("0.00")
            )

            total = Decimal("0.00")
            for item_data in selected_flowers:
                product = Product.objects.get(id=item_data["product_id"])
                qty = item_data["quantity"]
                # NEVER trust frontend prices: retrieve live price directly from database
                unit_price = product.price
                subtotal = unit_price * Decimal(qty)
                total += subtotal

                BouquetItem.objects.create(
                    bouquet=bouquet,
                    product=product,
                    quantity=qty,
                    unit_price=unit_price,
                    subtotal=subtotal
                )

            bouquet.total_price = total
            bouquet.save(update_fields=["total_price"])

        return bouquet

    def update(self, instance, validated_data):
        selected_flowers = validated_data.pop("selected_flowers", None)

        with transaction.atomic():
            # Update general bouquet fields
            instance.name = validated_data.get("name", instance.name)
            instance.style = validated_data.get("style", instance.style)
            if "special_instructions" in validated_data:
                instance.special_instructions = validated_data["special_instructions"]

            # If flower selection is updated, replace items and recalculate
            if selected_flowers is not None:
                instance.items.all().delete()
                total = Decimal("0.00")
                for item_data in selected_flowers:
                    product = Product.objects.get(id=item_data["product_id"])
                    qty = item_data["quantity"]
                    unit_price = product.price
                    subtotal = unit_price * Decimal(qty)
                    total += subtotal

                    BouquetItem.objects.create(
                        bouquet=instance,
                        product=product,
                        quantity=qty,
                        unit_price=unit_price,
                        subtotal=subtotal
                    )
                instance.total_price = total

            instance.save()

        return instance
