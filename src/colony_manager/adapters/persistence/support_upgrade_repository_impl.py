"""SQLite-backed support upgrade repository implementation."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.mappers import (
    domain_to_orm_support_upgrade,
    orm_to_domain_support_upgrade,
)
from colony_manager.adapters.persistence.orm_models import Base, SupportUpgradeORM
from colony_manager.domain.models.support_upgrade import SupportUpgrade
from colony_manager.domain.ports.support_upgrade_repository import SupportUpgradeRepository


class SqlAlchemySupportUpgradeRepository(SupportUpgradeRepository):
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        self._engine = create_engine(database_url)
        Base.metadata.create_all(self._engine)

    def create(self, upgrade: SupportUpgrade) -> SupportUpgrade:
        with Session(self._engine) as session:
            orm = domain_to_orm_support_upgrade(upgrade)
            session.add(orm)
            session.commit()
            session.refresh(orm)
            return orm_to_domain_support_upgrade(orm)

    def get(self, upgrade_id: int) -> SupportUpgrade | None:
        with Session(self._engine) as session:
            orm = session.get(SupportUpgradeORM, upgrade_id)
            if orm is None:
                return None
            return orm_to_domain_support_upgrade(orm)

    def update(self, upgrade: SupportUpgrade) -> SupportUpgrade:
        with Session(self._engine) as session:
            orm = session.get(SupportUpgradeORM, upgrade.id)
            if orm is None:
                raise ValueError(f"SupportUpgrade {upgrade.id} not found")
            orm.upgrade_type = upgrade.upgrade_type.value
            orm.custom_stat_choice = upgrade.custom_stat_choice.value if upgrade.custom_stat_choice else None
            orm.custom_product = upgrade.custom_product
            orm.affiliated_group = upgrade.affiliated_group
            session.commit()
            return orm_to_domain_support_upgrade(orm)

    def delete(self, upgrade_id: int) -> None:
        with Session(self._engine) as session:
            orm = session.get(SupportUpgradeORM, upgrade_id)
            if orm is not None:
                session.delete(orm)
                session.commit()

    def list_by_colony(self, colony_id: int) -> list[SupportUpgrade]:
        with Session(self._engine) as session:
            return [
                orm_to_domain_support_upgrade(orm)
                for orm in session.query(SupportUpgradeORM).filter_by(colony_id=colony_id).all()
            ]

    def list(self) -> list[SupportUpgrade]:
        with Session(self._engine) as session:
            return [orm_to_domain_support_upgrade(orm) for orm in session.query(SupportUpgradeORM).all()]
