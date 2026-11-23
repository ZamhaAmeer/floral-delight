"""
Django Admin configuration for Floral Delight Orders.
"""
from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "custom_bouquet", "product_name", "quantity", "unit_price", "subtotal")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "full_name",
        "user",
        "total_amount",
        "payment_method",
        "payment_status",
        "order_status",
        "created_at",
    )
    list_filter = ("order_status", "payment_status", "payment_method", "city", "created_at")
    search_fields = ("order_number", "full_name", "email", "phone_number", "delivery_address")
    readonly_fields = ("order_number", "subtotal", "delivery_fee", "total_amount", "created_at", "updated_at")
    inlines = [OrderItemInline]
