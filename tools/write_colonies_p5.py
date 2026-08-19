content = '''

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
        current_event=updated.current_event,
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
'''

with open('src/colony_manager/adapters/api/routers/colonies.py', 'a', encoding='utf-8') as f:
    f.write(content)
print('Part 5 done')