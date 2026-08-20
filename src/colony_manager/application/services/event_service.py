"""Application service for event management.

This service orchestrates event operations, including creation, updates,
and integration with the audit logging system.
"""

from datetime import datetime

from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.event import Event, EventModifier
from colony_manager.domain.ports.audit_log_repository import AuditLogRepository
from colony_manager.domain.ports.event_repository import EventRepository


class EventService:
    """Service for managing colony events.
    
    Events are GM-created occurrences that affect colony stats. This service
    handles event CRUD operations and ensures proper audit logging.
    """
    
    def __init__(
        self,
        event_repository: EventRepository,
        audit_log_repository: AuditLogRepository | None = None,
    ) -> None:
        self._event_repository = event_repository
        self._audit_log_repository = audit_log_repository
    
    def create_event(
        self,
        colony_id: int,
        name: str,
        description: str,
        created_by: int,
        modifiers: list[EventModifier] | None = None,
    ) -> Event:
        """Create a new event for a colony.
        
        Args:
            colony_id: ID of the colony.
            name: Short name for the event.
            description: Detailed description of the event.
            created_by: User ID of the GM creating the event.
            modifiers: Optional list of stat modifiers the event applies.
            
        Returns:
            Created event.
        """
        event = Event(
            colony_id=colony_id,
            name=name,
            description=description,
            created_by=created_by,
            modifiers=modifiers or [],
        )
        
        created_event = self._event_repository.create(event)
        
        # Log the creation
        if self._audit_log_repository:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="event",
                entity_id=created_event.id,
                action=AuditLogAction.CREATE,
                changed_by=created_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)
        
        return created_event
    
    def get_event(self, event_id: int) -> Event | None:
        """Get an event by ID.
        
        Args:
            event_id: ID of the event.
            
        Returns:
            Event if found, None otherwise.
        """
        return self._event_repository.get_by_id(event_id)
    
    def get_events_by_colony(self, colony_id: int, active_only: bool = False) -> list[Event]:
        """Get all events for a colony.
        
        Args:
            colony_id: ID of the colony.
            active_only: If True, only return active events.
            
        Returns:
            List of events.
        """
        return self._event_repository.get_by_colony(colony_id, active_only)
    
    def update_event(
        self,
        event_id: int,
        name: str | None = None,
        description: str | None = None,
        is_active: bool | None = None,
        changed_by: int | None = None,
    ) -> Event:
        """Update an existing event.
        
        Args:
            event_id: ID of the event to update.
            name: New name (optional).
            description: New description (optional).
            is_active: New active status (optional).
            changed_by: User ID making the change (for audit log).
            
        Returns:
            Updated event.
            
        Raises:
            NotFoundError: If event not found.
        """
        event = self._event_repository.get_by_id(event_id)
        if event is None:
            raise NotFoundError(f"Event with ID {event_id} not found")
        
        if name is not None:
            event.name = name
        if description is not None:
            event.description = description
        if is_active is not None:
            event.is_active = is_active
        
        updated_event = self._event_repository.update(event)
        
        # Log the update
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="event",
                entity_id=event_id,
                action=AuditLogAction.UPDATE,
                changed_by=changed_by,
                colony_id=event.colony_id,
            )
            self._audit_log_repository.create(audit_log)
        
        return updated_event
    
    def delete_event(self, event_id: int, changed_by: int | None = None) -> None:
        """Delete (soft delete) an event.
        
        Args:
            event_id: ID of the event to delete.
            changed_by: User ID making the change (for audit log).
            
        Raises:
            NotFoundError: If event not found.
        """
        event = self._event_repository.get_by_id(event_id)
        if event is None:
            raise NotFoundError(f"Event with ID {event_id} not found")
        
        colony_id = event.colony_id
        self._event_repository.delete(event_id)
        
        # Log the deletion
        if self._audit_log_repository and changed_by:
            from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction
            
            audit_log = AuditLog(
                entity_type="event",
                entity_id=event_id,
                action=AuditLogAction.DELETE,
                changed_by=changed_by,
                colony_id=colony_id,
            )
            self._audit_log_repository.create(audit_log)