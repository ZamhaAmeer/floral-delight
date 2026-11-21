"""
API Views for Floral Delight Smart Wishlist System.
Endpoints:
- GET    /api/wishlist/                     -> View logged-in user's wishlist
- POST   /api/wishlist/add/                 -> Add a product to the wishlist
- DELETE /api/wishlist/remove/<product_id>/ -> Remove a product from the wishlist
- DELETE /api/wishlist/clear/               -> Remove all items from the wishlist
- GET    /api/wishlist/check/<product_id>/  -> Check whether product is in wishlist
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from products.models import Product
from .models import Wishlist
from .serializers import WishlistItemSerializer, AddToWishlistSerializer


class WishlistView(APIView):
    """
    GET /api/wishlist/
    Retrieves all wishlist items for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related(
            "product",
            "product__category"
        )
        serializer = WishlistItemSerializer(items, many=True)
        return Response(
            {
                "status": "success",
                "count": items.count(),
                "wishlist": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AddToWishlistView(APIView):
    """
    POST /api/wishlist/add/
    Adds a flower product to the authenticated user's wishlist.
    Prevents duplicate entries.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddToWishlistSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "status": "error",
                    "message": "Invalid product ID.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        product_id = serializer.validated_data["product_id"]
        product = Product.objects.get(id=product_id)

        # Check if already in user's wishlist
        if Wishlist.objects.filter(user=request.user, product=product).exists():
            return Response(
                {
                    "status": "error",
                    "message": f"'{product.name}' is already in your wishlist.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create new wishlist entry
        wishlist_item = Wishlist.objects.create(user=request.user, product=product)
        item_data = WishlistItemSerializer(wishlist_item).data

        return Response(
            {
                "status": "success",
                "message": f"'{product.name}' added to your wishlist successfully! 🌸",
                "item": item_data,
            },
            status=status.HTTP_201_CREATED,
        )


class RemoveFromWishlistView(APIView):
    """
    DELETE /api/wishlist/remove/<product_id>/
    Removes a flower product from the authenticated user's wishlist.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        item = Wishlist.objects.filter(user=request.user, product_id=product_id).first()
        if not item:
            return Response(
                {
                    "status": "error",
                    "message": "Product is not in your wishlist.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        product_name = item.product.name
        item.delete()

        return Response(
            {
                "status": "success",
                "message": f"'{product_name}' removed from your wishlist successfully.",
            },
            status=status.HTTP_200_OK,
        )


class ClearWishlistView(APIView):
    """
    DELETE /api/wishlist/clear/
    Removes all wishlist items belonging strictly to the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user_items = Wishlist.objects.filter(user=request.user)
        deleted_count = user_items.count()
        user_items.delete()

        return Response(
            {
                "status": "success",
                "message": "Your wishlist has been cleared successfully.",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )


class CheckWishlistView(APIView):
    """
    GET /api/wishlist/check/<product_id>/
    Checks whether a specific product is already present in the authenticated user's wishlist.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        # Validate that product exists
        if not Product.objects.filter(id=product_id).exists():
            return Response(
                {
                    "status": "error",
                    "message": f"Product with ID {product_id} does not exist.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        is_saved = Wishlist.objects.filter(user=request.user, product_id=product_id).exists()
        return Response(
            {
                "status": "success",
                "product_id": int(product_id),
                "is_in_wishlist": is_saved,
            },
            status=status.HTTP_200_OK,
        )
