"""
URL Configuration for Reviews App.
"""
from django.urls import path
from .views import (
    ReviewListCreateView,
    ReviewDetailView,
    ProductReviewsView,
    UserReviewsView,
)

urlpatterns = [
    # Global reviews list and submit
    path("", ReviewListCreateView.as_view(), name="review_list_create"),

    # Authenticated user's personal reviews
    path("my-reviews/", UserReviewsView.as_view(), name="user_reviews"),

    # Product-specific reviews with rating breakdown
    path("product/<int:product_id>/", ProductReviewsView.as_view(), name="product_reviews"),

    # Specific review details, update, delete
    path("<int:pk>/", ReviewDetailView.as_view(), name="review_detail"),
]
