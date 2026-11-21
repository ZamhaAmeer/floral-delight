"""
Views for Floral Delight User Authentication.
Endpoints:
- Register
- Login
- Profile (View & Update)
- Change Password
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)


class RegisterView(APIView):
    """
    Customer Registration API
    POST /api/accounts/register/
    Permits any visitor to register with name, email, phone, and password.
    Returns the created user info along with initial JWT access and refresh tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate JWT token pair so newly registered users are logged in immediately
            refresh = RefreshToken.for_user(user)
            user_data = UserProfileSerializer(user).data
            return Response(
                {
                    "status": "success",
                    "message": "User registered successfully! Welcome to Floral Delight 🌸",
                    "user": user_data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "status": "error",
                "message": "Registration failed. Please check the provided information.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    """
    User Login API
    POST /api/accounts/login/
    Accepts email and password.
    Returns JWT access and refresh tokens + user basic information.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            tokens = serializer.validated_data["tokens"]
            user_data = UserProfileSerializer(user).data
            return Response(
                {
                    "status": "success",
                    "message": "Login successful. Welcome back!",
                    "user": user_data,
                    "tokens": tokens,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "Authentication failed.",
                "errors": serializer.errors,
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )


class UserProfileView(APIView):
    """
    User Profile API
    GET  /api/accounts/profile/  -> Retrieve current logged-in user profile
    PUT  /api/accounts/profile/  -> Full update of profile fields (full_name, phone_number)
    PATCH /api/accounts/profile/ -> Partial update of profile fields
    Requires valid Bearer token in Authorization header.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(
            {
                "status": "success",
                "user": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Profile updated successfully.",
                    "user": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "Profile update failed.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Profile updated successfully.",
                    "user": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "Profile update failed.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class ChangePasswordView(APIView):
    """
    Change Password API
    POST /api/accounts/change-password/
    Accepts old_password, new_password, and confirm_new_password.
    Requires authentication. Securely updates password and keeps old tokens invalid if rotated.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Password changed successfully. Please keep your new password safe.",
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "error",
                "message": "Password change failed.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
