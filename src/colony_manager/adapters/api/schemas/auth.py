"""API schemas for authentication endpoints."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Request schema for user login."""
    
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: str | None = None  # Optional role for testing (defaults to VIEWER)


class TokenResponse(BaseModel):
    """Response schema for token endpoints."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # seconds (30 minutes)


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing access token."""
    
    refresh_token: str


class UserResponse(BaseModel):
    """Response schema for user information (excludes sensitive data)."""
    
    id: int
    username: str
    email: str
    role: str
    is_active: bool


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password."""
    
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class TokenRevokeRequest(BaseModel):
    """Request schema for token revocation (logout)."""
    
    reason: str | None = Field(None, max_length=100, description="Optional reason for revocation")


class TokenRevokeAllRequest(BaseModel):
    """Request schema for revoking all user tokens."""
    
    user_id: int | None = Field(None, gt=0, description="Target user ID (admin only). If omitted, revokes own tokens.")
    reason: str | None = Field(None, max_length=100, description="Optional reason for revocation")


class TokenRevokeResponse(BaseModel):
    """Response schema for token revocation."""
    
    message: str
    tokens_revoked: int = 0