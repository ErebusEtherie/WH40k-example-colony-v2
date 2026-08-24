"""Representative API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api import dependencies
from colony_manager.adapters.api.middleware.auth import get_current_user
from colony_manager.adapters.api.middleware.permissions import require_colony_permission
from colony_manager.adapters.api.dependencies import get_colony_user_repository, get_db_path
from colony_manager.adapters.api.schemas.representative import (
    PersonalityCreate,
    RepresentativeCreate,
    RepresentativeListItem,
    RepresentativeResponse,
    RepresentativeStatsCreate,
    RepresentativeUpdate,
    parse_personality_effect,
)
from colony_manager.application.services.representative_service import RepresentativeService
from colony_manager.domain.errors import ColonyManagerError, NotFoundError
from colony_manager.domain.models.representative import (
    Personality,
    Representative,
    RepresentativeStats,
)
from colony_manager.domain.models.user import User
from colony_manager.domain.ports.colony_user_repository import ColonyUserRepository

router = APIRouter(prefix="/representatives", tags=["representatives"])


def _check_representative_exists(service: RepresentativeService, rep_id: int) -> Representative:
    """Check if representative exists, raise HTTPException if not."""
    representative = service._representative_repository.get(rep_id)
    if representative is None:
        raise HTTPException(status_code=404, detail=f"Representative {rep_id} not found")
    return representative


def _get_leadership_modifier(stats: RepresentativeStats) -> int:
    """Calculate leadership modifier from stats."""
    # Leadership modifier is the highest of Int/Per/Fel bonuses
    int_bonus = stats.int_ // 10
    per_bonus = stats.per // 10
    fel_bonus = stats.fel // 10
    return max(int_bonus, per_bonus, fel_bonus)


def _convert_personalities(personalities_create: list[PersonalityCreate]) -> list[Personality]:
    """Convert PersonalityCreate schemas to domain Personality objects.
    
    Args:
        personalities_create: List of personality creation schemas with effect strings.
        
    Returns:
        List of domain Personality objects with parsed stat_effects.
    """
    result = []
    for pc in personalities_create:
        effects = parse_personality_effect(pc.effect)
        result.append(Personality(
            name=pc.name, display_name=pc.display_name, description=pc.description,
            stat_effects=effects, calamitous_modifier=pc.calamitous_modifier,
            special_rule=pc.special_rule,
        ))
    return result


@router.get("", response_model=list[RepresentativeListItem])
async def list_representatives(
    current_user: Annotated[User, Depends(get_current_user)],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> list[RepresentativeListItem]:
    """List all representatives."""
    representatives = service._representative_repository.list()
    return [RepresentativeListItem(
        id=rep.id, name=rep.name, type=rep.type,
        leadership_modifier=_get_leadership_modifier(rep.stats),
        assigned_to_colony_id=rep.assigned_to_colony_id,
    ) for rep in representatives]


@router.post("", response_model=RepresentativeResponse, status_code=status.HTTP_201_CREATED)
async def create_representative(
    rep_data: RepresentativeCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> RepresentativeResponse:
    """Create a new representative."""
    personalities = _convert_personalities(rep_data.personalities)
    representative = Representative(
        name=rep_data.name, type=rep_data.type, personalities=personalities,
        stats=RepresentativeStats(**rep_data.stats.model_dump(by_alias=True)),
        skills=rep_data.skills, talents=rep_data.talents,
    )
    created = service.create_representative(representative)
    return RepresentativeResponse(
        id=created.id, name=created.name, type=created.type, personalities=created.personalities,
        stats=rep_data.stats, skills=created.skills, talents=created.talents,
        leadership_modifier=_get_leadership_modifier(created.stats),
        assigned_to_colony_id=created.assigned_to_colony_id,
    )


@router.get("/{rep_id}", response_model=RepresentativeResponse)
async def get_representative(
    rep_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> RepresentativeResponse:
    """Get a representative by ID."""
    representative = _check_representative_exists(service, rep_id)
    return RepresentativeResponse(
        id=representative.id, name=representative.name, type=representative.type,
        personalities=representative.personalities,
        stats=RepresentativeStatsCreate(**representative.stats.model_dump(by_alias=True)),
        skills=representative.skills, talents=representative.talents,
        leadership_modifier=_get_leadership_modifier(representative.stats),
        assigned_to_colony_id=representative.assigned_to_colony_id,
    )


@router.put("/{rep_id}", response_model=RepresentativeResponse)
async def update_representative(
    rep_id: int,
    rep_data: RepresentativeUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> RepresentativeResponse:
    """Update a representative (partial update)."""
    representative = _check_representative_exists(service, rep_id)
    update_data = rep_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(representative, field, value)
    updated = service._representative_repository.update(representative)
    return RepresentativeResponse(
        id=updated.id, name=updated.name, type=updated.type, personalities=updated.personalities,
        stats=RepresentativeStatsCreate(**updated.stats.model_dump(by_alias=True)),
        skills=updated.skills, talents=updated.talents,
        leadership_modifier=_get_leadership_modifier(updated.stats),
        assigned_to_colony_id=updated.assigned_to_colony_id,
    )


@router.delete("/{rep_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_representative(
    rep_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> None:
    """Delete a representative."""
    _check_representative_exists(service, rep_id)
    service._representative_repository.delete(rep_id)


@router.post("/{rep_id}/assign", response_model=RepresentativeResponse)
async def assign_to_colony(
    rep_id: int,
    colony_id: int,
    current_user: Annotated[User, Depends(require_colony_permission("edit"))],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> RepresentativeResponse:
    """Assign a representative to a colony."""
    try:
        updated = service.assign_to_colony(colony_id, rep_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ColonyManagerError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return RepresentativeResponse(
        id=updated.id, name=updated.name, type=updated.type, personalities=updated.personalities,
        stats=RepresentativeStatsCreate(**updated.stats.model_dump(by_alias=True)),
        skills=updated.skills, talents=updated.talents,
        leadership_modifier=_get_leadership_modifier(updated.stats),
        assigned_to_colony_id=updated.assigned_to_colony_id,
    )


@router.post("/{rep_id}/unassign", response_model=RepresentativeResponse)
async def unassign_from_colony(
    rep_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: RepresentativeService = Depends(dependencies.get_representative_service),
) -> RepresentativeResponse:
    """Unassign a representative from their colony."""
    # Get the representative to find which colony they're assigned to
    rep = service._representative_repository.get(rep_id)
    if rep is None or rep.assigned_to_colony_id is None:
        raise HTTPException(status_code=404, detail=f"Representative {rep_id} not found or not assigned")
    
    # Check permission on the colony
    colony_user_repo = get_colony_user_repository(get_db_path())
    if current_user.id is None:
        raise HTTPException(status_code=500, detail="Authenticated user has no ID")
    membership = colony_user_repo.get_by_colony_and_user(rep.assigned_to_colony_id, current_user.id)
    if membership is None and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail=f"User is not a member of colony {rep.assigned_to_colony_id}")
    
    try:
        updated = service.unassign_from_colony(rep_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ColonyManagerError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return RepresentativeResponse(
        id=updated.id, name=updated.name, type=updated.type, personalities=updated.personalities,
        stats=RepresentativeStatsCreate(**updated.stats.model_dump(by_alias=True)),
        skills=updated.skills, talents=updated.talents,
        leadership_modifier=_get_leadership_modifier(updated.stats),
        assigned_to_colony_id=updated.assigned_to_colony_id,
    )
