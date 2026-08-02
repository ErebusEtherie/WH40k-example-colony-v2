from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.profit_factor_calculator import calculate_profit_factor


def test_profit_factor_zero_forces_when_order_zero():
    result = calculate_profit_factor(
        base_profit_factor=5,
        current_complacency=10,
        current_order=0,
        current_productivity=10,
        current_piety=10,
        actual_size=5,
        modifiers=[],
        leadership_modifier=5,
    )
    assert result == 0


def test_profit_factor_halved_when_productivity_zero():
    result = calculate_profit_factor(
        base_profit_factor=5,
        current_complacency=0,
        current_order=10,
        current_productivity=0,
        current_piety=10,
        actual_size=5,
        modifiers=[
            Modifier(
                id=1,
                colony_id=1,
                modifier_source_type="gm_custom",
                modifier_stat=ModifierStat.PROFIT_FACTOR,
                modifier_value=3,
                modifier_description="PF bonus",
                is_active=True,
            )
        ],
        leadership_modifier=2,
    )
    assert result == 5  # (5 + 3 + 2) / 2 = 5.0


def test_profit_factor_does_not_go_negative():
    result = calculate_profit_factor(
        base_profit_factor=0,
        current_complacency=0,
        current_order=10,
        current_productivity=10,
        current_piety=10,
        actual_size=5,
        modifiers=[
            Modifier(
                id=1,
                colony_id=1,
                modifier_source_type="gm_custom",
                modifier_stat=ModifierStat.PROFIT_FACTOR,
                modifier_value=-10,
                modifier_description="PF penalty",
                is_active=True,
            )
        ],
        leadership_modifier=0,
    )
    assert result == 0
