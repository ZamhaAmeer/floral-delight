"""
Database models for Floral Delight Customer Reviews and Ratings System.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Product
from orders.models import Order


class Review(models.Model):
    """
    Customer review and rating for a flower product.
    Supports verified purchase tracking linked to completed orders and optional photo uploads.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="Customer who submitted the review."
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="Flower product being reviewed."
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
        help_text="Completed order through which product was purchased (verified purchase)."
    )
    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1, message="Rating must be at least 1 star."),
            MaxValueValidator(5, message="Rating cannot exceed 5 stars.")
        ],
        help_text="Rating score from 1 to 5 stars."
    )
    comment = models.TextField(
        help_text="Detailed customer feedback, fragrance, freshness, and arrangement review."
    )
    image = models.ImageField(
        upload_to="reviews/%Y/%m/",
        blank=True,
        null=True,
        help_text="Optional customer review photograph."
    )
    is_verified_purchase = models.BooleanField(
        default=True,
        help_text="Designates whether this review is backed by a delivered order."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when review was submitted."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when review was last updated."
    )

    class Meta:
        verbose_name = "Customer Review"
        verbose_name_plural = "Customer Reviews"
        ordering = ["-created_at"]
        # Prevent multiple reviews by the same customer for the exact same order & product
        unique_together = ("user", "product", "order")

    def __str__(self):
        return f"{self.rating}★ for {self.product.name} by {self.user.email}"
