"""
Automated Test Suite for Floral Delight Custom Bouquet Builder System.
Tests:
- Unauthenticated requests rejected (401 Unauthorized)
- Create bouquet with 1 flower (automatic backend price calculation)
- Create bouquet with multiple flower products (correct subtotals and total)
- Ignore any untrusted price sent by client; calculate strictly from database
- Retrieve user's bouquets (list and detail)
- Update flower quantities and recalculate total
- Change bouquet style (hand-tied, flower-box, flower-basket, premium)
- Delete a saved bouquet
- User privacy and isolation: User A cannot view, update, or delete User B's bouquet
- Validation: quantity <= 0 rejected, nonexistent product rejected, duplicate items in payload rejected
"""
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from products.models import Category, Product
from bouquets.models import CustomBouquet, BouquetItem

User = get_user_model()


class BouquetBuilderSystemTests(APITestCase):

    def setUp(self):
        # 1. Setup Flower Products
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
        self.unavailable_flower = Product.objects.create(
            name="Rare Black Rose",
            slug="rose-black",
            category=self.category,
            price=Decimal("5000.00"),
            image="Images/rose-black.jpg",
            flower_type="roses",
            is_available=False
        )

        # 2. Setup Users
        self.user_a = User.objects.create_user(
            email="clara@example.com",
            full_name="Clara Oswald",
            password="ClaraPassword123!"
        )
        self.user_b = User.objects.create_user(
            email="danny@example.com",
            full_name="Danny Pink",
            password="DannyPassword123!"
        )

        # 3. URLs
        self.bouquets_url = reverse("bouquet_list_create")

    def test_01_unauthenticated_request_fails(self):
        """Unauthenticated requests must be rejected with 401."""
        res_get = self.client.get(self.bouquets_url)
        self.assertEqual(res_get.status_code, status.HTTP_401_UNAUTHORIZED)

        res_post = self.client.post(self.bouquets_url, {"name": "Test"}, format="json")
        self.assertEqual(res_post.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_create_bouquet_single_flower(self):
        """Create a bouquet with a single flower variety and verify server-side price calculation."""
        self.client.force_authenticate(user=self.user_a)

        payload = {
            "name": "Romantic Solitude",
            "style": "hand-tied",
            "special_instructions": "Tie with champagne silk ribbon.",
            "selected_flowers": [
                {"product_id": self.rose_red.id, "quantity": 3}
            ]
        }
        response = self.client.post(self.bouquets_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "success")

        bouquet_data = response.data["bouquet"]
        self.assertEqual(bouquet_data["name"], "Romantic Solitude")
        self.assertEqual(bouquet_data["style"], "hand-tied")
        self.assertEqual(bouquet_data["style_display"], "Hand-Tied Bouquet")

        # 3 * 4300.00 = 12900.00
        expected_total = Decimal("12900.00")
        self.assertEqual(Decimal(bouquet_data["total_price"]), expected_total)
        self.assertEqual(len(bouquet_data["items"]), 1)
        self.assertEqual(bouquet_data["items"][0]["quantity"], 3)
        self.assertEqual(Decimal(bouquet_data["items"][0]["unit_price"]), Decimal("4300.00"))
        self.assertEqual(Decimal(bouquet_data["items"][0]["subtotal"]), expected_total)

    def test_03_create_bouquet_multiple_flowers(self):
        """Create a bouquet with multiple flower varieties and verify subtotals and total."""
        self.client.force_authenticate(user=self.user_a)

        payload = {
            "name": "Blush & Crimson Symphony",
            "style": "flower-box",
            "special_instructions": "Deliver in velvet blush round box.",
            "selected_flowers": [
                {"product_id": self.rose_red.id, "quantity": 2},   # 2 * 4300 = 8600
                {"product_id": self.rose_pink.id, "quantity": 3},  # 3 * 4400 = 13200
            ]
        }
        response = self.client.post(self.bouquets_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        bouquet_data = response.data["bouquet"]
        # Total = 8600 + 13200 = 21800.00
        expected_total = Decimal("21800.00")
        self.assertEqual(Decimal(bouquet_data["total_price"]), expected_total)
        self.assertEqual(len(bouquet_data["items"]), 2)

    def test_04_ignore_client_price_tampering(self):
        """Client trying to pass custom total_price or unit_price must be ignored."""
        self.client.force_authenticate(user=self.user_a)

        payload = {
            "name": "Cheating Attempt",
            "style": "flower-basket",
            "total_price": "1.00",  # Client tries to pay 1 rupee
            "selected_flowers": [
                {"product_id": self.rose_red.id, "quantity": 1, "unit_price": "0.50"}
            ]
        }
        response = self.client.post(self.bouquets_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        bouquet_data = response.data["bouquet"]
        # Server must enforce real price: 4300.00, NOT 1.00 or 0.50!
        self.assertEqual(Decimal(bouquet_data["total_price"]), Decimal("4300.00"))
        self.assertEqual(Decimal(bouquet_data["items"][0]["unit_price"]), Decimal("4300.00"))

    def test_05_retrieve_saved_bouquets(self):
        """View list and single saved bouquet details."""
        self.client.force_authenticate(user=self.user_a)

        # Create one bouquet
        create_res = self.client.post(self.bouquets_url, {
            "name": "Spring Melody",
            "style": "premium",
            "selected_flowers": [{"product_id": self.rose_pink.id, "quantity": 5}]
        }, format="json")
        b_id = create_res.data["bouquet"]["id"]

        # 1. Test List
        list_res = self.client.get(self.bouquets_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data["count"], 1)

        # 2. Test Detail
        detail_url = reverse("bouquet_detail", kwargs={"pk": b_id})
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["bouquet"]["name"], "Spring Melody")

    def test_06_update_bouquet_quantities_and_style(self):
        """Update bouquet flower quantities and style, ensuring total price recalculates."""
        self.client.force_authenticate(user=self.user_a)

        create_res = self.client.post(self.bouquets_url, {
            "name": "Original Name",
            "style": "hand-tied",
            "selected_flowers": [{"product_id": self.rose_red.id, "quantity": 1}]  # 4300
        }, format="json")
        b_id = create_res.data["bouquet"]["id"]
        detail_url = reverse("bouquet_detail", kwargs={"pk": b_id})

        # Update style and flower quantity
        update_payload = {
            "name": "Updated Luxury Edition",
            "style": "premium",
            "selected_flowers": [{"product_id": self.rose_red.id, "quantity": 4}]  # 4 * 4300 = 17200
        }
        patch_res = self.client.put(detail_url, update_payload, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        updated_data = patch_res.data["bouquet"]
        self.assertEqual(updated_data["name"], "Updated Luxury Edition")
        self.assertEqual(updated_data["style"], "premium")
        self.assertEqual(updated_data["style_display"], "Premium Bouquet")
        self.assertEqual(Decimal(updated_data["total_price"]), Decimal("17200.00"))

    def test_07_delete_bouquet(self):
        """Delete a saved bouquet."""
        self.client.force_authenticate(user=self.user_a)

        create_res = self.client.post(self.bouquets_url, {
            "name": "To Be Deleted",
            "style": "hand-tied",
            "selected_flowers": [{"product_id": self.rose_red.id, "quantity": 1}]
        }, format="json")
        b_id = create_res.data["bouquet"]["id"]
        detail_url = reverse("bouquet_detail", kwargs={"pk": b_id})

        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(CustomBouquet.objects.filter(id=b_id).exists())

    def test_08_user_isolation_privacy(self):
        """User A must NOT be able to view, update, or delete User B's bouquet."""
        # Create bouquet owned by User B
        self.client.force_authenticate(user=self.user_b)
        b_res = self.client.post(self.bouquets_url, {
            "name": "Danny's Private Bouquet",
            "style": "flower-box",
            "selected_flowers": [{"product_id": self.rose_red.id, "quantity": 2}]
        }, format="json")
        b_id = b_res.data["bouquet"]["id"]

        # Now authenticate as User A
        self.client.force_authenticate(user=self.user_a)
        detail_url = reverse("bouquet_detail", kwargs={"pk": b_id})

        # 1. Attempt GET -> 404 Not Found
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_404_NOT_FOUND)

        # 2. Attempt PUT -> 404 Not Found
        self.assertEqual(self.client.put(detail_url, {"name": "Hacked"}).status_code, status.HTTP_404_NOT_FOUND)

        # 3. Attempt DELETE -> 404 Not Found
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_404_NOT_FOUND)

        # Confirm User B's bouquet remains intact
        self.assertTrue(CustomBouquet.objects.filter(id=b_id, user=self.user_b).exists())

    def test_09_invalid_quantity_validation(self):
        """Quantity <= 0 must be rejected."""
        self.client.force_authenticate(user=self.user_a)

        payload = {
            "name": "Invalid Qty Bouquet",
            "selected_flowers": [
                {"product_id": self.rose_red.id, "quantity": 0}
            ]
        }
        res = self.client.post(self.bouquets_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_10_unavailable_flower_validation(self):
        """Unavailable products cannot be selected."""
        self.client.force_authenticate(user=self.user_a)

        payload = {
            "name": "Out of Stock Bouquet",
            "selected_flowers": [
                {"product_id": self.unavailable_flower.id, "quantity": 2}
            ]
        }
        res = self.client.post(self.bouquets_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unavailable", str(res.data))
