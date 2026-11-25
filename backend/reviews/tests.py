"""
Automated Test Suite for Floral Delight Customer Reviews and Ratings System.
Tests:
- Submit review with rating (1-5) and comment for a delivered purchase
- Submit review with photo upload (validating media handling)
- Reject reviews for unpurchased or undelivered products
- Reject duplicate reviews for the same purchase
- Validate rating limits (reject < 1 or > 5)
- Public product reviews with average calculation, review count, and star breakdown
- Filter product reviews by rating (?rating=5)
- Customer personal reviews retrieval (/api/reviews/my-reviews/)
- Update own review (rating and comment)
- Delete own review
- Prevent unauthorized users from modifying/deleting another customer's review (403 Forbidden)
- Unauthenticated submission rejection (401 Unauthorized)
"""
import io
from decimal import Decimal
from PIL import Image
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from products.models import Category, Product
from orders.models import Order, OrderItem
from reviews.models import Review

User = get_user_model()


def generate_test_image(filename="review_photo.jpg"):
    """
    Generate a simple valid in-memory RGB JPEG image for upload testing.
    """
    file_obj = io.BytesIO()
    image = Image.new("RGB", (100, 100), color="pink")
    image.save(file_obj, format="JPEG")
    file_obj.seek(0)
    return SimpleUploadedFile(filename, file_obj.read(), content_type="image/jpeg")


