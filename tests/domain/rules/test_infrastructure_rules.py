"""Tests for infrastructure rules."""

from colony_manager.domain.enums import InfrastructureState, InfrastructureType, ModifierStat
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.rules.infrastructure_rules import (
    apply_infrastructure_modifiers,
    get_infrastructure_modifiers,
)


class TestInfrastructureRules:
    def test_planned_state_returns_no_modifiers(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.PLANNED)
        assert get_infrastructure_modifiers(infra) == []

    def test_transport_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == 1 for m in mods)
        assert any(m.modifier_stat == ModifierStat.COMPLACENCY and m.modifier_value == 1 for m in mods)

    def test_transport_not_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.NOT_WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == -2 for m in mods)
        assert any(m.modifier_stat == ModifierStat.ORDER and m.modifier_value == -2 for m in mods)

    def test_power_network_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 1
        assert mods[0].modifier_stat == ModifierStat.PRODUCTIVITY
        assert mods[0].modifier_value == 2

    def test_power_network_not_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.NOT_WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == -3 for m in mods)
        assert any(m.modifier_stat == ModifierStat.COMPLACENCY and m.modifier_value == -1 for m in mods)

    def test_water_management_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.ORDER and m.modifier_value == 1 for m in mods)
        assert any(m.modifier_stat == ModifierStat.COMPLACENCY and m.modifier_value == 1 for m in mods)

    def test_water_management_not_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.NOT_WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.ORDER and m.modifier_value == -2 for m in mods)
        assert any(m.modifier_stat == ModifierStat.COMPLACENCY and m.modifier_value == -2 for m in mods)

    def test_food_production_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.FOOD_PRODUCTION, state=InfrastructureState.WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == 1 for m in mods)
        assert any(m.modifier_stat == ModifierStat.COMPLACENCY and m.modifier_value == 1 for m in mods)

    def test_food_production_not_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.FOOD_PRODUCTION, state=InfrastructureState.NOT_WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == -2 for m in mods)
        assert any(m.modifier_stat == ModifierStat.COMPLACENCY and m.modifier_value == -2 for m in mods)

    def test_communications_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.COMMUNICATIONS, state=InfrastructureState.WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == 1 for m in mods)
        assert any(m.modifier_stat == ModifierStat.ORDER and m.modifier_value == 1 for m in mods)

    def test_communications_not_working(self):
        infra = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.COMMUNICATIONS, state=InfrastructureState.NOT_WORKING)
        mods = get_infrastructure_modifiers(infra)
        assert len(mods) == 2
        assert any(m.modifier_stat == ModifierStat.PRODUCTIVITY and m.modifier_value == -2 for m in mods)
        assert any(m.modifier_stat == ModifierStat.ORDER and m.modifier_value == -2 for m in mods)

    def test_apply_multiple(self):
        infra_list = [Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.WORKING), Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)]
        mods = apply_infrastructure_modifiers(infra_list)
        prod_mods = [m for m in mods if m.modifier_stat == ModifierStat.PRODUCTIVITY]
        comp_mods = [m for m in mods if m.modifier_stat == ModifierStat.COMPLACENCY]
        assert sum(m.modifier_value for m in prod_mods) == 3
        assert sum(m.modifier_value for m in comp_mods) == 1

    def test_apply_mixed_states(self):
        infra_list = [Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.WORKING), Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.NOT_WORKING), Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.PLANNED)]
        mods = apply_infrastructure_modifiers(infra_list)
        prod_mods = [m for m in mods if m.modifier_stat == ModifierStat.PRODUCTIVITY]
        comp_mods = [m for m in mods if m.modifier_stat == ModifierStat.COMPLACENCY]
        assert sum(m.modifier_value for m in prod_mods) == -2
        assert sum(m.modifier_value for m in comp_mods) == 0
