"""Lore state resolver rules for the colony manager.

Per Rogue Trader Colony Rules:
- Complacency > Size → "Placated"
- Complacency == 0 → "riots and unrest"
- Order == 0 → "Anarchy"
- Order > Size → "Orderly"
- Productivity > Size → "Productive"
- Productivity == 0 → "Halted"
- Piety > Size → "Pious"
- Piety == 0 → "Heretical"
"""

from colony_manager.domain.enums import LoreState, ModifierStat


def resolve_lore_state(stat: ModifierStat, value: int, size: int) -> LoreState:
    """
    Resolve the lore state label for a stat based on current value and size.
    
    Args:
        stat: The colony stat to resolve.
        value: Current value of the stat (after modifiers, clamped to >= 0).
        size: Current colony Size for threshold comparisons.
    
    Returns:
        The appropriate LoreState enum value.
    """
    if stat == ModifierStat.COMPLACENCY:
        if value > size:
            return LoreState.PLACATED
        if value == 0:
            return LoreState.RIOTS_AND_UNREST
        return LoreState.STABLE
    
    if stat == ModifierStat.ORDER:
        if value == 0:
            return LoreState.ANARCHY
        if value > size:
            return LoreState.ORDERLY
        return LoreState.STABLE
    
    if stat == ModifierStat.PRODUCTIVITY:
        if value > size:
            return LoreState.PRODUCTIVE
        if value == 0:
            return LoreState.HALTED
        return LoreState.STABLE
    
    if stat == ModifierStat.PIETY:
        if value > size:
            return LoreState.PIOUS
        if value == 0:
            return LoreState.HERETICAL
        return LoreState.STABLE
    
    raise ValueError(f"Cannot resolve lore state for stat {stat}")