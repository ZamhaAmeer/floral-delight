"""
Django Admin for Products and Categories.
"""
from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "flower_type", "is_available")
    list_filter = ("category", "flower_type", "is_available")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
