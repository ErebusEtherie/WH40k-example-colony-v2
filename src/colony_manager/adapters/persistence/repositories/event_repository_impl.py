"""SQLAlchemy implementation of EventRepository."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select

from colony_manager.adapters.persistence.mappers import domain_to_orm_event, orm_to_domain_event
from colony_manager.adapters.persistence.orm_models import EventORM
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.event import Event
from colony_manager.domain.ports.event_repository import EventRepository


class SqlAlchemyEventRepository(EventRepository):
    """SQLAlchemy implementation of EventRepository.
    
    This implementation uses SQLAlchemy for database operations and follows
    the repository pattern defined in the domain layer.
    """
    
    def __init__(self, database_url: str = "sqlite:///:memory:") -> None:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        self._engine = create_engine(database_url)
        self._session_factory = sessionmaker(bind=self._engine, autoflush=False, autocommit=False)
    
    def _get_session(self) -> Any:
        """Get a database session."""
        
        return self._session_factory()
    
    def create(self, event: Event) -> Event:
        """Create a new event in the database."""
        with self._get_session() as session:
            orm_event = domain_to_orm_event(event)
            orm_event.created_at = datetime.now(UTC)
            
            session.add(orm_event)
            session.commit()
            session.refresh(orm_event)
            
            return orm_to_domain_event(orm_event)
    
    def get_by_id(self, event_id: int) -> Event | None:
        """Get event by ID."""
        with self._get_session() as session:
            orm_event = session.get(EventORM, event_id)
            if orm_event is None:
                return None
            return orm_to_domain_event(orm_event)
    
    def get_by_colony(self, colony_id: int, active_only: bool = False) -> list[Event]:
        """Get all events for a colony."""
        with self._get_session() as session:
            query = select(EventORM).where(EventORM.colony_id == colony_id)
            
            if active_only:
                query = query.where(EventORM.is_active == True)
            
            result = session.execute(query)
            orm_events = result.scalars().all()
            return [orm_to_domain_event(orm) for orm in orm_events]
    
    def update(self, event: Event) -> Event:
        """Update an existing event."""
        if event.id is None:
            raise NotFoundError("Event ID is required for update")
        
        with self._get_session() as session:
            orm_event = session.get(EventORM, event.id)
            
            if orm_event is None:
                raise NotFoundError(f"Event with ID {event.id} not found")
            
            # Update fields
            orm_event.name = event.name
            orm_event.description = event.description
            orm_event.is_active = event.is_active
            
            session.commit()
            session.refresh(orm_event)
            
            return orm_to_domain_event(orm_event)
    
    def delete(self, event_id: int) -> None:
        """Delete an event (soft delete by setting is_active=False)."""
        with self._get_session() as session:
            orm_event = session.get(EventORM, event_id)
            
            if orm_event is None:
                raise NotFoundError(f"Event with ID {event_id} not found")
            
            # Soft delete
            orm_event.is_active = False
            session.commit()