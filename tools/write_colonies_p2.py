content = '''

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
'''

with open("src/colony_manager/adapters/api/routers/colonies.py", "a", encoding="utf-8") as f:
    f.write(content)
print("Part 2 done")
