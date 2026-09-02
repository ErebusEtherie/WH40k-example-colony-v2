"""Application settings and configuration management.

This module provides centralized configuration management using pydantic-settings.
All settings are loaded from environment variables with sensible defaults for development.

Security Note: In production, JWT_SECRET_KEY must be set via environment variable.
The application will refuse to start with the default development key in production mode.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class SecuritySettings(BaseSettings):
    """Security-related settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # JWT Configuration
    jwt_secret_key: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT token signing. MUST be changed in production.",
        min_length=16,
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    access_token_expire_minutes: int = Field(
        default=30, description="Access token expiration in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=7, description="Refresh token expiration in days"
    )

    # Password Policy
    min_password_length: int = Field(default=8, description="Minimum password length", ge=6)
    require_password_complexity: bool = Field(
        default=True, description="Require password complexity"
    )

    # Rate Limiting
    rate_limit_enabled: bool = Field(
        default=True, description="Enable rate limiting on auth endpoints"
    )
    max_login_attempts: int = Field(
        default=5, description="Max login attempts before lockout", ge=1
    )
    lockout_duration_minutes: int = Field(
        default=15, description="Lockout duration in minutes", ge=1
    )

    # Cookie Configuration (httpOnly for security)
    cookie_secure: bool = Field(
        default=False, description="Use secure cookies (HTTPS only). Enable in production."
    )
    cookie_samesite: str = Field(
        default="lax", description="Cookie SameSite attribute (lax, strict, none)"
    )
    cookie_httponly: bool = Field(
        default=True, description="Use httpOnly cookies (prevents XSS theft)"
    )
    cookie_access_token_name: str = Field(
        default="rt_access_token", description="Cookie name for access token"
    )
    cookie_refresh_token_name: str = Field(
        default="rt_refresh_token", description="Cookie name for refresh token"
    )

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Validate JWT secret key is not the development default in production."""
        import os

        environment = os.getenv("ENVIRONMENT", "development")
        if environment != "development" and v == "dev-secret-key-change-in-production":
            raise ValueError(
                "JWT_SECRET_KEY must be set to a secure value in production. "
                'Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        return v


class CORSSettings(BaseSettings):
    """CORS configuration settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    allowed_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated list of allowed CORS origins",
    )

    def get_origins_list(self) -> list[str]:
        """Parse allowed origins into a list.

        Returns default localhost origins if allowed_origins is empty or whitespace-only.
        """
        origins = [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        # Return defaults if no valid origins provided
        if not origins:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return origins


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_path: str = Field(
        default="colony_manager.sqlite", description="Path to SQLite database file"
    )

    def get_database_url(self) -> str:
        """Build SQLite database URL from path."""
        resolved = Path(self.database_path).expanduser().resolve()
        resolved.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{resolved.as_posix()}"


class ApplicationSettings(BaseSettings):
    """General application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = Field(
        default="development",
        description="Environment: development, staging, production",
    )
    log_level: str = Field(default="INFO", description="Logging level")

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value."""
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"Environment must be one of: {', '.join(allowed)}")
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level value."""
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        if v not in allowed:
            raise ValueError(f"Log level must be one of: {', '.join(allowed)}")
        return v


@lru_cache
def get_security_settings() -> SecuritySettings:
    """Get cached security settings instance."""
    return SecuritySettings()


@lru_cache
def get_cors_settings() -> CORSSettings:
    """Get cached CORS settings instance."""
    return CORSSettings()


@lru_cache
def get_database_settings() -> DatabaseSettings:
    """Get cached database settings instance."""
    return DatabaseSettings()


@lru_cache
def get_application_settings() -> ApplicationSettings:
    """Get cached application settings instance."""
    return ApplicationSettings()
