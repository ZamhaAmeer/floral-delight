"""
API Views for Floral Delight Customer Reviews System.
Endpoints:
- GET    /api/reviews/                    -> View all reviews (public, filter by rating & product)
- POST   /api/reviews/                    -> Submit a verified customer review
- GET    /api/reviews/<id>/               -> View specific review
- PUT/PATCH /api/reviews/<id>/            -> Update customer's own review
- DELETE /api/reviews/<id>/               -> Delete customer's own review
- GET    /api/reviews/product/<product_id>/ -> View product reviews with average rating & breakdown
- GET    /api/reviews/my-reviews/         -> View logged-in customer's reviews
"""
from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from products.models import Product
from .models import Review
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
)


class ReviewListCreateView(APIView):
    """
    GET  /api/reviews/ -> View all approved reviews (public, supports ?product= and ?rating=).
    POST /api/reviews/ -> Submit a verified purchase review (authenticated).
    """
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        queryset = Review.objects.select_related("product", "user", "order").all()

        # Query parameter filters
        product_id = request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        rating = request.query_params.get("rating")
        if rating:
            queryset = queryset.filter(rating=rating)

        serializer = ReviewSerializer(queryset, many=True, context={"request": request})
        return Response(
            {
                "status": "success",
                "count": queryset.count(),
                "reviews": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            review = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Thank you! Your verified purchase review has been submitted successfully. 🌸",
                    "review": ReviewSerializer(review, context={"request": request}).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "status": "error",
                "message": "Failed to submit review.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class ReviewDetailView(APIView):
    """
    GET    /api/reviews/<id>/ -> View specific review (public)
    PUT    /api/reviews/<id>/ -> Update review (only review author)
    PATCH  /api/reviews/<id>/ -> Partial update (only review author)
    DELETE /api/reviews/<id>/ -> Delete review (only review author)
    """
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return Review.objects.select_related("product", "user", "order").get(pk=pk)
        except Review.DoesNotExist:
            return None

    def get(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response(
                {"status": "error", "message": f"Review #{pk} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ReviewSerializer(review, context={"request": request})
        return Response({"status": "success", "review": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response(
                {"status": "error", "message": f"Review #{pk} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if review.user != request.user and not request.user.is_staff:
            return Response(
                {"status": "error", "message": "You can only update your own reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReviewUpdateSerializer(review, data=request.data, context={"request": request})
        if serializer.is_valid():
            updated_review = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Review updated successfully.",
                    "review": ReviewSerializer(updated_review, context={"request": request}).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"status": "error", "message": "Update failed.", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response(
                {"status": "error", "message": f"Review #{pk} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if review.user != request.user and not request.user.is_staff:
            return Response(
                {"status": "error", "message": "You can only update your own reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReviewUpdateSerializer(review, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            updated_review = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": "Review updated successfully.",
                    "review": ReviewSerializer(updated_review, context={"request": request}).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"status": "error", "message": "Update failed.", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response(
                {"status": "error", "message": f"Review #{pk} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if review.user != request.user and not request.user.is_staff:
            return Response(
                {"status": "error", "message": "You can only delete your own reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        review.delete()
        return Response(
            {"status": "success", "message": "Review deleted successfully."},
            status=status.HTTP_200_OK,
        )


class ProductReviewsView(APIView):
    """
    GET /api/reviews/product/<product_id>/
    Public view of reviews for a flower product.
    Includes:
    - Average star rating (e.g. 4.8 / 5.0)
    - Total reviews count
    - Star breakdown (number of 5, 4, 3, 2, 1-star reviews)
    - Filterable by ?rating=<1-5>
    """
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response(
                {"status": "error", "message": f"Product #{product_id} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        all_reviews = Review.objects.filter(product=product).select_related("user", "order")
        total_count = all_reviews.count()

        # Compute average rating
        avg_dict = all_reviews.aggregate(avg_score=Avg("rating"))
        avg_rating = round(avg_dict["avg_score"], 2) if avg_dict["avg_score"] else 0.0

        # Compute rating breakdown
        breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        counts_by_star = all_reviews.values("rating").annotate(count=Count("id"))
        for entry in counts_by_star:
            star = entry["rating"]
            if star in breakdown:
                breakdown[star] = entry["count"]

        # Support optional rating filter (?rating=5)
        filtered_reviews = all_reviews
        rating_filter = request.query_params.get("rating")
        if rating_filter:
            try:
                filtered_reviews = filtered_reviews.filter(rating=int(rating_filter))
            except ValueError:
                pass

        serializer = ReviewSerializer(filtered_reviews, many=True, context={"request": request})

        return Response(
            {
                "status": "success",
                "product_id": product.id,
                "product_name": product.name,
                "average_rating": avg_rating,
                "total_reviews": total_count,
                "rating_breakdown": breakdown,
                "reviews": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class UserReviewsView(APIView):
    """
    GET /api/reviews/my-reviews/
    View all reviews submitted by the authenticated customer.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_reviews = Review.objects.filter(user=request.user).select_related("product", "order")
        serializer = ReviewSerializer(user_reviews, many=True, context={"request": request})
        return Response(
            {
                "status": "success",
                "count": user_reviews.count(),
                "reviews": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
