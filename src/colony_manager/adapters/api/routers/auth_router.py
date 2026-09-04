"""Authentication API router.

Provides endpoints for user registration, login, token refresh, and user management.

Security Features:
- Password validation (length, complexity)
- Rate limiting (prevents brute force attacks)
- Secure token handling
- Refresh token rotation
"""

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from colony_manager.adapters.api.dependencies import get_auth_service, get_user_repository
from colony_manager.adapters.api.middleware.auth import (
    get_current_user_from_cookie,
    get_jwt_secret_key,
)
from colony_manager.adapters.api.middleware.rate_limiter import (
    get_limiter,
    login_rate_limit,
    password_change_rate_limit,
    refresh_token_rate_limit,
    register_rate_limit,
)
from colony_manager.adapters.api.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    TokenRevokeAllRequest,
    TokenRevokeRequest,
    TokenRevokeResponse,
    UserResponse,
)
from colony_manager.application.services.auth_service import AuthService
from colony_manager.config.settings import get_security_settings
from colony_manager.domain.models.user import User, UserRole
from colony_manager.domain.ports.user_repository import UserRepository
from colony_manager.domain.util.auth import (
    PasswordValidationError,
    hash_password,
    validate_password,
    verify_password,
)
from colony_manager.domain.util.token import (
    TokenError,
    create_access_token,
    create_refresh_token,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["authentication"])
limiter = get_limiter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    openapi_extra={"security": []},
    responses={
        201: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "username": "rogue_trader",
                        "email": "trader@voidship.com",
                        "role": "viewer",
                        "is_active": True,
                    }
                }
            },
        },
        400: {
            "description": "Invalid input (username/email exists, weak password)",
            "content": {
                "application/json": {
                    "example": {"detail": "Username already exists"}
                }
            },
        },
    },
    tags=["authentication"],
)
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
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    openapi_extra={"security": []},
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 1800,
                    }
                }
            },
        },
        401: {"description": "Invalid credentials"},
        423: {"description": "Account locked due to too many failed attempts"},
    },
    tags=["authentication"],
)
@limiter.limit(login_rate_limit())
def login(
    request: Request,
    login_request: LoginRequest,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> JSONResponse:
    """Authenticate user and return JWT tokens.

    This endpoint is public and does not require authentication.

    Security:
    - Account lockout after 5 failed attempts within 15 minutes
    - Lockout duration: 15 minutes
    - All attempts are logged for audit purposes
    """
    # Extract client information for audit logging
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Check if account is locked before attempting authentication
    if auth_service.is_account_locked(login_request.username):
        # Log the attempt even though locked
        auth_service.track_login_attempt(
            username=login_request.username,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repository.get_by_username(login_request.username)

    if user is None:
        # Log failed attempt
        auth_service.track_login_attempt(
            username=login_request.username,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        # Log the attempt
        auth_service.track_login_attempt(
            username=login_request.username,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_request.password, user.password_hash):
        # Log failed attempt
        auth_service.track_login_attempt(
            username=login_request.username,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log successful login
    auth_service.track_login_attempt(
        username=login_request.username,
        success=True,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Create tokens with issuance tracking
    secret_key = get_jwt_secret_key()
    access_token, refresh_token = auth_service.create_tokens_with_tracking(
        user=user,
        secret_key=secret_key,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Get cookie settings
    settings = get_security_settings()

    # Create response with user info
    response = JSONResponse(
        content={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }
    )

    # Set httpOnly cookies for secure token storage
    response.set_cookie(
        key=settings.cookie_access_token_name,
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,  # type: ignore[arg-type]
        path="/",
    )
    response.set_cookie(
        key=settings.cookie_refresh_token_name,
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,  # type: ignore[arg-type]
        path="/",
    )

    return response


@router.get("/csrf-token", openapi_extra={"security": []})
async def get_csrf_token(request: Request) -> JSONResponse:
    """Generate and return a CSRF token for the current session.
    
    The CSRF token is stored in a non-HttpOnly cookie so JavaScript can read it
    and include it in the X-CSRF-Token header for state-changing requests.
    
    This endpoint is public and does not require authentication.
    """
    csrf_token = secrets.token_urlsafe(32)
    
    response = JSONResponse(content={"csrf_token": csrf_token})
    
    # Set CSRF token in a non-HttpOnly cookie (JavaScript needs to read it)
    settings = get_security_settings()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=60 * 60,  # 1 hour
        httponly=False,  # Must be readable by JavaScript
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )
    
    return response


@router.post("/refresh", response_model=TokenResponse, openapi_extra={"security": []}, responses={401: {"description": "Invalid token"}})
@limiter.limit(refresh_token_rate_limit())
def refresh_token_endpoint(
    request: Request,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> JSONResponse:
    """Refresh access token using refresh token from cookie.
    
    The refresh token is automatically sent via HttpOnly cookie.
    Returns new access/refresh tokens as HttpOnly cookies.
    
    This endpoint is public and does not require authentication.
    
    Security: Implements refresh token rotation - old refresh token is
    invalidated when a new one is issued. If an old token is reused,
    all sessions for that user should be invalidated (future enhancement).
    """
    settings = get_security_settings()
    secret_key = get_jwt_secret_key()
    
    # Get refresh token from cookie
    refresh_token = request.cookies.get(settings.cookie_refresh_token_name)
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found. Please log in again.",
        )
    
    try:
        payload = verify_token(refresh_token, secret_key, token_type="refresh")
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
    
    # Create response with new tokens
    response = JSONResponse(
        content={
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }
    )
    
    # Set httpOnly cookies for secure token storage (token rotation)
    response.set_cookie(
        key=settings.cookie_access_token_name,
        value=new_access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,  # type: ignore[arg-type]
        path="/",
    )
    response.set_cookie(
        key=settings.cookie_refresh_token_name,
        value=new_refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,  # type: ignore[arg-type]
        path="/",
    )
    
    return response


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user_from_cookie)],
) -> UserResponse:
    """Get current authenticated user information."""
    return UserResponse(
        id=current_user.id if current_user.id is not None else 0,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, "value") else current_user.role,
        is_active=current_user.is_active,
    )


@router.post("/change-password")
@limiter.limit(password_change_rate_limit())
def change_password(
    request: Request,
    password_change_request: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user_from_cookie)],
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


