"""Support Upgrade rules for the colony manager.

Per Rogue Trader Colony Rules:
- Support Upgrades provide stat bonuses and mechanical effects
- Mechanical effects are lore-only (no time tracking in engine)
- Some upgrades have conditional bonuses (e.g., Mechanicum varies by colony type)
- Cultural Improvement allows choosing any stat except Size
"""

from colony_manager.domain.enums import ColonyType, ModifierStat, SupportUpgradeType
from colony_manager.domain.models.modifier import Modifier, ModifierSourceType
from colony_manager.domain.models.support_upgrade import SupportUpgrade


def get_support_upgrade_modifiers(
    upgrade: SupportUpgrade,
    colony_type: ColonyType | None = None,
) -> list[Modifier]:
    """
    Get modifiers from a support upgrade.
    
    Args:
        upgrade: The support upgrade to get modifiers from.
        colony_type: Colony type for conditional bonuses (e.g., Mechanicum).
    
    Returns:
        List of modifiers from this upgrade.
    """
    modifiers = []
    
    # Handle standard stat effects
    base_modifiers = _get_base_modifiers(upgrade.upgrade_type, colony_type)
    modifiers.extend(base_modifiers)
    
    # Handle Cultural Improvement custom choice
    if upgrade.upgrade_type == SupportUpgradeType.CULTURAL_IMPROVEMENT:
        if upgrade.custom_stat_choice and upgrade.custom_stat_choice != ModifierStat.SIZE:
            modifiers.append(
                Modifier(
                    modifier_source_type=ModifierSourceType.SUPPORT_UPGRADE,
                    modifier_stat=upgrade.custom_stat_choice,
                    modifier_value=1,
                    description="Cultural Improvement (chosen)",
                    is_active=True,
                )
            )
    
    return modifiers


def _get_base_modifiers(
    upgrade_type: SupportUpgradeType,
    colony_type: ColonyType | None = None,
) -> list[Modifier]:
    """Get base modifiers for an upgrade type."""
    modifiers = []
    
    if upgrade_type == SupportUpgradeType.ARBITES_PRECINCT:
        modifiers.append(_make_modifier(ModifierStat.ORDER, 1, "Arbites Precinct"))
    
    elif upgrade_type == SupportUpgradeType.ECCLESIOARCHY_MISSION:
        modifiers.append(_make_modifier(ModifierStat.PIETY, 1, "Ecclesiarchy Mission"))
        modifiers.append(_make_modifier(ModifierStat.ORDER, 1, "Ecclesiarchy Mission"))
        modifiers.append(_make_modifier(ModifierStat.COMPLACENCY, 1, "Ecclesiarchy Mission"))
    
    elif upgrade_type == SupportUpgradeType.MECHANICUM_STATION:
        # Base +1, +2 for Mining/Industry/Mining_and_Industry, +3 for Research Mission
        productivity_bonus = 1
        if colony_type:
            if colony_type in (
                ColonyType.MINING,
                ColonyType.INDUSTRY,
                ColonyType.MINING_AND_INDUSTRY,
            ):
                productivity_bonus = 2
            elif colony_type == ColonyType.RESEARCH_MISSION:
                productivity_bonus = 3
        modifiers.append(_make_modifier(ModifierStat.PRODUCTIVITY, productivity_bonus, "Mechanicum Station"))
    
    elif upgrade_type == SupportUpgradeType.INFANTRY_GARRISON:
        modifiers.append(_make_modifier(ModifierStat.ORDER, 1, "Infantry Garrison"))
    
    elif upgrade_type == SupportUpgradeType.IMPERIAL_NAVY_STATION:
        modifiers.append(_make_modifier(ModifierStat.ORDER, 1, "Imperial Navy Station"))
    
    elif upgrade_type == SupportUpgradeType.INDUSTRIAL_FACILITY:
        modifiers.append(_make_modifier(ModifierStat.PRODUCTIVITY, 1, "Industrial Facility"))
    
    elif upgrade_type == SupportUpgradeType.PERSONAL_LODGINGS:
        modifiers.append(_make_modifier(ModifierStat.ORDER, 1, "Personal Lodgings"))
    
    elif upgrade_type == SupportUpgradeType.TRAPPINGS:
        modifiers.append(_make_modifier(ModifierStat.COMPLACENCY, 1, "Trappings"))
    
    # Contacts and Cultural Improvement have no base modifiers (handled separately)
    
    return modifiers


def _make_modifier(stat: ModifierStat, value: int, source_name: str) -> Modifier:
    """Helper to create a modifier."""
    return Modifier(
        modifier_source_type=ModifierSourceType.SUPPORT_UPGRADE,
        modifier_stat=stat,
        modifier_value=value,
        description=source_name,
        is_active=True,
    )


def apply_support_upgrade_modifiers(
    upgrades: list[SupportUpgrade],
    colony_type: ColonyType | None = None,
) -> list[Modifier]:
    """
    Apply modifiers from all support upgrades in a colony.
    
    Args:
        upgrades: List of all support upgrades in the colony.
        colony_type: Colony type for conditional bonuses.
    
    Returns:
        Combined list of all active modifiers.
    """
    all_modifiers = []
    for upgrade in upgrades:
        all_modifiers.extend(get_support_upgrade_modifiers(upgrade, colony_type))
    return all_modifiers