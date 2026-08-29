"""Pydantic schemas for colony manager YAML configuration."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# =============================================================================
# Colony Types
# =============================================================================
class ColonyBaseStats(BaseModel):
    size: int
    complacency: int
    productivity: int
    order: int
    piety: int


class ColonySpecialEffect(BaseModel):
    name: str
    description: str
    resource_types: list[str] | None = None
    productivity_bonus: int | None = None
    additional_pf: int | None = None
    starts_with_upgrade: bool | None = None
    upgrade_choices: list[str] | None = None
    upgrade_type: str | None = None
    order_piety_swap: bool | None = None
    famine_resilience_roll: int | None = None


class ColonyTypeConfig(BaseModel):
    name: str
    display_name: str
    description: str
    initial_investment_pf: str  # e.g., "1d5+2"
    base_stats: ColonyBaseStats
    special_effects: list[ColonySpecialEffect] = Field(default_factory=list)


# =============================================================================
# Infrastructure Types
# =============================================================================
class InfrastructureModifier(BaseModel):
    stat: str
    value: int


class InfrastructureStateConfig(BaseModel):
    description: str
    modifiers: list[InfrastructureModifier] = Field(default_factory=list)


class InfrastructureTypeConfig(BaseModel):
    name: str
    display_name: str
    description: str
    states: dict[str, InfrastructureStateConfig]


# =============================================================================
# Support Upgrades
# =============================================================================
class SupportUpgradeStatEffect(BaseModel):
    stat: str
    value: int
    conditional_bonuses: list[dict[str, Any]] | None = None
    choices: list[str] | None = None
    excludes: list[str] | None = None


class SupportUpgradeMechanicalEffect(BaseModel):
    description: str
    type: str
    skills: list[str] | None = None
    skill: str | None = None
    bonus: int | None = None
    condition: str | None = None
    interval_days: int | None = None
    roll: str | None = None
    threshold: int | None = None
    reward: str | None = None
    points: int | None = None


class SupportUpgradeConfig(BaseModel):
    name: str
    display_name: str
    description: str
    stat_effects: list[SupportUpgradeStatEffect] = Field(default_factory=list)
    mechanical_effects: list[SupportUpgradeMechanicalEffect] = Field(default_factory=list)
    lore_effects: list[str] = Field(default_factory=list)


# =============================================================================
# Personalities
# =============================================================================
class PersonalityStatEffect(BaseModel):
    """A single stat effect from a personality.

    For fixed values, use int (e.g., value: 1 for +1 bonus).
    For variable dice rolls, use str dice expression (e.g., "-1d5" for Mad personality).
    Dice expressions are NOT rolled by the engine - GM/player must provide the rolled result.
    """

    stat: str
    value: int | str
    condition: str | None = None


class PersonalityConfig(BaseModel):
    name: str
    display_name: str | None = None
    description: str
    stat_effects: list[PersonalityStatEffect] = Field(default_factory=list)
    calamitous_modifier: int = 0
    special_rule: str | None = None


# =============================================================================
# Representative Types
# =============================================================================
class RepresentativeLossMitigation(BaseModel):
    stat: str
    reduction: int = 1
    minimum: int = 1


class DynastyOutcomeConfig(BaseModel):
    name: str
    display_name: str
    stat_effect: dict[str, Any] | None = None
    calamitous_modifier: int = 0


class RepresentativeTypeConfig(BaseModel):
    name: str
    display_name: str
    description: str
    loss_mitigation: RepresentativeLossMitigation | None = None
    special_effects: list[dict[str, Any]] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)


# =============================================================================
# Rule Tables
# =============================================================================
class ProfitFactorSizeEntry(BaseModel):
    size: int
    profit_factor: int
    description: str | None = None


class LeadershipModifierEntry(BaseModel):
    stat_bonus: int
    modifier: int


class GrowthThresholdEntry(BaseModel):
    min_roll: int
    max_roll: int
    effect: str
    description: str


class LoreThresholdStatConfig(BaseModel):
    placated_threshold: str | None = None
    zero_state: str | None = None
    default: str = "stable"
    orderly_threshold: str | None = None
    productive_threshold: str | None = None
    pious_threshold: str | None = None


class LoreThresholdsConfig(BaseModel):
    complacency: LoreThresholdStatConfig
    order: LoreThresholdStatConfig
    productivity: LoreThresholdStatConfig
    piety: LoreThresholdStatConfig


class StatLossMitigationEntry(BaseModel):
    stat: str
    reduction: int = 1
    minimum: int = 1


class GameCyclesConfig(BaseModel):
    """Global configuration for game cycle intervals."""

    event_roll_interval_days: int = 60
    development_roll_interval_days: int = 90


class PFStateBonusesConfig(BaseModel):
    """Profit Factor bonuses for colony states."""

    placated: int = 1
    productive: int = 2
    orderly: int = 2


class RuleTablesConfig(BaseModel):
    size_to_profit_factor: list[ProfitFactorSizeEntry]
    leadership_modifier: list[LeadershipModifierEntry]
    colony_growth: dict[str, Any] | None = None
    lore_thresholds: LoreThresholdsConfig
    stat_loss_mitigation: dict[str, StatLossMitigationEntry] = Field(default_factory=dict)
    game_cycles: GameCyclesConfig | None = None
    calamitous_events: dict[str, Any] | None = None
    pf_state_bonuses: PFStateBonusesConfig | None = None
