"""Pydantic schemas for colony user membership API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class ColonyUserRoleEnum(str):
    """Enum for colony user roles."""
    
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


class ColonyUserCreate(BaseModel):
    """Schema for creating a colony-user membership."""
    
    user_id: int
    role: ColonyUserRoleEnum = ColonyUserRoleEnum.VIEWER


class ColonyUserUpdate(BaseModel):
    """Schema for updating a colony-user membership."""
    
    role: ColonyUserRoleEnum


class ColonyUserResponse(BaseModel):
    """Schema for colony-user membership response."""
    
    id: int
    colony_id: int
    user_id: int
    role: str
    joined_at: datetime
    invited_by: int | None
    
    model_config = {"from_attributes": True}


class ColonyMemberResponse(BaseModel):
    """Schema for colony member response with user details."""
    
    membership_id: int
    user_id: int
    username: str
    email: str
    role: str
    joined_at: datetime
    
    model_config = {"from_attributes": True}