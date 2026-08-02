"""Domain model for colonies."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from colony_manager.domain.models.modifier import Modifier


class Colony(BaseModel):
    model_config = ConfigDict(validate_assignment=True)

    id: int | None = None
    name: str
    owner: str
    colony_type: str
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
    modifiers: list[Modifier] = Field(default_factory=list)

    @field_validator("age_days")
    @classmethod
    def _validate_age_days(cls, value: int) -> int:
        if value < 0:
            raise ValueError("age_days cannot be negative")
        return value
