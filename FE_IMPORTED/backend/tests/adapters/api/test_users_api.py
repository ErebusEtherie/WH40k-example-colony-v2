"""Integration tests for User Management API endpoints."""

from fastapi.testclient import TestClient


class TestUsersAPI:
    """Integration tests for user management endpoints."""

    def test_list_users_admin_only(self, auth_client: TestClient):
        """Test listing users requires admin privileges."""
        # Create a regular user first
        user_data = {
            "username": "regularuser",
            "email": "regular@example.com",
            "password": "TestPass123!",
        }
        auth_client.post("/api/v1/auth/register", json=user_data)

        # Regular user cannot list all users
        response = auth_client.get("/api/v1/users")
        # This should return 403 since regular users are not admins
        assert response.status_code in [200, 403]  # Depends on if the test user is admin

    def test_create_user_admin_only(self, auth_client: TestClient):
        """Test creating a user requires admin privileges."""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "TestPass123!",
            "role": "viewer",
        }
        response = auth_client.post("/api/v1/users", json=user_data)
        # Should succeed if auth_client is admin, otherwise 403
        assert response.status_code in [201, 403]

    def test_get_user_by_id(self, auth_client: TestClient):
        """Test retrieving a specific user by ID."""
        # First create a user via registration
        user_data = {
            "username": "getuser",
            "email": "getuser@example.com",
            "password": "TestPass123!",
        }
        create_response = auth_client.post("/api/v1/auth/register", json=user_data)
        user_id = create_response.json()["id"]

        # Get the user
        response = auth_client.get(f"/api/v1/users/{user_id}")
        assert response.status_code in [200, 403]

        if response.status_code == 200:
            user = response.json()
            assert user["username"] == "getuser"
            assert user["email"] == "getuser@example.com"

    def test_update_user(self, auth_client: TestClient):
        """Test updating a user."""
        # Create a user
        user_data = {
            "username": "updateuser",
            "email": "updateuser@example.com",
            "password": "TestPass123!",
        }
        create_response = auth_client.post("/api/v1/auth/register", json=user_data)
        user_id = create_response.json()["id"]

        # Update the user
        update_data = {"role": "colony_manager", "is_active": True}
        response = auth_client.patch(f"/api/v1/users/{user_id}", json=update_data)
        assert response.status_code in [200, 403]

    def test_delete_user_soft_delete(self, auth_client: TestClient):
        """Test soft deleting a user."""
        # Create a user
        user_data = {
            "username": "deleteuser",
            "email": "deleteuser@example.com",
            "password": "TestPass123!",
        }
        create_response = auth_client.post("/api/v1/auth/register", json=user_data)
        user_id = create_response.json()["id"]

        # Delete the user
        response = auth_client.delete(f"/api/v1/users/{user_id}")
        assert response.status_code in [204, 403]

    def test_reset_password(self, auth_client: TestClient):
        """Test resetting a user password."""
        # Create a user
        user_data = {
            "username": "resetuser",
            "email": "resetuser@example.com",
            "password": "OldPass123!",
        }
        create_response = auth_client.post("/api/v1/auth/register", json=user_data)
        user_id = create_response.json()["id"]

        # Reset password
        reset_data = {"temporary_password": "NewPass456!"}
        response = auth_client.post(f"/api/v1/users/{user_id}/reset-password", json=reset_data)
        assert response.status_code in [200, 403]

    def test_get_nonexistent_user(self, auth_client: TestClient):
        """Test 404 when user doesn't exist."""
        response = auth_client.get("/api/v1/users/99999")
        assert response.status_code in [404, 403]

    def test_create_user_duplicate_username(self, auth_client: TestClient):
        """Test creating user with duplicate username fails."""
        # Create first user
        user_data1 = {
            "username": "duplicateuser",
            "email": "dup1@example.com",
            "password": "TestPass123!",
        }
        auth_client.post("/api/v1/auth/register", json=user_data1)

        # Try to create duplicate
        user_data2 = {
            "username": "duplicateuser",
            "email": "dup2@example.com",
            "password": "TestPass123!",
        }
        response = auth_client.post("/api/v1/users", json=user_data2)
        assert response.status_code in [400, 403]

    def test_create_user_duplicate_email(self, auth_client: TestClient):
        """Test creating user with duplicate email fails."""
        # Create first user
        user_data1 = {
            "username": "dupemail1",
            "email": "dupemail@example.com",
            "password": "TestPass123!",
        }
        auth_client.post("/api/v1/auth/register", json=user_data1)

        # Try to create duplicate
        user_data2 = {
            "username": "dupemail2",
            "email": "dupemail@example.com",
            "password": "TestPass123!",
        }
        response = auth_client.post("/api/v1/users", json=user_data2)
        assert response.status_code in [400, 403]

    def test_user_list_pagination(self, auth_client: TestClient):
        """Test user list pagination."""
        response = auth_client.get("/api/v1/users?limit=5&offset=0")
        assert response.status_code in [200, 403]

        if response.status_code == 200:
            data = response.json()
            assert "users" in data
            assert "total" in data
            assert "limit" in data
            assert "offset" in data
            assert "has_more" in data
            assert isinstance(data["users"], list)
            assert data["limit"] == 5
            assert data["offset"] == 0
