"""
Views for Products and Categories API.
"""
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryListView(generics.ListAPIView):
    """
    GET /api/products/categories/
    Public list of flower categories.
    """
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    Public list of flower products. Supports filtering by category, search keyword, and ordering.
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(is_available=True).select_related("category")
        category_param = self.request.query_params.get("category")
        if category_param and category_param != "all":
            queryset = queryset.filter(
                Q(category__slug=category_param) | Q(flower_type=category_param)
            )

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(meaning__icontains=search) |
                Q(color__icontains=search) |
                Q(flower_type__icontains=search) |
                Q(tagline__icontains=search)
            )

        ordering = self.request.query_params.get("ordering")
        if ordering:
            if ordering in ("price-low", "price"):
                queryset = queryset.order_by("price")
            elif ordering in ("price-high", "-price"):
                queryset = queryset.order_by("-price")
            elif ordering in ("name-asc", "name"):
                queryset = queryset.order_by("name")
            elif ordering == "name-desc":
                queryset = queryset.order_by("-name")
        else:
            queryset = queryset.order_by("id")

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/<pk>/
    Public single product details. Supports lookup by integer ID or slug.
    """
    queryset = Product.objects.all().select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        lookup = str(self.kwargs.get("pk"))
        if lookup.isdigit():
            return generics.get_object_or_404(Product, pk=int(lookup))
        return generics.get_object_or_404(Product, slug=lookup)

