"""Domain model for modifiers."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierSourceType, ModifierStat


class Modifier(BaseModel):
    id: int | None = None
    colony_id: int | None = None
    modifier_source_type: ModifierSourceType
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str = Field(alias="description", default="")
    is_active: bool = True
    
    model_config = {"populate_by_name": True}


__all__ = ["Modifier", "ModifierSourceType", "ModifierStat"]
