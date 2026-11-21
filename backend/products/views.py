"""
Views for Products and Categories API.
"""
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryListView(generics.ListAPIView):
    """
    GET /api/products/categories/
    Public list of flower categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    Public list of flower products. Supports filtering by category query parameter.
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(is_available=True).select_related("category")
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/<pk>/
    Public single product details.
    """
    queryset = Product.objects.all().select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
