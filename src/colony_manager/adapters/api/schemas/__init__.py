"""API schemas for the colony manager REST API."""

from colony_manager.adapters.api.schemas.colony import (
    ColonyCreate,
    ColonyListItem,
    ColonyResponse,
    ColonyStateNested,
    ColonyUpdate,
)
from colony_manager.adapters.api.schemas.common import (
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
)
from colony_manager.adapters.api.schemas.development_plan import (
    DevelopmentPlanCreate,
    DevelopmentPlanListItem,
    DevelopmentPlanResponse,
    DevelopmentPlanUpdate,
    InstallationResult,
)
from colony_manager.adapters.api.schemas.modifier import (
    ModifierCreate,
    ModifierResponse,
)
from colony_manager.adapters.api.schemas.representative import (
    RepresentativeCreate,
    RepresentativeListItem,
    RepresentativeResponse,
    RepresentativeUpdate,
)
from colony_manager.adapters.api.schemas.user import (
    UserCreate,
    UserListItem,
    UserPasswordReset,
    UserResponse,
    UserUpdate,
)

__all__ = [
    "ColonyCreate",
    "ColonyListItem",
    "ColonyResponse",
    "ColonyStateNested",
    "ColonyUpdate",
    "DevelopmentPlanCreate",
    "DevelopmentPlanListItem",
    "DevelopmentPlanResponse",
    "DevelopmentPlanUpdate",
    "ErrorResponse",
    "InstallationResult",
    "MessageResponse",
    "ModifierCreate",
    "ModifierResponse",
    "PaginatedResponse",
    "RepresentativeCreate",
    "RepresentativeListItem",
    "RepresentativeResponse",
    "RepresentativeUpdate",
    "UserCreate",
    "UserListItem",
    "UserPasswordReset",
    "UserResponse",
    "UserUpdate",
]
