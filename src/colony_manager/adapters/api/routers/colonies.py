"""Colony API router."""

from fastapi import APIRouter, Depends, HTTPException, status

from colony_manager.adapters.api.dependencies import get_colony_service
from colony_manager.adapters.api.schemas.colony import (
    ColonyCreate,
    ColonyListItem,
    ColonyResponse,
    ColonyStateNested,
    ColonyStateStat,
    ColonyUpdate,
)
from colony_manager.adapters.api.schemas.modifier import ModifierCreate, ModifierResponse
from colony_manager.application.services.colony_service import ColonyService
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.modifier import Modifier

router = APIRouter(prefix="/colonies", tags=["colonies"])


def _build_state_nested(state: dict) -> ColonyStateNested:
    """Build nested state structure from service state dict."""
    from colony_manager.domain.enums import ModifierStat
    from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state
    
    size = state.get("size", 0)
    complacency = state.get("complacency", 0)
    order = state.get("order", 0)
    productivity = state.get("productivity", 0)
    piety = state.get("piety", 0)
    
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
        leadership_modifier=state.get("leadership_modifier", 0),
        profit_factor=state.get("profit_factor", 0),
        lore_state=lore_state_dict,
    )


@router.get("", response_model=list[ColonyListItem])
async def list_colonies(service: ColonyService = Depends(get_colony_service)) -> list[ColonyListItem]:
    """List all colonies with summary information."""
    colonies = service._colony_repository.list()
    items = []
    for colony in colonies:
        state = service.get_state(colony.id)
        items.append(ColonyListItem(
            id=colony.id, name=colony.name, owner=colony.owner, colony_type=colony.colony_type,
            age_days=colony.age_days, current_size=state["size"], current_complacency=state["complacency"],
            current_order=state["order"], current_productivity=state["productivity"],
            current_piety=state["piety"], profit_factor=state["profit_factor"],
        ))
    return items


@router.post("", response_model=ColonyResponse, status_code=status.HTTP_201_CREATED)
async def create_colony(colony_data: ColonyCreate, service: ColonyService = Depends(get_colony_service)) -> ColonyResponse:
    """Create a new colony."""
    from datetime import date
    from colony_manager.domain.models.colony import Colony
    config = service._rule_config_provider
    colony_type_config = config.get_colony_type_config(colony_data.colony_type)
    colony = Colony(
        name=colony_data.name, owner=colony_data.owner, colony_type=colony_data.colony_type, age_days=0,
        age_last_updated=date.today(),
        base_complacency=colony_type_config["base_stats"]["complacency"],
        base_order=colony_type_config["base_stats"]["order"],
        base_productivity=colony_type_config["base_stats"]["productivity"],
        base_piety=colony_type_config["base_stats"]["piety"],
        base_size=colony_type_config["base_stats"]["size"],
    )
    created = service.create_colony(colony)
    state = service.get_state(created.id)
    return ColonyResponse(
        id=created.id, name=created.name, owner=created.owner, colony_type=created.colony_type,
        age_days=created.age_days, age_last_updated=created.age_last_updated,
        event_roll_interval_days=created.event_roll_interval_days,
        development_roll_interval_days=created.development_roll_interval_days,
        base_complacency=created.base_complacency, base_order=created.base_order,
        base_productivity=created.base_productivity, base_piety=created.base_piety, base_size=created.base_size,
        representative_id=created.representative_id, dynasty_outcome=created.dynasty_outcome,
        complacency_locked=created.complacency_locked, order_locked=created.order_locked,
        productivity_locked=created.productivity_locked, planetary_resources=created.planetary_resources,
        state=_build_state_nested(state),
    )


