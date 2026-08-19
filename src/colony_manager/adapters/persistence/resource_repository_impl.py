"""SQLite-backed resource repository implementation."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from colony_manager.adapters.persistence.orm_models import Base, ResourceORM
from colony_manager.domain.enums import ResourceType
from colony_manager.domain.models.resource import ColonyResource
from colony_manager.domain.ports.resource_repository import ResourceRepository


class SqlAlchemyResourceRepository(ResourceRepository):
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        self._engine = create_engine(database_url)
        Base.metadata.create_all(self._engine)

    def create(self, resource: ColonyResource) -> ColonyResource:
        with Session(self._engine) as session:
            orm = ResourceORM(
                colony_id=resource.colony_id,
                resource_type=resource.resource_type,
                name=resource.name,
                abundance=resource.abundance,
                notes=resource.notes,
                discovered_date=resource.discovered_date,
            )
            session.add(orm)
            session.commit()
            session.refresh(orm)
            return orm_to_domain_resource(orm)

    def get(self, resource_id: int) -> ColonyResource:
        with Session(self._engine) as session:
            orm = session.get(ResourceORM, resource_id)
            if orm is None:
                raise ValueError(f"Resource {resource_id} not found")
            return orm_to_domain_resource(orm)

    def get_by_colony(self, colony_id: int) -> list[ColonyResource]:
        with Session(self._engine) as session:
            resources = session.query(ResourceORM).filter_by(colony_id=colony_id).all()
            return [orm_to_domain_resource(r) for r in resources]

    def update(self, resource: ColonyResource) -> ColonyResource:
        with Session(self._engine) as session:
            orm = session.get(ResourceORM, resource.id)
            if orm is None:
                raise ValueError(f"Resource {resource.id} not found")
            orm.resource_type = resource.resource_type
            orm.name = resource.name
            orm.abundance = resource.abundance
            orm.notes = resource.notes
            orm.discovered_date = resource.discovered_date
            session.commit()
            session.refresh(orm)
            return orm_to_domain_resource(orm)

    def delete(self, resource_id: int) -> None:
        with Session(self._engine) as session:
            orm = session.get(ResourceORM, resource_id)
            if orm is None:
                return
            session.delete(orm)
            session.commit()

    def delete_by_colony(self, colony_id: int) -> None:
        with Session(self._engine) as session:
            session.query(ResourceORM).filter_by(colony_id=colony_id).delete()
            session.commit()


def orm_to_domain_resource(orm: ResourceORM) -> ColonyResource:
    """Convert ORM model to domain model."""
    return ColonyResource(
        id=orm.id,
        colony_id=orm.colony_id,
        resource_type=ResourceType(orm.resource_type),
        name=orm.name,
        abundance=orm.abundance,
        notes=orm.notes or "",
        discovered_date=orm.discovered_date,
    )


def domain_to_orm_resource(resource: ColonyResource) -> ResourceORM:
    """Convert domain model to ORM model."""
    return ResourceORM(
        id=resource.id,
        colony_id=resource.colony_id,
        resource_type=resource.resource_type,
        name=resource.name,
        abundance=resource.abundance,
        notes=resource.notes,
        discovered_date=resource.discovered_date,
    )