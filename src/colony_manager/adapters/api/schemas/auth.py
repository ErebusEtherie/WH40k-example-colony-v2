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
    managed_colony_id: int | None = None


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password."""
    
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)