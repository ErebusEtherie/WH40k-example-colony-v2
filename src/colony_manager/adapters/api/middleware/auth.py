"""Authentication middleware for JWT token validation.

This module provides FastAPI dependencies for protecting routes with JWT
authentication. It extracts and validates tokens from the Authorization header.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from colony_manager.adapters.api.dependencies import get_user_repository
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.token import TokenError, get_user_id_from_token

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


def get_secret_key() -> str:
    """Get JWT secret key from environment."""
    import os
    return os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> User:
    """Get current authenticated user from JWT token.
    
    This dependency extracts the JWT token from the Authorization header,
    validates it, and retrieves the corresponding user from the repository.
    
    Args:
        credentials: HTTP Bearer credentials from request
        user_repository: Repository for user lookup
        
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
    secret_key = get_secret_key()
    
    try:
        user_id = get_user_id_from_token(token, secret_key)
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    
    user = user_repository.get_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def require_role(required_role: str) -> object:
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
    
    def check_role(user: Annotated[User, Depends(get_current_user)]) -> User:
        user_role = user.role.value if hasattr(user.role, "value") else user.role
        user_level = role_hierarchy.get(user_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}",
            )
        
        return user
    
    return check_role