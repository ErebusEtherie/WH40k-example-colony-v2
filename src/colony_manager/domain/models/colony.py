"""Domain model for colonies."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from colony_manager.domain.enums import ColonyType, DynastyOutcome, ResourceType
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.support_upgrade import SupportUpgrade


class Colony(BaseModel):
    model_config = ConfigDict(validate_assignment=True)
    
    id: int | None = None
    name: str
    owner: str
    colony_type: ColonyType
    age_days: int = Field(ge=0)
    age_last_updated: date
    event_roll_interval_days: int = 60
    development_roll_interval_days: int = 90
    base_complacency: int
    base_order: int
    base_productivity: int
    base_piety: int
    base_size: int
    representative_id: int | None = None
    # Infrastructure and upgrades owned by this colony
    infrastructure: list[Infrastructure] = Field(default_factory=list)
    support_upgrades: list[SupportUpgrade] = Field(default_factory=list)
    # For Dynasty Member representatives: chosen nepotism outcome
    dynasty_outcome: DynastyOutcome | None = None
    # Lock flags - prevent stat increases until resolved (per Rogue Trader rules)
    # Complacency = 0: Order and Productivity cannot increase
    # Piety = 0: Order and Complacency cannot increase
    complacency_locked: bool = False
    order_locked: bool = False
    productivity_locked: bool = False
    # Planetary resources the colony is exploiting
    planetary_resources: list[ResourceType] = Field(default_factory=list)
    modifiers: list[Modifier] = Field(default_factory=list)
    
    @field_validator("age_days")
    @classmethod
    def _validate_age_days(cls, value: int) -> int:
        if value < 0:
            raise ValueError("age_days cannot be negative")
        return value