"""State-based effects for the colony manager.

Per Rogue Trader Colony Rules:
- Orderly (Order > Size): +2 Productivity
- Pious (Piety > Size): +1 Order, +1 Complacency
- Complacency = 0: Order and Productivity decrease by 1d5, cannot increase
- Piety = 0: Order and Complacency decrease by 1d5, cannot increase
- Anarchy (Order = 0): At end of 90-day cycle, Complacency, Productivity,
  and Piety decrease by 1d5, Size decreases by 1
"""

from colony_manager.domain.models.colony import Colony


def apply_orderly_effect(colony: Colony) -> int:
    """
    Apply Orderly state bonus to Productivity.
    
    Per Rogue Trader Colony Rules:
    "A Colony with Order greater than its Size is considered 'Orderly,'
    and increases its Productivity by 2."
    
    Args:
        colony: The colony to apply the effect to.
    
    Returns:
        Productivity bonus (0 or 2).
    """
    if colony.base_order > colony.base_size:
        return 2
    return 0


def apply_pious_effect(colony: Colony) -> tuple[int, int]:
    """
    Apply Pious state bonus to Order and Complacency.
    
    Per Rogue Trader Colony Rules:
    "If a Colony's Piety is greater than its Size, it is considered 'Pious,'
    and its Order and Complacency each increase by 1."
    
    Args:
        colony: The colony to apply the effect to.
    
    Returns:
        Tuple of (Order bonus, Complacency bonus), each 0 or 1.
    """
    if colony.base_piety > colony.base_size:
        return (1, 1)
    return (0, 0)


def apply_complacency_zero(
    colony: Colony,
    dice_roll_order: int,
    dice_roll_productivity: int,
) -> Colony:
    """
    Apply Complacency = 0 effect: immediate penalty and locks.
    
    Per Rogue Trader Colony Rules:
    "If a Colony's Complacency ever reaches 0, its Order and Productivity
    immediately decrease by 1d5 and cannot be increased again until the
    situation is remedied."
    
    Args:
        colony: The colony to apply the effect to.
        dice_roll_order: 1d5 roll for Order decrease (1-5).
        dice_roll_productivity: 1d5 roll for Productivity decrease (1-5).
    
    Returns:
        New Colony instance with decreased stats and locks applied.
    """
    # Calculate new values (minimum 0)
    new_order = max(colony.base_order - dice_roll_order, 0)
    new_productivity = max(colony.base_productivity - dice_roll_productivity, 0)
    
    return colony.model_copy(
        update={
            "base_order": new_order,
            "base_productivity": new_productivity,
            "order_locked": True,
            "productivity_locked": True,
        }
    )


def apply_piety_zero(
    colony: Colony,
    dice_roll_order: int,
    dice_roll_complacency: int,
) -> Colony:
    """
    Apply Piety = 0 (Heretical) effect: immediate penalty and locks.
    
    Per Rogue Trader Colony Rules:
    "If a Colony's Piety ever reaches 0, its Order and Complacency
    immediately fall by 1d5, and cannot be increased again until the
    Explorers resolve the situation."
    
    Args:
        colony: The colony to apply the effect to.
        dice_roll_order: 1d5 roll for Order decrease (1-5).
        dice_roll_complacency: 1d5 roll for Complacency decrease (1-5).
    
    Returns:
        New Colony instance with decreased stats and locks applied.
    """
    # Calculate new values (minimum 0)
    new_order = max(colony.base_order - dice_roll_order, 0)
    new_complacency = max(colony.base_complacency - dice_roll_complacency, 0)
    
    return colony.model_copy(
        update={
            "base_order": new_order,
            "base_complacency": new_complacency,
            "order_locked": True,
            "complacency_locked": True,
        }
    )


def apply_anarchy_decay(
    colony: Colony,
    dice_roll_complacency: int,
    dice_roll_productivity: int,
    dice_roll_piety: int,
    agricultural_resilience_roll: int | None = None,
) -> Colony:
    """
    Apply Anarchy cycle decay at end of 90-day cycle.
    
    Per Rogue Trader Colony Rules:
    "At the end of every 90-day cycle, its Complacency, Productivity, and
    Piety all decrease by 1d5 and its Size decreases by 1."
    
    For Agricultural colonies, the Size decrease may be prevented by the
    colony's resilience (see colony_type_effects.check_agricultural_resilience).
    
    Args:
        colony: The colony to apply the effect to.
        dice_roll_complacency: 1d5 roll for Complacency decrease (1-5).
        dice_roll_productivity: 1d5 roll for Productivity decrease (1-5).
        dice_roll_piety: 1d5 roll for Piety decrease (1-5).
        agricultural_resilience_roll: Optional 1d10 roll for Agricultural
            resilience check. If >= 8, Size decrease is prevented.
    
    Returns:
        New Colony instance with decreased stats.
    """
    from colony_manager.domain.rules.colony_type_effects import (
        check_agricultural_resilience,
    )
    
    # Calculate new values (minimum 0 for stats, minimum 0 for Size)
    new_complacency = max(colony.base_complacency - dice_roll_complacency, 0)
    new_productivity = max(colony.base_productivity - dice_roll_productivity, 0)
    new_piety = max(colony.base_piety - dice_roll_piety, 0)
    
    # Check if Size decrease is prevented (Agricultural resilience)
    size_decrease = 1
    if agricultural_resilience_roll is not None and check_agricultural_resilience(
        agricultural_resilience_roll
    ):
        size_decrease = 0
    
    new_size = max(colony.base_size - size_decrease, 0)
    
    return colony.model_copy(
        update={
            "base_complacency": new_complacency,
            "base_productivity": new_productivity,
            "base_piety": new_piety,
            "base_size": new_size,
        }
    )