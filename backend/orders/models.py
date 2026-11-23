"""
Database models for Floral Delight Order Management System.
"""
from decimal import Decimal
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from products.models import Product
from bouquets.models import CustomBouquet


ORDER_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("confirmed", "Confirmed"),
    ("preparing", "Preparing"),
    ("out_for_delivery", "Out for Delivery"),
    ("delivered", "Delivered"),
    ("cancelled", "Cancelled"),
]

PAYMENT_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("paid", "Paid"),
    ("failed", "Failed"),
    ("refunded", "Refunded"),
]

PAYMENT_METHOD_CHOICES = [
    ("cod", "Cash on Delivery"),
    ("card", "Credit/Debit Card (Online Payment Gateway - Coming Soon)"),
]

# Business rules for delivery
STANDARD_DELIVERY_FEE = Decimal("450.00")
FREE_DELIVERY_THRESHOLD = Decimal("10000.00")


def generate_order_number():
    """
    Generate unique, elegant order identifier: FD-YYYYMMDD-XXXX
    Example: FD-20261123-8B3F1
    """
    date_part = timezone.now().strftime("%Y%m%d")
    random_part = uuid.uuid4().hex[:6].upper()
    return f"FD-{date_part}-{random_part}"


class Order(models.Model):
    """
    Floral Delight Customer Order.
    Stores customer contact, delivery destination, pricing snapshot,
    payment status, and full delivery tracking state.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
        help_text="Customer who placed this order."
    )
    order_number = models.CharField(
        max_length=50,
        unique=True,
        default=generate_order_number,
        editable=False,
        db_index=True,
        help_text="Unique customer-facing order reference number."
    )
    full_name = models.CharField(
        max_length=255,
        help_text="Recipient or buyer full name."
    )
    email = models.EmailField(
        help_text="Order confirmation and notification email."
    )
    phone_number = models.CharField(
        max_length=25,
        help_text="Recipient phone number for delivery driver coordination."
    )
    delivery_address = models.TextField(
        help_text="Street address, apartment, or delivery destination."
    )
    city = models.CharField(
        max_length=100,
        default="Colombo",
        help_text="Delivery destination city."
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Optional postal or zip code."
    )
    order_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Gift message, card text, gate code, or florist instructions."
    )

    # Financial breakdown (calculated securely on backend)
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Sum of all ordered items before delivery fee."
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Delivery charge (Rs. 0 if subtotal >= Rs. 10,000, else Rs. 450)."
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total order amount to be collected (subtotal + delivery_fee)."
    )

    # Status tracking
    payment_method = models.CharField(
        max_length=50,
        choices=PAYMENT_METHOD_CHOICES,
        default="cod"
    )
    payment_status = models.CharField(
        max_length=30,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending"
    )
    order_status = models.CharField(
        max_length=30,
        choices=ORDER_STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when order was submitted."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of latest status change."
    )

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order_number} - {self.full_name} ({self.get_order_status_display()})"

    @property
    def can_be_cancelled(self):
        """
        An order can only be cancelled by customer when pending or confirmed.
        Once preparing or out for delivery, florist materials are harvested.
        """
        return self.order_status in ["pending", "confirmed"]


class OrderItem(models.Model):
    """
    Individual item snapshot in an order.
    Preserves exact historical product name and unit price even if catalog changes.
    Can reference either a catalog Product OR a CustomBouquet design.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Associated parent order."
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
        help_text="Catalog product reference (if ordered from standard catalog)."
    )
    custom_bouquet = models.ForeignKey(
        CustomBouquet,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
        help_text="Custom bouquet reference (if ordered from builder)."
    )
    product_name = models.CharField(
        max_length=255,
        help_text="Immutable snapshot of product or custom bouquet name."
    )
    quantity = models.PositiveIntegerField(
        default=1,
        help_text="Quantity ordered."
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Locked unit price snapshot from database at order time."
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Calculated line total (unit_price * quantity)."
    )

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * Decimal(self.quantity)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} ({self.order.order_number})"
