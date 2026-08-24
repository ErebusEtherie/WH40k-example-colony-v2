"""Domain enums for the colony manager."""

from enum import StrEnum


class ModifierSourceType(StrEnum):
    GM_CUSTOM = "gm_custom"
    GROWTH_DECAY = "growth_decay"
    REPRESENTATIVE_LEADERSHIP = "representative_leadership"
    RESOURCE = "resource"
    INFRASTRUCTURE = "infrastructure"
    SUPPORT_UPGRADE = "support_upgrade"


class ModifierCategory(StrEnum):
    """Category of modifier for tracking and filtering purposes."""
    PERMANENT = "permanent"  # Always active (infrastructure, support upgrades, resources)
    CONDITIONAL = "conditional"  # Condition-based (state effects, growth/decay)
    CUSTOM = "custom"  # GM-created custom modifiers


class ModifierStat(StrEnum):
    SIZE = "size"
    COMPLACENCY = "complacency"
    ORDER = "order"
    PRODUCTIVITY = "productivity"
    PIETY = "piety"
    PROFIT_FACTOR = "profit_factor"


class LoreState(StrEnum):
    # Base states
    STABLE = "stable"
    # Complacency states
    PLACATED = "placated"
    RIOTS_AND_UNREST = "riots_and_unrest"
    # Order states
    ANARCHY = "anarchy"
    ORDERLY = "orderly"
    # Productivity states
    PRODUCTIVE = "productive"
    HALTED = "halted"
    # Piety states
    PIOUS = "pious"
    HERETICAL = "heretical"


class RepresentativeType(StrEnum):
    SATRAP = "satrap"
    JUDGE = "judge"
    CARDINAL = "cardinal"
    COLONIST_REPRESENTATIVE = "colonist_representative"
    MILITARY_COMMANDER = "military_commander"
    DYNASTY_MEMBER = "dynasty_member"


class SkillLevel(StrEnum):
    KNOWN = "known"
    PLUS_10 = "+10"
    PLUS_20 = "+20"
    PLUS_30 = "+30"


class InfrastructureType(StrEnum):
    """Hard Infrastructure types - physical systems required for colony survival."""
    TRANSPORT = "transport"
    POWER_NETWORK = "power_network"
    WATER_MANAGEMENT = "water_management"
    FOOD_PRODUCTION = "food_production"
    COMMUNICATIONS = "communications"


class InfrastructureState(StrEnum):
    """State of infrastructure installation/operation."""
    PLANNED = "planned"  # Not yet installed, no effect
    WORKING = "working"  # Operational, bonuses apply
    NOT_WORKING = "not_working"  # Incapacitated, penalties apply


class SupportUpgradeType(StrEnum):
    """Support (Soft) Upgrades - non-essential but valuable additions."""
    ARBITES_PRECINCT = "arbites_precinct"
    ECCLESIOARCHY_MISSION = "ecclesiarchy_mission"
    MECHANICUM_STATION = "mechanicum_station"
    INFANTRY_GARRISON = "infantry_garrison"
    IMPERIAL_NAVY_STATION = "imperial_navy_station"
    CULTURAL_IMPROVEMENT = "cultural_improvement"
    INDUSTRIAL_FACILITY = "industrial_facility"
    PERSONAL_LODGINGS = "personal_lodgings"
    CONTACTS = "contacts"
    TRAPPINGS = "trappings"


class ResourceType(StrEnum):
    """Planetary resource types that colonies can exploit.
    
    Per Rogue Trader Colony Rules, different colony types gain bonuses
    when exploiting specific resource types.
    """
    MINERAL = "mineral"
    ORGANIC_COMPOUND = "organic_compound"
    ARCHEOTECH_CACHE = "archeotech_cache"
    XENOS_RUINS = "xenos_ruins"


class ColonyType(StrEnum):
    """Colony archetypes defining starting characteristics and specializations."""
    RESEARCH_MISSION = "research_mission"
    MINING = "mining"
    INDUSTRY = "industry"
    MINING_AND_INDUSTRY = "mining_and_industry"
    ECCLESIASTICAL = "ecclesiastical"
    AGRICULTURAL = "agricultural"


class GrowthEffect(StrEnum):
    """Result of colony growth roll."""
    DECREASE = "decrease"
    NO_CHANGE = "no_change"
    INCREASE = "increase"


class DynastyOutcome(StrEnum):
    """Consequences of Nepotism for Dynasty Member representatives."""
    THAT_ONE_HAS_POTENTIAL = "that_one_has_potential"
    ONE_TO_KEEP_AN_EYE_ON = "one_to_keep_an_eye_on"
    THRILLING_HEROICS = "thrilling_heroics"
    COME_ON_ITS_JUST_A_GROX = "come_on_its_just_a_grox"
    YOU_BUILT_THE_PALACE_ON_A_VOLCANO = "you_built_the_palace_on_a_volcano"
