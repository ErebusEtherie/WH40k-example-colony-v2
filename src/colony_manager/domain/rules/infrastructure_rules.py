"""Infrastructure rules for the colony manager.

Per Rogue Trader Colony Rules:
- Infrastructure has three states: planned, working, not_working
- planned: No mechanical effect (not yet installed)
- working: Bonuses apply
- not_working: Penalties apply

Hard Infrastructure types:
- Transport: working (+1 Prod, +1 Comp), not_working (-2 Prod, -2 Order)
- Power Network: working (+2 Prod), not_working (-3 Prod, -1 Comp)
- Water Management: working (+1 Order, +1 Comp), not_working (-2 Order, -2 Comp)
- Food Production: working (+1 Prod, +1 Comp), not_working (-2 Prod, -2 Comp)
- Communications: working (+1 Prod, +1 Order), not_working (-2 Prod, -2 Order)
"""

from colony_manager.domain.enums import InfrastructureState, InfrastructureType, ModifierStat
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.models.modifier import Modifier, ModifierSourceType


def get_infrastructure_modifiers(infrastructure: Infrastructure) -> list[Modifier]:
    """
    Get modifiers from an infrastructure based on its state.
    
    Args:
        infrastructure: The infrastructure to get modifiers from.
    
    Returns:
        List of modifiers (empty if state is planned).
    """
    if infrastructure.state == InfrastructureState.PLANNED:
        return []
    
    # Define modifiers by type and state
    modifiers_data = _get_modifiers_for_type(infrastructure.infrastructure_type, infrastructure.state)
    
    return [
        Modifier(
            colony_id=infrastructure.colony_id,
            modifier_source_type=ModifierSourceType.INFRASTRUCTURE,
            modifier_stat=ModifierStat(str(mod["stat"])),
            modifier_value=int(mod["value"]),  # type: ignore[call-overload]
            description=f"{infrastructure.infrastructure_type.value} ({infrastructure.state.value})",
            is_active=True,
        )
        for mod in modifiers_data
    ]


def _get_modifiers_for_type(
    infra_type: InfrastructureType,
    state: InfrastructureState,
) -> list[dict[str, object]]:
    """Get modifier data for a specific infrastructure type and state."""
    modifiers_map = {
        InfrastructureType.TRANSPORT: {
            InfrastructureState.WORKING: [
                {"stat": "productivity", "value": 1},
                {"stat": "complacency", "value": 1},
            ],
            InfrastructureState.NOT_WORKING: [
                {"stat": "productivity", "value": -2},
                {"stat": "order", "value": -2},
            ],
        },
        InfrastructureType.POWER_NETWORK: {
            InfrastructureState.WORKING: [
                {"stat": "productivity", "value": 2},
            ],
            InfrastructureState.NOT_WORKING: [
                {"stat": "productivity", "value": -3},
                {"stat": "complacency", "value": -1},
            ],
        },
        InfrastructureType.WATER_MANAGEMENT: {
            InfrastructureState.WORKING: [
                {"stat": "order", "value": 1},
                {"stat": "complacency", "value": 1},
            ],
            InfrastructureState.NOT_WORKING: [
                {"stat": "order", "value": -2},
                {"stat": "complacency", "value": -2},
            ],
        },
        InfrastructureType.FOOD_PRODUCTION: {
            InfrastructureState.WORKING: [
                {"stat": "productivity", "value": 1},
                {"stat": "complacency", "value": 1},
            ],
            InfrastructureState.NOT_WORKING: [
                {"stat": "productivity", "value": -2},
                {"stat": "complacency", "value": -2},
            ],
        },
        InfrastructureType.COMMUNICATIONS: {
            InfrastructureState.WORKING: [
                {"stat": "productivity", "value": 1},
                {"stat": "order", "value": 1},
            ],
            InfrastructureState.NOT_WORKING: [
                {"stat": "productivity", "value": -2},
                {"stat": "order", "value": -2},
            ],
        },
    }
    
    return modifiers_map.get(infra_type, {}).get(state, [])


def apply_infrastructure_modifiers(
    infrastructure_list: list[Infrastructure],
) -> list[Modifier]:
    """
    Apply modifiers from all infrastructure in a colony.
    
    Args:
        infrastructure_list: List of all infrastructure in the colony.
    
    Returns:
        Combined list of all active modifiers.
    """
    all_modifiers = []
    for infra in infrastructure_list:
        all_modifiers.extend(get_infrastructure_modifiers(infra))
    return all_modifiers