"""SQLite-backed colony repository implementation."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.mappers import domain_to_orm_colony, orm_to_domain_colony
from colony_manager.adapters.persistence.orm_models import Base, ColonyORM
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.ports.colony_repository import ColonyRepository


class SqlAlchemyColonyRepository(ColonyRepository):
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        self._engine = create_engine(database_url)
        Base.metadata.create_all(self._engine)

    def create(self, colony: Colony) -> Colony:
        with Session(self._engine) as session:
            orm = domain_to_orm_colony(colony)
            session.add(orm)
            session.commit()
            session.refresh(orm)
            return orm_to_domain_colony(orm)

    def get(self, colony_id: int) -> Colony | None:
        with Session(self._engine) as session:
            orm = session.get(ColonyORM, colony_id)
            if orm is None:
                return None
            return orm_to_domain_colony(orm)

    def update(self, colony: Colony) -> Colony:
        with Session(self._engine) as session:
            orm = session.get(ColonyORM, colony.id)
            if orm is None:
                raise ValueError(f"Colony {colony.id} not found")
            orm.name = colony.name
            orm.owner = colony.owner
            orm.colony_type = colony.colony_type
            orm.age_days = colony.age_days
            orm.age_last_updated = colony.age_last_updated
            orm.event_roll_interval_days = colony.event_roll_interval_days
            orm.development_roll_interval_days = colony.development_roll_interval_days
            orm.base_complacency = colony.base_complacency
            orm.base_order = colony.base_order
            orm.base_productivity = colony.base_productivity
            orm.base_piety = colony.base_piety
            orm.base_size = colony.base_size
            orm.representative_id = colony.representative_id
            orm.modifiers = [domain_to_orm_colony(colony).modifiers[0]] if False else []
            session.commit()
            return orm_to_domain_colony(orm)

    def delete(self, colony_id: int) -> None:
        with Session(self._engine) as session:
            orm = session.get(ColonyORM, colony_id)
            if orm is not None:
                session.delete(orm)
                session.commit()

    def list(self) -> list[Colony]:
        with Session(self._engine) as session:
            return [orm_to_domain_colony(orm) for orm in session.query(ColonyORM).all()]
