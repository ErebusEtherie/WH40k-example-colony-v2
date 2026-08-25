"""Configuration models for rule tables.

Source: docs/colony-manager-rules-reference.md
"""

from typing import Any

from pydantic import BaseModel, Field


class ColonyBaseStats(BaseModel):
    """Base stats for a colony type."""

    size: int
    complacency: int
    order: int
    productivity: int
    piety: int


class ColonySpecialtyConfig(BaseModel):
    """Specialty bonus for a colony type."""

    description: str
    pf_bonus: int | None = None


class ColonyTypeConfig(BaseModel):
    """Configuration for a colony type.

    Source: "Colony Type Specialties" section.
    """

    id: str
    name: str
    description: str
    base_stats: ColonyBaseStats
    specialties: list[ColonySpecialtyConfig] = Field(default_factory=list)


class RepresentativeTypeConfig(BaseModel):
    """Configuration for a representative type.

    Source: "Leadership" section, Representative Types table.
    """

    id: str
    name: str
    description: str
    protected_stat: str | None = None
    damage_reduction: int | None = None
    special: str | None = None  # e.g., Satrap: "+5 to Acquisition Tests"


class DynastyMemberRollConfig(BaseModel):
    """Configuration for a dynasty member roll result (Table 3-5)."""

    range_min: int
    range_max: int
    stat: str
    value: int
    source: str


class PersonalityModifierConfig(BaseModel):
    """A single modifier from a personality.
    
    Note: `value` can be an int for fixed modifiers, or a string placeholder
    like "gm_roll_negative_1d5" indicating the GM must roll and apply the result.
    Special stat values like "player_choice", "lowest_stat", or "gm_roll_negative_1d5"
    require special handling in the calculation logic.
    """

    stat: str
    value: int | str


class PersonalityConditionConfig(BaseModel):
    """Condition for a personality modifier to apply."""

    stat: str
    operator: str  # e.g., "greater"
    compare_to: str  # e.g., "size"


class RepresentativePersonalityConfig(BaseModel):
    """Configuration for a representative personality (Table 3-6)."""

    id: str
    name: str
    modifiers: list[PersonalityModifierConfig]
    description: str
    condition: PersonalityConditionConfig | None = None
    note: str | None = None


class InfrastructureBonuses(BaseModel):
    """Bonus values for working/not_working state."""

    working: dict[str, int] = Field(default_factory=dict)
    not_working: dict[str, int] = Field(default_factory=dict)


class InfrastructureTypeConfig(BaseModel):
    """Configuration for an infrastructure type.

    Source: "Hard Infrastructure" section, Table 3-7.
    When Size increases, player/GM provides d5 (1-5) to determine type.
    """

    id: str
    name: str
    description: str
    d5_result: int
    bonuses: InfrastructureBonuses = Field(default_factory=InfrastructureBonuses)


class MissingInfrastructurePenaltyConfig(BaseModel):
    """Penalty for missing infrastructure."""

    stat: str
    value: int
    source: str


class SupportUpgradeConfig(BaseModel):
    """Configuration for a support upgrade.

    Source: "Support Upgrades" section.
    Maximum Support Upgrades = current Colony Size.
    """

    id: str
    name: str
    description: str
    bonus_stat: str | None = None
    bonus_value: int = 0
    bonus_value_mining_industry: int | None = None  # Mechanicum Station special
    bonus_value_research: int | None = None  # Mechanicum Station special
    limit: str | None = None  # cumulative, one_only, once_per_stat, null
    note: str | None = None


class LeaderQualityModifiersConfig(BaseModel):
    """Leader quality modifiers (Int/Per/Fel to PF modifier).

    Source: "Leadership" section, Leader Quality table.
    Stored as dict with string keys (YAML compatibility), use get_modifier() to access.
    """

    # YAML loads int keys as ints, but we store as strings for Pydantic compatibility
    model_config = {"extra": "allow"}

    def get_modifier(self, quality: int) -> int:
        """Get the PF modifier for a leader quality stat (2-6).
        
        Args:
            quality: Leader quality stat value (2-6).
            
        Returns:
            PF modifier value (e.g., -2 for quality 2, +2 for quality 6).
        """
        # Keys are stored as strings for Pydantic compatibility (converted by loader)
        dumped = self.model_dump()
        value = dumped.get(str(quality))
        return int(value) if value is not None else 0


