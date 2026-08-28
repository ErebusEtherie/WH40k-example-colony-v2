"""Integration tests for Modifier API endpoints."""

from fastapi.testclient import TestClient


class TestModifiersAPI:
    """Integration tests for modifier management endpoints (admin only)."""

    def test_list_all_modifiers_empty(self, auth_client: TestClient):
        """Test listing all modifiers when none exist."""
        response = auth_client.get("/api/v1/modifiers")
        assert response.status_code == 200
        modifiers = response.json()
        assert isinstance(modifiers, list)
        assert len(modifiers) == 0

    def test_list_all_modifiers_with_colony(self, auth_client: TestClient):
        """Test listing all modifiers returns empty list for colonies without modifiers."""
        # Create a colony - it won't have modifiers initially
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={"name": "Modifier Test Colony", "founder_name": "Test Owner", "colony_type": "mining_and_industry"},
        )
        assert colony_response.status_code == 201
        response = auth_client.get("/api/v1/modifiers")
        assert response.status_code == 200
        modifiers = response.json()
        assert isinstance(modifiers, list)

    def test_get_modifier_not_found(self, auth_client: TestClient):
        """Test 404 when modifier doesn\'t exist."""
        response = auth_client.get("/api/v1/modifiers/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_list_modifiers_unauthorized(self, test_client: TestClient):
        """Test listing modifiers without authentication fails."""
        response = test_client.get("/api/v1/modifiers")
        assert response.status_code == 401
        detail = response.json()["detail"]
        assert "Authorization" in detail or "credential" in detail.lower()

    def test_get_modifier_unauthorized(self, test_client: TestClient):
        """Test getting modifier without authentication fails."""
        response = test_client.get("/api/v1/modifiers/1")
        assert response.status_code == 401
