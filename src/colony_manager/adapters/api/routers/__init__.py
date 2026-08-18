"""API routers."""

from colony_manager.adapters.api.routers.colonies import router as colonies_router
from colony_manager.adapters.api.routers.modifiers import router as modifiers_router
from colony_manager.adapters.api.routers.representatives import router as representatives_router

__all__ = ["colonies_router", "modifiers_router", "representatives_router"]