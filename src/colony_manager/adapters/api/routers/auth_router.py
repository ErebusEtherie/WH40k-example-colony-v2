"""Authentication API router.

Provides endpoints for user registration, login, token refresh, and user management.

Security Features:
- Password validation (length, complexity)
- Rate limiting (prevents brute force attacks)
- Secure token handling
- Refresh token rotation
"""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from colony_manager.adapters.api.dependencies import get_user_repository
from colony_manager.adapters.api.middleware.auth import get_current_user, get_jwt_secret_key
from colony_manager.adapters.api.middleware.rate_limiter import (
    get_limiter,
    login_rate_limit,
    password_change_rate_limit,
    register_rate_limit,
    refresh_token_rate_limit,
)
from colony_manager.adapters.api.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from colony_manager.config.settings import get_security_settings
from colony_manager.domain.models.user import User, UserRole
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.auth import hash_password, verify_password
from colony_manager.domain.util.token import (
    TokenError,
    create_access_token,
    create_refresh_token,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["authentication"])
limiter = get_limiter()


class PasswordValidationError(Exception):
    """Exception raised when password validation fails."""


def validate_password(password: str, require_complexity: bool = True, min_length: int = 8) -> None:
    """Validate password meets security requirements.
    
    Args:
        password: Password to validate
        require_complexity: Whether to require mixed case, numbers, and special chars
        min_length: Minimum password length
        
    Raises:
        PasswordValidationError: If password does not meet requirements
    """
    if len(password) < min_length:
        raise PasswordValidationError(f"Password must be at least {min_length} characters long")
    
    if require_complexity:
        if not re.search(r"[A-Z]", password):
            raise PasswordValidationError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", password):
            raise PasswordValidationError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", password):
            raise PasswordValidationError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise PasswordValidationError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, openapi_extra={"security": []})
@limiter.limit(register_rate_limit())
def register(
    request: Request,
    register_request: RegisterRequest,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserResponse:
    """Register a new user account.
    
    This endpoint is public and does not require authentication.
    
    Password Requirements:
    - Minimum 8 characters (configurable)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    # Validate password strength
    settings = get_security_settings()
    try:
        validate_password(
            register_request.password,
            require_complexity=settings.require_password_complexity,
            min_length=settings.min_password_length,
        )
    except PasswordValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    
    existing = user_repository.get_by_username(register_request.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    
    existing = user_repository.get_by_email(register_request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    password_hash = hash_password(register_request.password)
    # Use provided role or default to VIEWER
    user_role = UserRole(register_request.role) if register_request.role else UserRole.VIEWER
    user = User(
        username=register_request.username,
        email=register_request.email,
        password_hash=password_hash,
        role=user_role,
        is_active=True,
    )
    
    try:
        created_user = user_repository.create(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    
    return UserResponse(
        id=created_user.id if created_user.id is not None else 0,
        username=created_user.username,
        email=created_user.email,
        role=created_user.role.value if hasattr(created_user.role, "value") else created_user.role,
        is_active=created_user.is_active,
        managed_colony_id=created_user.managed_colony_id,
    )


@router.post("/login", response_model=TokenResponse, openapi_extra={"security": []})
@limiter.limit(login_rate_limit())
def login(
    request: Request,
    login_request: LoginRequest,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> TokenResponse:
    """Authenticate user and return JWT tokens.
    
    This endpoint is public and does not require authentication.
    """
    user = user_repository.get_by_username(login_request.username)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    secret_key = get_jwt_secret_key()
    access_token = create_access_token(user, secret_key)
    refresh_token = create_refresh_token(user, secret_key)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=1800,
    )


@router.post("/refresh", response_model=TokenResponse, openapi_extra={"security": []})
@limiter.limit(refresh_token_rate_limit())
def refresh_token_endpoint(
    request: Request,
    refresh_request: RefreshTokenRequest,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> TokenResponse:
    """Refresh access token using refresh token.
    
    This endpoint is public and does not require authentication.
    
    Security: Implements refresh token rotation - old refresh token is
    invalidated when a new one is issued. If an old token is reused,
    all sessions for that user should be invalidated (future enhancement).
    """
    settings = get_security_settings()
    secret_key = get_jwt_secret_key()
    
    try:
        payload = verify_token(refresh_request.refresh_token, secret_key, token_type="refresh")
        user_id = int(payload["sub"])
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired refresh token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    
    user = user_repository.get_by_id(user_id)
    
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token rotation: issue new refresh token along with new access token
    # This provides security by invalidating old refresh tokens after use
    new_access_token = create_access_token(user, secret_key)
    new_refresh_token = create_refresh_token(user, secret_key)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,  # Rotated refresh token
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,  # Convert minutes to seconds
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current authenticated user information."""
    return UserResponse(
        id=current_user.id if current_user.id is not None else 0,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, "value") else current_user.role,
        is_active=current_user.is_active,
        managed_colony_id=current_user.managed_colony_id,
    )


@router.post("/change-password")
@limiter.limit(password_change_rate_limit())
def change_password(
    request: Request,
    password_change_request: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> dict[str, str]:
    """Change password for current user."""
    if not verify_password(password_change_request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    new_password_hash = hash_password(password_change_request.new_password)
    current_user.password_hash = new_password_hash
    
    try:
        user_repository.update(current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    
    return {"message": "Password changed successfully"}