class ThresholdEffectSingle(BaseModel):
    """Single effect from a threshold trigger.
    
    Note: `value` can be an int for fixed modifiers, or a string placeholder
    like "gm_roll_negative_1d5" indicating the GM must roll and apply the result.
    """

    stat: str
    value: int | str | None = None
    set_to: int | None = None
    operation: str | None = None  # e.g., "divide_by_2_round_down"


class ThresholdEffectList(BaseModel):
    """List of effects from a threshold trigger."""

    root: list[ThresholdEffectSingle]


class ThresholdConfig(BaseModel):
    """Configuration for a single threshold state."""

    stat: str
    condition: str  # "greater" or "equals"
    compare_to: str | None = None  # e.g., "size"
    value: int | None = None
    effect: dict[str, Any] | list[dict[str, Any]] | None = None


class ThresholdsConfig(BaseModel):
    """Threshold configuration for state transitions.

    Source: "Conditional States Reference" section.
    """

    placated: ThresholdConfig
    orderly: ThresholdConfig
    productive: ThresholdConfig
    pious: ThresholdConfig
    riots_unrest: ThresholdConfig
    anarchy: ThresholdConfig
    production_halted: ThresholdConfig
    heretical: ThresholdConfig


class GrowthOutcomeConfig(BaseModel):
    """Configuration for a growth check outcome."""

    roll_range: list[int]
    effect: list[dict[str, Any]]


class HarvestProfitsAbsentExplorersConfig(BaseModel):
    """Configuration for harvest profits when explorers are absent."""

    complacency_penalty: str  # "gm_roll_negative_1d5"
    note: str | None = None


class HarvestProfitsConfig(BaseModel):
    """Configuration for harvest profits bonuses."""

    size_1_to_4: dict[str, int]
    size_5_plus: dict[str, int]
    absent_explorers: HarvestProfitsAbsentExplorersConfig | None = None


class GrowthDecayConfig(BaseModel):
    """Configuration for growth and decay rules.

    Source: "Colony Growth System" and "Resource Harvesting" sections.
    """

    event_roll_interval_days: int = 60
    development_roll_interval_days: int = 90
    growth_outcomes: dict[str, GrowthOutcomeConfig] | None = None
    harvest_profits: HarvestProfitsConfig | None = None


class StatConstraintConfig(BaseModel):
    """Min/max constraints for a stat."""

    min: int = 0
    max: int | None = None


class StatConstraintsConfig(BaseModel):
    """Constraints for all stats."""

    size: StatConstraintConfig
    complacency: StatConstraintConfig
    order: StatConstraintConfig
    productivity: StatConstraintConfig
    piety: StatConstraintConfig
    profit_factor: StatConstraintConfig


class RuleTablesConfig(BaseModel):
    """Root configuration model for all rule tables.

    Source: docs/colony-manager-rules-reference.md
    """

    colony_types: list[ColonyTypeConfig]
    representative_types: list[RepresentativeTypeConfig]
    dynasty_member_rolls: list[DynastyMemberRollConfig] = Field(default_factory=list)
    representative_personalities: list[RepresentativePersonalityConfig] = Field(
        default_factory=list
    )
    infrastructure_types: list[InfrastructureTypeConfig]
    missing_infrastructure_penalty: MissingInfrastructurePenaltyConfig | None = None
    support_upgrades: list[SupportUpgradeConfig]
    leader_quality_modifiers: LeaderQualityModifiersConfig | None = None
    colony_size_to_pf: dict[int, int]
    thresholds: ThresholdsConfig
    growth_decay: GrowthDecayConfig
    stat_constraints: StatConstraintsConfig | None = None