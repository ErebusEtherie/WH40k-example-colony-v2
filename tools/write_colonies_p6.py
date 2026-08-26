content = '''

@router.post("/{colony_id}/modifiers", response_model=ModifierResponse, status_code=status.HTTP_201_CREATED)
async def add_colony_modifier(colony_id: int, modifier_data: ModifierCreate, service: ColonyService = Depends(get_colony_service)) -> ModifierResponse:
    """Add a modifier to a colony."""
    colony = service._colony_repository.get(colony_id)
    if colony is None:
        raise HTTPException(status_code=404, detail=f"Colony {colony_id} not found")
    modifier = Modifier(
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
'''

with open("src/colony_manager/adapters/api/routers/colonies.py", "a", encoding="utf-8") as f:
    f.write(content)
print("Part 6 done - colonies.py complete")
