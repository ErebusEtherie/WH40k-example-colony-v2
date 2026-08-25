"""Domain model for infrastructure."""

from pydantic import BaseModel, ConfigDict

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
    """
    model_config = ConfigDict(validate_assignment=True)
    
    id: int | None = None
    colony_id: int
    infrastructure_type: InfrastructureType
    state: InfrastructureState = InfrastructureState.PLANNED
    
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