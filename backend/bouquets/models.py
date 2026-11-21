"""
Database models for Custom Bouquet Builder.
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from products.models import Product


BOUQUET_STYLE_CHOICES = [
    ("hand-tied", "Hand-Tied Bouquet"),
    ("flower-box", "Flower Box"),
    ("flower-basket", "Flower Basket"),
    ("premium", "Premium Bouquet"),
]


class CustomBouquet(models.Model):
    """
    Custom Bouquet crafted by a customer.
    Stores metadata (name, style, instructions) and the calculated total price.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="custom_bouquets",
        help_text="Customer who owns and designed this bouquet."
    )
    name = models.CharField(
        max_length=255,
        default="My Custom Bouquet",
        help_text="Custom name for this arrangement."
    )
    style = models.CharField(
        max_length=50,
        choices=BOUQUET_STYLE_CHOICES,
        default="hand-tied",
        help_text="Packaging/presentation style."
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total calculated price in LKR (auto-calculated from items)."
    )
    special_instructions = models.TextField(
        blank=True,
        null=True,
        help_text="Optional requests, notes, or card messages."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Date when bouquet was designed."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date when bouquet was last modified."
    )

    class Meta:
        verbose_name = "Custom Bouquet"
        verbose_name_plural = "Custom Bouquets"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.get_style_display()}) by {self.user.email}"

    def recalculate_total(self):
        """
        Recalculate total price strictly from attached items.
        """
        total = sum(item.subtotal for item in self.items.all())
        self.total_price = total
        self.save(update_fields=["total_price", "updated_at"])
        return self.total_price


class BouquetItem(models.Model):
    """
    Individual flower product entry inside a Custom Bouquet.
    Stores the quantity, snapshot of unit price from DB, and calculated subtotal.
    """
    bouquet = models.ForeignKey(
        CustomBouquet,
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Parent custom bouquet."
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="bouquet_items",
        help_text="Selected flower stem or bouquet component."
    )
    quantity = models.PositiveIntegerField(
        default=1,
        help_text="Quantity of this flower in the arrangement (must be > 0)."
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price per stem/item locked at creation time from Product table."
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Calculated subtotal (unit_price * quantity)."
    )

    class Meta:
        verbose_name = "Bouquet Item"
        verbose_name_plural = "Bouquet Items"
        unique_together = ("bouquet", "product")

    def save(self, *args, **kwargs):
        # Auto-compute subtotal
        self.subtotal = self.unit_price * Decimal(self.quantity)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.bouquet.name}"
