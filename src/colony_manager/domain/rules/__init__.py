"""Domain rule functions for colony manager."""

from colony_manager.domain.rules.infrastructure_rules import (
    apply_infrastructure_modifiers,
    get_infrastructure_modifiers,
    get_missing_infrastructure_penalty,
)
from colony_manager.domain.rules.leadership_modifier_resolver import (
    resolve_leadership_modifier,
)
from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state
from colony_manager.domain.rules.profit_factor_calculator import (
    calculate_profit_factor,
)
from colony_manager.domain.rules.representative_rules import (
    apply_loss_mitigation,
    get_personality_modifiers,
)
from colony_manager.domain.rules.size_calculator import (
    GrowthRollOutcome,
    GrowthRollResult,
    calculate_size,
    calculate_size_decrease_penalty,
    resolve_growth_roll,
)
from colony_manager.domain.rules.stat_calculator import calculate_stat
from colony_manager.domain.rules.support_upgrade_rules import (
    apply_support_upgrade_modifiers,
    get_support_upgrade_modifiers,
)

__all__ = [
    # Core calculations
    "GrowthRollOutcome",
    "GrowthRollResult",
    "apply_infrastructure_modifiers",
    "apply_loss_mitigation",
    "apply_support_upgrade_modifiers",
    "calculate_profit_factor",
    "calculate_size",
    "calculate_size_decrease_penalty",
    "calculate_stat",
    "get_infrastructure_modifiers",
    "get_missing_infrastructure_penalty",
    "get_personality_modifiers",
    "get_support_upgrade_modifiers",
    "resolve_growth_roll",
    "resolve_leadership_modifier",
    "resolve_lore_state",
]
