"""Support Upgrade API router."""

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.schemas.support_upgrade import (
    SupportUpgradeCreate,
    SupportUpgradeListItem,
    SupportUpgradeResponse,
    SupportUpgradeUpdate,
)
from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.support_upgrade_repository_impl import (
    SqlAlchemySupportUpgradeRepository,
)
from colony_manager.application.services.support_upgrade_service import SupportUpgradeService
from colony_manager.domain.errors import NotFoundError

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
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")


@router.get("", response_model=list[SupportUpgradeListItem])
async def list_upgrades(
    colony_id: int,
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> list[SupportUpgradeListItem]:
    """List all support upgrades for a colony."""
    _check_colony_exists(service, colony_id)
    upgrades = service.list_by_colony(colony_id)
    return [
        SupportUpgradeListItem(
            id=upg.id,
            upgrade_type=upg.upgrade_type,
            custom_stat_choice=upg.custom_stat_choice,
            custom_product=upg.custom_product,
            affiliated_group=upg.affiliated_group,
            has_stat_effect=upg.has_stat_effect,
        )
        for upg in upgrades
    ]


@router.post("", response_model=SupportUpgradeResponse, status_code=status.HTTP_201_CREATED)
async def create_upgrade(
    colony_id: int,
    upgrade_data: SupportUpgradeCreate,
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> SupportUpgradeResponse:
    """Add new support upgrade to a colony."""
    _check_colony_exists(service, colony_id)
    from colony_manager.domain.models.support_upgrade import SupportUpgrade

    upgrade = SupportUpgrade(
        colony_id=colony_id,
        upgrade_type=upgrade_data.upgrade_type,
        custom_stat_choice=upgrade_data.custom_stat_choice,
        custom_product=upgrade_data.custom_product,
        affiliated_group=upgrade_data.affiliated_group,
    )
    created = service.create_upgrade(upgrade)
    assert created.id is not None
    return SupportUpgradeResponse(
        id=created.id,
        colony_id=colony_id,
        upgrade_type=created.upgrade_type,
        custom_stat_choice=created.custom_stat_choice,
        custom_product=created.custom_product,
        affiliated_group=created.affiliated_group,
        has_stat_effect=created.has_stat_effect,
    )


@router.get("/{upgrade_id}", response_model=SupportUpgradeResponse)
async def get_upgrade(
    colony_id: int,
    upgrade_id: int,
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
            upgrade_type=upgrade.upgrade_type,
            custom_stat_choice=upgrade.custom_stat_choice,
            custom_product=upgrade.custom_product,
            affiliated_group=upgrade.affiliated_group,
            has_stat_effect=upgrade.has_stat_effect,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"SupportUpgrade {upgrade_id} not found")


@router.patch("/{upgrade_id}", response_model=SupportUpgradeResponse)
async def update_upgrade(
    colony_id: int,
    upgrade_id: int,
    upgrade_data: SupportUpgradeUpdate,
    service: SupportUpgradeService = Depends(get_support_upgrade_service),
) -> SupportUpgradeResponse:
    """Update support upgrade."""
    _check_colony_exists(service, colony_id)
    try:
        upgrade = service.get_upgrade(upgrade_id)
        update_data = upgrade_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(upgrade, field, value)
        updated = service.update_upgrade(upgrade)
        
        if updated.colony_id != colony_id:
            raise HTTPException(
                status_code=404,
                detail=f"SupportUpgrade {upgrade_id} not found in colony {colony_id}",
            )
        assert updated.id is not None
        return SupportUpgradeResponse(
            id=updated.id,
            colony_id=updated.colony_id,
            upgrade_type=updated.upgrade_type,
            custom_stat_choice=updated.custom_stat_choice,
            custom_product=updated.custom_product,
            affiliated_group=updated.affiliated_group,
            has_stat_effect=updated.has_stat_effect,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"SupportUpgrade {upgrade_id} not found")


@router.delete("/{upgrade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_upgrade(
    colony_id: int,
    upgrade_id: int,
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