@router.post("/revoke", response_model=TokenRevokeResponse, responses={400: {"description": "Invalid token"}})
@limiter.limit(refresh_token_rate_limit())
def revoke_token(
    request: Request,
    revoke_request: TokenRevokeRequest,
    current_user: Annotated[User, Depends(get_current_user_from_cookie)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> JSONResponse:
    """Revoke current access token (logout).

    This endpoint adds the current token to the blacklist, preventing
    further use even if the token hasn't expired yet.

    Uses cookie-based authentication for frontend compatibility.
    The client should discard the token after calling this endpoint.
    """
    # Get token from cookie (cookie-based auth for frontend)
    settings = get_security_settings()
    access_token = request.cookies.get(settings.cookie_access_token_name)
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access token cookie not found",
        )
    
    secret_key = get_jwt_secret_key()

    try:
        auth_service.revoke_token(access_token, secret_key, reason=revoke_request.reason or "logout")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    # Create response
    response = JSONResponse(
        content={"message": "Token revoked successfully", "tokens_revoked": 1}
    )

    # Clear httpOnly cookies on logout
    settings = get_security_settings()
    response.delete_cookie(
        key=settings.cookie_access_token_name,
        path="/",
    )
    response.delete_cookie(
        key=settings.cookie_refresh_token_name,
        path="/",
    )

    return response


@router.post("/revoke-all", responses={403: {"description": "Forbidden"}, 404: {"description": "User not found"}})
def revoke_all_tokens(
    revoke_request: TokenRevokeAllRequest,
    current_user: Annotated[User, Depends(get_current_user_from_cookie)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenRevokeResponse:
    """Revoke all tokens for a user.

    For regular users: Revokes all tokens for the current user.
    For admins: Can revoke tokens for any user by specifying user_id.

    This is useful for:
    - Password changes (revoke all sessions)
    - Suspected account compromise
    - User deactivation
    """
    # Check if user is trying to revoke another user's tokens
    target_user_id = revoke_request.user_id or (current_user.id if current_user.id else 0)

    # Only admins can revoke tokens for other users
    user_role = (
        current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    )
    if target_user_id != current_user.id and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can revoke tokens for other users",
        )

    # Verify target user exists
    target_user = auth_service.get_user(target_user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {target_user_id} not found",
        )

    tokens_revoked = auth_service.revoke_all_user_tokens(
        target_user_id,
        reason=revoke_request.reason or "admin_revoke"
        if user_role == "admin"
        else "password_change",
    )

    return TokenRevokeResponse(
        message=f"Revoked {tokens_revoked} token(s) for user {target_user_id}",
        tokens_revoked=tokens_revoked,
    )
