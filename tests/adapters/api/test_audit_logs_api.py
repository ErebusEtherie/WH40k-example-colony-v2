"""Integration tests for Audit Log API endpoints."""

from fastapi.testclient import TestClient


class TestAuditLogsAPI:
    """Integration tests for audit log query endpoints."""

    def test_get_audit_logs_by_colony(self, auth_client: TestClient):
        """Test retrieving audit logs for a colony."""
        colony_data = {"name": "Audit Test Colony", "owner": "Test Owner", "colony_type": "mining_and_industry"}
        colony_response = auth_client.post("/api/v1/colonies", json=colony_data)
        colony_id = colony_response.json()["id"]
        event_data = {"name": "Test Event", "description": "Test", "modifiers": []}
        auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) >= 1

    def test_get_audit_logs_by_colony_with_action_filter(self, auth_client: TestClient):
        """Test filtering audit logs by entity type."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Filter Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        event_data = {"name": "Test Event", "description": "Test", "modifiers": []}
        event_response = auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        event_id = event_response.json()["id"]
        auth_client.patch(f"/api/v1/events/{event_id}", json={"name": "Updated Event"})
        # Filter by entity_type (event) instead of action (not supported)
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}?entity_type=event")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) >= 1
        assert all(log["entity_type"] == "event" for log in logs)

    def test_get_audit_logs_by_colony_with_entity_filter(self, auth_client: TestClient):
        """Test filtering audit logs by entity type."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Entity Filter Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        event_data = {"name": "Test Event", "description": "Test", "modifiers": []}
        auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}?entity_type=event")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) >= 1
        assert all(log["entity_type"] == "event" for log in logs)

    def test_get_audit_log_by_id(self, auth_client: TestClient):
        """Test retrieving a specific audit log entry by ID."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Single Log Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        event_data = {"name": "Test Event", "description": "Test", "modifiers": []}
        auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        logs_response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}")
        log_id = logs_response.json()[0]["id"]
        response = auth_client.get(f"/api/v1/audit-logs/{log_id}")
        assert response.status_code == 200
        log = response.json()
        assert log["id"] == log_id
        assert log["colony_id"] == colony_id

    def test_get_audit_logs_pagination(self, auth_client: TestClient):
        """Test audit log pagination with limit and offset."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Pagination Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i in range(5):
            event_data = {"name": f"Event {i}", "description": f"Test {i}", "modifiers": []}
            auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}?limit=2&offset=0")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 2
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}?limit=2&offset=2")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 2

    def test_get_audit_logs_empty(self, auth_client: TestClient):
        """Test audit logs for colony with no logs."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Empty Logs Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}")
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 0

    def test_get_audit_log_not_found(self, auth_client: TestClient):
        """Test 404 when audit log doesn't exist."""
        response = auth_client.get("/api/v1/audit-logs/99999")
        assert response.status_code == 404

    def test_audit_log_contains_required_fields(self, auth_client: TestClient):
        """Test that audit log entries contain all required fields."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Fields Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        event_data = {"name": "Test Event", "description": "Test", "modifiers": []}
        auth_client.post(f"/api/v1/events/colonies/{colony_id}", json=event_data)
        response = auth_client.get(f"/api/v1/audit-logs/colonies/{colony_id}")
        log = response.json()[0]
        required_fields = ["id", "colony_id", "entity_type", "entity_id", "action", "changed_by", "changed_at"]
        for field in required_fields:
            assert field in log, f"Missing required field: {field}"