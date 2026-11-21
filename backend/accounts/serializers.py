"""
Serializers for Floral Delight User Authentication.
Handles validation, password hashing, JWT generation, and profile management.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for customer registration.
    Validates email uniqueness, password confirmation, and hashes password securely.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        help_text="Password must be at least 8 characters long."
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        help_text="Must match password exactly."
    )

    class Meta:
        model = User
        fields = ("id", "full_name", "email", "phone_number", "password", "confirm_password")
        extra_kwargs = {
            "full_name": {"required": True},
            "email": {"required": True},
            "phone_number": {"required": False, "allow_blank": True},
        }

    def validate_email(self, value):
        """
        Check whether the email address is already registered (case-insensitive).
        """
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized_email

    def validate(self, attrs):
        """
        Check that password and confirm_password match and meet standard security rules.
        """
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Run Django's standard password validators (length, common passwords, etc.)
        validate_password(password)

        return attrs

    def create(self, validated_data):
        """
        Create customer user with securely hashed password.
        """
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login with email and password.
    Validates credentials and generates JWT access/refresh token pair.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"}
    )

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This user account is inactive. Please contact support.")

        # Generate JWT tokens for the authenticated user
        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer to view and update customer profile details.
    Email and ID are read-only to preserve identity integrity.
    """
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "phone_number", "is_staff", "created_at", "updated_at")
        read_only_fields = ("id", "email", "is_staff", "created_at", "updated_at")


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password securely while logged in.
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"}
    )
    confirm_new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"}
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        new_password = attrs.get("new_password")
        confirm_new_password = attrs.get("confirm_new_password")
        old_password = attrs.get("old_password")

        if new_password != confirm_new_password:
            raise serializers.ValidationError({"confirm_new_password": "New passwords do not match."})

        if new_password == old_password:
            raise serializers.ValidationError({"new_password": "New password cannot be the same as your old password."})

        user = self.context["request"].user
        validate_password(new_password, user)

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save()
        return user
