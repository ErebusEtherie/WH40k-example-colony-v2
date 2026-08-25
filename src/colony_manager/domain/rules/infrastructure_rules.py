"""Infrastructure rules for the colony manager.

Per Rogue Trader Colony Rules:
- Infrastructure has five states: planned, in_progress, working, needed, not_working
- planned: No mechanical effect (not yet installed)
- in_progress: No mechanical effect (currently being installed)
- working: Bonuses apply
- needed: Counts toward missing infrastructure penalty (-1 Complacency)
- not_working: Penalties apply

Hard Infrastructure types:
- Transport: working (+1 Prod, +1 Comp), not_working (-2 Prod, -2 Order)
- Power Network: working (+2 Prod), not_working (-3 Prod, -1 Comp)
- Water Management: working (+1 Order, +1 Comp), not_working (-2 Order, -2 Comp)
- Food Production: working (+1 Prod, +1 Comp), not_working (-2 Prod, -2 Comp)
- Communications: working (+1 Prod, +1 Order), not_working (-2 Prod, -2 Order)
"""

from colony_manager.domain.enums import (
    InfrastructureState,
    InfrastructureType,
    ModifierCategory,
    ModifierStat,
)
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.models.modifier import Modifier, ModifierSourceType


def get_infrastructure_modifiers(infrastructure: Infrastructure) -> list[Modifier]:
    """
    Get modifiers from an infrastructure based on its state.
    
    Args:
        infrastructure: The infrastructure to get modifiers from.
    
    Returns:
        List of modifiers (empty if state is planned or in_progress).
    """
    if infrastructure.state in (InfrastructureState.PLANNED, InfrastructureState.IN_PROGRESS):
        return []
    
    # Define modifiers by type and state
    modifiers_data = _get_modifiers_for_type(infrastructure.infrastructure_type, infrastructure.state)
    
    return [
        Modifier(
            colony_id=infrastructure.colony_id,
            modifier_source_type=ModifierSourceType.INFRASTRUCTURE,
            modifier_category=ModifierCategory.PERMANENT,
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


def get_missing_infrastructure_penalty(
    infrastructure_list: list[Infrastructure],
    colony_id: int = 1,
) -> list[Modifier]:
    """
    Get penalty for missing required infrastructure types.
    
    Per business_analysis.md §3.1:
    Until each required infrastructure type is built (moved to Working),
    the colony suffers Complacency -1 per missing type.
    
    Required types: Transport, Power Network, Water Management, Food Production, Communications
    
    Args:
        infrastructure_list: List of all infrastructure in the colony.
        colony_id: The colony ID for the modifier.
    
    Returns:
        List containing a single penalty modifier if any types are missing,
        or empty list if all types are present and Working.
    """
    # All required infrastructure types
    required_types = {
        InfrastructureType.TRANSPORT,
        InfrastructureType.POWER_NETWORK,
        InfrastructureType.WATER_MANAGEMENT,
        InfrastructureType.FOOD_PRODUCTION,
        InfrastructureType.COMMUNICATIONS,
    }
    
    # Find which types have at least one Working instance
    working_types = {
        infra.infrastructure_type
        for infra in infrastructure_list
        if infra.state == InfrastructureState.WORKING
    }
    
    # Count missing types (not Working)
    missing_count = len(required_types - working_types)
    
    if missing_count == 0:
        return []
    
    # Apply -1 Complacency per missing type
    total_penalty = -1 * missing_count
    
    return [
        Modifier(
            colony_id=colony_id,
            modifier_source_type=ModifierSourceType.INFRASTRUCTURE,
            modifier_category=ModifierCategory.PERMANENT,
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=total_penalty,
            description="Missing Infrastructure (-1 per type not Working)",
            is_active=True,
        )
    ]