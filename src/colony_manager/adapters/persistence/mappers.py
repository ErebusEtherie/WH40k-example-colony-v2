"""Mapping helpers between domain models and ORM models."""

from __future__ import annotations

import json

from colony_manager.adapters.persistence.orm_models import (
    ColonyORM,
    InfrastructureORM,
    ModifierORM,
    RepresentativeORM,
    SupportUpgradeORM,
    UserORM,
)
from colony_manager.domain.enums import (
    ColonyType,
    ModifierSourceType,
    ModifierStat,
    RepresentativeType,
    SkillLevel,
)
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.representative import (
    Personality,
    Representative,
    RepresentativeStats,
    Skill,
    Talent,
)
from colony_manager.domain.models.support_upgrade import SupportUpgrade
from colony_manager.domain.models.user import User, UserRole


def orm_to_domain_colony(orm: ColonyORM) -> Colony:
    return Colony(
        id=orm.id,
        name=orm.name,
        owner=orm.owner,
        colony_type=ColonyType(orm.colony_type),
        age_days=orm.age_days,
        age_last_updated=orm.age_last_updated,
        current_event=orm.current_event,
        base_complacency=orm.base_complacency,
        base_order=orm.base_order,
        base_productivity=orm.base_productivity,
        base_piety=orm.base_piety,
        base_size=orm.base_size,
        representative_id=orm.representative_id,
        modifiers=[orm_to_domain_modifier(modifier) for modifier in orm.modifiers],
        infrastructure=[orm_to_domain_infrastructure(inf) for inf in orm.infrastructure],
        support_upgrades=[orm_to_domain_support_upgrade(upg) for upg in orm.support_upgrades],
    )


def domain_to_orm_colony(domain: Colony) -> ColonyORM:
    return ColonyORM(
        id=domain.id,
        name=domain.name,
        owner=domain.owner,
        colony_type=domain.colony_type.value,
        age_days=domain.age_days,
        age_last_updated=domain.age_last_updated,
        current_event=domain.current_event,
        base_complacency=domain.base_complacency,
        base_order=domain.base_order,
        base_productivity=domain.base_productivity,
        base_piety=domain.base_piety,
        base_size=domain.base_size,
        representative_id=domain.representative_id,
        modifiers=[domain_to_orm_modifier(modifier) for modifier in domain.modifiers],
        infrastructure=[domain_to_orm_infrastructure(inf) for inf in domain.infrastructure],
        support_upgrades=[domain_to_orm_support_upgrade(upg) for upg in domain.support_upgrades],
    )


def orm_to_domain_representative(orm: RepresentativeORM) -> Representative:
    """Convert a RepresentativeORM to a Representative domain model.
    
    Args:
        orm: The SQLAlchemy ORM model instance.
        
    Returns:
        The corresponding domain Representative object.
    """
    return Representative(
        id=orm.id,
        name=orm.name,
        type=RepresentativeType(orm.type),
        personalities=[Personality(**item) for item in json.loads(orm.personalities)],
        stats=RepresentativeStats(**json.loads(orm.stats)),
        skills=[Skill(name=item["name"], level=SkillLevel(item["level"]), description=item["description"]) for item in json.loads(orm.skills)],
        talents=[Talent(**item) for item in json.loads(orm.talents)],
        assigned_to_colony_id=orm.assigned_to_colony_id,
    )


def domain_to_orm_representative(domain: Representative) -> RepresentativeORM:
    """Convert a Representative domain model to a RepresentativeORM.
    
    Args:
        domain: The domain Representative object.
        
    Returns:
        The corresponding SQLAlchemy ORM model instance.
    """
    return RepresentativeORM(
        id=domain.id,
        name=domain.name,
        type=domain.type.value,
        personalities=json.dumps([item.model_dump() for item in domain.personalities]),
        stats=json.dumps(domain.stats.model_dump()),
        skills=json.dumps([{"name": item.name, "level": item.level.value, "description": item.description} for item in domain.skills]),
        talents=json.dumps([item.model_dump() for item in domain.talents]),
        assigned_to_colony_id=domain.assigned_to_colony_id,
    )


def orm_to_domain_modifier(orm: ModifierORM) -> Modifier:
    return Modifier(
        id=orm.id,
        colony_id=orm.colony_id,
        modifier_source_type=ModifierSourceType(orm.modifier_source_type),
        modifier_stat=ModifierStat(orm.modifier_stat),
        modifier_value=orm.modifier_value,
        description=orm.modifier_description,
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


def orm_to_domain_infrastructure(orm: InfrastructureORM) -> Infrastructure:
    from colony_manager.domain.enums import InfrastructureState, InfrastructureType
    return Infrastructure(
        id=orm.id,
        colony_id=orm.colony_id,
        infrastructure_type=InfrastructureType(orm.infrastructure_type),
        state=InfrastructureState(orm.state),
    )


def domain_to_orm_infrastructure(domain: Infrastructure) -> InfrastructureORM:
    return InfrastructureORM(
        id=domain.id,
        colony_id=domain.colony_id,
        infrastructure_type=domain.infrastructure_type.value,
        state=domain.state.value,
    )


def orm_to_domain_support_upgrade(orm: SupportUpgradeORM) -> SupportUpgrade:
    from colony_manager.domain.enums import ModifierStat, SupportUpgradeType
    return SupportUpgrade(
        id=orm.id,
        colony_id=orm.colony_id,
        upgrade_type=SupportUpgradeType(orm.upgrade_type),
        custom_stat_choice=ModifierStat(orm.custom_stat_choice) if orm.custom_stat_choice else None,
        custom_product=orm.custom_product,
        affiliated_group=orm.affiliated_group,
    )


def domain_to_orm_support_upgrade(domain: SupportUpgrade) -> SupportUpgradeORM:
    return SupportUpgradeORM(
        id=domain.id,
        colony_id=domain.colony_id,
        upgrade_type=domain.upgrade_type.value,
        custom_stat_choice=domain.custom_stat_choice.value if domain.custom_stat_choice else None,
        custom_product=domain.custom_product,
        affiliated_group=domain.affiliated_group,
    )


def orm_to_domain_user(orm: UserORM) -> User:
    """Convert a UserORM to a User domain model.
    
    Args:
        orm: The SQLAlchemy ORM model instance.
        
    Returns:
        The corresponding domain User object.
    """
    from datetime import datetime
    
    return User(
        id=orm.id,
        username=orm.username,
        email=orm.email,
        password_hash=orm.password_hash,
        role=UserRole(orm.role),
        is_active=orm.is_active,
        created_at=datetime.combine(orm.created_at, datetime.min.time()) if orm.created_at else None,
        updated_at=datetime.combine(orm.updated_at, datetime.min.time()) if orm.updated_at else None,
        managed_colony_id=orm.managed_colony_id,
    )


def domain_to_orm_user(domain: User) -> UserORM:
    """Convert a User domain model to a UserORM.
    
    Args:
        domain: The domain User object.
        
    Returns:
        The corresponding SQLAlchemy ORM model instance.
    """
    from datetime import date
    
    return UserORM(
        id=domain.id,
        username=domain.username,
        email=domain.email,
        password_hash=domain.password_hash,
        role=domain.role.value if hasattr(domain.role, "value") else domain.role,
        is_active=domain.is_active,
        created_at=date(domain.created_at.year, domain.created_at.month, domain.created_at.day) if domain.created_at else None,
        updated_at=date(domain.updated_at.year, domain.updated_at.month, domain.updated_at.day) if domain.updated_at else None,
        managed_colony_id=domain.managed_colony_id,
    )

