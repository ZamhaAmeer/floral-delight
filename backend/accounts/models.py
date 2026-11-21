"""
Custom User Model for Floral Delight Boutique Florist.

We use a custom user model inheriting from AbstractBaseUser and PermissionsMixin
so that users log in with their email address instead of a username.
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """

    def create_user(self, email, full_name, password=None, **extra_fields):
        """
        Create and save a regular customer User with the given email, full name and password.
        """
        if not email:
            raise ValueError("An email address is required to register.")
        if not full_name:
            raise ValueError("Full name is required.")

        email = self.normalize_email(email).strip().lower()
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_staff", False)

        user = self.model(email=email, full_name=full_name, **extra_fields)
        # set_password hashes the password securely using PBKDF2 with SHA256
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """
        Create and save a superuser (admin) with the given email, full name and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Floral Delight Custom User Model.
    Supports email-based login, customer profile data, and staff/admin permissions.
    """
    email = models.EmailField(
        verbose_name="Email Address",
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Primary email address used for login."
    )
    full_name = models.CharField(
        verbose_name="Full Name",
        max_length=255,
        help_text="Customer or staff member's full name."
    )
    phone_number = models.CharField(
        verbose_name="Phone Number",
        max_length=20,
        blank=True,
        null=True,
        help_text="Optional contact phone number."
    )
    is_active = models.BooleanField(
        verbose_name="Active",
        default=True,
        help_text="Designates whether this user should be treated as active."
    )
    is_staff = models.BooleanField(
        verbose_name="Staff status",
        default=False,
        help_text="Designates whether the user can log into the Django admin site."
    )
    created_at = models.DateTimeField(
        verbose_name="Date Created",
        default=timezone.now,
        help_text="Timestamp when user registered."
    )
    updated_at = models.DateTimeField(
        verbose_name="Last Updated",
        auto_now=True,
        help_text="Timestamp when profile was last modified."
    )

    objects = UserManager()

    # The field used as the unique username identifier for login
    USERNAME_FIELD = "email"

    # Additional fields prompted when creating a superuser via 'createsuperuser'
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.email})"
