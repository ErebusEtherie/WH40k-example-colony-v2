"""Size calculation rules for the colony manager."""

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier


def calculate_size(base_size: int, modifiers: list[Modifier]) -> int:
    """Calculate actual size from base and active size modifiers."""
    total = base_size
    for modifier in modifiers:
        if modifier.is_active and modifier.modifier_stat == ModifierStat.SIZE:
            total += modifier.modifier_value
    return max(total, 0)
