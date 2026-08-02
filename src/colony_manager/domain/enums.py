"""Domain enums for the colony manager."""

from enum import StrEnum


class ModifierSourceType(StrEnum):
    GM_CUSTOM = "gm_custom"
    GROWTH_DECAY = "growth_decay"
    REPRESENTATIVE_LEADERSHIP = "representative_leadership"
    RESOURCE = "resource"
    INFRASTRUCTURE = "infrastructure"
    SUPPORT_UPGRADE = "support_upgrade"


class ModifierStat(StrEnum):
    SIZE = "size"
    COMPLACENCY = "complacency"
    ORDER = "order"
    PRODUCTIVITY = "productivity"
    PIETY = "piety"
    PROFIT_FACTOR = "profit_factor"


class LoreState(StrEnum):
    STABLE = "stable"
    PLACATED = "placated"
    ANARCHY = "anarchy"
    PRODUCTIVE = "productive"
    HALTED = "halted"
    PIOUS = "pious"
    HERETICAL = "heretical"
    # Note: exact labels for Complacency == 0 and Order > Size are not confirmed.


class RepresentativeType(StrEnum):
    SATRAP = "satrap"
    JUDGE = "judge"
    CARDINAL = "cardinal"
    COLONIST_REPRESENTATIVE = "colonist_representative"
    MILITARY_COMMANDER = "military_commander"


class SkillLevel(StrEnum):
    KNOWN = "known"
    PLUS_10 = "+10"
    PLUS_20 = "+20"
    PLUS_30 = "+30"
