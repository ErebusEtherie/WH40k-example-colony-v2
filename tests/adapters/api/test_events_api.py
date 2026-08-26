"""Integration tests for Event API endpoints."""

from fastapi.testclient import TestClient


class TestEventsAPI:
    """Integration tests for event management endpoints."""

    def test_create_event(self, auth_client: TestClient):
        """Test creating a new event for a colony."""
        colony_data = {
            "name": "Event Test Colony",
            "owner": "Test Owner",
            "colony_type": "mining_and_industry",
        }
        colony_response = auth_client.post("/api/v1/colonies", json=colony_data)
        colony_id = colony_response.json()["id"]
        event_data = {
            "name": "Warp Storm",
            "description": "A dangerous warp storm affects the colony",
            "modifiers": [
                {"stat": "productivity", "value": -2, "description": "Storm disrupts operations"},
                {"stat": "order", "value": -1, "description": "Panic among workers"},
            ],
        }
        response = auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        assert response.status_code == 201
        event = response.json()
        assert event["name"] == "Warp Storm"
        assert event["colony_id"] == colony_id
        assert len(event["modifiers"]) == 2
        assert "id" in event
        assert event["is_active"] is True

    def test_get_event(self, auth_client: TestClient):
        """Test retrieving a specific event by ID."""
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={"name": "Test", "owner": "Owner", "colony_type": "mining_and_industry"},
        )
        colony_id = colony_response.json()["id"]
        event_data = {"name": "Test Event", "description": "Test description", "modifiers": []}
        event_response = auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        event_id = event_response.json()["id"]
        response = auth_client.get(f"/api/v1/events/{event_id}")
        assert response.status_code == 200
        event = response.json()
        assert event["id"] == event_id
        assert event["name"] == "Test Event"

    def test_get_events_by_colony(self, auth_client: TestClient):
        """Test retrieving all events for a colony."""
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={
                "name": "Multi-Event Colony",
                "owner": "Owner",
                "colony_type": "mining_and_industry",
            },
        )
        colony_id = colony_response.json()["id"]
        for i in range(3):
            event_data = {"name": f"Event {i}", "description": f"Description {i}", "modifiers": []}
            auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        response = auth_client.get(f"/api/v1/events/colonies/{colony_id}")
        assert response.status_code == 200

    def test_update_event(self, auth_client: TestClient):
        """Test updating an event."""
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={"name": "Update Test", "owner": "Owner", "colony_type": "mining_and_industry"},
        )
        colony_id = colony_response.json()["id"]
        event_data = {
            "name": "Original Event",
            "description": "Original description",
            "modifiers": [],
        }
        event_response = auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        event_id = event_response.json()["id"]
        update_data = {
            "name": "Updated Event",
            "description": "Updated description",
            "is_active": False,
        }
        response = auth_client.patch(f"/api/v1/events/{event_id}", json=update_data)
        assert response.status_code == 200
        event = response.json()
        assert event["name"] == "Updated Event"
        assert event["description"] == "Updated description"
        assert event["is_active"] is False

    def test_delete_event(self, auth_client: TestClient):
        """Test deleting (soft delete) an event."""
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={"name": "Delete Test", "owner": "Owner", "colony_type": "mining_and_industry"},
        )
        colony_id = colony_response.json()["id"]
        event_data = {"name": "To Delete", "description": "Will be deleted", "modifiers": []}
        event_response = auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        event_id = event_response.json()["id"]
        response = auth_client.delete(f"/api/v1/events/{event_id}")
        assert response.status_code == 204
        response = auth_client.get(f"/api/v1/events/colonies/{colony_id}?active_only=true")
        assert len(response.json()) == 0

    def test_event_not_found(self, auth_client: TestClient):
        """Test 404 when event doesn't exist."""
        response = auth_client.get("/api/v1/events/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_create_event_unauthorized(self, test_client: TestClient):
        """Test creating event without authentication fails."""
        event_data = {"name": "Unauthorized Event", "description": "Should fail", "modifiers": []}
        response = test_client.post("/api/v1/events/colonies/1", json=event_data)
        assert response.status_code == 401
        detail = response.json()["detail"]
        assert "Authorization" in detail or "credential" in detail.lower()

    def test_get_events_by_colony_active_only(self, auth_client: TestClient):
        """Test retrieving only active events for a colony."""
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={"name": "Active Test", "owner": "Owner", "colony_type": "mining_and_industry"},
        )
        colony_id = colony_response.json()["id"]
        for i in range(3):
            event_data = {"name": f"Event {i}", "description": f"Description {i}", "modifiers": []}
            auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        events_response = auth_client.get(f"/api/v1/events/colonies/{colony_id}")
        event_id = events_response.json()[0]["id"]
        auth_client.patch(f"/api/v1/events/{event_id}", json={"is_active": False})
        response = auth_client.get(f"/api/v1/events/colonies/{colony_id}?active_only=true")
        assert response.status_code == 200
        events = response.json()
        assert len(events) == 2
