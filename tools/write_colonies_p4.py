content = '''

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
        current_event=updated.current_event,
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
'''

with open('src/colony_manager/adapters/api/routers/colonies.py', 'a', encoding='utf-8') as f:
    f.write(content)
print('Part 4 done')