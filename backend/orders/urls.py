"""
URL Configuration for Orders App.
"""
from django.urls import path
from .views import OrderListCreateView, OrderDetailView, OrderCancelView

urlpatterns = [
    # List all user's orders & place a new order
    path("", OrderListCreateView.as_view(), name="order_list_create"),

    # Retrieve single order details
    path("<int:pk>/", OrderDetailView.as_view(), name="order_detail"),

    # Cancel eligible order
    path("<int:pk>/cancel/", OrderCancelView.as_view(), name="order_cancel"),
]
