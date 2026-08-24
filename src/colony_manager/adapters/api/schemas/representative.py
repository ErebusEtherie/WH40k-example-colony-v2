"""Representative API schemas."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import RepresentativeType
from colony_manager.domain.models.representative import (
    Personality,
    PersonalityEffect,
    Skill,
    Talent,
)


class RepresentativeStatsCreate(BaseModel):
    """Schema for creating representative stats."""

    ws: int = Field(ge=1, le=100)
    bs: int = Field(ge=1, le=100)
    s: int = Field(ge=1, le=100)
    t: int = Field(ge=1, le=100)
    ag: int = Field(ge=1, le=100)
    intelligence: int = Field(ge=1, le=100, alias="int")
    per: int = Field(ge=1, le=100)
    wp: int = Field(ge=1, le=100)
    fel: int = Field(ge=1, le=100)


class PersonalityCreate(BaseModel):
    """Schema for creating a personality with simplified effect string."""

    name: str
    display_name: str | None = None  # Domain model defaults to name if None
    description: str
    effect: str = Field(default="")
    calamitous_modifier: int = Field(default=0)
    special_rule: str | None = Field(default=None)


def parse_personality_effect(effect_str: str) -> list[PersonalityEffect]:
    """Parse a simple effect string like '+1 Fel' into PersonalityEffect list."""
    if not effect_str or effect_str.strip() == "":
        return []
    effect_str = effect_str.strip()
    sign = -1 if effect_str.startswith("-") else 1
    if effect_str[0] in "+-":
        effect_str = effect_str[1:]
    parts = effect_str.split()
    if len(parts) < 2:
        return []
    try:
        value = int(parts[0]) * sign
        stat_name = parts[1].lower()
        return [PersonalityEffect(stat=stat_name, value=value, condition=None)]
    except ValueError:
        pass
    return []


class RepresentativeCreate(BaseModel):
    """Schema for creating a new representative."""

    name: str = Field(..., min_length=1, max_length=100)
    type: RepresentativeType
    personalities: list[PersonalityCreate] = Field(default_factory=list)
    stats: RepresentativeStatsCreate
    skills: list[Skill] = Field(default_factory=list)
    talents: list[Talent] = Field(default_factory=list)


class RepresentativeUpdate(BaseModel):
    """Schema for updating a representative (partial update)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    personalities: list[PersonalityCreate] | None = None
    stats: RepresentativeStatsCreate | None = None
    skills: list[Skill] | None = None
    talents: list[Talent] | None = None


class RepresentativeListItem(BaseModel):
    """Summary information for representative list."""

    id: int | None
    name: str
    type: RepresentativeType
    leadership_modifier: int
    assigned_to_colony_id: int | None


class RepresentativeResponse(BaseModel):
    """Full representative response."""

    id: int | None
    name: str
    type: RepresentativeType
    personalities: list[Personality]
    stats: RepresentativeStatsCreate
    skills: list[Skill]
    talents: list[Talent]
    leadership_modifier: int
    assigned_to_colony_id: int | None
