"""Support Upgrade API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.middleware.permissions import require_colony_permission
from colony_manager.adapters.api.schemas.common import PaginatedResponse, PaginationMeta
from colony_manager.adapters.api.schemas.support_upgrade import (
    SupportUpgradeCreate,
    SupportUpgradeListItem,
    SupportUpgradeResponse,
    SupportUpgradeUpdate,
    SupportUpgradeValidationResponse,
)
from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.support_upgrade_repository_impl import (
    SqlAlchemySupportUpgradeRepository,
)
from colony_manager.application.services.support_upgrade_service import SupportUpgradeService
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/colonies/{colony_id}/upgrades", tags=["support_upgrades"])


def get_support_upgrade_service(
    colony_id: int, db_path: str = Depends(dependencies.get_db_path)
) -> SupportUpgradeService:
    """Get support upgrade service instance with proper repositories."""
    from colony_manager.adapters.persistence.db import build_database_url

    db_url = build_database_url(db_path)
    colony_repo = SqlAlchemyColonyRepository(db_url)
    upgrade_repo = SqlAlchemySupportUpgradeRepository(db_url)
    return SupportUpgradeService(upgrade_repo, colony_repo)


def _check_colony_exists(service: SupportUpgradeService, colony_id: int) -> None:
    """Check if colony exists, raise HTTPException if not."""
    if not service.colony_exists(colony_id):
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")


@router.get("", response_model=PaginatedResponse[SupportUpgradeListItem])
async def list_upgrades(
    colony_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("view"))],
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of items to return"),
) -> PaginatedResponse[SupportUpgradeListItem]:
    """List all support upgrades for a colony with pagination."""
    _check_colony_exists(service, colony_id)
    all_upgrades = service.list_by_colony(colony_id)

    # Calculate pagination
    total = len(all_upgrades)
    items = all_upgrades[offset : offset + limit]

    return PaginatedResponse(
        items=[
            SupportUpgradeListItem(
                id=upg.id,
                name=upg.name,
                upgrade_type=upg.upgrade_type,
                custom_stat_choice=upg.custom_stat_choice,
                custom_product=upg.custom_product,
                affiliated_group=upg.affiliated_group,
                has_stat_effect=upg.has_stat_effect,
            )
            for upg in items
        ],
        meta=PaginationMeta(
            total=total,
            offset=offset,
            limit=limit,
            has_more=(offset + limit) < total,
        ),
    )


@router.post("", response_model=SupportUpgradeResponse, status_code=status.HTTP_201_CREATED)
async def create_upgrade(
    colony_id: int,
    upgrade_data: SupportUpgradeCreate,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> SupportUpgradeResponse:
    """Add new support upgrade to a colony."""
    _check_colony_exists(service, colony_id)
    from colony_manager.domain.models.support_upgrade import SupportUpgrade

    upgrade = SupportUpgrade(
        colony_id=colony_id,
        name=upgrade_data.name,
        upgrade_type=upgrade_data.upgrade_type,
        custom_stat_choice=upgrade_data.custom_stat_choice,
        custom_product=upgrade_data.custom_product,
        affiliated_group=upgrade_data.affiliated_group,
        notes=upgrade_data.notes,
    )
    created = service.create_upgrade(upgrade)
    assert created.id is not None
    return SupportUpgradeResponse(
        id=created.id,
        colony_id=colony_id,
        name=created.name,
        upgrade_type=created.upgrade_type,
        custom_stat_choice=created.custom_stat_choice,
        custom_product=created.custom_product,
        affiliated_group=created.affiliated_group,
        notes=created.notes,
        has_stat_effect=created.has_stat_effect,
    )


@router.get("/{upgrade_id}", response_model=SupportUpgradeResponse)
async def get_upgrade(
    colony_id: int,
    upgrade_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("view"))],
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> SupportUpgradeResponse:
    """Get a specific support upgrade by ID."""
    _check_colony_exists(service, colony_id)
    try:
        upgrade = service.get_upgrade(upgrade_id)
        if upgrade.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"SupportUpgrade {upgrade_id} not found in colony {colony_id}",
            )
        assert upgrade.id is not None
        return SupportUpgradeResponse(
            id=upgrade.id,
            colony_id=upgrade.colony_id,
            name=upgrade.name,
            upgrade_type=upgrade.upgrade_type,
            custom_stat_choice=upgrade.custom_stat_choice,
            custom_product=upgrade.custom_product,
            affiliated_group=upgrade.affiliated_group,
            notes=upgrade.notes,
            has_stat_effect=upgrade.has_stat_effect,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"SupportUpgrade {upgrade_id} not found")


@router.patch(
    "/{upgrade_id}",
    response_model=SupportUpgradeResponse | SupportUpgradeValidationResponse,
    summary="Update support upgrade",
    description="Update support upgrade name, notes, or type-specific fields. Use `validate_only=true` to preview effects without applying.",
)
async def update_upgrade(
    colony_id: int,
    upgrade_id: int,
    upgrade_data: SupportUpgradeUpdate,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    validate_only: bool = Query(False, description="If true, preview changes without applying"),
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> SupportUpgradeResponse | SupportUpgradeValidationResponse:
    """Update support upgrade name, notes, or type-specific fields."""
    _check_colony_exists(service, colony_id)
    try:
        upgrade = service.get_upgrade(upgrade_id)

        if upgrade.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"SupportUpgrade {upgrade_id} not found in colony {colony_id}",
            )

        # If validate_only, return preview of changes
        if validate_only:
            # Build update data dict for preview
            update_data = {}
            if upgrade_data.custom_stat_choice is not None:
                update_data["custom_stat_choice"] = upgrade_data.custom_stat_choice
            if upgrade_data.custom_product is not None:
                update_data["custom_product"] = upgrade_data.custom_product
            if upgrade_data.affiliated_group is not None:
                update_data["affiliated_group"] = upgrade_data.affiliated_group

            preview_result = service.preview_upgrade_changes(upgrade_id, update_data)
            return SupportUpgradeValidationResponse(
                valid=preview_result["valid"],
                modifiers_preview=preview_result["modifiers_preview"],
                colony_type_bonus_applied=preview_result["colony_type_bonus_applied"],
                bonus_description=preview_result["bonus_description"],
            )

        # Build update data dict for batch update
        update_data = {}
        if upgrade_data.name is not None:
            update_data["name"] = upgrade_data.name
        if upgrade_data.notes is not None:
            update_data["notes"] = upgrade_data.notes
        if upgrade_data.custom_stat_choice is not None:
            update_data["custom_stat_choice"] = upgrade_data.custom_stat_choice
        if upgrade_data.custom_product is not None:
            update_data["custom_product"] = upgrade_data.custom_product
        if upgrade_data.affiliated_group is not None:
            update_data["affiliated_group"] = upgrade_data.affiliated_group

        # Apply batch update
        upgrade = service.update_upgrade_batch(upgrade_id, update_data, changed_by=current_user.id)

        assert upgrade.id is not None
        return SupportUpgradeResponse(
            id=upgrade.id,
            colony_id=upgrade.colony_id,
            name=upgrade.name,
            upgrade_type=upgrade.upgrade_type,
            custom_stat_choice=upgrade.custom_stat_choice,
            custom_product=upgrade.custom_product,
            affiliated_group=upgrade.affiliated_group,
            notes=upgrade.notes,
            has_stat_effect=upgrade.has_stat_effect,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"SupportUpgrade {upgrade_id} not found")


@router.delete("/{upgrade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_upgrade(
    colony_id: int,
    upgrade_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("admin"))],
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> None:
    """Remove support upgrade from a colony."""
    _check_colony_exists(service, colony_id)
    try:
        upgrade = service.get_upgrade(upgrade_id)
        if upgrade.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"SupportUpgrade {upgrade_id} not found in colony {colony_id}",
            )
        service.delete_upgrade(upgrade_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"SupportUpgrade {upgrade_id} not found")
