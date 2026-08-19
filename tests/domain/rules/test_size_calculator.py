from hypothesis import given
from hypothesis import strategies as st

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.size_calculator import calculate_size


def test_calculate_size_with_active_modifiers():
    base_size = 5
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.SIZE,
            modifier_value=3,
            modifier_description="Growth",
            is_active=True,
        ),
    ]

    assert calculate_size(base_size, modifiers) == 8


def test_calculate_size_ignores_non_size_modifiers():
    base_size = 5
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.ORDER,
            modifier_value=10,
            modifier_description="Misapplied",
            is_active=True,
        ),
    ]

    assert calculate_size(base_size, modifiers) == 5


def test_calculate_size_never_negative():
    base_size = 0
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.SIZE,
            modifier_value=-5,
            modifier_description="Shrink",
            is_active=True,
        ),
    ]

    assert calculate_size(base_size, modifiers) == 0


@given(
    base_size=st.integers(min_value=0, max_value=20),
    modifier_values=st.lists(st.integers(min_value=-50, max_value=50), min_size=0, max_size=20),
)
def test_calculate_size_never_negative_property(base_size, modifier_values):
    """Property: Size never goes below 0 regardless of modifier stacking."""
    modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_stat=ModifierStat.SIZE,
            modifier_value=value,
            modifier_description=f"Modifier {i}",
            is_active=True,
        )
        for i, value in enumerate(modifier_values)
    ]
    result = calculate_size(base_size, modifiers)
    assert result >= 0
