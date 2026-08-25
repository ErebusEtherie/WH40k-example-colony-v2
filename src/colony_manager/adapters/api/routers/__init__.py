"""API routers."""

from colony_manager.adapters.api.routers.auth_router import router as auth_router
from colony_manager.adapters.api.routers.audit_logs import router as audit_logs_router
from colony_manager.adapters.api.routers.colonies import router as colonies_router
from colony_manager.adapters.api.routers.colony_users import router as colony_users_router
from colony_manager.adapters.api.routers.development_plans import router as development_plans_router
from colony_manager.adapters.api.routers.events import router as events_router
from colony_manager.adapters.api.routers.export_import import router as export_import_router
from colony_manager.adapters.api.routers.infrastructure import router as infrastructure_router
from colony_manager.adapters.api.routers.modifiers import router as modifiers_router
from colony_manager.adapters.api.routers.notifications import router as notifications_router
from colony_manager.adapters.api.routers.representatives import router as representatives_router
from colony_manager.adapters.api.routers.resources import router as resources_router
from colony_manager.adapters.api.routers.support_upgrades import router as support_upgrades_router
from colony_manager.adapters.api.routers.users import router as users_router

__all__ = [
    "auth_router",
    "audit_logs_router",
    "colonies_router",
    "colony_users_router",
    "development_plans_router",
    "events_router",
    "export_import_router",
    "infrastructure_router",
    "modifiers_router",
    "notifications_router",
    "representatives_router",
    "resources_router",
    "support_upgrades_router",
    "users_router",
]