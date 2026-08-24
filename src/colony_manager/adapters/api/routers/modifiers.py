"""Modifier API router.

Note: Modifiers are managed through the colonies router since they are
owned by colonies. This router provides a top-level view of all modifiers.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from colony_manager.adapters.api.dependencies import get_colony_service
from colony_manager.adapters.api.middleware.auth import get_current_user, require_role
from colony_manager.adapters.api.middleware.permissions import require_colony_permission
from colony_manager.adapters.api.schemas.modifier import ModifierResponse
from colony_manager.application.services.colony_service import ColonyService
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/modifiers", tags=["modifiers"])


@router.get("", response_model=list[ModifierResponse])
async def list_all_modifiers(
    current_user: Annotated[User, Depends(require_role("admin"))],
    service: ColonyService = Depends(get_colony_service),
) -> list[ModifierResponse]:
    """List all modifiers across all colonies."""
    colonies = service._colony_repository.list()
    all_modifiers = []
    for colony in colonies:
        assert colony.id is not None
        for mod in colony.modifiers:
            all_modifiers.append(
                ModifierResponse(
                    id=mod.id,
                    colony_id=colony.id,
                    modifier_source_type=mod.modifier_source_type,
                    modifier_category=mod.modifier_category,
                    modifier_stat=mod.modifier_stat,
                    modifier_value=mod.modifier_value,
                    modifier_description=mod.modifier_description,
                    is_active=mod.is_active,
                    expires_at=mod.expires_at,
                )
            )
    return all_modifiers


@router.get("/{modifier_id}", response_model=ModifierResponse)
async def get_modifier(
    modifier_id: int,
    current_user: Annotated[User, Depends(require_role("admin"))],
    service: ColonyService = Depends(get_colony_service),
) -> ModifierResponse:
    """Get a specific modifier by ID (searches across all colonies)."""
    colonies = service._colony_repository.list()
    for colony in colonies:
        assert colony.id is not None
        for mod in colony.modifiers:
            if mod.id == modifier_id:
                return ModifierResponse(
                    id=mod.id,
                    colony_id=colony.id,
                    modifier_source_type=mod.modifier_source_type,
                    modifier_category=mod.modifier_category,
                    modifier_stat=mod.modifier_stat,
                    modifier_value=mod.modifier_value,
                    modifier_description=mod.modifier_description,
                    is_active=mod.is_active,
                    expires_at=mod.expires_at,
                )
    raise HTTPException(status_code=404, detail=f"Modifier {modifier_id} not found")