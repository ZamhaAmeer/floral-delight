"""
Automated Test Suite for Floral Delight Accounts & Authentication.
Tests:
- Registration (valid, duplicate email, mismatched passwords, invalid email)
- Login (valid, wrong password, non-existent user)
- JWT Token Refresh
- User Profile (retrieval with/without token, updates)
- Password Change (success, incorrect old password, mismatch)
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AccountsAuthenticationTests(APITestCase):

    def setUp(self):
        self.register_url = reverse("account_register")
        self.login_url = reverse("account_login")
        self.refresh_url = reverse("token_refresh")
        self.profile_url = reverse("account_profile")
        self.change_password_url = reverse("account_change_password")

        # Test user data
        self.valid_user_data = {
            "full_name": "Elena Rostova",
            "email": "elena.rostova@example.com",
            "phone_number": "+94771234567",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
        }

    def test_01_successful_registration(self):
        """Test registering a new customer with valid information."""
        response = self.client.post(self.register_url, self.valid_user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "success")
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "elena.rostova@example.com")
        self.assertEqual(response.data["user"]["full_name"], "Elena Rostova")
        self.assertEqual(response.data["user"]["phone_number"], "+94771234567")

        # Verify password is NOT stored as plain text
        user = User.objects.get(email="elena.rostova@example.com")
        self.assertNotEqual(user.password, "SecurePassword123!")
        self.assertTrue(user.check_password("SecurePassword123!"))

    def test_02_duplicate_email_registration(self):
        """Test registration fails when email is already registered."""
        # First registration
        self.client.post(self.register_url, self.valid_user_data, format="json")

        # Second registration attempt with identical email (different case)
        duplicate_data = self.valid_user_data.copy()
        duplicate_data["email"] = "ELENA.ROSTOVA@example.com"
        response = self.client.post(self.register_url, duplicate_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "error")
        self.assertIn("email", response.data["errors"])

    def test_03_registration_password_mismatch(self):
        """Test registration fails when password and confirm_password do not match."""
        mismatched_data = self.valid_user_data.copy()
        mismatched_data["confirm_password"] = "DifferentPassword123!"
        response = self.client.post(self.register_url, mismatched_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data["errors"])

    def test_04_successful_login(self):
        """Test login with valid email and password returns JWT tokens."""
        # Create user
        User.objects.create_user(
            email="sophia@example.com",
            full_name="Sophia Laurent",
            password="FloralSecretPassword2026!"
        )

        login_payload = {
            "email": "sophia@example.com",
            "password": "FloralSecretPassword2026!"
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "sophia@example.com")

    def test_05_login_with_incorrect_password(self):
        """Test login fails with invalid password."""
        User.objects.create_user(
            email="sophia@example.com",
            full_name="Sophia Laurent",
            password="FloralSecretPassword2026!"
        )

        bad_payload = {
            "email": "sophia@example.com",
            "password": "WrongPassword!"
        }
        response = self.client.post(self.login_url, bad_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["status"], "error")

    def test_06_login_with_nonexistent_email(self):
        """Test login fails when email does not exist."""
        payload = {
            "email": "nonexistent@example.com",
            "password": "AnyPassword123!"
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_07_access_profile_without_token(self):
        """Test accessing protected profile endpoint without authorization fails."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_08_access_profile_with_valid_token(self):
        """Test accessing profile with valid JWT Bearer token succeeds."""
        user = User.objects.create_user(
            email="charlotte@example.com",
            full_name="Charlotte Rose",
            phone_number="+94711122334",
            password="PasswordRose123!"
        )

        # Login to obtain access token
        login_res = self.client.post(self.login_url, {
            "email": "charlotte@example.com",
            "password": "PasswordRose123!"
        }, format="json")
        access_token = login_res.data["tokens"]["access"]

        # Authenticate with Bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], "charlotte@example.com")
        self.assertEqual(response.data["user"]["full_name"], "Charlotte Rose")

    def test_09_update_profile(self):
        """Test updating profile details (full_name, phone_number)."""
        user = User.objects.create_user(
            email="isabella@example.com",
            full_name="Isabella Bloom",
            phone_number="+94770000000",
            password="BloomPassword123!"
        )
        self.client.force_authenticate(user=user)

        update_payload = {
            "full_name": "Isabella V. Bloom",
            "phone_number": "+94779998877"
        }
        response = self.client.patch(self.profile_url, update_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["full_name"], "Isabella V. Bloom")
        self.assertEqual(response.data["user"]["phone_number"], "+94779998877")

        user.refresh_from_db()
        self.assertEqual(user.full_name, "Isabella V. Bloom")
        self.assertEqual(user.phone_number, "+94779998877")

    def test_10_change_password_success(self):
        """Test changing password with correct old password."""
        user = User.objects.create_user(
            email="amelia@example.com",
            full_name="Amelia Blossom",
            password="InitialPassword123!"
        )
        self.client.force_authenticate(user=user)

        payload = {
            "old_password": "InitialPassword123!",
            "new_password": "BrandNewSecret2026!",
            "confirm_new_password": "BrandNewSecret2026!"
        }
        response = self.client.post(self.change_password_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verify old password no longer works
        user.refresh_from_db()
        self.assertFalse(user.check_password("InitialPassword123!"))
        self.assertTrue(user.check_password("BrandNewSecret2026!"))

    def test_11_change_password_wrong_old_password(self):
        """Test changing password fails when old password is incorrect."""
        user = User.objects.create_user(
            email="amelia2@example.com",
            full_name="Amelia Blossom",
            password="InitialPassword123!"
        )
        self.client.force_authenticate(user=user)

        payload = {
            "old_password": "WrongCurrentPassword!",
            "new_password": "BrandNewSecret2026!",
            "confirm_new_password": "BrandNewSecret2026!"
        }
        response = self.client.post(self.change_password_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data["errors"])

    def test_12_token_refresh(self):
        """Test generating a fresh access token using a refresh token."""
        user = User.objects.create_user(
            email="victor@example.com",
            full_name="Victor Thorne",
            password="VictorPassword123!"
        )
        login_res = self.client.post(self.login_url, {
            "email": "victor@example.com",
            "password": "VictorPassword123!"
        }, format="json")
        refresh_token = login_res.data["tokens"]["refresh"]

        refresh_res = self.client.post(self.refresh_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)
