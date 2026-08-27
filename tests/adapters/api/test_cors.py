"""CORS configuration tests.

Tests for Cross-Origin Resource Sharing (CORS) middleware configuration.
Verifies that the API correctly handles preflight requests, allowed origins,
and credentials.
"""

import pytest
from fastapi.testclient import TestClient

from colony_manager.adapters.api.app import create_app, get_allowed_origins
from colony_manager.adapters.persistence.db import init_db
from colony_manager.config.settings import get_cors_settings


@pytest.fixture
def test_client_with_defaults(tmp_path, monkeypatch):
    """Create test client with default CORS settings (localhost)."""
    db_path = tmp_path / "test.db"

    # Clear cache and ensure ALLOWED_ORIGINS is not set for default tests
    get_cors_settings.cache_clear()
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)

    import colony_manager.adapters.api.dependencies as deps

    init_db(db_path)
    app = create_app()
    app.dependency_overrides[deps.get_db_path] = lambda: db_path

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


@pytest.fixture
def test_client_with_custom_origins(tmp_path, monkeypatch):
    """Create test client with custom CORS origins."""
    db_path = tmp_path / "test.db"

    # Clear cache and set custom origins for production-like testing
    get_cors_settings.cache_clear()
    monkeypatch.setenv(
        "ALLOWED_ORIGINS", "https://colony.example.com, https://admin.colony.example.com"
    )

    import colony_manager.adapters.api.dependencies as deps

    init_db(db_path)
    app = create_app()
    app.dependency_overrides[deps.get_db_path] = lambda: db_path

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


class TestGetAllowedOrigins:
    """Tests for the get_allowed_origins utility function."""

    def test_default_origins_when_env_not_set(self, monkeypatch):
        """Test default localhost origins when ALLOWED_ORIGINS is not set."""
        get_cors_settings.cache_clear()
        monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
        origins = get_allowed_origins()
        assert origins == ["http://localhost:3000", "http://127.0.0.1:3000"]

    def test_custom_origins_from_env(self, monkeypatch):
        """Test custom origins parsed from environment variable."""
        get_cors_settings.cache_clear()
        monkeypatch.setenv(
            "ALLOWED_ORIGINS", "https://prod.example.com, https://staging.example.com"
        )
        origins = get_allowed_origins()
        assert origins == ["https://prod.example.com", "https://staging.example.com"]

    def test_origins_with_whitespace(self, monkeypatch):
        """Test that whitespace around origins is stripped."""
        get_cors_settings.cache_clear()
        monkeypatch.setenv(
            "ALLOWED_ORIGINS", "https://example.com ,  https://test.com  ,https://another.com"
        )
        origins = get_allowed_origins()
        assert origins == [
            "https://example.com",
            "https://test.com",
            "https://another.com",
        ]

    def test_empty_env_var_returns_default(self, monkeypatch):
        """Test that empty ALLOWED_ORIGINS returns defaults."""
        get_cors_settings.cache_clear()
        monkeypatch.setenv("ALLOWED_ORIGINS", "")
        origins = get_allowed_origins()
        assert origins == ["http://localhost:3000", "http://127.0.0.1:3000"]

    def test_single_origin(self, monkeypatch):
        """Test single origin without commas."""
        get_cors_settings.cache_clear()
        monkeypatch.setenv("ALLOWED_ORIGINS", "https://single.example.com")
        origins = get_allowed_origins()
        assert origins == ["https://single.example.com"]


