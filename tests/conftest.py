"""Pytest configuration and shared fixtures."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import colony_manager.adapters.api.dependencies as deps
from colony_manager.adapters.api.app import create_app
from colony_manager.adapters.persistence.db import init_db


@pytest.fixture(scope="function")
def test_client(tmp_path):
    """Create test client with isolated database."""
    from colony_manager.adapters.api.dependencies import init_rule_config_provider

    db_path = tmp_path / "test.db"

    # Override dependencies to use test database
    def override_get_db_path() -> Path:
        return db_path

    init_db(db_path)

    # Initialize rule config provider singleton for tests
    init_rule_config_provider()

    app = create_app()

    # Override the dependency after app creation
    app.dependency_overrides[deps.get_db_path] = override_get_db_path

    # Don't raise exceptions for HTTP errors - we want to test error responses
    client = TestClient(app, raise_server_exceptions=False)
    yield client

    # Cleanup
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_client(test_client, request):
    """Create authenticated test client with a test user using cookie-based auth."""
    # Use unique username per test to avoid conflicts
    test_name = (
        request.node.name.replace("[", "_")
        .replace("]", "_")
        .replace("(", "_")
        .replace(")", "_")[:20]
    )
    username = f"testuser_{test_name}"

    # Register a test user with admin role (password must meet complexity requirements)
    register_data = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "TestPass123!",
        "role": "admin",
    }
    response = test_client.post("/api/v1/auth/register", json=register_data)
    if response.status_code != 201:
        print(f"Registration failed: {response.status_code} - {response.text}")
    assert response.status_code == 201

    # Login to get cookies (cookie-based auth)
    login_data = {"username": username, "password": "TestPass123!"}
    login_response = test_client.post("/api/v1/auth/login", json=login_data)
    assert login_response.status_code == 200

    # The TestClient automatically handles cookies from Set-Cookie headers
    # Cookies are persisted for subsequent requests on the same client instance

    # Fetch CSRF token for state-changing requests (double-submit pattern)
    csrf_response = test_client.get("/api/v1/auth/csrf-token")
    assert csrf_response.status_code == 200
    csrf_token = csrf_response.json()["csrf_token"]
    test_client.headers["X-CSRF-Token"] = csrf_token

    return test_client


@pytest.fixture
def test_client_with_auth(tmp_path):
    """Create test client with initialized database (for auth tests)."""
    import colony_manager.adapters.api.dependencies as deps
    from colony_manager.adapters.api.dependencies import init_rule_config_provider
    from colony_manager.adapters.persistence.db import init_db

    db_path = tmp_path / "test.db"
    init_db(db_path)

    # Initialize rule config provider singleton for tests
    init_rule_config_provider()

    app = create_app()

    def override_get_db_path() -> Path:
        return db_path

    app.dependency_overrides[deps.get_db_path] = override_get_db_path

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
