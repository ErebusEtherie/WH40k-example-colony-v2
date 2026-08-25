"""Configuration API router - exposes rule tables and type definitions."""

from fastapi import APIRouter, Depends

from colony_manager.adapters.api.dependencies import get_rule_config_provider
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/colony-types")
def get_colony_types(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get list of available colony types.
    
    Returns data suitable for populating dropdown menus in the frontend.
    """
    return [
        {"id": ct.name, "name": ct.display_name, "description": ct.description}
        for ct in provider.colony_types
    ]


@router.get("/representative-types")
def get_representative_types(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get list of available representative types.
    
    Returns data suitable for populating dropdown menus in the frontend.
    """
    return [
        {"id": rt.name, "name": rt.display_name, "description": rt.description}
        for rt in provider.representative_types
    ]


@router.get("/infrastructure-types")
def get_infrastructure_types(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get list of infrastructure types with bonuses and costs.
    
    Returns data for dropdown menus and displaying bonus information.
    """
    result = []
    for infra in provider.infrastructure_types:
        # Transform states into working/faulty bonus format for API compatibility
        working_bonuses = {}
        faulty_bonuses = {}
        for state_name, state_config in infra.states.items():
            bonuses = {mod.stat: mod.value for mod in state_config.modifiers}
            if state_name.lower() in ("working", "operational"):
                working_bonuses = bonuses
            elif state_name.lower() in ("faulty", "broken", "not_working"):
                faulty_bonuses = bonuses
        
        result.append({
            "id": infra.name,
            "name": infra.display_name,
            "description": infra.description,
            "bonuses": {
                "working": working_bonuses,
                "faulty": faulty_bonuses,
            }
        })
    return result


@router.get("/support-upgrades")
def get_support_upgrades(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get list of support upgrades with bonuses and costs.
    
    Returns data for dropdown menus and displaying bonus information.
    """
    result = []
    for su in provider.support_upgrades:
        # Extract primary stat effect for API compatibility
        bonus_stat = None
        bonus_value = None
        if su.stat_effects:
            bonus_stat = su.stat_effects[0].stat
            bonus_value = su.stat_effects[0].value
        
        result.append({
            "id": su.name,
            "name": su.display_name,
            "description": su.description,
            "bonus_stat": bonus_stat,
            "bonus_value": bonus_value,
        })
    return result


@router.get("/profit-factor-table")
def get_profit_factor_table(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get colony size to profit factor lookup table.
    
    Returns a mapping of colony size to base profit factor value.
    """
    return provider.get_profit_factor_table()


@router.get("/thresholds")
def get_thresholds(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get threshold values for state transitions.
    
    Returns thresholds for Anarchy, Placated, Productive, Halted, Pious, Heretical states.
    """
    return provider.get_lore_thresholds()


@router.get("/growth-decay")
def get_growth_decay(provider: RuleConfigProvider = Depends(get_rule_config_provider)):
    """Get growth and decay rule configuration.
    
    Returns interval days for event and development rolls.
    """
    return {
        "event_roll_interval_days": provider.get_event_roll_interval_days(),
        "development_roll_interval_days": provider.get_development_roll_interval_days(),
    }