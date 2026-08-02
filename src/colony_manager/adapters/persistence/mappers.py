"""Mapping helpers between domain models and ORM models."""

from __future__ import annotations

import json
from datetime import date

from colony_manager.domain.enums import ModifierSourceType, ModifierStat, RepresentativeType, SkillLevel
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.representative import Personality, Representative, RepresentativeStats, Skill, Talent
from colony_manager.adapters.persistence.orm_models import ColonyORM, ModifierORM, RepresentativeORM


def orm_to_domain_colony(orm: ColonyORM) -> Colony:
    return Colony(
        id=orm.id,
        name=orm.name,
        owner=orm.owner,
        colony_type=orm.colony_type,
        age_days=orm.age_days,
        age_last_updated=orm.age_last_updated,
        event_roll_interval_days=orm.event_roll_interval_days,
        development_roll_interval_days=orm.development_roll_interval_days,
        base_complacency=orm.base_complacency,
        base_order=orm.base_order,
        base_productivity=orm.base_productivity,
        base_piety=orm.base_piety,
        base_size=orm.base_size,
        representative_id=orm.representative_id,
        modifiers=[orm_to_domain_modifier(modifier) for modifier in orm.modifiers],
    )


def domain_to_orm_colony(domain: Colony) -> ColonyORM:
    return ColonyORM(
        id=domain.id,
        name=domain.name,
        owner=domain.owner,
        colony_type=domain.colony_type,
        age_days=domain.age_days,
        age_last_updated=domain.age_last_updated,
        event_roll_interval_days=domain.event_roll_interval_days,
        development_roll_interval_days=domain.development_roll_interval_days,
        base_complacency=domain.base_complacency,
        base_order=domain.base_order,
        base_productivity=domain.base_productivity,
        base_piety=domain.base_piety,
        base_size=domain.base_size,
        representative_id=domain.representative_id,
        modifiers=[domain_to_orm_modifier(modifier) for modifier in domain.modifiers],
    )


def orm_to_domain_representative(orm: RepresentativeORM) -> Representative:
    return Representative(
        id=orm.id,
        name=orm.name,
        type=RepresentativeType(orm.type),
        personalities=[Personality(**item) for item in json.loads(orm.personalities)],
        stats=RepresentativeStats(**json.loads(orm.stats)),
        skills=[Skill(name=item["name"], level=SkillLevel(item["level"]), description=item["description"]) for item in json.loads(orm.skills)],
        talents=[Talent(**item) for item in json.loads(orm.talents)],
    )


def domain_to_orm_representative(domain: Representative) -> RepresentativeORM:
    return RepresentativeORM(
        id=domain.id,
        name=domain.name,
        type=domain.type.value,
        personalities=json.dumps([item.model_dump() for item in domain.personalities]),
        stats=json.dumps(domain.stats.model_dump()),
        skills=json.dumps([{"name": item.name, "level": item.level.value, "description": item.description} for item in domain.skills]),
        talents=json.dumps([item.model_dump() for item in domain.talents]),
    )


def orm_to_domain_modifier(orm: ModifierORM) -> Modifier:
    return Modifier(
        id=orm.id,
        colony_id=orm.colony_id,
        modifier_source_type=ModifierSourceType(orm.modifier_source_type),
        modifier_stat=ModifierStat(orm.modifier_stat),
        modifier_value=orm.modifier_value,
        modifier_description=orm.modifier_description,
        is_active=orm.is_active,
    )


def domain_to_orm_modifier(domain: Modifier) -> ModifierORM:
    return ModifierORM(
        id=domain.id,
        colony_id=domain.colony_id,
        modifier_source_type=domain.modifier_source_type.value,
        modifier_stat=domain.modifier_stat.value,
        modifier_value=domain.modifier_value,
        modifier_description=domain.modifier_description,
        is_active=domain.is_active,
    )
