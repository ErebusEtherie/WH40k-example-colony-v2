"""API integration tests."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from colony_manager.adapters.api.app import create_app
from colony_manager.adapters.persistence.db import init_db


@pytest.fixture
def test_client(tmp_path):
    """Create test client with isolated database."""
    db_path = tmp_path / "test.db"
    
    # Override dependencies to use test database
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
    # Register a test user
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
    }
    response = test_client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201
    
    # Login to get token
    login_data = {"username": "testuser", "password": "testpassword123"}
    login_response = test_client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]
    
    # Return client with auth header
    test_client.headers["Authorization"] = f"Bearer {access_token}"
    yield test_client


def test_root_endpoint(test_client):
    """Test root endpoint returns API info."""
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "WH40k Colony Manager API" in data["message"]
    assert data["version"] == "0.1.0"


def test_list_colonies_empty(auth_client):
    """Test listing colonies when empty."""
    response = auth_client.get("/api/v1/colonies")
    assert response.status_code == 200
    assert response.json() == []


def test_create_and_get_colony(auth_client):
    """Test creating and retrieving a colony."""
    create_data = {"name": "Test Colony", "owner": "Test Rogue Trader", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    assert response.status_code == 201
    colony = response.json()
    assert colony["name"] == "Test Colony"
    assert "id" in colony
def test_colony_state_nested(auth_client):
    """Test that state is returned in nested format."""
    create_data = {"name": "State Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony = response.json()
    colony_id = colony["id"]
    
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/state")
    assert response.status_code == 200
    state = response.json()
    assert "size" in state
    assert "base" in state["size"]
    assert "current" in state["size"]
    assert "lore_state" in state["size"]


def test_update_colony(auth_client):
    """Test updating a colony."""
    create_data = {"name": "Update Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]
    
    update_data = {"name": "Updated Colony"}
    response = auth_client.put(f"/api/v1/colonies/{colony_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Colony"


def test_delete_colony(auth_client):
    """Test deleting a colony."""
    create_data = {"name": "Delete Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]
    
    response = auth_client.delete(f"/api/v1/colonies/{colony_id}")
    assert response.status_code == 204
    
    response = auth_client.get(f"/api/v1/colonies/{colony_id}")
    assert response.status_code == 404


def test_advance_colony_age(auth_client):
    """Test advancing colony age."""
    create_data = {"name": "Age Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]
    
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/age", params={"age_days": 30})
    assert response.status_code == 200
    assert response.json()["age_days"] == 30
def test_colony_modifiers(auth_client):
    """Test adding and listing modifiers."""
    create_data = {"name": "Modifier Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]
    
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifiers")
    assert response.status_code == 200
    assert response.json() == []
    
    modifier_data = {
        "modifier_source_type": "infrastructure",
        "modifier_stat": "complacency",
        "modifier_value": 5,
        "modifier_description": "Test infrastructure"
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier_data)
    assert response.status_code == 201
    modifier = response.json()
    assert modifier["modifier_value"] == 5
    
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifiers")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    modifier_id = modifier["id"]
    response = auth_client.delete(f"/api/v1/colonies/{colony_id}/modifiers/{modifier_id}")
    assert response.status_code == 204
    
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifiers")
    assert response.json() == []


def test_create_representative(auth_client):
    """Test creating and retrieving a representative."""
    create_data = {
        "name": "Test Rep",
        "type": "satrap",
        "personalities": [{"name": "Bold", "description": "Bold personality", "effect": "+1 Fel"}],
        "stats": {"ws": 30, "bs": 30, "s": 30, "t": 30, "ag": 30, "int": 45, "per": 35, "wp": 40, "fel": 50},
        "skills": [],
        "talents": []
    }
    response = auth_client.post("/api/v1/representatives", json=create_data)
    assert response.status_code == 201
    rep = response.json()
    assert rep["name"] == "Test Rep"
    assert rep["type"] == "satrap"
    assert "leadership_modifier" in rep
    
    rep_id = rep["id"]
    response = auth_client.get(f"/api/v1/representatives/{rep_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Rep"


def test_assign_representative(auth_client):
    """Test assigning representative to colony."""
    colony_data = {"name": "Colony for Rep", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=colony_data)
    colony_id = response.json()["id"]
    
    rep_data = {
        "name": "Assigned Rep",
        "type": "satrap",
        "personalities": [{"name": "Bold", "description": "Bold personality", "effect": "+1 Fel"}],
        "stats": {"ws": 30, "bs": 30, "s": 30, "t": 30, "ag": 30, "int": 45, "per": 35, "wp": 40, "fel": 50},
        "skills": [],
        "talents": []
    }
    response = auth_client.post("/api/v1/representatives", json=rep_data)
    rep_id = response.json()["id"]
    
    response = auth_client.post(f"/api/v1/representatives/{rep_id}/assign", params={"colony_id": colony_id})
    assert response.status_code == 200
    assert response.json()["assigned_to_colony_id"] == colony_id
def test_list_all_modifiers(auth_client):
    """Test listing all modifiers across colonies."""
    for i in range(2):
        colony_data = {"name": f"Colony {i}", "owner": "Owner", "colony_type": "mining_and_industry"}
        response = auth_client.post("/api/v1/colonies", json=colony_data)
        colony_id = response.json()["id"]
        
        modifier_data = {
            "modifier_source_type": "infrastructure",
            "modifier_stat": "order",
            "modifier_value": 3,
            "modifier_description": f"Test {i}"
        }
        auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier_data)
    
    response = auth_client.get("/api/v1/modifiers")
    assert response.status_code == 200
    modifiers = response.json()
    assert len(modifiers) == 2


def test_not_found_error(auth_client):
    """Test 404 error handling."""
    response = auth_client.get("/api/v1/colonies/999")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_docs_available(test_client):
    """Test that API docs are available."""
    response = test_client.get("/docs")
    assert response.status_code == 200
    assert "swagger" in response.text.lower() or "openapi" in response.text.lower()


