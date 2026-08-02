"""Explicit import/export mapping helpers for save files."""

from __future__ import annotations

from datetime import date

from colony_manager.adapters.io.save_file_schema import (
    ColonySaveFile,
    SaveModifier,
    SavePersonality,
    SaveRepresentative,
    SaveRepresentativeStats,
    SaveSkill,
    SaveTalent,
)
from colony_manager.domain.enums import ModifierSourceType, ModifierStat, RepresentativeType, SkillLevel
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.representative import Personality, Representative, RepresentativeStats, Skill, Talent


def domain_to_save_file(colony: Colony, representative: Representative | None = None) -> ColonySaveFile:
    return ColonySaveFile(
        name=colony.name,
        owner=colony.owner,
        colony_type=colony.colony_type,
        age_days=colony.age_days,
        age_last_updated=colony.age_last_updated.isoformat(),
        event_roll_interval_days=colony.event_roll_interval_days,
        development_roll_interval_days=colony.development_roll_interval_days,
        base_complacency=colony.base_complacency,
        base_order=colony.base_order,
        base_productivity=colony.base_productivity,
        base_piety=colony.base_piety,
        base_size=colony.base_size,
        representative_id=colony.representative_id,
        modifiers=[
            SaveModifier(
                modifier_source_type=modifier.modifier_source_type,
                modifier_stat=modifier.modifier_stat,
                modifier_value=modifier.modifier_value,
                modifier_description=modifier.modifier_description,
                is_active=modifier.is_active,
            )
            for modifier in colony.modifiers
        ],
        representative=None if representative is None else domain_to_save_representative(representative),
    )


def save_file_to_domain(save_file: ColonySaveFile) -> tuple[Colony, Representative | None]:
    colony = Colony(
        name=save_file.name,
        owner=save_file.owner,
        colony_type=save_file.colony_type,
        age_days=save_file.age_days,
        age_last_updated=date.fromisoformat(save_file.age_last_updated),
        event_roll_interval_days=save_file.event_roll_interval_days,
        development_roll_interval_days=save_file.development_roll_interval_days,
        base_complacency=save_file.base_complacency,
        base_order=save_file.base_order,
        base_productivity=save_file.base_productivity,
        base_piety=save_file.base_piety,
        base_size=save_file.base_size,
        representative_id=save_file.representative_id,
        modifiers=[
            Modifier(
                colony_id=0,
                modifier_source_type=modifier.modifier_source_type,
                modifier_stat=modifier.modifier_stat,
                modifier_value=modifier.modifier_value,
                modifier_description=modifier.modifier_description,
                is_active=modifier.is_active,
            )
            for modifier in save_file.modifiers
        ],
    )
    representative = None if save_file.representative is None else save_file_to_domain_representative(save_file.representative)
    return colony, representative


def domain_to_save_representative(representative: Representative) -> SaveRepresentative:
    stats_payload = representative.stats.model_dump(by_alias=True)
    if "int" in stats_payload:
        stats_payload["int"] = stats_payload["int"]
    elif "int_value" in stats_payload:
        stats_payload["int"] = stats_payload.pop("int_value")
    else:
        stats_payload["int"] = None
    return SaveRepresentative(
        name=representative.name,
        type=representative.type,
        personalities=[SavePersonality(**personality.model_dump()) for personality in representative.personalities],
        stats=SaveRepresentativeStats(**stats_payload),
        skills=[SaveSkill(name=skill.name, level=skill.level, description=skill.description) for skill in representative.skills],
        talents=[SaveTalent(**talent.model_dump()) for talent in representative.talents],
    )


def save_file_to_domain_representative(representative: SaveRepresentative) -> Representative:
    stats_payload = representative.stats.model_dump(by_alias=True)
    if "int" in stats_payload:
        stats_payload["int"] = stats_payload.pop("int")
    if "int_value" in stats_payload:
        stats_payload["int"] = stats_payload.pop("int_value")
    return Representative(
        name=representative.name,
        type=representative.type,
        personalities=[Personality(**personality.model_dump()) for personality in representative.personalities],
        stats=RepresentativeStats(**stats_payload),
        skills=[Skill(name=skill.name, level=skill.level, description=skill.description) for skill in representative.skills],
        talents=[Talent(**talent.model_dump()) for talent in representative.talents],
    )
