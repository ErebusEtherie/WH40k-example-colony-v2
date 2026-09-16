"""Authentication middleware for JWT token validation.

This module provides FastAPI dependencies for protecting routes with JWT
authentication. It extracts and validates tokens from HttpOnly cookies
and checks tokens against the blacklist for revocation support.
"""

from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status

from colony_manager.adapters.api.dependencies import (
    get_token_blacklist_repository,
    get_user_repository,
)
from colony_manager.config.settings import get_security_settings
from colony_manager.domain.models.user import User, UserRole
from colony_manager.domain.ports.token_blacklist_repository import TokenBlacklistRepository
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.token import TokenError, verify_token

# Error message constants to avoid duplication
ERR_TOKEN_REVOKED = "Token has been revoked"
ERR_USER_NOT_FOUND = "User not found"
ERR_USER_DEACTIVATED = "User account is deactivated"


def get_jwt_secret_key() -> str:
    """Get JWT secret key from settings.

    Returns:
        JWT secret key from environment/settings

    Raises:
        HTTPException: If JWT secret is not properly configured
    """
    settings = get_security_settings()
    return settings.jwt_secret_key


def get_current_user_from_cookie(
    request: Request,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_blacklist_repository: Annotated[
        TokenBlacklistRepository, Depends(get_token_blacklist_repository)
    ],
) -> User:
    """Get current authenticated user from cookie-based authentication.

    Reads access token from HttpOnly cookie instead of Authorization header.
    Used for frontend that uses cookie-based auth.

    Args:
        request: FastAPI request object to read cookies from
        user_repository: Repository for user lookup
        token_blacklist_repository: Repository for checking token revocation

    Returns:
        Authenticated User object

    Raises:
        HTTPException: If authentication fails (401) or user not found (404)
    """
    settings = get_security_settings()

    # Try to get token from cookie
    access_token = request.cookies.get(settings.cookie_access_token_name)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    # Validate the access token (delivered via HttpOnly cookie)
    secret_key = get_jwt_secret_key()

    try:
        payload = verify_token(access_token, secret_key, token_type="access")
        user_id = int(payload["sub"])

        # Check if token is blacklisted (revoked)
        token_jti = payload.get("jti")
        if token_jti and token_blacklist_repository.is_blacklisted(token_jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ERR_TOKEN_REVOKED,
            )
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        ) from e
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
        ) from e

    user = user_repository.get_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ERR_USER_NOT_FOUND,
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERR_USER_DEACTIVATED,
        )

    return user


def require_role(required_role: str | UserRole) -> Callable[[User], User]:
    """Create a dependency that requires a specific user role.

    The role-ordering rule itself lives in the domain ``UserRole`` enum
    (``meets_or_exceeds``), so this adapter only coerces the boundary argument
    to a role and delegates the comparison — it does not re-implement the
    hierarchy (see 01-architecture.md / 02-domain-modeling.md).

    Args:
        required_role: Minimum role required (e.g., "admin", "colony_manager").

    Returns:
        A dependency function that checks user role
    """
    required: UserRole = (
        required_role if isinstance(required_role, UserRole) else UserRole(required_role)
    )

    def check_role(user: Annotated[User, Depends(get_current_user_from_cookie)]) -> User:
        if not user.role.meets_or_exceeds(required):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required.value}",
            )

        return user

    return check_role
