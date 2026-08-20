"""Colony API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api.dependencies import get_colony_service
from colony_manager.adapters.api.middleware.auth import get_current_user
from colony_manager.adapters.api.schemas.colony import (
    ColonyCreate,
    ColonyListItem,
    ColonyResponse,
    ColonyRollStatus,
    ColonyStateNested,
    ColonyStateStat,
    ColonyUpdate,
)
from colony_manager.adapters.api.schemas.modifier import ModifierCreate, ModifierResponse
from colony_manager.application.services.colony_service import ColonyService
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.user import User

router = APIRouter(prefix="/colonies", tags=["colonies"])


def _check_colony_exists(service: ColonyService, colony_id: int) -> Colony:
    """Check if colony exists, raise HTTPException if not."""
    try:
        return service.get_colony(colony_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


def _build_state_nested(state: dict[str, object]) -> ColonyStateNested:
    """Build nested state structure from service state dict."""
    from colony_manager.domain.enums import ModifierStat
    from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state
    
    size = int(state.get("size", 0))  # type: ignore[call-overload]
    complacency = int(state.get("complacency", 0))  # type: ignore[call-overload]
    order = int(state.get("order", 0))  # type: ignore[call-overload]
    productivity = int(state.get("productivity", 0))  # type: ignore[call-overload]
    piety = int(state.get("piety", 0))  # type: ignore[call-overload]
    
    # Build lore_state dict for each stat (size doesn't have lore state)
    lore_state_dict = {
        "size": "stable",
        "complacency": resolve_lore_state(ModifierStat.COMPLACENCY, complacency, size).value,
        "order": resolve_lore_state(ModifierStat.ORDER, order, size).value,
        "productivity": resolve_lore_state(ModifierStat.PRODUCTIVITY, productivity, size).value,
        "piety": resolve_lore_state(ModifierStat.PIETY, piety, size).value,
    }
    
    return ColonyStateNested(
        size=ColonyStateStat(base=size, current=size, lore_state=lore_state_dict["size"]),
        complacency=ColonyStateStat(base=complacency, current=complacency, lore_state=lore_state_dict["complacency"]),
        order=ColonyStateStat(base=order, current=order, lore_state=lore_state_dict["order"]),
        productivity=ColonyStateStat(base=productivity, current=productivity, lore_state=lore_state_dict["productivity"]),
        piety=ColonyStateStat(base=piety, current=piety, lore_state=lore_state_dict["piety"]),
        leadership_modifier=int(state.get("leadership_modifier", 0)),  # type: ignore[call-overload]
        profit_factor=int(state.get("profit_factor", 0)),  # type: ignore[call-overload]
        lore_state=lore_state_dict,
    )


@router.get("", response_model=list[ColonyListItem])
async def list_colonies(
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> list[ColonyListItem]:
    """List all colonies with summary information."""
    colonies = service._colony_repository.list()
    items = []
    for colony in colonies:
        assert colony.id is not None
        state = service.get_state(colony.id)
        items.append(ColonyListItem(
            id=colony.id, name=colony.name, owner=colony.owner, colony_type=colony.colony_type,
            age_days=colony.age_days, current_size=int(state["size"]),  # type: ignore[call-overload]
            current_complacency=int(state["complacency"]),  # type: ignore[call-overload]
            current_order=int(state["order"]),  # type: ignore[call-overload]
            current_productivity=int(state["productivity"]),  # type: ignore[call-overload]
            current_piety=int(state["piety"]),  # type: ignore[call-overload]
            profit_factor=int(state["profit_factor"]),  # type: ignore[call-overload]
        ))
    return items


@router.post("", response_model=ColonyResponse, status_code=status.HTTP_201_CREATED)
async def create_colony(
    colony_data: ColonyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ColonyResponse:
    """Create a new colony."""
    from datetime import date

    from colony_manager.domain.models.colony import Colony
    config = service._rule_config_provider
    colony_type_config = config.get_colony_type_config(colony_data.colony_type)
    base_stats = colony_type_config["base_stats"]
    colony = Colony(
        name=colony_data.name, owner=colony_data.owner, colony_type=colony_data.colony_type, age_days=0,
        age_last_updated=date.today(),
        base_complacency=base_stats["complacency"],  # type: ignore[index]
        base_order=base_stats["order"],  # type: ignore[index]
        base_productivity=base_stats["productivity"],  # type: ignore[index]
        base_piety=base_stats["piety"],  # type: ignore[index]
        base_size=base_stats["size"],  # type: ignore[index]
    )
    created = service.create_colony(colony)
    assert created.id is not None
    state = service.get_state(created.id)
    return ColonyResponse(
        id=created.id, name=created.name, owner=created.owner, colony_type=created.colony_type,
        age_days=created.age_days, age_last_updated=created.age_last_updated,
        current_event=created.current_event,
        base_complacency=created.base_complacency, base_order=created.base_order,
        base_productivity=created.base_productivity, base_piety=created.base_piety, base_size=created.base_size,
        representative_id=created.representative_id, dynasty_outcome=created.dynasty_outcome,
        complacency_locked=created.complacency_locked, order_locked=created.order_locked,
        productivity_locked=created.productivity_locked, planetary_resources=created.planetary_resources,
        state=_build_state_nested(state),
    )


@router.get("/{colony_id}", response_model=ColonyResponse)
async def get_colony(
    colony_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ColonyResponse:
    """Get a colony by ID."""
    colony = _check_colony_exists(service, colony_id)
    state = service.get_state(colony_id)
    return ColonyResponse(
        id=colony.id, name=colony.name, owner=colony.owner, colony_type=colony.colony_type,
        age_days=colony.age_days, age_last_updated=colony.age_last_updated,
        current_event=colony.current_event,
        base_complacency=colony.base_complacency, base_order=colony.base_order,
        base_productivity=colony.base_productivity, base_piety=colony.base_piety, base_size=colony.base_size,
        representative_id=colony.representative_id, dynasty_outcome=colony.dynasty_outcome,
        complacency_locked=colony.complacency_locked, order_locked=colony.order_locked,
        productivity_locked=colony.productivity_locked, planetary_resources=colony.planetary_resources,
        state=_build_state_nested(state),
    )


@router.put("/{colony_id}", response_model=ColonyResponse)
async def update_colony(
    colony_id: int,
    colony_data: ColonyUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ColonyResponse:
    """Update a colony (partial update)."""
    colony = _check_colony_exists(service, colony_id)
    update_data = colony_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(colony, field, value)
    updated = service._colony_repository.update(colony)
    state = service.get_state(colony_id)
    return ColonyResponse(
        id=updated.id, name=updated.name, owner=updated.owner, colony_type=updated.colony_type,
        age_days=updated.age_days, age_last_updated=updated.age_last_updated,
        current_event=updated.current_event,
        base_complacency=updated.base_complacency, base_order=updated.base_order,
        base_productivity=updated.base_productivity, base_piety=updated.base_piety, base_size=updated.base_size,
        representative_id=updated.representative_id, dynasty_outcome=updated.dynasty_outcome,
        complacency_locked=updated.complacency_locked, order_locked=updated.order_locked,
        productivity_locked=updated.productivity_locked, planetary_resources=updated.planetary_resources,
        state=_build_state_nested(state),
    )


@router.delete("/{colony_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_colony(
    colony_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> None:
    """Delete a colony."""
    _check_colony_exists(service, colony_id)
    service._colony_repository.delete(colony_id)


@router.get("/{colony_id}/state", response_model=ColonyStateNested)
async def get_colony_state(
    colony_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ColonyStateNested:
    """Get computed state for a colony."""
    _check_colony_exists(service, colony_id)
    state = service.get_state(colony_id)
    return _build_state_nested(state)


@router.post("/{colony_id}/age", response_model=ColonyResponse)
async def advance_colony_age(
    colony_id: int,
    age_days: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ColonyResponse:
    """Advance colony age."""
    _check_colony_exists(service, colony_id)
    try:
        updated = service.update_age(colony_id, age_days)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    state = service.get_state(colony_id)
    return ColonyResponse(
        id=updated.id, name=updated.name, owner=updated.owner, colony_type=updated.colony_type,
        age_days=updated.age_days, age_last_updated=updated.age_last_updated,
        current_event=updated.current_event,
        base_complacency=updated.base_complacency, base_order=updated.base_order,
        base_productivity=updated.base_productivity, base_piety=updated.base_piety, base_size=updated.base_size,
        representative_id=updated.representative_id, dynasty_outcome=updated.dynasty_outcome,
        complacency_locked=updated.complacency_locked, order_locked=updated.order_locked,
        productivity_locked=updated.productivity_locked, planetary_resources=updated.planetary_resources,
        state=_build_state_nested(state),
    )


@router.get("/{colony_id}/modifiers", response_model=list[ModifierResponse])
async def list_colony_modifiers(
    colony_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> list[ModifierResponse]:
    """List all modifiers for a colony."""
    colony = _check_colony_exists(service, colony_id)
    return [ModifierResponse(
        id=mod.id, colony_id=colony_id, modifier_source_type=mod.modifier_source_type,
        modifier_stat=mod.modifier_stat, modifier_value=mod.modifier_value,
        modifier_description=mod.modifier_description, is_active=mod.is_active,
    ) for mod in colony.modifiers]


@router.post("/{colony_id}/modifiers", response_model=ModifierResponse, status_code=status.HTTP_201_CREATED)
async def add_colony_modifier(
    colony_id: int,
    modifier_data: ModifierCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ModifierResponse:
    """Add a modifier to a colony."""
    _check_colony_exists(service, colony_id)
    modifier = Modifier(
        colony_id=colony_id,
        modifier_source_type=modifier_data.modifier_source_type, modifier_stat=modifier_data.modifier_stat,
        modifier_value=modifier_data.modifier_value, description=modifier_data.modifier_description,
        is_active=modifier_data.is_active,
    )
    updated = service.add_modifier(colony_id, modifier)
    new_modifier = updated.modifiers[-1]
    return ModifierResponse(
        id=new_modifier.id, colony_id=colony_id, modifier_source_type=new_modifier.modifier_source_type,
        modifier_stat=new_modifier.modifier_stat, modifier_value=new_modifier.modifier_value,
        modifier_description=new_modifier.modifier_description, is_active=new_modifier.is_active,
    )


@router.delete("/{colony_id}/modifiers/{modifier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_colony_modifier(
    colony_id: int,
    modifier_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> None:
    """Remove a modifier from a colony."""
    colony = _check_colony_exists(service, colony_id)
    modifier_to_remove = None
    for mod in colony.modifiers:
        if mod.id == modifier_id:
            modifier_to_remove = mod
            break
    if modifier_to_remove is None:
        raise HTTPException(status_code=404, detail=f"Modifier {modifier_id} not found")
    colony.modifiers.remove(modifier_to_remove)
    service._colony_repository.update(colony)


@router.get("/{colony_id}/roll-status", response_model=ColonyRollStatus)
async def get_colony_roll_status(
    colony_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: ColonyService = Depends(get_colony_service),
) -> ColonyRollStatus:
    """
    Get the roll status for a colony.
    
    Returns information about when the next event and development rolls are due.
    Event rolls occur every 60 days, development rolls every 90 days.
    """
    _check_colony_exists(service, colony_id)
    roll_status = service.get_roll_status(colony_id)
    return ColonyRollStatus(**roll_status)
