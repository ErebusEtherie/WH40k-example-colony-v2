"""Colony API schemas."""

from datetime import date

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ColonyType, DynastyOutcome, ResourceType


class ColonyRollStatus(BaseModel):
    """Response schema for colony roll status."""

    event_roll_due: bool
    development_roll_due: bool
    days_since_event_roll: int
    days_until_event_roll: int
    days_since_development_roll: int
    days_until_development_roll: int
    event_interval_days: int
    development_interval_days: int


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


class ColonyCycleInfo(BaseModel):
    """Computed information about upcoming rolls."""

    days_since_event_roll: int
    days_until_event_roll: int
    days_since_development_roll: int
    days_until_development_roll: int


class ColonyCreate(BaseModel):
    """Schema for creating a new colony."""

    name: str = Field(..., min_length=1, max_length=100)
    founder_name: str = Field(..., min_length=1, max_length=100)
    patron_name: str | None = Field(None, min_length=1, max_length=100)
    colony_type: ColonyType


class ColonyUpdate(BaseModel):
    """Schema for updating a colony (partial update)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    founder_name: str | None = Field(None, min_length=1, max_length=100)
    patron_name: str | None = Field(None, min_length=1, max_length=100)
    age_days: int | None = Field(None, ge=0)
    current_event: str | None = None


class ColonyListItem(BaseModel):
    """Summary information for colony list."""

    id: int | None
    name: str
    founder_name: str
    patron_name: str | None
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
    founder_name: str
    patron_name: str | None
    colony_type: ColonyType
    age_days: int
    age_last_updated: date
    current_event: str | None
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
