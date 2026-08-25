"""Configuration API router - exposes rule tables and type definitions."""

from fastapi import APIRouter

from colony_manager.config import get_config

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/colony-types")
def get_colony_types():
    """Get list of available colony types.
    
    Returns data suitable for populating dropdown menus in the frontend.
    """
    config = get_config()
    return [
        {"id": ct.id, "name": ct.name, "description": ct.description}
        for ct in config.colony_types
    ]


@router.get("/representative-types")
def get_representative_types():
    """Get list of available representative types.
    
    Returns data suitable for populating dropdown menus in the frontend.
    """
    config = get_config()
    return [
        {"id": rt.id, "name": rt.name, "description": rt.description}
        for rt in config.representative_types
    ]


@router.get("/infrastructure-types")
def get_infrastructure_types():
    """Get list of infrastructure types with bonuses and costs.
    
    Returns data for dropdown menus and displaying bonus information.
    """
    config = get_config()
    result = []
    for it in config.infrastructure_types:
        result.append({
            "id": it.id,
            "name": it.name,
            "description": it.description,
            "base_cost": it.base_cost,
            "bonuses": {
                "working": it.bonuses.working.model_dump(exclude_none=True),
                "faulty": it.bonuses.faulty.model_dump(exclude_none=True),
            }
        })
    return result


@router.get("/support-upgrades")
def get_support_upgrades():
    """Get list of support upgrades with bonuses and costs.
    
    Returns data for dropdown menus and displaying bonus information.
    """
    config = get_config()
    return [
        {
            "id": su.id,
            "name": su.name,
            "description": su.description,
            "base_cost": su.base_cost,
            "bonus_stat": su.bonus_stat,
            "bonus_value": su.bonus_value,
        }
        for su in config.support_upgrades
    ]


@router.get("/profit-factor-table")
def get_profit_factor_table():
    """Get colony size to profit factor lookup table.
    
    Returns a mapping of colony size to base profit factor value.
    """
    config = get_config()
    return {str(k): v for k, v in config.colony_size_to_pf.items()}


@router.get("/thresholds")
def get_thresholds():
    """Get threshold values for state transitions.
    
    Returns thresholds for Anarchy, Placated, Productive, Halted, Pious, Heretical states.
    """
    config = get_config()
    return config.thresholds.model_dump()


@router.get("/growth-decay")
def get_growth_decay():
    """Get growth and decay rule configuration.
    
    Returns interval days for event and development rolls.
    """
    config = get_config()
    return config.growth_decay.model_dump()