"""
Database models for Floral Products and Botanical Categories.
"""
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """
    Product Category (e.g., Roses, Tulips, Orchids, Lilies, Romance, Celebrations).
    """
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Flower Bouquet or Stem Product.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.CharField(
        max_length=500,
        default="Images/hero-bouquet.jpg",
        help_text="Relative image path (e.g., Images/rose-red.jpg) or image URL."
    )
    description = models.TextField(blank=True, null=True)
    tagline = models.CharField(max_length=255, blank=True, null=True)
    flower_type = models.CharField(max_length=100, blank=True, null=True)
    color = models.CharField(max_length=120, blank=True, null=True)
    meaning = models.TextField(blank=True, null=True)
    season = models.CharField(max_length=120, blank=True, null=True)
    stem_length = models.CharField(max_length=80, blank=True, null=True)
    fragrance = models.CharField(max_length=120, blank=True, null=True)
    occasions = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
