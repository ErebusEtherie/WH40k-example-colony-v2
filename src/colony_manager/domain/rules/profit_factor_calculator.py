"""Profit factor calculation rules for the colony manager.

Per Rogue Trader Colony Rules:
- Base PF from Size (Size → PF table)
- Placated (Complacency > Size): +1 PF
- Productive (Productivity > Size): +2 PF
- Orderly (Order > Size): +2 PF (added per rulebook)
- Leadership modifier from Representative
- Custom modifiers (GM, resources, etc.)
- Anarchy (Order = 0): PF = 0
- Halted (Productivity = 0): PF halved (round down)
"""

from math import floor

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier


def calculate_profit_factor(
    base_profit_factor: int,
    current_complacency: int,
    current_order: int,
    current_productivity: int,
    actual_size: int,
    modifiers: list[Modifier],
    leadership_modifier: int,
    is_orderly: bool = False,
    state_bonuses: dict[str, int] | None = None,
) -> int:
    """
    Calculate a colony's profit factor based on the current state.

    Args:
        base_profit_factor: Base PF from Size table.
        current_complacency: Current Complacency value.
        current_order: Current Order value.
        current_productivity: Current Productivity value.
        actual_size: Current colony Size.
        modifiers: List of all active modifiers (including resource bonuses).
        leadership_modifier: Leadership bonus from Representative.
        is_orderly: If True, apply Orderly bonus (+2 PF).
            This is determined by checking if Order > Size.
        state_bonuses: Dict with 'placated', 'productive', 'orderly' bonus values.
            Defaults to standard values if not provided.

    Returns:
        Final Profit Factor value (minimum 0).
    """
    # Use config-driven bonuses or defaults per Rogue Trader Colony Rules
    bonuses = state_bonuses or {"placated": 1, "productive": 2, "orderly": 2}

    pf_raw = base_profit_factor

    # State bonuses
    if current_complacency > actual_size:
        pf_raw += bonuses.get("placated", 1)  # Placated
    if current_productivity > actual_size:
        pf_raw += bonuses.get("productive", 2)  # Productive
    if is_orderly:
        pf_raw += bonuses.get("orderly", 2)  # Orderly (per rulebook)

    # Leadership modifier
    pf_raw += leadership_modifier

    # Custom modifiers
    for modifier in modifiers:
        if modifier.is_active and modifier.modifier_stat == ModifierStat.PROFIT_FACTOR:
            pf_raw += modifier.modifier_value

    # Apply penalties
    if current_order == 0:
        return 0  # Anarchy
    if current_productivity == 0:
        return max(floor(pf_raw / 2), 0)  # Halted (round down)

    return max(pf_raw, 0)
