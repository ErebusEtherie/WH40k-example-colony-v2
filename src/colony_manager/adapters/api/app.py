"""FastAPI application factory for the Colony Manager API."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from slowapi.errors import RateLimitExceeded

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.middleware.rate_limiter import (
    get_limiter,
    get_rate_limit_exceeded_handler,
)
from colony_manager.adapters.api.middleware.security_headers import (
    SecurityHeadersMiddleware,
)
from colony_manager.adapters.api.routers import (
    audit_logs_router,
    auth_router,
    colonies_router,
    colony_users_router,
    config_router,
    development_plans_router,
    events_router,
    export_import_router,
    infrastructure_router,
    modifiers_router,
    notifications_router,
    representatives_router,
    resources_router,
    support_upgrades_router,
    users_router,
)
from colony_manager.adapters.persistence.db import init_db
from colony_manager.config.settings import get_cors_settings
from colony_manager.domain.errors import ColonyManagerError, NotFoundError

logger = logging.getLogger(__name__)

# API version prefix constant
API_V1_PREFIX = "/api/v1"

# Security scheme for JWT Bearer token authentication
security = HTTPBearer(
    scheme_name="JWT",
    description="Enter your JWT token in the format: Bearer <token>",
    auto_error=False,
)


def get_allowed_origins() -> list[str]:
    """Get allowed CORS origins from settings.

    Returns:
        List of allowed origins. Defaults to localhost for development.
        Set ALLOWED_ORIGINS env var to comma-separated list for production.

    Note:
        This function uses the CORSSettings class which loads from environment.
        For production, ensure ALLOWED_ORIGINS is set to your frontend domain(s).
    """
    settings = get_cors_settings()
    return settings.get_origins_list()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize database and load configuration on startup."""
    import os

    from colony_manager.adapters.api.dependencies import init_rule_config_provider
    from colony_manager.config.settings import get_security_settings

    # Security warning for production deployments
    settings = get_security_settings()
    if os.getenv("ENVIRONMENT") == "production" and not settings.cookie_secure:
        logger.warning(
            "⚠️  SECURITY WARNING: cookie_secure=False in production. "
            "Set COOKIE_SECURE=true to enable HTTPS-only cookies."
        )

    # Initialize rule config provider singleton
    init_rule_config_provider()
    logger.info("Rule config provider initialized")

    # Initialize database tables
    db_path = dependencies.get_db_path()
    init_db(db_path)
    logger.info("Database initialized")

    yield
    # Cleanup on shutdown (if needed)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="WH40k Colony Manager API",
        description="REST API for managing Warhammer 40k Rogue Trader colonies",
        version="0.1.0",
        lifespan=lifespan,
        openapi_tags=[],
    )

    # Store original openapi method
    original_openapi = app.openapi

    def custom_openapi() -> dict[str, object]:
        """Customize OpenAPI schema with JWT security scheme."""
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = original_openapi()

        # Add JWT Bearer security scheme
        openapi_schema["components"]["securitySchemes"] = {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Enter your JWT token (do not include 'Bearer' prefix in the value)",
            }
        }

        # Apply security requirement globally (can be overridden per-endpoint)
        # Note: Auth endpoints don't require auth, so they override this
        openapi_schema["security"] = [{"BearerAuth": []}]

        app.openapi_schema = openapi_schema
        return openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]

    # Rate limiting middleware
    limiter = get_limiter()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, get_rate_limit_exceeded_handler())  # type: ignore[arg-type]

    # Security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS middleware - MUST be last in the chain to properly handle CORS headers
    # after all other middleware have processed the request/response
    allowed_origins = get_allowed_origins()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,  # Required for httpOnly cookies
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Request-ID"],  # For debugging/tracing
    )

    # Include routers
    app.include_router(auth_router, prefix=API_V1_PREFIX)
    app.include_router(colonies_router, prefix=API_V1_PREFIX)
    app.include_router(events_router, prefix=API_V1_PREFIX)
    app.include_router(development_plans_router, prefix=API_V1_PREFIX)
    app.include_router(audit_logs_router, prefix=API_V1_PREFIX)
    app.include_router(colony_users_router, prefix=API_V1_PREFIX)
    app.include_router(export_import_router, prefix=API_V1_PREFIX)
    app.include_router(notifications_router, prefix=API_V1_PREFIX)
    app.include_router(infrastructure_router, prefix=API_V1_PREFIX)
    app.include_router(representatives_router, prefix=API_V1_PREFIX)
    app.include_router(modifiers_router, prefix=API_V1_PREFIX)
    app.include_router(resources_router, prefix=API_V1_PREFIX)
    app.include_router(support_upgrades_router, prefix=API_V1_PREFIX)
    app.include_router(users_router, prefix=API_V1_PREFIX)
    app.include_router(config_router, prefix=API_V1_PREFIX)

    # Exception handlers
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc), "path": request.url.path},
        )

    @app.exception_handler(ColonyManagerError)
    async def colony_manager_error_handler(
        request: Request, exc: ColonyManagerError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc), "path": request.url.path},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log the full exception internally for debugging
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        # Return generic error message to avoid leaking internal details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "path": request.url.path},
        )

    # Root endpoint
    @app.get("/", tags=["root"])
    async def root() -> dict[str, str]:
        return {
            "message": "WH40k Colony Manager API",
            "docs": "/docs",
            "version": "0.1.0",
        }

    return app
