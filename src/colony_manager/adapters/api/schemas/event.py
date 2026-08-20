"""Pydantic schemas for event API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierStat


class EventModifierCreate(BaseModel):
    """Schema for creating an event modifier."""
    
    stat: ModifierStat
    value: int
    description: str = Field(min_length=1, max_length=500)


class EventCreate(BaseModel):
    """Schema for creating an event."""
    
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=2000)
    modifiers: list[EventModifierCreate] = Field(default_factory=list)


class EventUpdate(BaseModel):
    """Schema for updating an event."""
    
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    is_active: bool | None = None


class EventModifierResponse(BaseModel):
    """Schema for event modifier response."""
    
    stat: ModifierStat
    value: int
    description: str


class EventResponse(BaseModel):
    """Schema for event response."""
    
    id: int
    colony_id: int
    name: str
    description: str
    created_by: int
    created_at: datetime
    is_active: bool
    modifiers: list[EventModifierResponse]
    
    model_config = {"from_attributes": True}