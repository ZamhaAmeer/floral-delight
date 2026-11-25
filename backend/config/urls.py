"""
URL configuration for Floral Delight config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
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
    # Order Management Endpoints
    path('api/orders/', include('orders.urls')),
    # Customer Reviews & Ratings Endpoints
    path('api/reviews/', include('reviews.urls')),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
