"""Pydantic schemas for development plan API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class DevelopmentPlanStatusEnum(str):
    """Enum for development plan status."""
    
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ACQUIRED = "acquired"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class DevelopmentPlanCreate(BaseModel):
    """Schema for creating a development plan."""
    
    upgrade_type: str = Field(pattern="^(infrastructure|support_upgrade)$")
    target_name: str = Field(min_length=1, max_length=200)
    priority: int = Field(ge=1, le=5)
    description: str = Field(min_length=1, max_length=2000)
    acquisition_plan: str = Field(min_length=1, max_length=2000)


class DevelopmentPlanUpdate(BaseModel):
    """Schema for updating a development plan."""
    
    upgrade_type: str | None = Field(default=None, pattern="^(infrastructure|support_upgrade)$")
    target_name: str | None = Field(default=None, min_length=1, max_length=200)
    priority: int | None = Field(default=None, ge=1, le=5)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    acquisition_plan: str | None = Field(default=None, min_length=1, max_length=2000)
    progress: int | None = Field(default=None, ge=0, le=100)
    status: DevelopmentPlanStatusEnum | None = None


class DevelopmentPlanResponse(BaseModel):
    """Schema for development plan response."""
    
    id: int
    colony_id: int
    upgrade_type: str
    target_name: str
    priority: int
    description: str
    acquisition_plan: str
    progress: int
    status: str
    created_by: int
    created_at: datetime
    completed_at: datetime | None
    
    model_config = {"from_attributes": True}