"""Pydantic schemas for colony manager YAML configuration."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ColonyTypeConfig(BaseModel):
    name: str
    base_complacency: int
    base_order: int
    base_productivity: int
    base_piety: int
    base_size: int
    resource_exploit_bonus: int = 0


class ProfitFactorSizeEntry(BaseModel):
    size: int = Field(gt=0)
    profit_factor: int


class LeadershipModifierEntry(BaseModel):
    stat_bonus: int
    modifier: int


class LoreThresholdsConfig(BaseModel):
    complacency: dict[str, bool]
    order: dict[str, bool]
    productivity: dict[str, bool]
    piety: dict[str, bool]


class RuleTablesConfig(BaseModel):
    size_to_profit_factor: list[ProfitFactorSizeEntry]
    leadership_modifier: list[LeadershipModifierEntry]
    lore_thresholds: LoreThresholdsConfig


class PersonalityConfig(BaseModel):
    name: str
    description: str
    effect: str
