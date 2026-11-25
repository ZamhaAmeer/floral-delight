"""
Automated Test Suite for Floral Delight Personalized Flower Recommendation System.
Tests:
- Public unauthenticated access to recommendation endpoints (200 OK)
- Recommendation for Birthday occasion
- Recommendation for Anniversary occasion
- Recommendation filtered by specific flower type (e.g. 'roses')
- Recommendation filtered by budget constraints
- Combined multi-preference matching (occasion + flower type + color + recipient + budget)
- Unavailable products exclusion (is_available=False excluded)
- Graceful fallback when no exact match exists
- Invalid budget validation (negative budget or budget_min > budget_max rejected with 400)
- Occasions metadata catalog endpoint (/api/recommendations/occasions/)
- Preferences metadata catalog endpoint (/api/recommendations/preferences/)
"""
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from products.models import Category, Product


class RecommendationSystemTests(APITestCase):

    def setUp(self):
        # Setup Categories
        self.cat_roses = Category.objects.create(name="Roses", slug="roses")
        self.cat_sunflowers = Category.objects.create(name="Sunflowers", slug="sunflowers")
        self.cat_tulips = Category.objects.create(name="Tulips", slug="tulips")

        # Setup Available Products
        self.rose_red = Product.objects.create(
            name="Classic Red Rose Bouquet",
            slug="rose-red",
            category=self.cat_roses,
            price=Decimal("4300.00"),
            image="Images/rose-red.jpg",
            flower_type="roses",
            description="Lush classic garden roses with full velvety red petals.",
            is_available=True
        )
        self.rose_pink = Product.objects.create(
            name="Blush Pink Rose Bouquet",
            slug="rose-pink",
            category=self.cat_roses,
            price=Decimal("4400.00"),
            image="Images/rose-pink.jpg",
            flower_type="roses",
            description="Tender blush garden roses layered with ruffled perfection.",
            is_available=True
        )
        self.sunflower = Product.objects.create(
            name="Golden Radiance Sunflower",
            slug="sunflower-golden",
            category=self.cat_sunflowers,
            price=Decimal("3800.00"),
            image="Images/sunflower-golden.jpg",
            flower_type="sunflowers",
            description="Golden-yellow blooms capturing sunny morning optimism.",
            is_available=True
        )
        self.tulip = Product.objects.create(
            name="Dutch Tulip Ensemble",
            slug="tulip-pink",
            category=self.cat_tulips,
            price=Decimal("5500.00"),
            image="Images/tulip-pink.jpg",
            flower_type="tulips",
            description="Springtime Dutch tulips in harmonic pink and white shades.",
            is_available=True
        )

        # Setup Unavailable Product
        self.rare_black_rose = Product.objects.create(
            name="Rare Black Rose Out of Stock",
            slug="rose-black",
            category=self.cat_roses,
            price=Decimal("5000.00"),
            image="Images/rose-black.jpg",
            flower_type="roses",
            description="Rare velvet rose currently out of harvest season.",
            is_available=False
        )

        # URLs
        self.recommendations_url = reverse("recommendations_generate")
        self.occasions_url = reverse("recommendations_occasions")
        self.preferences_url = reverse("recommendations_preferences")

    def test_01_public_access_without_authentication(self):
        """Guest customers can request recommendations without logging in."""
        res = self.client.post(self.recommendations_url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "success")
        self.assertGreaterEqual(res.data["total_found"], 1)

    def test_02_birthday_recommendations(self):
        """Birthday recommendations prioritize cheerful yellow blooms (Sunflowers)."""
        payload = {"occasion": "birthday"}
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        recommendations = res.data["recommendations"]
        self.assertTrue(len(recommendations) > 0)
        # First recommended item should be the Sunflower due to birthday / joyful synergy
        top_item = recommendations[0]
        self.assertEqual(top_item["product_name"], "Golden Radiance Sunflower")
        self.assertIn("Birthday", top_item["recommendation_reason"])

    def test_03_anniversary_recommendations(self):
        """Anniversary recommendations prioritize romantic red roses."""
        payload = {"occasion": "anniversary", "recipient": "partner"}
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        recommendations = res.data["recommendations"]
        self.assertTrue(len(recommendations) > 0)
        # Red rose should rank at the top for Anniversary + Partner
        top_item = recommendations[0]
        self.assertEqual(top_item["product_name"], "Classic Red Rose Bouquet")
        self.assertIn("Anniversary", top_item["recommendation_reason"])

    def test_04_flower_type_filter(self):
        """Recommendations filtered by flower type prioritize that flower."""
        payload = {"flower_type": "tulips"}
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        top_item = res.data["recommendations"][0]
        self.assertEqual(top_item["flower_type"], "tulips")
        self.assertIn("Tulips", top_item["recommendation_reason"])

    def test_05_budget_filtering(self):
        """Recommendations respecting maximum budget constraints."""
        # Only Sunflower (3800.00) is <= 4000.00
        payload = {"budget_max": "4000.00"}
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        top_item = res.data["recommendations"][0]
        self.assertEqual(top_item["product_name"], "Golden Radiance Sunflower")
        self.assertLessEqual(Decimal(top_item["price"]), Decimal("4000.00"))

    def test_06_multi_preference_matching(self):
        """Combined matching: Anniversary + Roses + Red + Partner + Budget."""
        payload = {
            "occasion": "anniversary",
            "flower_type": "roses",
            "color": "red",
            "recipient": "partner",
            "budget_max": "4500.00"
        }
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["is_exact_match"])

        top_item = res.data["recommendations"][0]
        self.assertEqual(top_item["product_id"], self.rose_red.id)
        self.assertGreaterEqual(top_item["match_score"], 80)
        self.assertIn("Red", top_item["recommendation_reason"])
        self.assertIn("Anniversary", top_item["recommendation_reason"])

    def test_07_unavailable_products_excluded(self):
        """Products with is_available=False must NEVER appear in recommendations."""
        payload = {"flower_type": "roses"}
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        recommended_ids = [r["product_id"] for r in res.data["recommendations"]]
        self.assertNotIn(self.rare_black_rose.id, recommended_ids)

    def test_08_fallback_when_no_exact_match(self):
        """When user requests a flower type not in stock, suggest similar available products gracefully."""
        payload = {"flower_type": "anthurium"}  # Not in database
        res = self.client.post(self.recommendations_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Fallback should provide alternatives rather than an empty screen or error
        self.assertFalse(res.data["is_exact_match"])
        self.assertGreaterEqual(res.data["total_found"], 1)
        self.assertIn("closest available seasonal arrangements", res.data["summary_message"])

    def test_09_invalid_budget_validation(self):
        """Negative budgets or min > max must be rejected with 400 Bad Request."""
        # 1. budget_min > budget_max
        res_inverted = self.client.post(self.recommendations_url, {
            "budget_min": "6000.00",
            "budget_max": "3000.00"
        }, format="json")
        self.assertEqual(res_inverted.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("budget_min", res_inverted.data["errors"])

        # 2. Negative budget
        res_negative = self.client.post(self.recommendations_url, {
            "budget_max": "-500.00"
        }, format="json")
        self.assertEqual(res_negative.status_code, status.HTTP_400_BAD_REQUEST)

    def test_10_occasions_catalog_endpoint(self):
        """GET /api/recommendations/occasions/ returns supported occasions catalog."""
        res = self.client.get(self.occasions_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "success")
        self.assertGreaterEqual(res.data["count"], 7)

        slugs = [occ["slug"] for occ in res.data["occasions"]]
        self.assertIn("birthday", slugs)
        self.assertIn("anniversary", slugs)
        self.assertIn("wedding", slugs)
        self.assertIn("graduation", slugs)
        self.assertIn("valentines", slugs)
        self.assertIn("mothers_day", slugs)

    def test_11_preferences_catalog_endpoint(self):
        """GET /api/recommendations/preferences/ returns supported options catalog."""
        res = self.client.get(self.preferences_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "success")
        self.assertIn("flower_types", res.data)
        self.assertIn("colors", res.data)
        self.assertIn("bouquet_styles", res.data)
        self.assertIn("recipients", res.data)
        self.assertIn("budget_presets", res.data)