class ReviewSystemTests(APITestCase):

    def setUp(self):
        # 1. Setup Category and Products
        self.category = Category.objects.create(name="Roses", slug="roses")
        self.rose_red = Product.objects.create(
            name="Classic Red Rose Bouquet",
            slug="rose-red",
            category=self.category,
            price=Decimal("4300.00"),
            image="Images/rose-red.jpg",
            flower_type="roses",
            is_available=True
        )
        self.rose_pink = Product.objects.create(
            name="Blush Pink Rose Bouquet",
            slug="rose-pink",
            category=self.category,
            price=Decimal("4400.00"),
            image="Images/rose-pink.jpg",
            flower_type="roses",
            is_available=True
        )

        # 2. Setup Users
        self.customer_a = User.objects.create_user(
            email="clara.oswald@example.com",
            full_name="Clara Oswald",
            password="ClaraPassword123!"
        )
        self.customer_b = User.objects.create_user(
            email="danny.pink@example.com",
            full_name="Danny Pink",
            password="DannyPassword123!"
        )

        # 3. Create a delivered order for Customer A containing rose_red
        self.delivered_order_a = Order.objects.create(
            user=self.customer_a,
            full_name="Clara Oswald",
            email="clara.oswald@example.com",
            phone_number="+94771112233",
            delivery_address="7 Coal Hill Road",
            subtotal=Decimal("4300.00"),
            delivery_fee=Decimal("450.00"),
            total_amount=Decimal("4750.00"),
            order_status="delivered",
            payment_status="paid"
        )
        OrderItem.objects.create(
            order=self.delivered_order_a,
            product=self.rose_red,
            product_name=self.rose_red.name,
            quantity=1,
            unit_price=self.rose_red.price,
            subtotal=self.rose_red.price
        )

        # 4. Create an undelivered ('pending') order for Customer A
        self.pending_order_a = Order.objects.create(
            user=self.customer_a,
            full_name="Clara Oswald",
            email="clara.oswald@example.com",
            phone_number="+94771112233",
            delivery_address="7 Coal Hill Road",
            subtotal=Decimal("4400.00"),
            total_amount=Decimal("4850.00"),
            order_status="pending"
        )
        OrderItem.objects.create(
            order=self.pending_order_a,
            product=self.rose_pink,
            product_name=self.rose_pink.name,
            quantity=1,
            unit_price=self.rose_pink.price,
            subtotal=self.rose_pink.price
        )

        # 5. URLs
        self.reviews_url = reverse("review_list_create")
        self.my_reviews_url = reverse("user_reviews")

    def test_01_unauthenticated_submission_rejected(self):
        """Unauthenticated requests to submit reviews must return 401."""
        payload = {
            "product_id": self.rose_red.id,
            "rating": 5,
            "comment": "Incredible velvet petals!"
        }
        res = self.client.post(self.reviews_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_submit_review_without_purchase_rejected(self):
        """Customer cannot review a product they never purchased/received."""
        self.client.force_authenticate(user=self.customer_b)  # Customer B has no orders

        payload = {
            "product_id": self.rose_red.id,
            "rating": 5,
            "comment": "Looks nice, though I never bought it."
        }
        res = self.client.post(self.reviews_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("purchased and received", str(res.data))

    def test_03_submit_review_with_undelivered_order_rejected(self):
        """Customer cannot review a product whose order is still pending."""
        self.client.force_authenticate(user=self.customer_a)

        payload = {
            "product_id": self.rose_pink.id,  # In pending order, not delivered
            "order_id": self.pending_order_a.id,
            "rating": 5,
            "comment": "Excited for it to arrive."
        }
        res = self.client.post(self.reviews_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only delivered orders can be reviewed", str(res.data))

    def test_04_submit_review_success_verified_purchase(self):
        """Customer with delivered order can submit a 5-star review."""
        self.client.force_authenticate(user=self.customer_a)

        payload = {
            "product_id": self.rose_red.id,
            "order_id": self.delivered_order_a.id,
            "rating": 5,
            "comment": "Exquisite velvety roses! The sweet natural fragrance lasted over a week."
        }
        res = self.client.post(self.reviews_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "success")

        review_data = res.data["review"]
        self.assertEqual(review_data["product_id"], self.rose_red.id)
        self.assertEqual(review_data["customer_name"], "Clara Oswald")
        self.assertEqual(review_data["rating"], 5)
        self.assertTrue(review_data["is_verified_purchase"])
        self.assertEqual(review_data["order_number"], self.delivered_order_a.order_number)

    def test_05_submit_review_with_image_upload(self):
        """Customer can upload a photo alongside their review."""
        self.client.force_authenticate(user=self.customer_a)

        image_file = generate_test_image("my_rose_vase.jpg")
        payload = {
            "product_id": self.rose_red.id,
            "rating": 4,
            "comment": "Beautiful presentation, looks lovely on my table.",
            "image": image_file
        }
        res = self.client.post(self.reviews_url, payload, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(res.data["review"]["image"])
        self.assertIn("reviews/", res.data["review"]["image"])

    def test_06_prevent_duplicate_review_for_same_purchase(self):
        """Duplicate review for the exact same delivered order is rejected."""
        self.client.force_authenticate(user=self.customer_a)

        # First review
        self.client.post(self.reviews_url, {
            "product_id": self.rose_red.id,
            "order_id": self.delivered_order_a.id,
            "rating": 5,
            "comment": "First review."
        }, format="json")

        # Second attempt
        res = self.client.post(self.reviews_url, {
            "product_id": self.rose_red.id,
            "order_id": self.delivered_order_a.id,
            "rating": 4,
            "comment": "Trying to review again."
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already submitted a review", str(res.data))

    def test_07_rating_range_validation(self):
        """Ratings below 1 or above 5 must be rejected."""
        self.client.force_authenticate(user=self.customer_a)

        # Rating = 0
        res_zero = self.client.post(self.reviews_url, {
            "product_id": self.rose_red.id,
            "rating": 0,
            "comment": "Zero stars"
        }, format="json")
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)

        # Rating = 6
        res_six = self.client.post(self.reviews_url, {
            "product_id": self.rose_red.id,
            "rating": 6,
            "comment": "Six stars"
        }, format="json")
        self.assertEqual(res_six.status_code, status.HTTP_400_BAD_REQUEST)

    def test_08_product_reviews_endpoint_and_aggregations(self):
        """Test GET /api/reviews/product/<id>/ returning average rating, count, and breakdown."""
        # Create delivered orders and reviews
        Review.objects.create(
            user=self.customer_a,
            product=self.rose_red,
            order=self.delivered_order_a,
            rating=5,
            comment="Perfection 5 stars!"
        )

        product_reviews_url = reverse("product_reviews", kwargs={"product_id": self.rose_red.id})
        res = self.client.get(product_reviews_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["product_id"], self.rose_red.id)
        self.assertEqual(res.data["average_rating"], 5.0)
        self.assertEqual(res.data["total_reviews"], 1)
        self.assertEqual(res.data["rating_breakdown"][5], 1)
        self.assertEqual(len(res.data["reviews"]), 1)

    def test_09_filter_reviews_by_rating(self):
        """Filter product reviews using query parameter ?rating=5."""
        Review.objects.create(
            user=self.customer_a,
            product=self.rose_red,
            order=self.delivered_order_a,
            rating=5,
            comment="Awesome 5-star flowers."
        )

        product_reviews_url = reverse("product_reviews", kwargs={"product_id": self.rose_red.id})

        # Filter by 5 stars -> 1 review
        res_5 = self.client.get(f"{product_reviews_url}?rating=5")
        self.assertEqual(len(res_5.data["reviews"]), 1)

        # Filter by 1 star -> 0 reviews
        res_1 = self.client.get(f"{product_reviews_url}?rating=1")
        self.assertEqual(len(res_1.data["reviews"]), 0)

    def test_10_view_customer_own_reviews(self):
        """Customer can retrieve all reviews they authored."""
        self.client.force_authenticate(user=self.customer_a)
        Review.objects.create(
            user=self.customer_a,
            product=self.rose_red,
            order=self.delivered_order_a,
            rating=5,
            comment="My private list test."
        )

        res = self.client.get(self.my_reviews_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["reviews"][0]["comment"], "My private list test.")

    def test_11_update_own_review(self):
        """Customer can update their own review."""
        self.client.force_authenticate(user=self.customer_a)
        review = Review.objects.create(
            user=self.customer_a,
            product=self.rose_red,
            order=self.delivered_order_a,
            rating=4,
            comment="Original text."
        )

        detail_url = reverse("review_detail", kwargs={"pk": review.id})
        update_payload = {
            "rating": 5,
            "comment": "Updated to 5 stars! Flowers bloomed even better on day 3."
        }
        res = self.client.patch(detail_url, update_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["review"]["rating"], 5)
        self.assertIn("day 3", res.data["review"]["comment"])

    def test_12_user_isolation_cannot_modify_others_review(self):
        """User B cannot update or delete User A's review (403 Forbidden)."""
        review = Review.objects.create(
            user=self.customer_a,
            product=self.rose_red,
            order=self.delivered_order_a,
            rating=5,
            comment="User A's review."
        )

        # Authenticate as User B
        self.client.force_authenticate(user=self.customer_b)
        detail_url = reverse("review_detail", kwargs={"pk": review.id})

        # Attempt PATCH
        res_patch = self.client.patch(detail_url, {"comment": "Hacked comment"}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

        # Attempt DELETE
        res_del = self.client.delete(detail_url)
        self.assertEqual(res_del.status_code, status.HTTP_403_FORBIDDEN)

        # Ensure review is still intact
        self.assertTrue(Review.objects.filter(id=review.id).exists())

    def test_13_delete_own_review(self):
        """Customer can delete their own review."""
        self.client.force_authenticate(user=self.customer_a)
        review = Review.objects.create(
            user=self.customer_a,
            product=self.rose_red,
            order=self.delivered_order_a,
            rating=5,
            comment="To be deleted."
        )

        detail_url = reverse("review_detail", kwargs={"pk": review.id})
        res = self.client.delete(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Review.objects.filter(id=review.id).exists())
