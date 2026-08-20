"""Rate limiting configuration tests.

These tests verify that rate limiting is properly configured for auth endpoints.
Note: Actual rate limiting enforcement is tested in integration/E2E tests,
as unit tests disable rate limiting to prevent test interference.
"""

import pytest

from colony_manager.adapters.api.middleware.rate_limiter import (
    login_rate_limit,
    password_change_rate_limit,
    register_rate_limit,
    refresh_token_rate_limit,
)


class TestRateLimitConfiguration:
    """Test rate limit configuration values."""

    def test_login_rate_limit_config(self) -> None:
        """Test that login rate limit is configured correctly."""
        limit = login_rate_limit()
        assert "minute" in limit

    def test_register_rate_limit_config(self) -> None:
        """Test that registration rate limit is configured correctly."""
        limit = register_rate_limit()
        assert limit == "3/minute"

    def test_refresh_token_rate_limit_config(self) -> None:
        """Test that refresh token rate limit is configured correctly."""
        limit = refresh_token_rate_limit()
        assert limit == "10/minute"

    def test_password_change_rate_limit_config(self) -> None:
        """Test that password change rate limit is configured correctly."""
        limit = password_change_rate_limit()
        assert limit == "5/minute"

    def test_rate_limit_format(self) -> None:
        """Test that all rate limits follow the correct format."""
        limits = [
            login_rate_limit(),
            register_rate_limit(),
            refresh_token_rate_limit(),
            password_change_rate_limit(),
        ]
        for limit in limits:
            assert "/" in limit
            assert any(period in limit for period in ["minute", "hour", "day"])