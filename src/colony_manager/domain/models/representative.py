"""Domain model for representatives."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import RepresentativeType, SkillLevel


class RepresentativeStats(BaseModel):
    ws: int = Field(gt=0)
    bs: int = Field(gt=0)
    s: int = Field(gt=0)
    t: int = Field(gt=0)
    ag: int = Field(gt=0)
    int_: int = Field(gt=0, alias="int")
    per: int = Field(gt=0)
    wp: int = Field(gt=0)
    fel: int = Field(gt=0)

    model_config = {"populate_by_name": True}


class Personality(BaseModel):
    name: str
    description: str
    effect: str


class Skill(BaseModel):
    name: str
    level: SkillLevel
    description: str


class Talent(BaseModel):
    name: str
    description: str


class Representative(BaseModel):
    id: int | None = None
    name: str
    type: RepresentativeType
    personalities: list[Personality] = Field(min_length=1)
    stats: RepresentativeStats
    skills: list[Skill] = Field(default_factory=list)
    talents: list[Talent] = Field(default_factory=list)
