"""JWT token utilities for authentication.

Provides functions for creating and verifying JWT tokens. This module
handles token creation, validation, and extraction of user claims.

Token expiration times are configurable via settings:
- Access tokens: 30 minutes (default)
- Refresh tokens: 7 days (default)

Each token includes a unique 'jti' (JWT ID) claim for token revocation support.
"""

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from colony_manager.domain.models.user import User

# Token expiration defaults (can be overridden via settings)
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
DEFAULT_REFRESH_TOKEN_EXPIRE_DAYS = 7


class TokenError(Exception):
    """Exception raised for token-related errors."""


def create_access_token(
    user: User,
    secret_key: str,
    algorithm: str = "HS256",
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token for a user.

    Args:
        user: User to create token for
        secret_key: Secret key for signing the token
        algorithm: JWT algorithm to use (default: HS256)
        expires_delta: Token expiration time (default: 30 minutes)

    Returns:
        Encoded JWT token string

    Note:
        Token includes a unique 'jti' (JWT ID) claim for revocation support.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(UTC) + expires_delta
    token_id = secrets.token_urlsafe(16)  # Unique token identifier

    to_encode: dict[str, Any] = {
        "sub": str(user.id),  # Subject (user ID)
        "username": user.username,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "access",
        "jti": token_id,  # JWT ID for revocation
    }

    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def create_refresh_token(
    user: User,
    secret_key: str,
    algorithm: str = "HS256",
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT refresh token for a user.

    Refresh tokens have longer expiration and are used to obtain new
    access tokens without requiring the user to log in again.

    Args:
        user: User to create token for
        secret_key: Secret key for signing the token
        algorithm: JWT algorithm to use (default: HS256)
        expires_delta: Token expiration time (default: 7 days)

    Returns:
        Encoded JWT token string

    Note:
        Token includes a unique 'jti' (JWT ID) claim for revocation support.
    """
    if expires_delta is None:
        expires_delta = timedelta(days=DEFAULT_REFRESH_TOKEN_EXPIRE_DAYS)

    expire = datetime.now(UTC) + expires_delta
    token_id = secrets.token_urlsafe(16)  # Unique token identifier

    to_encode: dict[str, Any] = {
        "sub": str(user.id),
        "username": user.username,
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "refresh",
        "jti": token_id,  # JWT ID for revocation
    }

    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def verify_token(
    token: str,
    secret_key: str,
    algorithm: str = "HS256",
    token_type: str = "access",
) -> dict[str, Any]:
    """Verify and decode a JWT token.

    Args:
        token: JWT token string to verify
        secret_key: Secret key for verification
        algorithm: JWT algorithm used (default: HS256)
        token_type: Expected token type ("access" or "refresh")

    Returns:
        Decoded token payload as dictionary

    Raises:
        TokenError: If token is invalid, expired, or wrong type
    """
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])

        # Verify token type
        if payload.get("type") != token_type:
            raise TokenError(f"Invalid token type. Expected {token_type}")

        return payload

    except jwt.ExpiredSignatureError as e:
        raise TokenError("Token has expired") from e
    except jwt.InvalidTokenError as e:
        raise TokenError(f"Invalid token: {e}") from e


def get_user_id_from_token(token: str, secret_key: str) -> int:
    """Extract user ID from a valid token.

    Args:
        token: JWT token string
        secret_key: Secret key for verification

    Returns:
        User ID as integer

    Raises:
        TokenError: If token is invalid or user ID cannot be extracted
    """
    payload = verify_token(token, secret_key)
    user_id = payload.get("sub")

    if user_id is None:
        raise TokenError("Token does not contain user ID")

    try:
        return int(user_id)
    except (ValueError, TypeError) as e:
        raise TokenError(f"Invalid user ID in token: {e}") from e
