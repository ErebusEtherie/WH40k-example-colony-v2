"""Authentication middleware for JWT token validation.

This module provides FastAPI dependencies for protecting routes with JWT
authentication. It extracts and validates tokens from the Authorization header
or cookies, and checks tokens against the blacklist for revocation support.
"""

from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from colony_manager.adapters.api.dependencies import (
    get_token_blacklist_repository,
    get_user_repository,
)
from colony_manager.config.settings import get_security_settings
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.token_blacklist_repository import TokenBlacklistRepository
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.token import TokenError, verify_token

# Error message constants to avoid duplication
ERR_TOKEN_REVOKED = "Token has been revoked"
ERR_USER_NOT_FOUND = "User not found"
ERR_USER_DEACTIVATED = "User account is deactivated"

# Security scheme for Bearer token
# scheme_name must match the OpenAPI security scheme name for Swagger UI to work correctly
security = HTTPBearer(scheme_name="HTTPBearer", auto_error=False)


def get_jwt_secret_key() -> str:
    """Get JWT secret key from settings.

    Returns:
        JWT secret key from environment/settings

    Raises:
        HTTPException: If JWT secret is not properly configured
    """
    settings = get_security_settings()
    return settings.jwt_secret_key


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_blacklist_repository: Annotated[
        TokenBlacklistRepository, Depends(get_token_blacklist_repository)
    ],
) -> User:
    """Get current authenticated user from JWT token.

    This dependency extracts the JWT token from the Authorization header,
    validates it, checks it against the blacklist, and retrieves the
    corresponding user from the repository.

    Args:
        credentials: HTTP Bearer credentials from request
        user_repository: Repository for user lookup
        token_blacklist_repository: Repository for checking token revocation

    Returns:
        Authenticated User object

    Raises:
        HTTPException: If authentication fails (401) or user not found (404)
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    secret_key = get_jwt_secret_key()

    try:
        # First verify the token is valid and not expired
        payload = verify_token(token, secret_key, token_type="access")
        user_id = int(payload["sub"])

        # Check if token is blacklisted (revoked)
        token_jti = payload.get("jti")
        if token_jti and token_blacklist_repository.is_blacklisted(token_jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ERR_TOKEN_REVOKED,
                headers={"WWW-Authenticate": "Bearer"},
            )
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
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
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


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
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validate token (same logic as Bearer token validation)
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
                headers={"WWW-Authenticate": "Bearer"},
            )
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
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
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_user_unified(
    request: Request,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_blacklist_repository: Annotated[
        TokenBlacklistRepository, Depends(get_token_blacklist_repository)
    ],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> User:
    """Get current user from cookie OR Bearer token (whichever is present).
    
    This unified dependency tries cookie-based auth first, then falls back to
    Bearer token auth. This allows backward compatibility during migration.
    
    Args:
        request: FastAPI request object to read cookies from
        user_repository: Repository for user lookup
        token_blacklist_repository: Repository for checking token revocation
        credentials: Optional Bearer token credentials from header
    
    Returns:
        Authenticated User object
    
    Raises:
        HTTPException: If authentication fails (401) or user not found (404)
    """
    settings = get_security_settings()
    
    # Try cookie first
    access_token = request.cookies.get(settings.cookie_access_token_name)
    
    # If no cookie, try Bearer header
    if not access_token and credentials:
        access_token = credentials.credentials
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validate token (same logic as other auth methods)
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
                headers={"WWW-Authenticate": "Bearer"},
            )
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
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
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def require_role(required_role: str) -> Callable[[User], User]:
    """Create a dependency that requires a specific user role.

    Args:
        required_role: Minimum role required (e.g., "admin", "colony_manager")

    Returns:
        A dependency function that checks user role
    """
    role_hierarchy = {
        "viewer": 0,
        "colony_manager": 1,
        "admin": 2,
    }

    required_level = role_hierarchy.get(required_role, 0)

    def check_role(user: Annotated[User, Depends(get_current_user_from_cookie)]) -> User:
        user_role = user.role.value if hasattr(user.role, "value") else user.role
        user_level = role_hierarchy.get(user_role, 0)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}",
            )

        return user

    return check_role
