"""Modifier API schemas."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierSourceType, ModifierStat


class ModifierCreate(BaseModel):
    """Schema for creating a new modifier."""

    modifier_source_type: ModifierSourceType
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str = Field(..., min_length=1, max_length=200)
    is_active: bool = True


class ModifierResponse(BaseModel):
    """Full modifier response."""

    id: int | None
    colony_id: int
    modifier_source_type: ModifierSourceType
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str
    is_active: bool