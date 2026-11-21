"""
Database model for Floral Delight Smart Wishlist.
"""
from django.db import models
from django.conf import settings
from products.models import Product


class Wishlist(models.Model):
    """
    Wishlist item connecting a registered User to a saved flower Product.
    Enforces uniqueness so a user cannot add the same product multiple times.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
        help_text="The customer who saved this item."
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
        help_text="The flower product saved to wishlist."
    )
    added_date = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when product was added to wishlist."
    )

    class Meta:
        # Prevent duplicate wishlist entries for the same user & product
        unique_together = ("user", "product")
        ordering = ["-added_date"]
        verbose_name = "Wishlist Item"
        verbose_name_plural = "Wishlist Items"

    def __str__(self):
        return f"{self.user.email} - {self.product.name}"
