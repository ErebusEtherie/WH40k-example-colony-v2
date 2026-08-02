"""Profit factor calculation rules for the colony manager."""

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.util.rounding import round_half_up


def calculate_profit_factor(
    base_profit_factor: int,
    current_complacency: int,
    current_order: int,
    current_productivity: int,
    current_piety: int,
    actual_size: int,
    modifiers: list[Modifier],
    leadership_modifier: int,
) -> int:
    """Calculate a colony's profit factor based on the current state."""
    pf_raw = base_profit_factor
    if current_complacency > actual_size:
        pf_raw += 1
    if current_productivity > actual_size:
        pf_raw += 2
    pf_raw += leadership_modifier
    for modifier in modifiers:
        if modifier.is_active and modifier.modifier_stat == ModifierStat.PROFIT_FACTOR:
            pf_raw += modifier.modifier_value

    if current_order == 0:
        return 0
    if current_productivity == 0:
        return max(round_half_up(pf_raw / 2), 0)
    return max(pf_raw, 0)
