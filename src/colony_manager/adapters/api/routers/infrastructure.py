"""Infrastructure API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.middleware.permissions import require_colony_permission
from colony_manager.adapters.api.schemas.common import PaginatedResponse, PaginationMeta
from colony_manager.adapters.api.schemas.infrastructure import (
    InfrastructureCreate,
    InfrastructureListItem,
    InfrastructureResponse,
    InfrastructureUpdate,
)
from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.infrastructure_repository_impl import (
    SqlAlchemyInfrastructureRepository,
)
from colony_manager.application.services.infrastructure_service import InfrastructureService
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/colonies/{colony_id}/infrastructure", tags=["infrastructure"])


def get_infrastructure_service(
    colony_id: int, db_path: str = Depends(dependencies.get_db_path)
) -> InfrastructureService:
    """Get infrastructure service instance with proper repositories."""
    from colony_manager.adapters.persistence.db import build_database_url

    db_url = build_database_url(db_path)
    colony_repo = SqlAlchemyColonyRepository(db_url)
    infra_repo = SqlAlchemyInfrastructureRepository(db_url)
    return InfrastructureService(infra_repo, colony_repo)


def _check_colony_exists(service: InfrastructureService, colony_id: int) -> None:
    """Check if colony exists, raise HTTPException if not."""
    if not service.colony_exists(colony_id):
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")


@router.get("", response_model=PaginatedResponse[InfrastructureListItem])
async def list_infrastructure(
    colony_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("view"))],
    service: InfrastructureService = Depends(get_infrastructure_service),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of items to return"),
) -> PaginatedResponse[InfrastructureListItem]:
    """List all infrastructure for a colony with pagination."""
    _check_colony_exists(service, colony_id)
    all_infrastructure = service.list_by_colony(colony_id)

    # Calculate pagination
    total = len(all_infrastructure)
    items = all_infrastructure[offset : offset + limit]

    return PaginatedResponse(
        items=[
            InfrastructureListItem(
                id=infra.id,
                infrastructure_type=infra.infrastructure_type,
                state=infra.state,
                has_effect=infra.has_effect,
                is_working=infra.is_working,
                is_not_working=infra.is_not_working,
            )
            for infra in items
        ],
        meta=PaginationMeta(
            total=total,
            offset=offset,
            limit=limit,
            has_more=(offset + limit) < total,
        ),
    )


@router.post("", response_model=InfrastructureResponse, status_code=status.HTTP_201_CREATED)
async def create_infrastructure(
    colony_id: int,
    infra_data: InfrastructureCreate,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    service: InfrastructureService = Depends(get_infrastructure_service),
) -> InfrastructureResponse:
    """Add new infrastructure to a colony."""
    _check_colony_exists(service, colony_id)
    from colony_manager.domain.models.infrastructure import Infrastructure

    infrastructure = Infrastructure(
        colony_id=colony_id,
        infrastructure_type=infra_data.infrastructure_type,
        state=infra_data.state,
    )
    created = service.create_infrastructure(infrastructure)
    assert created.id is not None
    return InfrastructureResponse(
        id=created.id,
        colony_id=colony_id,
        infrastructure_type=created.infrastructure_type,
        state=created.state,
        has_effect=created.has_effect,
        is_working=created.is_working,
        is_not_working=created.is_not_working,
    )


@router.get("/{infrastructure_id}", response_model=InfrastructureResponse)
async def get_infrastructure(
    colony_id: int,
    infrastructure_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("view"))],
    service: InfrastructureService = Depends(get_infrastructure_service),
) -> InfrastructureResponse:
    """Get a specific infrastructure by ID."""
    _check_colony_exists(service, colony_id)
    try:
        infrastructure = service.get_infrastructure(infrastructure_id)
        if infrastructure.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"Infrastructure {infrastructure_id} not found in colony {colony_id}",
            )
        assert infrastructure.id is not None
        return InfrastructureResponse(
            id=infrastructure.id,
            colony_id=infrastructure.colony_id,
            infrastructure_type=infrastructure.infrastructure_type,
            state=infrastructure.state,
            has_effect=infrastructure.has_effect,
            is_working=infrastructure.is_working,
            is_not_working=infrastructure.is_not_working,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"Infrastructure {infrastructure_id} not found")


@router.patch("/{infrastructure_id}", response_model=InfrastructureResponse)
async def update_infrastructure(
    colony_id: int,
    infrastructure_id: int,
    infra_data: InfrastructureUpdate,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    service: InfrastructureService = Depends(get_infrastructure_service),
) -> InfrastructureResponse:
    """Update infrastructure state."""
    _check_colony_exists(service, colony_id)
    try:
        if infra_data.state is not None:
            infrastructure = service.update_infrastructure_state(
                infrastructure_id, infra_data.state
            )
        else:
            infrastructure = service.get_infrastructure(infrastructure_id)

        if infrastructure.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"Infrastructure {infrastructure_id} not found in colony {colony_id}",
            )
        assert infrastructure.id is not None
        return InfrastructureResponse(
            id=infrastructure.id,
            colony_id=infrastructure.colony_id,
            infrastructure_type=infrastructure.infrastructure_type,
            state=infrastructure.state,
            has_effect=infrastructure.has_effect,
            is_working=infrastructure.is_working,
            is_not_working=infrastructure.is_not_working,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"Infrastructure {infrastructure_id} not found")


@router.delete("/{infrastructure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_infrastructure(
    colony_id: int,
    infrastructure_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("admin"))],
    service: InfrastructureService = Depends(get_infrastructure_service),
) -> None:
    """Remove infrastructure from a colony."""
    _check_colony_exists(service, colony_id)
    try:
        infrastructure = service.get_infrastructure(infrastructure_id)
        if infrastructure.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"Infrastructure {infrastructure_id} not found in colony {colony_id}",
            )
        service.delete_infrastructure(infrastructure_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"Infrastructure {infrastructure_id} not found")
