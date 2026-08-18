"""Colony API schemas."""

from datetime import date
from typing import Any

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ColonyType, DynastyOutcome, ResourceType


class ColonyStateStat(BaseModel):
    """Nested stat information with base, current, and lore state."""

    base: int
    current: int
    lore_state: str


class ColonyStateNested(BaseModel):
    """Nested colony state structure."""

    size: ColonyStateStat
    complacency: ColonyStateStat
    order: ColonyStateStat
    productivity: ColonyStateStat
    piety: ColonyStateStat
    leadership_modifier: int
    profit_factor: int
    lore_state: dict[str, str]


class ColonyCreate(BaseModel):
    """Schema for creating a new colony."""

    name: str = Field(..., min_length=1, max_length=100)
    owner: str = Field(..., min_length=1, max_length=100)
    colony_type: ColonyType


class ColonyUpdate(BaseModel):
    """Schema for updating a colony (partial update)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    owner: str | None = Field(None, min_length=1, max_length=100)
    age_days: int | None = Field(None, ge=0)
    event_roll_interval_days: int | None = Field(None, ge=1)
    development_roll_interval_days: int | None = Field(None, ge=1)


class ColonyListItem(BaseModel):
    """Summary information for colony list."""

    id: int | None
    name: str
    owner: str
    colony_type: ColonyType
    age_days: int
    current_size: int
    current_complacency: int
    current_order: int
    current_productivity: int
    current_piety: int
    profit_factor: int


class ColonyResponse(BaseModel):
    """Full colony response with computed state."""

    id: int | None
    name: str
    owner: str
    colony_type: ColonyType
    age_days: int
    age_last_updated: date
    event_roll_interval_days: int
    development_roll_interval_days: int
    base_complacency: int
    base_order: int
    base_productivity: int
    base_piety: int
    base_size: int
    representative_id: int | None
    dynasty_outcome: DynastyOutcome | None
    complacency_locked: bool
    order_locked: bool
    productivity_locked: bool
    planetary_resources: list[ResourceType]
    state: ColonyStateNested