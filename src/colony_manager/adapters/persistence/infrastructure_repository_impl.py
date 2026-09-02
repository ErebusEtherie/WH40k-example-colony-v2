"""SQLite-backed infrastructure repository implementation."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.mappers import (
    domain_to_orm_infrastructure,
    orm_to_domain_infrastructure,
)
from colony_manager.adapters.persistence.orm_models import Base, InfrastructureORM
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.ports.infrastructure_repository import InfrastructureRepository


class SqlAlchemyInfrastructureRepository(InfrastructureRepository):
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        self._engine = create_engine(database_url)
        Base.metadata.create_all(self._engine)

    def create(self, infrastructure: Infrastructure) -> Infrastructure:
        with Session(self._engine) as session:
            orm = domain_to_orm_infrastructure(infrastructure)
            session.add(orm)
            session.commit()
            session.refresh(orm)
            return orm_to_domain_infrastructure(orm)

    def get(self, infrastructure_id: int) -> Infrastructure | None:
        with Session(self._engine) as session:
            orm = session.get(InfrastructureORM, infrastructure_id)
            if orm is None:
                return None
            return orm_to_domain_infrastructure(orm)

    def update(self, infrastructure: Infrastructure) -> Infrastructure:
        with Session(self._engine) as session:
            orm = session.get(InfrastructureORM, infrastructure.id)
            if orm is None:
                raise ValueError(f"Infrastructure {infrastructure.id} not found")
            orm.infrastructure_type = infrastructure.infrastructure_type.value
            orm.state = infrastructure.state.value
            orm.name = infrastructure.name
            orm.notes = infrastructure.notes
            session.commit()
            return orm_to_domain_infrastructure(orm)

    def delete(self, infrastructure_id: int) -> None:
        with Session(self._engine) as session:
            orm = session.get(InfrastructureORM, infrastructure_id)
            if orm is not None:
                session.delete(orm)
                session.commit()

    def list_by_colony(self, colony_id: int) -> list[Infrastructure]:
        with Session(self._engine) as session:
            return [
                orm_to_domain_infrastructure(orm)
                for orm in session.query(InfrastructureORM).filter_by(colony_id=colony_id).all()
            ]

    def list(self) -> list[Infrastructure]:
        with Session(self._engine) as session:
            return [
                orm_to_domain_infrastructure(orm) for orm in session.query(InfrastructureORM).all()
            ]
