"""FastAPI application factory for the Colony Manager API."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from colony_manager.adapters.api.dependencies import get_config_dir, get_db_path
from colony_manager.adapters.api.routers import colonies_router, modifiers_router, representatives_router
from colony_manager.adapters.persistence.db import init_db
from colony_manager.domain.errors import ColonyManagerError, NotFoundError


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    # Initialize database tables
    db_path = get_db_path()
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
    )

    # CORS middleware - allow all for local development
    # TODO: Restrict CORS in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(colonies_router, prefix="/api/v1")
    app.include_router(representatives_router, prefix="/api/v1")
    app.include_router(modifiers_router, prefix="/api/v1")

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
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Internal server error: {str(exc)}", "path": request.url.path},
        )

    # Root endpoint
    @app.get("/", tags=["root"])
    async def root() -> dict:
        return {
            "message": "WH40k Colony Manager API",
            "docs": "/docs",
            "version": "0.1.0",
        }

    return app