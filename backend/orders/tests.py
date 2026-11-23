"""
Automated Test Suite for Floral Delight Order Management System.
Tests:
- Placing an order with a single catalog product
- Placing an order with multiple catalog products
- Placing an order with a custom bouquet design
- Server-side price calculation & delivery fee rules (Rs. 450 standard / Rs. 0 above Rs. 10,000)
- Price tampering protection (client prices ignored, locked DB snapshot used)
- View order history and order detail
- Cancel eligible order (pending status)
- Ineligible order cancellation (preparing/out_for_delivery/delivered rejected)
- User isolation: User A cannot view or cancel User B's order
- Validation: quantity <= 0, unavailable product, missing address, another user's bouquet rejected
- Unauthenticated access rejection (401 Unauthorized)
"""
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from products.models import Category, Product
from bouquets.models import CustomBouquet, BouquetItem
from orders.models import Order, OrderItem

User = get_user_model()


class OrderSystemTests(APITestCase):

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
        self.customer_a = User.objects.create_user(
            email="amelia.pond@example.com",
            full_name="Amelia Pond",
            phone_number="+94771112233",
            password="AmeliaSecretPassword123!"
        )
        self.customer_b = User.objects.create_user(
            email="rory.williams@example.com",
            full_name="Rory Williams",
            phone_number="+94772223344",
            password="RorySecretPassword123!"
        )

        # 3. Setup Custom Bouquet for Customer A
        self.custom_bouquet_a = CustomBouquet.objects.create(
            user=self.customer_a,
            name="Amelia's Sunset Dream",
            style="flower-box",
            total_price=Decimal("8700.00")
        )
        BouquetItem.objects.create(
            bouquet=self.custom_bouquet_a,
            product=self.rose_red,
            quantity=1,
            unit_price=Decimal("4300.00"),
            subtotal=Decimal("4300.00")
        )
        BouquetItem.objects.create(
            bouquet=self.custom_bouquet_a,
            product=self.rose_pink,
            quantity=1,
            unit_price=Decimal("4400.00"),
            subtotal=Decimal("4400.00")
        )

        # 4. URLs
        self.orders_url = reverse("order_list_create")

    def test_01_unauthenticated_request_fails(self):
        """Unauthenticated requests must be rejected with 401."""
        response = self.client.get(self.orders_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response_post = self.client.post(self.orders_url, {"delivery_address": "Test"})
        self.assertEqual(response_post.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_place_order_single_product_standard_delivery(self):
        """Place order with 1 product under Rs. 10,000 threshold (incurs Rs. 450 delivery fee)."""
        self.client.force_authenticate(user=self.customer_a)

        payload = {
            "full_name": "Amelia Pond",
            "email": "amelia.pond@example.com",
            "phone_number": "+94771112233",
            "delivery_address": "12 Flower Road, Colombo 07",
            "city": "Colombo",
            "postal_code": "00700",
            "order_notes": "Please include a birthday note card.",
            "payment_method": "cod",
            "order_items": [
                {"product_id": self.rose_red.id, "quantity": 1}
            ]
        }
        response = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "success")

        order_data = response.data["order"]
        self.assertTrue(order_data["order_number"].startswith("FD-"))
        self.assertEqual(order_data["full_name"], "Amelia Pond")
        self.assertEqual(order_data["payment_method"], "cod")
        self.assertEqual(order_data["payment_method_display"], "Cash on Delivery")
        self.assertEqual(order_data["order_status"], "pending")
        self.assertEqual(order_data["payment_status"], "pending")

        # 1 * 4300.00 = 4300.00 subtotal + 450.00 delivery fee = 4750.00 total
        self.assertEqual(Decimal(order_data["subtotal"]), Decimal("4300.00"))
        self.assertEqual(Decimal(order_data["delivery_fee"]), Decimal("450.00"))
        self.assertEqual(Decimal(order_data["total_amount"]), Decimal("4750.00"))

        # Verify items snapshot
        self.assertEqual(len(order_data["items"]), 1)
        item = order_data["items"][0]
        self.assertEqual(item["product_name"], "Classic Red Rose Bouquet")
        self.assertEqual(Decimal(item["unit_price"]), Decimal("4300.00"))
        self.assertEqual(Decimal(item["subtotal"]), Decimal("4300.00"))

    def test_03_place_order_multiple_products_free_delivery(self):
        """Place order with subtotal >= Rs. 10,000 to receive free delivery (delivery_fee = 0.00)."""
        self.client.force_authenticate(user=self.customer_a)

        # 2 * 4300 = 8600, 1 * 4400 = 4400 -> subtotal = 13000.00 >= 10000.00
        payload = {
            "delivery_address": "88 Galle Road, Kollupitiya",
            "city": "Colombo",
            "payment_method": "cod",
            "order_items": [
                {"product_id": self.rose_red.id, "quantity": 2},
                {"product_id": self.rose_pink.id, "quantity": 1},
            ]
        }
        response = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_data = response.data["order"]
        self.assertEqual(Decimal(order_data["subtotal"]), Decimal("13000.00"))
        self.assertEqual(Decimal(order_data["delivery_fee"]), Decimal("0.00"))
        self.assertEqual(Decimal(order_data["total_amount"]), Decimal("13000.00"))
        self.assertEqual(len(order_data["items"]), 2)

    def test_04_place_order_with_custom_bouquet(self):
        """Customers can order their saved custom bouquets."""
        self.client.force_authenticate(user=self.customer_a)

        payload = {
            "delivery_address": "15 Rosmead Place",
            "city": "Colombo",
            "order_items": [
                {"custom_bouquet_id": self.custom_bouquet_a.id, "quantity": 1}
            ]
        }
        response = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_data = response.data["order"]
        # Bouquet price is 8700.00 + 450.00 delivery fee = 9150.00
        self.assertEqual(Decimal(order_data["subtotal"]), Decimal("8700.00"))
        self.assertEqual(Decimal(order_data["delivery_fee"]), Decimal("450.00"))
        self.assertEqual(Decimal(order_data["total_amount"]), Decimal("9150.00"))

        item = order_data["items"][0]
        self.assertIn("Custom Bouquet: Amelia's Sunset Dream", item["product_name"])
        self.assertEqual(item["custom_bouquet_id"], self.custom_bouquet_a.id)

    def test_05_ignore_client_price_tampering(self):
        """Backend must never trust prices submitted by client in payload."""
        self.client.force_authenticate(user=self.customer_a)

        payload = {
            "delivery_address": "10 Fraud Lane",
            "subtotal": "5.00",
            "delivery_fee": "0.00",
            "total_amount": "5.00",
            "order_items": [
                {"product_id": self.rose_red.id, "quantity": 1, "unit_price": "5.00"}
            ]
        }
        response = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_data = response.data["order"]
        # Real DB price must be used: 4300 + 450 = 4750.00
        self.assertEqual(Decimal(order_data["subtotal"]), Decimal("4300.00"))
        self.assertEqual(Decimal(order_data["delivery_fee"]), Decimal("450.00"))
        self.assertEqual(Decimal(order_data["total_amount"]), Decimal("4750.00"))

    def test_06_retrieve_order_history_and_detail(self):
        """Retrieve list of orders and single order details."""
        self.client.force_authenticate(user=self.customer_a)

        create_res = self.client.post(self.orders_url, {
            "delivery_address": "25 Horton Place",
            "order_items": [{"product_id": self.rose_red.id, "quantity": 1}]
        }, format="json")
        order_id = create_res.data["order"]["id"]

        # 1. Order History
        list_res = self.client.get(self.orders_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data["count"], 1)

        # 2. Order Detail
        detail_url = reverse("order_detail", kwargs={"pk": order_id})
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["order"]["id"], order_id)

    def test_07_cancel_eligible_order(self):
        """Cancel an order with pending status."""
        self.client.force_authenticate(user=self.customer_a)

        create_res = self.client.post(self.orders_url, {
            "delivery_address": "33 Ward Place",
            "order_items": [{"product_id": self.rose_red.id, "quantity": 1}]
        }, format="json")
        order_id = create_res.data["order"]["id"]

        cancel_url = reverse("order_cancel", kwargs={"pk": order_id})
        cancel_res = self.client.post(cancel_url)
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data["order"]["order_status"], "cancelled")

        # Cancelling again returns 400
        re_cancel = self.client.post(cancel_url)
        self.assertEqual(re_cancel.status_code, status.HTTP_400_BAD_REQUEST)

    def test_08_ineligible_order_cancellation_rejected(self):
        """Orders that are 'preparing', 'out_for_delivery', or 'delivered' cannot be cancelled."""
        self.client.force_authenticate(user=self.customer_a)

        order = Order.objects.create(
            user=self.customer_a,
            full_name="Amelia Pond",
            email="amelia@example.com",
            phone_number="+94771112233",
            delivery_address="33 Ward Place",
            order_status="preparing"
        )
        cancel_url = reverse("order_cancel", kwargs={"pk": order.id})
        response = self.client.post(cancel_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot be cancelled", response.data["message"])

    def test_09_user_isolation_privacy(self):
        """User B cannot view or cancel User A's order."""
        # Create order for Customer A
        self.client.force_authenticate(user=self.customer_a)
        order_res = self.client.post(self.orders_url, {
            "delivery_address": "Secret A Avenue",
            "order_items": [{"product_id": self.rose_red.id, "quantity": 1}]
        }, format="json")
        order_id = order_res.data["order"]["id"]

        # Authenticate as Customer B
        self.client.force_authenticate(user=self.customer_b)
        detail_url = reverse("order_detail", kwargs={"pk": order_id})
        cancel_url = reverse("order_cancel", kwargs={"pk": order_id})

        # 1. User B views order list -> count is 0
        self.assertEqual(self.client.get(self.orders_url).data["count"], 0)

        # 2. User B tries to view User A's order detail -> 404 Not Found
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_404_NOT_FOUND)

        # 3. User B tries to cancel User A's order -> 404 Not Found
        self.assertEqual(self.client.post(cancel_url).status_code, status.HTTP_404_NOT_FOUND)

    def test_10_invalid_quantity_validation(self):
        """Quantity <= 0 is rejected."""
        self.client.force_authenticate(user=self.customer_a)
        payload = {
            "delivery_address": "12 Test Rd",
            "order_items": [{"product_id": self.rose_red.id, "quantity": 0}]
        }
        res = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_11_unavailable_product_rejected(self):
        """Ordering an unavailable product is rejected."""
        self.client.force_authenticate(user=self.customer_a)
        payload = {
            "delivery_address": "12 Test Rd",
            "order_items": [{"product_id": self.unavailable_flower.id, "quantity": 1}]
        }
        res = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unavailable", str(res.data))

    def test_12_order_another_users_custom_bouquet_rejected(self):
        """Customer B cannot order Customer A's custom bouquet."""
        self.client.force_authenticate(user=self.customer_b)
        payload = {
            "delivery_address": "44 Theft Lane",
            "order_items": [{"custom_bouquet_id": self.custom_bouquet_a.id, "quantity": 1}]
        }
        res = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("only order custom bouquets designed in your own account", str(res.data))

    def test_13_missing_delivery_address_rejected(self):
        """Missing delivery address is rejected."""
        self.client.force_authenticate(user=self.customer_a)
        payload = {
            "order_items": [{"product_id": self.rose_red.id, "quantity": 1}]
        }
        res = self.client.post(self.orders_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("delivery_address", res.data["errors"])
