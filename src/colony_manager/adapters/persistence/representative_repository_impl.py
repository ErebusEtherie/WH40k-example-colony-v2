"""SQLite-backed representative repository implementation."""

from __future__ import annotations

import json

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.mappers import (
    domain_to_orm_representative,
    orm_to_domain_representative,
)
from colony_manager.adapters.persistence.orm_models import Base, RepresentativeORM
from colony_manager.domain.models.representative import Representative
from colony_manager.domain.ports.representative_repository import RepresentativeRepository


class SqlAlchemyRepresentativeRepository(RepresentativeRepository):
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        self._engine = create_engine(database_url)
        Base.metadata.create_all(self._engine)

    def create(self, representative: Representative) -> Representative:
        with Session(self._engine) as session:
            orm = domain_to_orm_representative(representative)
            session.add(orm)
            session.commit()
            session.refresh(orm)
            return orm_to_domain_representative(orm)

    def get(self, representative_id: int) -> Representative | None:
        with Session(self._engine) as session:
            orm = session.get(RepresentativeORM, representative_id)
            if orm is None:
                return None
            return orm_to_domain_representative(orm)

    def update(self, representative: Representative) -> Representative:
        with Session(self._engine) as session:
            orm = session.get(RepresentativeORM, representative.id)
            if orm is None:
                raise ValueError(f"Representative {representative.id} not found")
            orm.name = representative.name
            orm.type = representative.type.value
            orm.personalities = json.dumps([item.model_dump() for item in representative.personalities])
            orm.stats = json.dumps(representative.stats.model_dump())
            orm.skills = json.dumps([{"name": item.name, "level": item.level.value, "description": item.description} for item in representative.skills])
            orm.talents = json.dumps([item.model_dump() for item in representative.talents])
            orm.assigned_to_colony_id = representative.assigned_to_colony_id
            session.commit()
            return orm_to_domain_representative(orm)

    def delete(self, representative_id: int) -> None:
        with Session(self._engine) as session:
            orm = session.get(RepresentativeORM, representative_id)
            if orm is not None:
                session.delete(orm)
                session.commit()

    def list(self) -> list[Representative]:
        with Session(self._engine) as session:
            return [orm_to_domain_representative(orm) for orm in session.query(RepresentativeORM).all()]
