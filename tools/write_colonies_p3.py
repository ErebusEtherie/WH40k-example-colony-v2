content = '''

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
'''

with open("src/colony_manager/adapters/api/routers/colonies.py", "a", encoding="utf-8") as f:
    f.write(content)
print("Part 3 done")