class TestCORSWithDefaultOrigins:
    """Tests for CORS behavior with default localhost origins."""

    def test_preflight_request_allowed_origin(self, test_client_with_defaults):
        """Test OPTIONS preflight request with allowed origin."""
        response = test_client_with_defaults.options(
            "/api/v1/colonies",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"
        assert "POST" in response.headers.get("Access-Control-Allow-Methods", "")
        assert "Content-Type" in response.headers.get("Access-Control-Allow-Headers", "")

    def test_preflight_request_with_credentials(self, test_client_with_defaults):
        """Test that credentials are allowed in preflight."""
        response = test_client_with_defaults.options(
            "/api/v1/colonies",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("Access-Control-Allow-Credentials") == "true"

    def test_actual_request_with_allowed_origin(self, test_client_with_defaults):
        """Test actual GET request with allowed origin."""
        response = test_client_with_defaults.get(
            "/",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200
        assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"

    def test_actual_request_with_alternate_localhost(self, test_client_with_defaults):
        """Test GET request with alternate localhost origin."""
        response = test_client_with_defaults.get(
            "/",
            headers={"Origin": "http://127.0.0.1:3000"},
        )
        assert response.status_code == 200
        assert response.headers.get("Access-Control-Allow-Origin") == "http://127.0.0.1:3000"

    def test_preflight_request_unallowed_origin(self, test_client_with_defaults):
        """Test OPTIONS preflight request with disallowed origin."""
        response = test_client_with_defaults.options(
            "/api/v1/colonies",
            headers={
                "Origin": "https://malicious-site.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        # FastAPI's CORSMiddleware returns 400 for disallowed origins in preflight
        assert response.status_code == 400
        # The origin should NOT be reflected back
        allow_origin = response.headers.get("Access-Control-Allow-Origin")
        assert allow_origin != "https://malicious-site.com"

    def test_actual_request_unallowed_origin(self, test_client_with_defaults):
        """Test actual request with disallowed origin."""
        response = test_client_with_defaults.get(
            "/",
            headers={"Origin": "https://malicious-site.com"},
        )
        assert response.status_code == 200
        allow_origin = response.headers.get("Access-Control-Allow-Origin")
        assert allow_origin != "https://malicious-site.com"


class TestCORSWithCustomOrigins:
    """Tests for CORS behavior with custom production origins."""

    def test_preflight_with_production_origin(self, test_client_with_custom_origins):
        """Test OPTIONS preflight with production origin."""
        response = test_client_with_custom_origins.options(
            "/api/v1/colonies",
            headers={
                "Origin": "https://colony.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("Access-Control-Allow-Origin") == "https://colony.example.com"

    def test_preflight_with_admin_origin(self, test_client_with_custom_origins):
        """Test OPTIONS preflight with admin origin."""
        response = test_client_with_custom_origins.options(
            "/api/v1/representatives",
            headers={
                "Origin": "https://admin.colony.example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type, Authorization",
            },
        )
        assert response.status_code == 200
        assert (
            response.headers.get("Access-Control-Allow-Origin")
            == "https://admin.colony.example.com"
        )
        assert "Authorization" in response.headers.get("Access-Control-Allow-Headers", "")

    def test_actual_request_with_production_origin(self, test_client_with_custom_origins):
        """Test actual GET request with production origin."""
        response = test_client_with_custom_origins.get(
            "/",
            headers={"Origin": "https://colony.example.com"},
        )
        assert response.status_code == 200
        assert response.headers.get("Access-Control-Allow-Origin") == "https://colony.example.com"

    def test_request_with_unlisted_origin(self, test_client_with_custom_origins):
        """Test request with origin not in allowed list."""
        response = test_client_with_custom_origins.get(
            "/",
            headers={"Origin": "https://unauthorized.com"},
        )
        assert response.status_code == 200
        allow_origin = response.headers.get("Access-Control-Allow-Origin")
        assert allow_origin != "https://unauthorized.com"
        assert allow_origin not in [
            "https://colony.example.com",
            "https://admin.colony.example.com",
        ]

    def test_localhost_not_allowed_with_custom_origins(self, test_client_with_custom_origins):
        """Test that localhost is NOT allowed when custom origins are set."""
        response = test_client_with_custom_origins.get(
            "/",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200
        allow_origin = response.headers.get("Access-Control-Allow-Origin")
        assert allow_origin != "http://localhost:3000"


class TestCORSMethodsAndHeaders:
    """Tests for allowed methods and headers in CORS."""

    def test_all_allowed_methods(self, test_client_with_defaults):
        """Test that all configured methods are allowed."""
        methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
        for method in methods:
            response = test_client_with_defaults.options(
                "/api/v1/colonies",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": method,
                },
            )
            assert response.status_code == 200
            assert method in response.headers.get("Access-Control-Allow-Methods", "")

    def test_authorization_header_allowed(self, test_client_with_defaults):
        """Test that Authorization header is allowed for authentication."""
        response = test_client_with_defaults.options(
            "/api/v1/colonies",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
        assert response.status_code == 200
        assert "Authorization" in response.headers.get("Access-Control-Allow-Headers", "")

    def test_content_type_header_allowed(self, test_client_with_defaults):
        """Test that Content-Type header is allowed."""
        response = test_client_with_defaults.options(
            "/api/v1/colonies",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert response.status_code == 200
        assert "Content-Type" in response.headers.get("Access-Control-Allow-Headers", "")


class TestCORSCredentials:
    """Tests for credentials handling in CORS."""

    def test_credentials_header_present(self, test_client_with_defaults):
        """Test that Access-Control-Allow-Credentials is set to true."""
        response = test_client_with_defaults.options(
            "/api/v1/colonies",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.headers.get("Access-Control-Allow-Credentials") == "true"

    def test_credentials_with_actual_request(self, test_client_with_defaults):
        """Test credentials header is present in actual requests."""
        response = test_client_with_defaults.get(
            "/",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.headers.get("Access-Control-Allow-Credentials") == "true"

    def test_vary_header_present(self, test_client_with_defaults):
        """Test that Vary header is set (important for caching with CORS)."""
        response = test_client_with_defaults.get(
            "/",
            headers={"Origin": "http://localhost:3000"},
        )
        vary_header = response.headers.get("Vary", "")
        assert "Origin" in vary_header
