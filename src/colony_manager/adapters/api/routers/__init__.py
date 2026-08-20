"""API routers."""

from colony_manager.adapters.api.routers.auth_router import router as auth_router
from colony_manager.adapters.api.routers.colonies import router as colonies_router
from colony_manager.adapters.api.routers.events import router as events_router
from colony_manager.adapters.api.routers.infrastructure import router as infrastructure_router
from colony_manager.adapters.api.routers.modifiers import router as modifiers_router
from colony_manager.adapters.api.routers.representatives import router as representatives_router
from colony_manager.adapters.api.routers.resources import router as resources_router
from colony_manager.adapters.api.routers.support_upgrades import router as support_upgrades_router

__all__ = ["auth_router", "colonies_router", "events_router", "infrastructure_router", "modifiers_router", "representatives_router", "resources_router", "support_upgrades_router"]