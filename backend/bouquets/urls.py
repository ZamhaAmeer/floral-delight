"""
URL Configuration for Custom Bouquet Builder App.
"""
from django.urls import path
from .views import BouquetListCreateView, BouquetDetailView

urlpatterns = [
    # List and Create Custom Bouquets
    path("", BouquetListCreateView.as_view(), name="bouquet_list_create"),
    # Retrieve, Update, and Delete single Custom Bouquet
    path("<int:pk>/", BouquetDetailView.as_view(), name="bouquet_detail"),
]
