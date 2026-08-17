"""Stat calculation rules for the colony manager.

Per Rogue Trader Colony Rules:
- Stats cannot go below 0
- When a stat is "locked" (due to Complacency=0 or Piety=0 effects),
  it cannot be increased by modifiers until the situation is resolved.
"""

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier


def calculate_stat(
    base_value: int,
    modifiers: list[Modifier],
    stat: ModifierStat,
    is_locked: bool = False,
) -> int:
    """
    Calculate a current stat from base and active modifiers.
    
    Args:
        base_value: The base stat value.
        modifiers: List of all active modifiers.
        stat: The stat being calculated.
        is_locked: If True, positive modifiers are ignored (stat cannot
            increase). Per Rogue Trader rules, this happens when:
            - Order/Productivity locked: Complacency = 0
            - Order/Complacency locked: Piety = 0
    
    Returns:
        Calculated stat value (minimum 0).
    """
    total = base_value
    
    for modifier in modifiers:
        if not modifier.is_active:
            continue
        if modifier.modifier_stat != stat:
            continue
        
        # If locked, skip positive modifiers (can still decrease)
        if is_locked and modifier.modifier_value > 0:
            continue
        
        total += modifier.modifier_value
    
    return max(total, 0)


def calculate_stat_with_locks(
    base_value: int,
    modifiers: list[Modifier],
    stat: ModifierStat,
    complacency_locked: bool = False,
    order_locked: bool = False,
    productivity_locked: bool = False,
) -> int:
    """
    Calculate a stat with lock flag awareness.
    
    Convenience wrapper that determines is_locked based on stat type.
    
    Args:
        base_value: The base stat value.
        modifiers: List of all active modifiers.
        stat: The stat being calculated.
        complacency_locked: If True, Complacency cannot increase.
        order_locked: If True, Order cannot increase.
        productivity_locked: If True, Productivity cannot increase.
    
    Returns:
        Calculated stat value (minimum 0).
    """
    is_locked = False
    
    if stat == ModifierStat.COMPLACENCY:
        is_locked = complacency_locked
    elif stat == ModifierStat.ORDER:
        is_locked = order_locked
    elif stat == ModifierStat.PRODUCTIVITY:
        is_locked = productivity_locked
    # Piety and Size are never locked by these effects
    
    return calculate_stat(base_value, modifiers, stat, is_locked)
