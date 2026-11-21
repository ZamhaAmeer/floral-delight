"""
URL Configuration for Smart Wishlist App.
"""
from django.urls import path
from .views import (
    WishlistView,
    AddToWishlistView,
    RemoveFromWishlistView,
    ClearWishlistView,
    CheckWishlistView,
)

urlpatterns = [
    # GET: View authenticated user's wishlist
    path("", WishlistView.as_view(), name="wishlist_list"),

    # POST: Add product to wishlist
    path("add/", AddToWishlistView.as_view(), name="wishlist_add"),

    # DELETE: Remove specific product from wishlist
    path("remove/<int:product_id>/", RemoveFromWishlistView.as_view(), name="wishlist_remove"),

    # DELETE: Clear entire wishlist for user
    path("clear/", ClearWishlistView.as_view(), name="wishlist_clear"),

    # GET: Check if product is in wishlist
    path("check/<int:product_id>/", CheckWishlistView.as_view(), name="wishlist_check"),
]
