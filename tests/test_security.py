"""Security tests for authentication and input validation."""

import pytest

from colony_manager.adapters.api.routers.auth_router import (
    PasswordValidationError,
    validate_password,
)
from colony_manager.config.settings import get_security_settings
from colony_manager.domain.util.token import TokenError, create_access_token, create_refresh_token, verify_token


class TestPasswordValidation:
    """Test password validation logic."""

    def test_password_too_short(self) -> None:
        """Test that short passwords are rejected."""
        with pytest.raises(PasswordValidationError, match="at least 8 characters"):
            validate_password("Short1!", min_length=8)

    def test_password_missing_uppercase(self) -> None:
        """Test that passwords without uppercase are rejected."""
        with pytest.raises(PasswordValidationError, match="uppercase"):
            validate_password("lowercase123!", require_complexity=True)

    def test_password_missing_lowercase(self) -> None:
        """Test that passwords without lowercase are rejected."""
        with pytest.raises(PasswordValidationError, match="lowercase"):
            validate_password("UPPERCASE123!", require_complexity=True)

    def test_password_missing_number(self) -> None:
        """Test that passwords without numbers are rejected."""
        with pytest.raises(PasswordValidationError, match="number"):
            validate_password("NoNumbers!ABC", require_complexity=True)

    def test_password_missing_special_char(self) -> None:
        """Test that passwords without special characters are rejected."""
        with pytest.raises(PasswordValidationError, match="special"):
            validate_password("NoSpecial123ABC", require_complexity=True)

    def test_password_valid(self) -> None:
        """Test that valid passwords pass validation."""
        validate_password("SecurePass123!", require_complexity=True, min_length=8)

    def test_password_complexity_disabled(self) -> None:
        """Test that complexity requirements can be disabled."""
        validate_password("simple", require_complexity=False, min_length=6)

    def test_password_custom_min_length(self) -> None:
        """Test custom minimum length enforcement."""
        with pytest.raises(PasswordValidationError, match="at least 12 characters"):
            validate_password("Short1!", require_complexity=False, min_length=12)
        validate_password("longenoughpassword", require_complexity=False, min_length=12)


class TestTokenSecurity:
    """Test JWT token security features."""

    def test_token_type_validation(self, sample_user: object) -> None:
        """Test that token type is validated."""
        secret = "test-secret-key-for-testing-only-12345"
        access_token = create_access_token(sample_user, secret)  # type: ignore[arg-type]
        with pytest.raises(TokenError, match="Invalid token type"):
            verify_token(access_token, secret, token_type="refresh")

    def test_invalid_signature(self, sample_user: object) -> None:
        """Test that tokens signed with different key are rejected."""
        secret1 = "secret-key-one-for-testing-1234567"
        secret2 = "secret-key-two-for-testing-7654321"
        token = create_access_token(sample_user, secret1)  # type: ignore[arg-type]
        with pytest.raises(TokenError, match="Invalid token"):
            verify_token(token, secret2, token_type="access")


class TestSecuritySettings:
    """Test security configuration settings."""

    def test_default_password_requirements(self) -> None:
        """Test default password policy settings."""
        settings = get_security_settings()
        assert settings.min_password_length >= 8
        assert settings.require_password_complexity is True

    def test_jwt_secret_validation(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test JWT secret validation in production mode."""
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
        get_security_settings.cache_clear()
        with pytest.raises(ValueError, match="JWT_SECRET_KEY must be set"):
            get_security_settings()
        get_security_settings.cache_clear()
        monkeypatch.setenv("ENVIRONMENT", "development")


@pytest.fixture
def sample_user() -> object:
    """Create a sample user for token tests."""
    from colony_manager.domain.models.user import User, UserRole

    return User(
        id=1,
        username="test_user",
        email="test@example.com",
        password_hash="hashed_password",
        role=UserRole.VIEWER,
        is_active=True,
    )