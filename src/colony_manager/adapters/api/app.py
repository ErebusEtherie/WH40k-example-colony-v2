"""FastAPI application factory for the Colony Manager API."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.routers import (
    auth_router,
    colonies_router,
    infrastructure_router,
    modifiers_router,
    representatives_router,
    resources_router,
    support_upgrades_router,
)
from colony_manager.adapters.persistence.db import init_db
from colony_manager.domain.errors import ColonyManagerError, NotFoundError

logger = logging.getLogger(__name__)

# Security scheme for JWT Bearer token authentication
security = HTTPBearer(
    scheme_name="JWT",
    description="Enter your JWT token in the format: Bearer <token>",
    auto_error=False,
)


def get_allowed_origins() -> list[str]:
    """Get allowed CORS origins from environment variable.
    
    Returns:
        List of allowed origins. Defaults to localhost for development.
        Set ALLOWED_ORIGINS env var to comma-separated list for production.
    """
    import os
    
    allowed = os.getenv("ALLOWED_ORIGINS", "")
    if allowed:
        return [origin.strip() for origin in allowed.split(",") if origin.strip()]
    # Default to localhost for development
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize database on startup."""
    # Initialize database tables
    db_path = dependencies.get_db_path()
    init_db(db_path)
    yield
    # Cleanup on shutdown (if needed)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="WH40k Colony Manager API",
        description="REST API for managing Warhammer 40k Rogue Trader colonies",
        version="0.1.0",
        lifespan=lifespan,
        openapi_tags=[
            {"name": "root", "description": "Root endpoint and API info"},
            {"name": "auth", "description": "User authentication and authorization"},
            {"name": "colonies", "description": "Colony management operations"},
            {"name": "representatives", "description": "Representative (governor) management"},
            {"name": "infrastructure", "description": "Hard infrastructure buildings"},
            {"name": "support", "description": "Support upgrades and services"},
            {"name": "modifiers", "description": "Colony stat modifiers"},
            {"name": "resources", "description": "Resource production and management"},
        ],
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
                "description": "Enter your JWT token (do not include 'Bearer' prefix in the value)"
            }
        }
        
        # Apply security requirement globally (can be overridden per-endpoint)
        # Note: Auth endpoints don't require auth, so they override this
        openapi_schema["security"] = [{"BearerAuth": []}]
        
        app.openapi_schema = openapi_schema
        return openapi_schema
    
    app.openapi = custom_openapi  # type: ignore[method-assign]

    # CORS middleware - configurable via ALLOWED_ORIGINS environment variable
    allowed_origins = get_allowed_origins()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # Include routers
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(colonies_router, prefix="/api/v1")
    app.include_router(infrastructure_router, prefix="/api/v1")
    app.include_router(representatives_router, prefix="/api/v1")
    app.include_router(modifiers_router, prefix="/api/v1")
    app.include_router(resources_router, prefix="/api/v1")
    app.include_router(support_upgrades_router, prefix="/api/v1")

    # Exception handlers
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc), "path": request.url.path},
        )

    @app.exception_handler(ColonyManagerError)
    async def colony_manager_error_handler(request: Request, exc: ColonyManagerError) -> JSONResponse:
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