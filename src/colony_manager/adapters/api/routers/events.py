"""API router for event endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api.dependencies import get_event_service
from colony_manager.adapters.api.middleware.auth import get_current_user, require_role
from colony_manager.adapters.api.schemas.event import (
    EventCreate,
    EventModifierResponse,
    EventResponse,
    EventUpdate,
)
from colony_manager.application.services.event_service import EventService
from colony_manager.domain.models.event import EventModifier
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/events", tags=["events"])

# Error message constants
ERR_EVENT_NOT_FOUND = "Event not found"
ERR_EVENT_INCOMPLETE = "Event data is incomplete"
ERR_USER_NO_ID = "Authenticated user has no ID"


@router.post("/colonies/{colony_id}", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    colony_id: int,
    event_data: EventCreate,
    service: Annotated[EventService, Depends(get_event_service)],
    current_user: Annotated[User, Depends(require_role("colony_manager"))],
) -> EventResponse:
    """Create a new event for a colony.
    
    Events are GM-created occurrences that affect colony stats.
    Requires colony_manager role or higher.
    """
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_USER_NO_ID,
        )
    
    event = service.create_event(
        colony_id=colony_id,
        name=event_data.name,
        description=event_data.description,
        created_by=current_user.id,
        modifiers=[
            EventModifier(stat=m.stat, value=m.value, description=m.description)
            for m in event_data.modifiers
        ],
    )
    
    if event.id is None or event.created_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_EVENT_INCOMPLETE,
        )
    
    return EventResponse(
        id=event.id,
        colony_id=event.colony_id,
        name=event.name,
        description=event.description,
        created_by=event.created_by,
        created_at=event.created_at,
        is_active=event.is_active,
        modifiers=[
            EventModifierResponse(stat=m.stat, value=m.value, description=m.description)
            for m in event.modifiers
        ],
    )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    service: Annotated[EventService, Depends(get_event_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EventResponse:
    """Get an event by ID."""
    event = service.get_event(event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ERR_EVENT_NOT_FOUND)
    
    if event.id is None or event.created_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_EVENT_INCOMPLETE,
        )
    
    return EventResponse(
        id=event.id,
        colony_id=event.colony_id,
        name=event.name,
        description=event.description,
        created_by=event.created_by,
        created_at=event.created_at,
        is_active=event.is_active,
        modifiers=[
            EventModifierResponse(stat=m.stat, value=m.value, description=m.description)
            for m in event.modifiers
        ],
    )


@router.get("/colonies/{colony_id}", response_model=list[EventResponse])
def get_events_by_colony(
    colony_id: int,
    service: Annotated[EventService, Depends(get_event_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    active_only: bool = False,
) -> list[EventResponse]:
    """Get all events for a colony."""
    events = service.get_events_by_colony(colony_id, active_only)
    result: list[EventResponse] = []
    for e in events:
        if e.id is None or e.created_at is None:
            continue  # Skip events with incomplete data
        result.append(
            EventResponse(
                id=e.id,
                colony_id=e.colony_id,
                name=e.name,
                description=e.description,
                created_by=e.created_by,
                created_at=e.created_at,
                is_active=e.is_active,
                modifiers=[
                    EventModifierResponse(stat=m.stat, value=m.value, description=m.description)
                    for m in e.modifiers
                ],
            )
        )
    return result


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_data: EventUpdate,
    service: Annotated[EventService, Depends(get_event_service)],
    current_user: Annotated[User, Depends(require_role("colony_manager"))],
) -> EventResponse:
    """Update an event. Requires colony_manager role or higher."""
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_USER_NO_ID,
        )
    
    event = service.get_event(event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ERR_EVENT_NOT_FOUND)
    
    updated_event = service.update_event(
        event_id=event_id,
        name=event_data.name,
        description=event_data.description,
        is_active=event_data.is_active,
        changed_by=current_user.id,
    )
    
    if updated_event.id is None or updated_event.created_at is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_EVENT_INCOMPLETE,
        )
    
    return EventResponse(
        id=updated_event.id,
        colony_id=updated_event.colony_id,
        name=updated_event.name,
        description=updated_event.description,
        created_by=updated_event.created_by,
        created_at=updated_event.created_at,
        is_active=updated_event.is_active,
        modifiers=[
            EventModifierResponse(stat=m.stat, value=m.value, description=m.description)
            for m in updated_event.modifiers
        ],
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    service: Annotated[EventService, Depends(get_event_service)],
    current_user: Annotated[User, Depends(require_role("colony_manager"))],
) -> None:
    """Delete (soft delete) an event. Requires colony_manager role or higher."""
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ERR_USER_NO_ID,
        )
    
    event = service.get_event(event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ERR_EVENT_NOT_FOUND)
    
    service.delete_event(event_id, changed_by=current_user.id)