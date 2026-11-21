"""
URL Configuration for Accounts App
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    ChangePasswordView,
)

urlpatterns = [
    # Customer Registration & Login
    path("register/", RegisterView.as_view(), name="account_register"),
    path("login/", LoginView.as_view(), name="account_login"),

    # JWT Token Refresh & Verify
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # Authenticated User Profile
    path("profile/", UserProfileView.as_view(), name="account_profile"),
    path("change-password/", ChangePasswordView.as_view(), name="account_change_password"),
]