class TestInfrastructureIntegration:
    """Integration tests showing working vs not working state effects on colony stats."""
    
    def test_working_infrastructure_boosts_stats(self):
        """Working infrastructure provides positive modifiers to colony stats."""
        from colony_manager.domain.rules.infrastructure_rules import apply_infrastructure_modifiers
        from colony_manager.domain.rules.stat_calculator import calculate_stat
        
        # Create working infrastructure
        infra_list = [
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.WORKING),
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING),
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.WORKING),
        ]
        
        # Apply modifiers
        modifiers = apply_infrastructure_modifiers(infra_list)
        
        # Calculate stats with base values
        base_productivity = 10
        base_complacency = 10
        base_order = 10
        
        productivity = calculate_stat(base_productivity, modifiers, ModifierStat.PRODUCTIVITY)
        complacency = calculate_stat(base_complacency, modifiers, ModifierStat.COMPLACENCY)
        order = calculate_stat(base_order, modifiers, ModifierStat.ORDER)
        
        # Working infrastructure should boost stats above base
        assert productivity > base_productivity
        assert complacency > base_complacency
        assert order > base_order
    
    def test_not_working_infrastructure_penalizes_stats(self):
        """not working infrastructure applies negative modifiers to colony stats."""
        from colony_manager.domain.rules.infrastructure_rules import apply_infrastructure_modifiers
        from colony_manager.domain.rules.stat_calculator import calculate_stat
        
        # Create not working infrastructure
        infra_list = [
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.NOT_WORKING),
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.NOT_WORKING),
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.NOT_WORKING),
        ]
        
        # Apply modifiers
        modifiers = apply_infrastructure_modifiers(infra_list)
        
        # Calculate stats with base values
        base_productivity = 10
        base_complacency = 10
        base_order = 10
        
        productivity = calculate_stat(base_productivity, modifiers, ModifierStat.PRODUCTIVITY)
        complacency = calculate_stat(base_complacency, modifiers, ModifierStat.COMPLACENCY)
        order = calculate_stat(base_order, modifiers, ModifierStat.ORDER)
        
        # not working infrastructure should reduce stats below base
        assert productivity < base_productivity
        assert complacency < base_complacency
        assert order < base_order
    
    def test_mixed_states_have_combined_effect(self):
        """Mixed working and not working infrastructure have combined net effect."""
        from colony_manager.domain.rules.infrastructure_rules import apply_infrastructure_modifiers
        from colony_manager.domain.rules.stat_calculator import calculate_stat
        
        # Create mixed infrastructure
        infra_list = [
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.WORKING),
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.NOT_WORKING),
        ]
        
        # Apply modifiers
        modifiers = apply_infrastructure_modifiers(infra_list)
        
        # Calculate stats with base values
        base_productivity = 10
        
        productivity = calculate_stat(base_productivity, modifiers, ModifierStat.PRODUCTIVITY)
        
        # Transport working: +1 productivity
        # Power Network not working: -3 productivity
        # Net: -2 productivity
        assert productivity == base_productivity - 2
    
    def test_planned_infrastructure_has_no_effect(self):
        """Planned infrastructure has no effect on colony stats."""
        from colony_manager.domain.rules.infrastructure_rules import apply_infrastructure_modifiers
        from colony_manager.domain.rules.stat_calculator import calculate_stat
        
        # Create planned infrastructure
        infra_list = [
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.PLANNED),
            Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.PLANNED),
        ]
        
        # Apply modifiers
        modifiers = apply_infrastructure_modifiers(infra_list)
        
        # Calculate stats with base values
        base_productivity = 10
        base_complacency = 10
        base_order = 10
        
        productivity = calculate_stat(base_productivity, modifiers, ModifierStat.PRODUCTIVITY)
        complacency = calculate_stat(base_complacency, modifiers, ModifierStat.COMPLACENCY)
        order = calculate_stat(base_order, modifiers, ModifierStat.ORDER)
        
        # Planned infrastructure should have no effect
        assert productivity == base_productivity
        assert complacency == base_complacency
        assert order == base_order
