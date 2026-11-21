"""
Django Admin registration for Floral Delight custom User model.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom UserAdmin interface for viewing and managing users in /admin/.
    """
    list_display = ("email", "full_name", "phone_number", "is_staff", "is_active", "created_at")
    list_filter = ("is_staff", "is_active", "created_at")
    fieldsets = (
        ("Login Credentials", {"fields": ("email", "password")}),
        ("Personal Information", {"fields": ("full_name", "phone_number")}),
        ("Permissions & Roles", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at", "last_login")
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password", "phone_number", "is_staff", "is_active"),
        }),
    )
    search_fields = ("email", "full_name", "phone_number")
    ordering = ("-created_at",)
