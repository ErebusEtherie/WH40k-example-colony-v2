"""Modifier API schemas."""

from datetime import date

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierCategory, ModifierSourceType, ModifierStat


class ModifierCreate(BaseModel):
    """Schema for creating a new modifier."""

    modifier_source_type: ModifierSourceType
    modifier_category: ModifierCategory
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str = Field(default="", max_length=200)
    is_active: bool = True
    expires_at: date | None = None


class ModifierListItem(BaseModel):
    """Lightweight schema for modifier list items (paginated endpoints)."""

    id: int | None
    colony_id: int
    modifier_source_type: ModifierSourceType
    modifier_category: ModifierCategory
    modifier_stat: ModifierStat
    modifier_value: int
    is_active: bool


class ModifierResponse(BaseModel):
    """Full modifier response."""

    id: int | None
    colony_id: int
    modifier_source_type: ModifierSourceType
    modifier_category: ModifierCategory
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str
    is_active: bool
    expires_at: date | None = None


class ModifierUpdate(BaseModel):
    """Schema for updating a modifier (partial update)."""

    is_active: bool | None = None
    modifier_description: str | None = None


class ModifierBreakdownItem(BaseModel):
    """Individual modifier in a breakdown."""

    source_type: ModifierSourceType
    source_id: int | None = None
    source_name: str
    value: int
    description: str = ""


class StatModifierBreakdown(BaseModel):
    """Modifier breakdown for a single stat."""

    base: int = Field(description="Base stat value before modifiers")
    modifiers: list[ModifierBreakdownItem] = Field(
        default_factory=list, description="List of active modifier contributions"
    )
    total_modifier: int = Field(description="Sum of all modifier values")
    current: int = Field(description="Final calculated value (includes conditional bonuses)")


class ModifierBreakdownResponse(BaseModel):
    """Detailed modifier breakdown grouped by stat."""

    size: StatModifierBreakdown
    complacency: StatModifierBreakdown
    order: StatModifierBreakdown
    productivity: StatModifierBreakdown
    piety: StatModifierBreakdown
    leadership_modifier: int
    profit_factor: int
