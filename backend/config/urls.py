"""
URL configuration for Floral Delight config project.
"""
from django.contrib import admin
from django.urls import path, include
from .views import api_health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    # Initial Test API endpoint
    path('api/health/', api_health_check, name='api_health_check'),
    # Accounts & Authentication Endpoints
    path('api/accounts/', include('accounts.urls')),
    # Flower Products & Categories
    path('api/products/', include('products.urls')),
    # Smart Wishlist Endpoints
    path('api/wishlist/', include('wishlist.urls')),
    # Custom Bouquet Builder Endpoints
    path('api/bouquets/', include('bouquets.urls')),
]
