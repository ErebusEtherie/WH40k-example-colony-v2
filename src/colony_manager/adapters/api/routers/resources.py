"""Resource API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api.dependencies import get_db_path
from colony_manager.adapters.api.middleware.permissions import require_colony_permission
from colony_manager.adapters.api.schemas.resource import (
    ResourceCreate,
    ResourceListItem,
    ResourceResponse,
    ResourceUpdate,
)
from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.resource_repository_impl import (
    SqlAlchemyResourceRepository,
)
from colony_manager.application.services.resource_service import ResourceService
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/colonies/{colony_id}/resources", tags=["resources"])


def get_resource_service(colony_id: int, db_path: str = Depends(get_db_path)) -> ResourceService:
    """Get resource service instance with proper repositories."""
    colony_repo = SqlAlchemyColonyRepository(db_path)
    resource_repo = SqlAlchemyResourceRepository(db_path)
    return ResourceService(resource_repo, colony_repo)


def _check_colony_exists(service: ResourceService, colony_id: int) -> None:
    """Check if colony exists, raise HTTPException if not."""
    if not service.colony_exists(colony_id):
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")


@router.get("", response_model=list[ResourceListItem])
async def list_resources(
    colony_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("view"))],
    service: ResourceService = Depends(get_resource_service),
) -> list[ResourceListItem]:
    """List all planetary resources for a colony."""
    _check_colony_exists(service, colony_id)
    resources = service.list_resources(colony_id)
    return [
        ResourceListItem(
            id=r.id,
            name=r.name,
            resource_type=r.resource_type,
            abundance=r.abundance,
            abundance_level=r.abundance_level,
        )
        for r in resources
    ]


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    colony_id: int,
    resource_data: ResourceCreate,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    service: ResourceService = Depends(get_resource_service),
) -> ResourceResponse:
    """Add a new planetary resource to a colony."""
    _check_colony_exists(service, colony_id)
    try:
        resource = service.add_resource(
            colony_id=colony_id,
            resource_type=resource_data.resource_type.value,
            name=resource_data.name,
            abundance=resource_data.abundance,
            notes=resource_data.notes,
        )
        assert resource.id is not None
        assert resource.colony_id is not None
        return ResourceResponse(
            id=resource.id,
            colony_id=resource.colony_id,
            resource_type=resource.resource_type,
            name=resource.name,
            abundance=resource.abundance,
            notes=resource.notes,
            discovered_date=resource.discovered_date,
            abundance_level=resource.abundance_level,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    colony_id: int,
    resource_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("view"))],
    service: ResourceService = Depends(get_resource_service),
) -> ResourceResponse:
    """Get a specific planetary resource by ID."""
    _check_colony_exists(service, colony_id)
    try:
        resource = service.get_resource(resource_id)
        if resource.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"Resource {resource_id} not found in colony {colony_id}",
            )
        assert resource.id is not None
        assert resource.colony_id is not None
        return ResourceResponse(
            id=resource.id,
            colony_id=resource.colony_id,
            resource_type=resource.resource_type,
            name=resource.name,
            abundance=resource.abundance,
            notes=resource.notes,
            discovered_date=resource.discovered_date,
            abundance_level=resource.abundance_level,
        )
    except (NotFoundError, ValueError):
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    colony_id: int,
    resource_id: int,
    resource_data: ResourceUpdate,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    service: ResourceService = Depends(get_resource_service),
) -> ResourceResponse:
    """Update a planetary resource's abundance or notes."""
    _check_colony_exists(service, colony_id)
    try:
        resource = service.update_resource(
            resource_id=resource_id,
            abundance=resource_data.abundance,
            notes=resource_data.notes,
        )
        if resource.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"Resource {resource_id} not found in colony {colony_id}",
            )
        assert resource.id is not None
        assert resource.colony_id is not None
        return ResourceResponse(
            id=resource.id,
            colony_id=resource.colony_id,
            resource_type=resource.resource_type,
            name=resource.name,
            abundance=resource.abundance,
            notes=resource.notes,
            discovered_date=resource.discovered_date,
            abundance_level=resource.abundance_level,
        )
    except (NotFoundError, ValueError):
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    colony_id: int,
    resource_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("admin"))],
    service: ResourceService = Depends(get_resource_service),
) -> None:
    """Remove a planetary resource from a colony."""
    _check_colony_exists(service, colony_id)
    try:
        resource = service.get_resource(resource_id)
        if resource.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"Resource {resource_id} not found in colony {colony_id}",
            )
        service.remove_resource(resource_id)
    except (NotFoundError, ValueError):
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
