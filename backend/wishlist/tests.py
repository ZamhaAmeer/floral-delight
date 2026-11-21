"""
Automated Test Suite for Floral Delight Smart Wishlist System.
Tests:
- Access wishlist without authentication (401 Unauthorized)
- Add product to wishlist (201 Created)
- Retrieve wishlist items with required product fields (200 OK)
- Duplicate prevention (400 Bad Request when adding same product twice)
- Check whether product is in wishlist (200 OK, is_in_wishlist boolean)
- Remove single product from wishlist (200 OK and 404 when not found)
- Clear entire wishlist for user (200 OK)
- Privacy & Isolation: Verify User A cannot access or delete User B's wishlist items
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from products.models import Category, Product
from wishlist.models import Wishlist

User = get_user_model()


class WishlistSystemTests(APITestCase):

    def setUp(self):
        # 1. Create test categories & products
        self.category = Category.objects.create(name="Roses", slug="roses")
        self.product1 = Product.objects.create(
            name="Classic Red Rose Bouquet",
            slug="rose-red",
            category=self.category,
            price=4300.00,
            image="Images/rose-red.jpg",
            flower_type="roses"
        )
        self.product2 = Product.objects.create(
            name="Blush Pink Rose Bouquet",
            slug="rose-pink",
            category=self.category,
            price=4400.00,
            image="Images/rose-pink.jpg",
            flower_type="roses"
        )

        # 2. Create two distinct test users
        self.user_a = User.objects.create_user(
            email="usera@example.com",
            full_name="Alice Garden",
            password="AlicePassword123!"
        )
        self.user_b = User.objects.create_user(
            email="userb@example.com",
            full_name="Bob Bloom",
            password="BobPassword123!"
        )

        # 3. Setup Wishlist URLs
        self.wishlist_url = reverse("wishlist_list")
        self.add_url = reverse("wishlist_add")
        self.clear_url = reverse("wishlist_clear")

    def test_01_access_wishlist_without_auth_fails(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        response = self.client.get(self.wishlist_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response_add = self.client.post(self.add_url, {"product_id": self.product1.id})
        self.assertEqual(response_add.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_add_product_to_wishlist_success(self):
        """Authenticated user can add a product to their wishlist."""
        self.client.force_authenticate(user=self.user_a)

        payload = {"product_id": self.product1.id}
        response = self.client.post(self.add_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["item"]["product_id"], self.product1.id)
        self.assertEqual(response.data["item"]["product_name"], "Classic Red Rose Bouquet")
        self.assertEqual(response.data["item"]["category"], "Roses")
        self.assertEqual(float(response.data["item"]["price"]), 4300.00)
        self.assertIn("added_date", response.data["item"])

        # Confirm in PostgreSQL database
        self.assertTrue(Wishlist.objects.filter(user=self.user_a, product=self.product1).exists())

    def test_03_view_wishlist(self):
        """Authenticated user receives all required product fields."""
        self.client.force_authenticate(user=self.user_a)
        Wishlist.objects.create(user=self.user_a, product=self.product1)
        Wishlist.objects.create(user=self.user_a, product=self.product2)

        response = self.client.get(self.wishlist_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["count"], 2)
        items = response.data["wishlist"]
        self.assertEqual(len(items), 2)

        # Verify required product fields in response
        first_item = items[0]
        self.assertIn("product_id", first_item)
        self.assertIn("product_name", first_item)
        self.assertIn("product_image", first_item)
        self.assertIn("price", first_item)
        self.assertIn("category", first_item)
        self.assertIn("added_date", first_item)

    def test_04_duplicate_prevention(self):
        """Adding the same product twice to wishlist must be rejected."""
        self.client.force_authenticate(user=self.user_a)

        # First addition
        self.client.post(self.add_url, {"product_id": self.product1.id}, format="json")

        # Second addition attempt
        response = self.client.post(self.add_url, {"product_id": self.product1.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "error")
        self.assertIn("already in your wishlist", response.data["message"])

        # Count in DB must still be exactly 1
        self.assertEqual(Wishlist.objects.filter(user=self.user_a, product=self.product1).count(), 1)

    def test_05_check_product_in_wishlist(self):
        """Check whether a product is currently saved in wishlist."""
        self.client.force_authenticate(user=self.user_a)
        check_url = reverse("wishlist_check", kwargs={"product_id": self.product1.id})

        # Before adding: False
        res_before = self.client.get(check_url)
        self.assertEqual(res_before.status_code, status.HTTP_200_OK)
        self.assertFalse(res_before.data["is_in_wishlist"])

        # Add product
        Wishlist.objects.create(user=self.user_a, product=self.product1)

        # After adding: True
        res_after = self.client.get(check_url)
        self.assertEqual(res_after.status_code, status.HTTP_200_OK)
        self.assertTrue(res_after.data["is_in_wishlist"])

    def test_06_remove_product_from_wishlist(self):
        """Remove a single product from wishlist."""
        self.client.force_authenticate(user=self.user_a)
        Wishlist.objects.create(user=self.user_a, product=self.product1)

        remove_url = reverse("wishlist_remove", kwargs={"product_id": self.product1.id})
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verify removed from DB
        self.assertFalse(Wishlist.objects.filter(user=self.user_a, product=self.product1).exists())

        # Removing again returns 404
        response_404 = self.client.delete(remove_url)
        self.assertEqual(response_404.status_code, status.HTTP_404_NOT_FOUND)

    def test_07_clear_wishlist(self):
        """Clearing wishlist removes all items for current user."""
        self.client.force_authenticate(user=self.user_a)
        Wishlist.objects.create(user=self.user_a, product=self.product1)
        Wishlist.objects.create(user=self.user_a, product=self.product2)

        response = self.client.delete(self.clear_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["deleted_count"], 2)
        self.assertEqual(Wishlist.objects.filter(user=self.user_a).count(), 0)

    def test_08_user_isolation_privacy(self):
        """Verify User A cannot view, modify, or delete User B's wishlist items."""
        # Add item to User B's wishlist
        Wishlist.objects.create(user=self.user_b, product=self.product1)

        # Authenticate as User A
        self.client.force_authenticate(user=self.user_a)

        # 1. User A views wishlist -> must be empty
        response = self.client.get(self.wishlist_url)
        self.assertEqual(response.data["count"], 0)

        # 2. User A attempts to check User B's product -> False for User A
        check_url = reverse("wishlist_check", kwargs={"product_id": self.product1.id})
        check_res = self.client.get(check_url)
        self.assertFalse(check_res.data["is_in_wishlist"])

        # 3. User A attempts to remove product 1 -> 404 (not in User A's wishlist)
        remove_url = reverse("wishlist_remove", kwargs={"product_id": self.product1.id})
        remove_res = self.client.delete(remove_url)
        self.assertEqual(remove_res.status_code, status.HTTP_404_NOT_FOUND)

        # 4. User A clears wishlist -> User B's item is untouched
        self.client.delete(self.clear_url)
        self.assertTrue(Wishlist.objects.filter(user=self.user_b, product=self.product1).exists())
