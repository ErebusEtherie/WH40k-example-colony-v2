"""Infrastructure API schemas."""

from pydantic import BaseModel

from colony_manager.domain.enums import InfrastructureState, InfrastructureType


class InfrastructureCreate(BaseModel):
    """Schema for creating new infrastructure."""

    infrastructure_type: InfrastructureType
    state: InfrastructureState = InfrastructureState.PLANNED


class InfrastructureUpdate(BaseModel):
    """Schema for updating infrastructure (partial update)."""

    state: InfrastructureState | None = None


class InfrastructureResponse(BaseModel):
    """Full infrastructure response."""

    id: int
    colony_id: int
    infrastructure_type: InfrastructureType
    state: InfrastructureState
    has_effect: bool
    is_working: bool
    is_not_working: bool


class InfrastructureListItem(BaseModel):
    """Summary information for infrastructure list."""

    id: int | None
    infrastructure_type: InfrastructureType
    state: InfrastructureState
    has_effect: bool
    is_working: bool
    is_not_working: bool