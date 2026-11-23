"""
API Views for Floral Delight Order Management System.
Endpoints:
- POST /api/orders/            -> Place a new order
- GET  /api/orders/            -> View authenticated customer's order history
- GET  /api/orders/<id>/       -> View details of a specific order
- POST /api/orders/<id>/cancel/ -> Cancel an eligible order
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer


class OrderListCreateView(APIView):
    """
    GET  /api/orders/ -> List all orders placed by the authenticated customer.
    POST /api/orders/ -> Place a new order with multiple flower products or custom bouquets.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related(
            "items",
            "items__product",
            "items__custom_bouquet"
        )
        serializer = OrderSerializer(orders, many=True)
        return Response(
            {
                "status": "success",
                "count": orders.count(),
                "orders": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = OrderSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            order = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": f"Order {order.order_number} placed successfully! 🌸",
                    "order": OrderSerializer(order).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "status": "error",
                "message": "Order placement failed. Please verify your delivery details and items.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class OrderDetailView(APIView):
    """
    GET /api/orders/<id>/ -> View detailed breakdown of a specific order.
    Customers can only access their own orders (staff members can view all).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            if request.user.is_staff:
                order = Order.objects.prefetch_related("items").get(pk=pk)
            else:
                order = Order.objects.prefetch_related("items").get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "message": f"Order with ID {pk} not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrderSerializer(order)
        return Response(
            {
                "status": "success",
                "order": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OrderCancelView(APIView):
    """
    POST /api/orders/<id>/cancel/
    Cancel an order if it is in an eligible status ('pending' or 'confirmed').
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            if request.user.is_staff:
                order = Order.objects.get(pk=pk)
            else:
                order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "message": f"Order with ID {pk} not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not order.can_be_cancelled:
            if order.order_status == "cancelled":
                return Response(
                    {
                        "status": "error",
                        "message": f"Order {order.order_number} is already cancelled.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {
                    "status": "error",
                    "message": (
                        f"Order {order.order_number} cannot be cancelled because it is currently "
                        f"'{order.get_order_status_display()}'. Please contact our boutique support for assistance."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.order_status = "cancelled"
        order.save(update_fields=["order_status", "updated_at"])

        return Response(
            {
                "status": "success",
                "message": f"Order {order.order_number} has been cancelled successfully.",
                "order": OrderSerializer(order).data,
            },
            status=status.HTTP_200_OK,
        )
