"""Colony type special rules for the colony manager.

Per Rogue Trader Colony Rules, different colony types have unique abilities:

ECCLESIASTICAL:
"If an Ecclesiastical Colony's Order would decrease by any amount, its owners
can choose to have its Piety decrease by that amount instead."

AGRICULTURAL:
"Any time an Agricultural Colony's Size would decrease, roll 1d10; on a result
of 8 or higher, it does not decrease."

MINING AND INDUSTRY:
"If set to exploiting Mineral Resources, the Colony's Productivity increases
by 2 and it generates 2 additional Profit Factor."

RESEARCH MISSION:
"If set to exploiting Organic Compound, Archeotech Cache, or Xenos Ruins
Resources, the Colony's Productivity increases by 2 and it generates 1
additional Profit Factor."
"""

from colony_manager.domain.enums import ColonyType, ResourceType
from colony_manager.domain.models.colony import Colony


def apply_ecclesiastical_protection(
    colony: Colony,
    order_decrease: int,
    use_protection: bool,
) -> Colony:
    """
    Apply Ecclesiastical colony protection: convert Order loss to Piety loss.
    
    Per Rogue Trader Colony Rules:
    "If an Ecclesiastical Colony's Order would decrease by any amount, its
    owners can choose to have its Piety decrease by that amount instead."
    
    Args:
        colony: The colony to apply the effect to.
        order_decrease: Amount of Order that would be lost.
        use_protection: Whether to use the Ecclesiastical protection
            (player/GM choice).
    
    Returns:
        New Colony instance with adjusted stats.
    """
    if colony.colony_type != ColonyType.ECCLESIASTICAL:
        return colony
    
    if not use_protection:
        return colony
    
    # Convert Order loss to Piety loss
    new_order = colony.base_order  # No change
    new_piety = max(colony.base_piety - order_decrease, 0)
    
    return colony.model_copy(
        update={
            "base_order": new_order,
            "base_piety": new_piety,
        }
    )


def check_agricultural_resilience(dice_roll: int) -> bool:
    """
    Check if Agricultural colony prevents Size decrease.
    
    Per Rogue Trader Colony Rules:
    "Any time an Agricultural Colony's Size would decrease, roll 1d10;
    on a result of 8 or higher, it does not decrease."
    
    Args:
        dice_roll: 1d10 roll result (1-10).
    
    Returns:
        True if Size decrease is prevented (roll >= 8).
    """
    return dice_roll >= 8


def get_mining_industry_resource_bonus(colony: Colony) -> tuple[int, int]:
    """
    Get Mining/Industry colony resource exploitation bonus.
    
    Per Rogue Trader Colony Rules:
    "If set to exploiting Mineral Resources, the Colony's Productivity
    increases by 2 and it generates 2 additional Profit Factor."
    
    Args:
        colony: The colony to check.
    
    Returns:
        Tuple of (Productivity bonus, Profit Factor bonus).
        Returns (0, 0) if not Mining/Industry or not exploiting Minerals.
    """
    if colony.colony_type not in (
        ColonyType.MINING,
        ColonyType.INDUSTRY,
        ColonyType.MINING_AND_INDUSTRY,
    ):
        return (0, 0)
    
    if ResourceType.MINERAL not in colony.planetary_resources:
        return (0, 0)
    
    return (2, 2)


def get_research_mission_resource_bonus(colony: Colony) -> tuple[int, int]:
    """
    Get Research Mission colony resource exploitation bonus.
    
    Per Rogue Trader Colony Rules:
    "If set to exploiting Organic Compound, Archeotech Cache, or Xenos Ruins
    Resources, the Colony's Productivity increases by 2 and it generates 1
    additional Profit Factor."
    
    Args:
        colony: The colony to check.
    
    Returns:
        Tuple of (Productivity bonus, Profit Factor bonus).
        Returns (0, 0) if not Research Mission or not exploiting
        qualifying resources.
    """
    if colony.colony_type != ColonyType.RESEARCH_MISSION:
        return (0, 0)
    
    qualifying_resources = {
        ResourceType.ORGANIC_COMPOUND,
        ResourceType.ARCHEOTECH_CACHE,
        ResourceType.XENOS_RUINS,
    }
    
    # Check if colony is exploiting any qualifying resource
    if not (set(colony.planetary_resources) & qualifying_resources):
        return (0, 0)
    
    return (2, 1)