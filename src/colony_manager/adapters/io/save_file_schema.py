"""Portable save-file schema for colony data."""

from __future__ import annotations

from pydantic import BaseModel, Field

from colony_manager.domain.enums import (
    ModifierSourceType,
    ModifierStat,
    RepresentativeType,
    SkillLevel,
)


class SaveModifier(BaseModel):
    modifier_source_type: ModifierSourceType
    modifier_stat: ModifierStat
    modifier_value: int
    modifier_description: str
    is_active: bool = True


class SaveRepresentativeStats(BaseModel):
    ws: int = Field(gt=0)
    bs: int = Field(gt=0)
    s: int = Field(gt=0)
    t: int = Field(gt=0)
    ag: int = Field(gt=0)
    int_value: int = Field(gt=0, alias="int")
    per: int = Field(gt=0)
    wp: int = Field(gt=0)
    fel: int = Field(gt=0)

    model_config = {"populate_by_name": True}


class SavePersonality(BaseModel):
    name: str
    description: str
    stat_effects: dict[str, int] = Field(default_factory=dict)
    calamitous_modifier: int = 0
    special_rule: str | None = None


class SaveSkill(BaseModel):
    name: str
    level: SkillLevel
    description: str


class SaveTalent(BaseModel):
    name: str
    description: str


class SaveRepresentative(BaseModel):
    name: str
    type: RepresentativeType
    personalities: list[SavePersonality]
    stats: SaveRepresentativeStats
    skills: list[SaveSkill] = Field(default_factory=list)
    talents: list[SaveTalent] = Field(default_factory=list)


class ColonySaveFile(BaseModel):
    name: str
    owner: str
    colony_type: str
    age_days: int = Field(ge=0)
    age_last_updated: str
    current_event: str | None = None
    base_complacency: int
    base_order: int
    base_productivity: int
    base_piety: int
    base_size: int
    representative_id: int | None = None
    modifiers: list[SaveModifier] = Field(default_factory=list)
    representative: SaveRepresentative | None = None
