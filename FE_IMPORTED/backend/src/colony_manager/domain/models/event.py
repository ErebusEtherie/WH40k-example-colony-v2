"""Domain model for events.

Events are GM-created occurrences that affect colony stats (e.g., "Warp Storm",
"Trade Embargo", "Xenos Raid"). They create modifiers when active and can be
edited/deleted by GM+ roles.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierStat


class EventModifier(BaseModel):
    """A modifier applied by an event to a colony stat.

    Attributes:
        stat: Which stat this modifier affects (complacency, order, productivity, piety, size).
        value: Numeric value of the modifier (positive or negative).
        description: Human-readable description of what this modifier represents.
    """

    stat: ModifierStat
    value: int
    description: str = Field(min_length=1, max_length=500)


class Event(BaseModel):
    """Domain model for colony events.

    Events are GM-created occurrences that affect colony stats. They can be
    activated/deactivated and create modifiers when active.

    Attributes:
        id: Database ID (None if not yet persisted).
        colony_id: ID of the colony this event belongs to.
        name: Short name for the event (e.g., "Warp Storm").
        description: Detailed description of the event and its narrative impact.
        created_by: User ID of the GM who created this event.
        created_at: Timestamp when the event was created.
        is_active: Whether the event is currently active (soft delete when False).
        modifiers: List of stat modifiers this event applies when active.
    """

    id: int | None = None
    colony_id: int
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=2000)
    created_by: int
    created_at: datetime | None = None
    is_active: bool = True
    modifiers: list[EventModifier] = Field(default_factory=list)