@router.get("/{colony_id}", response_model=ColonyResponse)
async def get_colony(colony_id: int, service: ColonyService = Depends(get_colony_service)) -> ColonyResponse:
    """Get a colony by ID."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    state = service.get_state(colony_id)
    return ColonyResponse(
        id=colony.id, name=colony.name, owner=colony.owner, colony_type=colony.colony_type,
        age_days=colony.age_days, age_last_updated=colony.age_last_updated,
        event_roll_interval_days=colony.event_roll_interval_days,
        development_roll_interval_days=colony.development_roll_interval_days,
        base_complacency=colony.base_complacency, base_order=colony.base_order,
        base_productivity=colony.base_productivity, base_piety=colony.base_piety, base_size=colony.base_size,
        representative_id=colony.representative_id, dynasty_outcome=colony.dynasty_outcome,
        complacency_locked=colony.complacency_locked, order_locked=colony.order_locked,
        productivity_locked=colony.productivity_locked, planetary_resources=colony.planetary_resources,
        state=_build_state_nested(state),
    )


@router.put("/{colony_id}", response_model=ColonyResponse)
async def update_colony(colony_id: int, colony_data: ColonyUpdate, service: ColonyService = Depends(get_colony_service)) -> ColonyResponse:
    """Update a colony (partial update)."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    update_data = colony_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(colony, field, value)
    updated = service._colony_repository.update(colony)
    state = service.get_state(colony_id)
    return ColonyResponse(
        id=updated.id, name=updated.name, owner=updated.owner, colony_type=updated.colony_type,
        age_days=updated.age_days, age_last_updated=updated.age_last_updated,
        event_roll_interval_days=updated.event_roll_interval_days,
        development_roll_interval_days=updated.development_roll_interval_days,
        base_complacency=updated.base_complacency, base_order=updated.base_order,
        base_productivity=updated.base_productivity, base_piety=updated.base_piety, base_size=updated.base_size,
        representative_id=updated.representative_id, dynasty_outcome=updated.dynasty_outcome,
        complacency_locked=updated.complacency_locked, order_locked=updated.order_locked,
        productivity_locked=updated.productivity_locked, planetary_resources=updated.planetary_resources,
        state=_build_state_nested(state),
    )


@router.delete("/{colony_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_colony(colony_id: int, service: ColonyService = Depends(get_colony_service)) -> None:
    """Delete a colony."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    service._colony_repository.delete(colony_id)


@router.get("/{colony_id}/state", response_model=ColonyStateNested)
async def get_colony_state(colony_id: int, service: ColonyService = Depends(get_colony_service)) -> ColonyStateNested:
    """Get computed state for a colony."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    state = service.get_state(colony_id)
    return _build_state_nested(state)


@router.post("/{colony_id}/age", response_model=ColonyResponse)
async def advance_colony_age(colony_id: int, age_days: int, service: ColonyService = Depends(get_colony_service)) -> ColonyResponse:
    """Advance colony age."""
    try:
        updated = service.update_age(colony_id, age_days)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    state = service.get_state(colony_id)
    return ColonyResponse(
        id=updated.id, name=updated.name, owner=updated.owner, colony_type=updated.colony_type,
        age_days=updated.age_days, age_last_updated=updated.age_last_updated,
        event_roll_interval_days=updated.event_roll_interval_days,
        development_roll_interval_days=updated.development_roll_interval_days,
        base_complacency=updated.base_complacency, base_order=updated.base_order,
        base_productivity=updated.base_productivity, base_piety=updated.base_piety, base_size=updated.base_size,
        representative_id=updated.representative_id, dynasty_outcome=updated.dynasty_outcome,
        complacency_locked=updated.complacency_locked, order_locked=updated.order_locked,
        productivity_locked=updated.productivity_locked, planetary_resources=updated.planetary_resources,
        state=_build_state_nested(state),
    )


@router.get("/{colony_id}/modifiers", response_model=list[ModifierResponse])
async def list_colony_modifiers(colony_id: int, service: ColonyService = Depends(get_colony_service)) -> list[ModifierResponse]:
    """List all modifiers for a colony."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    return [ModifierResponse(
        id=mod.id, colony_id=colony_id, modifier_source_type=mod.modifier_source_type,
        modifier_stat=mod.modifier_stat, modifier_value=mod.modifier_value,
        modifier_description=mod.modifier_description, is_active=mod.is_active,
    ) for mod in colony.modifiers]


@router.post("/{colony_id}/modifiers", response_model=ModifierResponse, status_code=status.HTTP_201_CREATED)
async def add_colony_modifier(colony_id: int, modifier_data: ModifierCreate, service: ColonyService = Depends(get_colony_service)) -> ModifierResponse:
    """Add a modifier to a colony."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    modifier = Modifier(
        colony_id=colony_id,
        modifier_source_type=modifier_data.modifier_source_type, modifier_stat=modifier_data.modifier_stat,
        modifier_value=modifier_data.modifier_value, modifier_description=modifier_data.modifier_description,
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
async def remove_colony_modifier(colony_id: int, modifier_id: int, service: ColonyService = Depends(get_colony_service)) -> None:
    """Remove a modifier from a colony."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    modifier_to_remove = None
    for mod in colony.modifiers:
        if mod.id == modifier_id:
            modifier_to_remove = mod
            break
    if modifier_to_remove is None:
        raise HTTPException(status_code=404, detail=f"Modifier {modifier_id} not found")
    colony.modifiers.remove(modifier_to_remove)
    service._colony_repository.update(colony)
