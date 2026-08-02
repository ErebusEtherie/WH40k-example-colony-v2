"""Stat calculation rules for the colony manager."""

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier


def calculate_stat(base_value: int, modifiers: list[Modifier], stat: ModifierStat) -> int:
    """Calculate a current stat from base and active modifiers."""
    total = base_value
    for modifier in modifiers:
        if modifier.is_active and modifier.modifier_stat == stat:
            total += modifier.modifier_value
    return max(total, 0)
