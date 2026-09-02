"""Domain model for infrastructure."""

from pydantic import BaseModel, ConfigDict, Field

from colony_manager.domain.enums import InfrastructureState, InfrastructureType


class Infrastructure(BaseModel):
    """
    Hard Infrastructure represents the fundamental physical systems required
    for a colony to survive and function as it grows.

    States:
    - planned: Not yet installed, no mechanical effect
    - in_progress: Currently being installed, no mechanical effect
    - working: Operational, bonuses apply
    - needed: Required but not yet built, counts toward missing infrastructure penalty
    - not_working: Incapacitated, penalties apply

    Attributes:
        id: Database ID (None if not yet persisted).
        colony_id: ID of the colony this infrastructure belongs to.
        name: User-defined name for this infrastructure instance.
        infrastructure_type: Type of infrastructure (transport, power, etc.).
        state: Current operational state.
        notes: Player notes about this infrastructure.
    """

    model_config = ConfigDict(validate_assignment=True)

    id: int | None = None
    colony_id: int
    name: str = Field(default="Unnamed Infrastructure", min_length=1, max_length=255)
    infrastructure_type: InfrastructureType
    state: InfrastructureState = InfrastructureState.PLANNED
    notes: str = Field(default="", max_length=1000)

    @property
    def has_effect(self) -> bool:
        """Check if this infrastructure currently applies modifiers."""
        return self.state in (InfrastructureState.WORKING, InfrastructureState.NOT_WORKING)

    @property
    def is_working(self) -> bool:
        """Check if infrastructure is operational."""
        return self.state == InfrastructureState.WORKING

    @property
    def is_not_working(self) -> bool:
        """Check if infrastructure is not working."""
        return self.state == InfrastructureState.NOT_WORKING
