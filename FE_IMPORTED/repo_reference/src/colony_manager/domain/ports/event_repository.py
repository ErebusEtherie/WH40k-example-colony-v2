"""Repository port for event management.

Defines the interface for event persistence operations. Implementations
should be provided in adapters/persistence/.
"""

from typing import Protocol

from colony_manager.domain.models.event import Event


class EventRepository(Protocol):
    """Protocol defining the interface for event repository operations.

    This follows the dependency inversion principle - the domain defines
    what it needs, and adapters provide the implementation.
    """

    def create(self, event: Event) -> Event:
        """Create a new event.

        Args:
            event: Event to create (should have all required fields set).

        Returns:
            Created event with ID populated.

        Raises:
            ValueError: If event data is invalid.
        """
        ...

    def get_by_id(self, event_id: int) -> Event | None:
        """Get event by ID.

        Args:
            event_id: Event ID to retrieve.

        Returns:
            Event if found, None otherwise.
        """
        ...

    def get_by_colony(self, colony_id: int, active_only: bool = False) -> list[Event]:
        """Get all events for a colony.

        Args:
            colony_id: Colony ID to filter by.
            active_only: If True, only return active events.

        Returns:
            List of events for the colony.
        """
        ...

    def update(self, event: Event) -> Event:
        """Update an existing event.

        Args:
            event: Event with updated fields (must have id set).

        Returns:
            Updated event.

        Raises:
            ValueError: If event not found.
        """
        ...

    def delete(self, event_id: int) -> None:
        """Delete an event (soft delete by setting is_active=False).

        Args:
            event_id: ID of event to delete.

        Raises:
            ValueError: If event not found.
        """
        ...
