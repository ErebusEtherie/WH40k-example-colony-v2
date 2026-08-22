"""Pytest configuration and shared fixtures."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from colony_manager.adapters.api.app import create_app
from colony_manager.adapters.persistence.db import init_db
import colony_manager.adapters.api.dependencies as deps


@pytest.fixture
def test_client(tmp_path):
    """Create test client with isolated database."""
    db_path = tmp_path / "test.db"
    
    # Override dependencies to use test database
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
    # Register a test user with colony_manager role (password must meet complexity requirements)
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
        "role": "colony_manager",
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
def test_client_with_auth(tmp_path):
    """Create test client with initialized database (for auth tests)."""
    from colony_manager.adapters.persistence.db import init_db
    import colony_manager.adapters.api.dependencies as deps
    
    db_path = tmp_path / "test.db"
    init_db(db_path)
    app = create_app()
    
    def override_get_db_path() -> Path:
        return db_path
    
    app.dependency_overrides[deps.get_db_path] = override_get_db_path
    
    client = TestClient(app)
    yield client
    
    app.dependency_overrides.clear()