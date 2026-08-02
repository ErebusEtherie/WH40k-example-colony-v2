"""Lore state resolver rules for the colony manager."""

from colony_manager.domain.enums import LoreState, ModifierStat


def resolve_lore_state(stat: ModifierStat, value: int, size: int) -> LoreState:
    """Resolve the lore state label for a stat based on current value and size."""
    if stat == ModifierStat.COMPLACENCY:
        if value > size:
            return LoreState.PLACATED
        if value == 0:
            raise NotImplementedError(
                "Complacency == 0 label is not confirmed; please provide the exact lore state label."
            )
        return LoreState.STABLE

    if stat == ModifierStat.ORDER:
        if value == 0:
            return LoreState.ANARCHY
        if value > size:
            raise NotImplementedError(
                "Order > size label is not confirmed; please provide the exact lore state label."
            )
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
