
from hypothesis import given
from hypothesis import strategies as st

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.stat_calculator import calculate_stat


def test_calculate_stat_with_active_modifiers():
    base = 10
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=5,
            modifier_description="Bonus",
            is_active=True,
        ),
        Modifier(
            id=2,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.ORDER,
            modifier_value=-3,
            modifier_description="Penalty",
            is_active=True,
        ),
    ]

    assert calculate_stat(base, modifiers, ModifierStat.COMPLACENCY) == 15


def test_calculate_stat_ignores_inactive_modifiers():
    base = 10
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=-20,
            modifier_description="Inactive penalty",
            is_active=False,
        )
    ]

    assert calculate_stat(base, modifiers, ModifierStat.COMPLACENCY) == 10


def test_calculate_stat_never_negative():
    base = 0
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=-5,
            modifier_description="Penalty",
            is_active=True,
        )
    ]

    assert calculate_stat(base, modifiers, ModifierStat.COMPLACENCY) == 0


@given(
    base_value=st.integers(min_value=0, max_value=100),
    modifier_values=st.lists(st.integers(min_value=-50, max_value=50), min_size=0, max_size=20),
)
def test_calculate_stat_never_negative_property(base_value, modifier_values):
    """Property: Stats never go below 0 regardless of how many penalties stack."""
    modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=value,
            modifier_description=f"Modifier {i}",
            is_active=True,
        )
        for i, value in enumerate(modifier_values)
    ]
    result = calculate_stat(base_value, modifiers, ModifierStat.COMPLACENCY)
    assert result >= 0


@given(
    base_value=st.integers(min_value=0, max_value=100),
    modifier_values=st.lists(st.integers(min_value=-50, max_value=50), min_size=0, max_size=20),
)
def test_calculate_stat_locked_prevents_increases_property(base_value, modifier_values):
    """Property: When locked, positive modifiers are ignored but negative ones still apply."""
    modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.ORDER,
            modifier_value=value,
            modifier_description=f"Modifier {i}",
            is_active=True,
        )
        for i, value in enumerate(modifier_values)
    ]
    unlocked_result = calculate_stat(base_value, modifiers, ModifierStat.ORDER, is_locked=False)
    locked_result = calculate_stat(base_value, modifiers, ModifierStat.ORDER, is_locked=True)
    
    # When locked, result should be <= unlocked (can't increase, but can decrease)
    assert locked_result <= unlocked_result
    # Result should still never go negative
    assert locked_result >= 0
