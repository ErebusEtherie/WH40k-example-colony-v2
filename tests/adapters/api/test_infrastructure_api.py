"""Infrastructure API integration tests."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from colony_manager.adapters.api.app import create_app
from colony_manager.adapters.persistence.db import init_db


@pytest.fixture
def test_client(tmp_path):
    """Create test client with isolated database."""
    db_path = tmp_path / "test.db"
    import colony_manager.adapters.api.dependencies as deps
    
    def override_get_db_path() -> Path:
        return db_path
    
    init_db(db_path)
    app = create_app()
    
    # Override the dependency after app creation
    app.dependency_overrides[deps.get_db_path] = override_get_db_path
    
    client = TestClient(app)
    yield client
    
    # Cleanup
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(test_client):
    """Create authenticated test client with a test user."""
    # Register a test user (password must meet complexity requirements)
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
    }
    response = test_client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201
    
    # Login to get token
    login_data = {"username": "testuser", "password": "TestPass123!"}
    login_response = test_client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]
    
    # Return client with auth header
    test_client.headers["Authorization"] = f"Bearer {access_token}"
    return test_client


@pytest.fixture
def colony(auth_client):
    create_data = {"name": "Test Colony", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    return response.json()


class TestInfrastructureAPI:
    def test_list_infrastructure_empty(self, auth_client, colony):
        response = auth_client.get(f"/api/v1/colonies/{colony['id']}/infrastructure")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_infrastructure(self, auth_client, colony):
        create_data = {"infrastructure_type": "power_network", "state": "working"}
        response = auth_client.post(f"/api/v1/colonies/{colony['id']}/infrastructure", json=create_data)
        assert response.status_code == 201
        data = response.json()
        assert data["infrastructure_type"] == "power_network"
        assert data["state"] == "working"
        assert data["has_effect"] is True
        assert data["is_working"] is True

    def test_create_infrastructure_for_missing_colony_raises(self, auth_client):
        create_data = {"infrastructure_type": "power_network", "state": "working"}
        response = auth_client.post("/api/v1/colonies/9999/infrastructure", json=create_data)
        assert response.status_code == 404
        assert "Colony 9999 not found" in response.json()["detail"]

    def test_get_infrastructure(self, auth_client, colony):
        create_data = {"infrastructure_type": "power_network", "state": "working"}
        create_response = auth_client.post(f"/api/v1/colonies/{colony['id']}/infrastructure", json=create_data)
        infra_id = create_response.json()["id"]
        response = auth_client.get(f"/api/v1/colonies/{colony['id']}/infrastructure/{infra_id}")
        assert response.status_code == 200
        assert response.json()["id"] == infra_id

    def test_get_infrastructure_missing_raises(self, auth_client, colony):
        response = auth_client.get(f"/api/v1/colonies/{colony['id']}/infrastructure/9999")
        assert response.status_code == 404
        assert "Infrastructure 9999 not found" in response.json()["detail"]

    def test_update_infrastructure_state(self, auth_client, colony):
        create_data = {"infrastructure_type": "power_network", "state": "planned"}
        create_response = auth_client.post(f"/api/v1/colonies/{colony['id']}/infrastructure", json=create_data)
        infra_id = create_response.json()["id"]
        update_data = {"state": "disrupted"}
        response = auth_client.patch(f"/api/v1/colonies/{colony['id']}/infrastructure/{infra_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["state"] == "disrupted"
        assert response.json()["is_disrupted"] is True

    def test_update_infrastructure_missing_raises(self, auth_client, colony):
        update_data = {"state": "working"}
        response = auth_client.patch(f"/api/v1/colonies/{colony['id']}/infrastructure/9999", json=update_data)
        assert response.status_code == 404

    def test_delete_infrastructure(self, auth_client, colony):
        create_data = {"infrastructure_type": "power_network", "state": "working"}
        create_response = auth_client.post(f"/api/v1/colonies/{colony['id']}/infrastructure", json=create_data)
        infra_id = create_response.json()["id"]
        response = auth_client.delete(f"/api/v1/colonies/{colony['id']}/infrastructure/{infra_id}")
        assert response.status_code == 204
        get_response = auth_client.get(f"/api/v1/colonies/{colony['id']}/infrastructure/{infra_id}")
        assert get_response.status_code == 404

    def test_delete_infrastructure_missing_raises(self, auth_client, colony):
        response = auth_client.delete(f"/api/v1/colonies/{colony['id']}/infrastructure/9999")
        assert response.status_code == 404

    def test_infrastructure_state_defaults_to_planned(self, auth_client, colony):
        create_data = {"infrastructure_type": "transport"}
        response = auth_client.post(f"/api/v1/colonies/{colony['id']}/infrastructure", json=create_data)
        assert response.status_code == 201
        assert response.json()["state"] == "planned"
        assert response.json()["has_effect"] is False