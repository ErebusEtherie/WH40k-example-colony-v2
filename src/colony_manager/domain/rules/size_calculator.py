"""Colony size and growth calculation rules for the colony manager.

Per Rogue Trader Colony Rules:
- Colony Size ranges 0-10, maps to Profit Factor (Table 3-2)
- Growth roll: 1d10 every 90 days (Table 3-3)
- Modifiers: PF investment (+1 per PF), Resource bonus (+1d5)
- Agricultural resilience: 1d10 >= 8 prevents size decrease
- Size decrease penalty: 1d5-3 to random stat (min 1)
"""

from dataclasses import dataclass
from enum import StrEnum

from colony_manager.domain.enums import ColonyType, ModifierStat
from colony_manager.domain.models.modifier import Modifier


class GrowthRollResult(StrEnum):
    DECREASE = "decrease"
    NO_CHANGE = "no_change"
    INCREASE = "increase"


@dataclass
class GrowthRollOutcome:
    """Result of a colony growth roll."""
    effect: GrowthRollResult
    size_change: int
    description: str
    agricultural_resilience_rolled: bool = False
    agricultural_resilience_success: bool = False


def calculate_size(base_size: int, modifiers: list[Modifier]) -> int:
    """
    Calculate current colony Size from base value and active modifiers.
    
    Args:
        base_size: The colony's base Size (from colony type).
        modifiers: List of all active modifiers.
    
    Returns:
        Current Size (minimum 0).
    """
    total = base_size
    for modifier in modifiers:
        if modifier.is_active and modifier.modifier_stat == ModifierStat.SIZE:
            total += modifier.modifier_value
    return max(total, 0)


def resolve_growth_roll(
    roll: int,
    pf_investment: int = 0,
    resource_bonus: int = 0,
    colony_type: ColonyType | None = None,
    resilience_roll: int | None = None,
) -> GrowthRollOutcome:
    """Resolve a colony growth roll with all modifiers."""
    modified_roll = roll + pf_investment + resource_bonus
    
    if modified_roll <= 2:
        effect = GrowthRollResult.DECREASE
        size_change = -1
        description = "Colony Size decreases by one"
        
        # Check agricultural resilience
        if colony_type == ColonyType.AGRICULTURAL and resilience_roll is not None:
            if resilience_roll >= 8:
                effect = GrowthRollResult.NO_CHANGE
                size_change = 0
                description = "Agricultural resilience prevents size decrease"
                return GrowthRollOutcome(
                    effect=effect,
                    size_change=size_change,
                    description=description,
                    agricultural_resilience_rolled=True,
                    agricultural_resilience_success=True,
                )
    elif modified_roll <= 7:
        effect = GrowthRollResult.NO_CHANGE
        size_change = 0
        description = "No Change"
    else:
        effect = GrowthRollResult.INCREASE
        size_change = 1
        description = "Colony Size increases by one"
    
    return GrowthRollOutcome(
        effect=effect,
        size_change=size_change,
        description=description,
    )


def calculate_size_decrease_penalty(penalty_roll: int) -> int:
    """Calculate stat loss from size decrease (1d5-3, min 1)."""
    loss = penalty_roll - 3
    return max(loss, 1)