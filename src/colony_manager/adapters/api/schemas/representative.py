"""Representative API schemas."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import RepresentativeType, SkillLevel
from colony_manager.domain.models.representative import Personality, Skill, Talent


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


class RepresentativeCreate(BaseModel):
    """Schema for creating a new representative."""

    name: str = Field(..., min_length=1, max_length=100)
    type: RepresentativeType
    personalities: list[Personality] = Field(default_factory=list)
    stats: RepresentativeStatsCreate
    skills: list[Skill] = Field(default_factory=list)
    talents: list[Talent] = Field(default_factory=list)


class RepresentativeUpdate(BaseModel):
    """Schema for updating a representative (partial update)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    personalities: list[Personality] | None = None
    stats: RepresentativeStatsCreate | None = None
    skills: list[Skill] | None = None
    talents: list[Talent] | None = None


class RepresentativeListItem(BaseModel):
    """Summary information for representative list."""

    id: int
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