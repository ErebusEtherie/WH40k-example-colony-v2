"""API schemas for user management endpoints."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    """Response schema for user information (excludes sensitive data)."""
    
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
    managed_colony_id: int | None = None
    
    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    """Request schema for creating a new user (admin only)."""
    
    username: str = Field(..., min_length=3, max_length=50, description="Username (immutable after creation)")
    email: EmailStr = Field(..., description="Email address (immutable after creation)")
    password: str = Field(..., min_length=8, max_length=128, description="Initial password")
    role: str = Field(default="viewer", description="User role: viewer, colony_manager, or admin")
    is_active: bool = Field(default=True, description="Whether the user account is active")
    managed_colony_id: int | None = Field(default=None, description="Optional colony ID this user manages")


class UserUpdate(BaseModel):
    """Request schema for updating a user (admin only).
    
    Note: username and email are immutable. Only role, is_active, and managed_colony_id can be updated.
    """
    
    role: str | None = Field(default=None, description="User role: viewer, colony_manager, or admin")
    is_active: bool | None = Field(default=None, description="Whether the user account is active")
    managed_colony_id: int | None = Field(default=None, description="Optional colony ID this user manages")


class UserPasswordReset(BaseModel):
    """Request schema for admin password reset."""
    
    temporary_password: str = Field(..., min_length=8, max_length=128, description="Temporary password to set")


class UserListResponse(BaseModel):
    """Response schema for listing users with pagination."""
    
    users: list[UserResponse]
    total: int
    limit: int
    offset: int
    has_more: bool
