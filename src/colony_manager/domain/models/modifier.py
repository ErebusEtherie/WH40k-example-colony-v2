"""Domain model for modifiers."""

from pydantic import BaseModel

from colony_manager.domain.enums import ModifierSourceType, ModifierStat


class Modifier(BaseModel):
    id: int | None = None
    colony_id: int
    modifier_source_type: ModifierSourceType
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str
    is_active: bool = True
