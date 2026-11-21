"""
Admin registration for Custom Bouquets.
"""
from django.contrib import admin
from .models import CustomBouquet, BouquetItem


class BouquetItemInline(admin.TabularInline):
    model = BouquetItem
    extra = 0
    readonly_fields = ("unit_price", "subtotal")


@admin.register(CustomBouquet)
class CustomBouquetAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "style", "total_price", "created_at", "updated_at")
    list_filter = ("style", "created_at")
    search_fields = ("name", "user__email")
    readonly_fields = ("total_price", "created_at", "updated_at")
    inlines = [BouquetItemInline]
