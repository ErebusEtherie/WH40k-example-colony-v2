"""Integration tests for Development Plan API endpoints."""

from fastapi.testclient import TestClient


class TestDevelopmentPlansAPI:
    """Integration tests for development plan management endpoints."""

    def test_create_development_plan(self, auth_client: TestClient):
        """Test creating a new development plan for a colony."""
        colony_data = {"name": "Plan Test Colony", "owner": "Test Owner", "colony_type": "mining_and_industry"}
        colony_response = auth_client.post("/api/v1/colonies", json=colony_data)
        colony_id = colony_response.json()["id"]

        plan_data = {
            "upgrade_type": "infrastructure",
            "target_name": "Industrial Expansion",
            "priority": 3,
            "description": "Expand mining operations to sector 7",
            "acquisition_plan": "Acquire resources from nearby asteroids",
        }
        response = auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json=plan_data)
        assert response.status_code == 201
        plan = response.json()
        assert plan["target_name"] == "Industrial Expansion"
        assert plan["colony_id"] == colony_id
        assert plan["upgrade_type"] == "infrastructure"
        assert "id" in plan

    def test_get_development_plan(self, auth_client: TestClient):
        """Test retrieving a specific development plan by ID."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]

        plan_data = {"upgrade_type": "infrastructure", "target_name": "Test Plan", "priority": 2, "description": "Test description", "acquisition_plan": "Test plan"}
        plan_response = auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json=plan_data)
        plan_id = plan_response.json()["id"]

        response = auth_client.get(f"/api/v1/development-plans/{plan_id}")
        assert response.status_code == 200
        plan = response.json()
        assert plan["id"] == plan_id
        assert plan["target_name"] == "Test Plan"

    def test_get_plans_by_colony(self, auth_client: TestClient):
        """Test retrieving all development plans for a colony."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Multi-Plan Colony", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]

        for i in range(3):
            plan_data = {"upgrade_type": "infrastructure", "target_name": f"Plan {i}", "priority": 2, "description": f"Description {i}", "acquisition_plan": f"Plan {i}"}
            auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json=plan_data)

        response = auth_client.get(f"/api/v1/development-plans/colonies/{colony_id}")
        assert response.status_code == 200
        plans = response.json()
        assert len(plans) == 3

    def test_update_development_plan(self, auth_client: TestClient):
        """Test updating a development plan."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Update Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]

        plan_data = {"upgrade_type": "infrastructure", "target_name": "Original Plan", "priority": 2, "description": "Original description", "acquisition_plan": "Original plan"}
        plan_response = auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json=plan_data)
        plan_id = plan_response.json()["id"]

        update_data = {"target_name": "Updated Plan", "description": "Updated description", "status": "in_progress"}
        response = auth_client.patch(f"/api/v1/development-plans/{plan_id}", json=update_data)
        assert response.status_code == 200
        plan = response.json()
        assert plan["target_name"] == "Updated Plan"
        assert plan["status"] == "in_progress"

    def test_delete_development_plan(self, auth_client: TestClient):
        """Test deleting a development plan."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Delete Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]

        plan_data = {"upgrade_type": "infrastructure", "target_name": "To Delete", "priority": 2, "description": "Will be deleted", "acquisition_plan": "Delete plan"}
        plan_response = auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json=plan_data)
        plan_id = plan_response.json()["id"]

        response = auth_client.delete(f"/api/v1/development-plans/{plan_id}")
        assert response.status_code == 204

        response = auth_client.get(f"/api/v1/development-plans/colonies/{colony_id}")
        assert len(response.json()) == 0

    def test_development_plan_not_found(self, auth_client: TestClient):
        """Test 404 when development plan doesn't exist."""
        response = auth_client.get("/api/v1/development-plans/99999")
        assert response.status_code == 404

    def test_create_development_plan_unauthorized(self, test_client: TestClient):
        """Test creating development plan without authentication fails."""
        plan_data = {"upgrade_type": "infrastructure", "target_name": "Unauthorized Plan", "priority": 2, "description": "Should fail", "acquisition_plan": "Fail plan"}
        response = test_client.post("/api/v1/development-plans/colonies/1", json=plan_data)
        assert response.status_code == 401

    def test_development_plan_status_enum_values(self, auth_client: TestClient):
        """Test all valid development plan status values."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Status Test", "owner": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]

        valid_statuses = ["planned", "in_progress", "acquired", "completed", "abandoned"]
        for i, status in enumerate(valid_statuses):
            plan_data = {"upgrade_type": "infrastructure", "target_name": f"Plan {i}", "priority": 2, "description": f"Testing {status}", "acquisition_plan": f"Plan {i}"}
            response = auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json=plan_data)
            assert response.status_code == 201
            plan_id = response.json()["id"]
            # Update the status
            update_data = {"status": status}
            update_response = auth_client.patch(f"/api/v1/development-plans/{plan_id}", json=update_data)
            assert update_response.status_code == 200
            plan = update_response.json()
            assert plan["status"] == status, f"Expected status {status}, got {plan['status']}"