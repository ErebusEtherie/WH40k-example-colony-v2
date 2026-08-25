
from hypothesis import given
from hypothesis import strategies as st

from colony_manager.domain.enums import ModifierCategory, ModifierSourceType, ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.stat_calculator import calculate_stat


def test_calculate_stat_with_active_modifiers():
    base = 10
    modifiers = [
        Modifier(
            id=1,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=5,
            modifier_description="Bonus",
            is_active=True,
        ),
        Modifier(
            id=2,
            colony_id=1,
            modifier_source_type="gm_custom",
            modifier_category=ModifierCategory.CUSTOM,
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
            modifier_category=ModifierCategory.CUSTOM,
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
            modifier_category=ModifierCategory.CUSTOM,
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
            modifier_category=ModifierCategory.CUSTOM,
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
            modifier_category=ModifierCategory.CUSTOM,
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
# When locked, result should be <= unlocked (can't increase, but can decrease)
    assert locked_result <= unlocked_result
    # Result should still never go negative
    assert locked_result >= 0


@given(
    base_value=st.integers(min_value=0, max_value=50),
    modifier_values=st.lists(st.integers(min_value=-10, max_value=10), min_size=1, max_size=20),
)
def test_multiple_modifiers_stack_correctly(base_value: int, modifier_values: list[int]):
    """Property: Multiple modifiers of the same stat stack additively."""
    modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.ORDER,
            modifier_value=value,
            modifier_description=f"Modifier {i}",
            is_active=True,
        )
        for i, value in enumerate(modifier_values)
    ]
    
    result = calculate_stat(base_value, modifiers, ModifierStat.ORDER)
    expected = base_value + sum(modifier_values)
    expected = max(expected, 0)  # Clamped at 0
    
    assert result == expected


@given(
    base_value=st.integers(min_value=0, max_value=50),
    positive_values=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=10),
    negative_values=st.lists(st.integers(min_value=-10, max_value=-1), min_size=1, max_size=10),
)
def test_positive_and_negative_modifiers_combine(base_value: int, positive_values: list[int], negative_values: list[int]):
    """Property: Positive and negative modifiers combine correctly."""
    all_values = positive_values + negative_values
    modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.COMPLACENCY,
            modifier_value=value,
            modifier_description=f"Modifier {i}",
            is_active=True,
        )
        for i, value in enumerate(all_values)
    ]
    
    result = calculate_stat(base_value, modifiers, ModifierStat.COMPLACENCY)
    expected = base_value + sum(all_values)
    expected = max(expected, 0)  # Clamped at 0
    
    assert result == expected


@given(
    base_value=st.integers(min_value=0, max_value=50),
    modifier_values=st.lists(st.integers(min_value=-5, max_value=2), min_size=5, max_size=30),
)
def test_many_modifiers_never_cause_negative(base_value: int, modifier_values: list[int]):
    """Property: Even with many negative modifiers, stat never goes below 0."""
    modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=value,
            modifier_description=f"Modifier {i}",
            is_active=True,
        )
        for i, value in enumerate(modifier_values)
    ]
    
    result = calculate_stat(base_value, modifiers, ModifierStat.PRODUCTIVITY)
    assert result >= 0


@given(
    base_value=st.integers(min_value=0, max_value=50),
    active_values=st.lists(st.integers(min_value=-5, max_value=5), min_size=1, max_size=10),
    inactive_values=st.lists(st.integers(min_value=-100, max_value=100), min_size=1, max_size=10),
)
def test_inactive_modifiers_dont_affect_calculation(base_value: int, active_values: list[int], inactive_values: list[int]):
    """Property: Inactive modifiers are ignored in calculation."""
    active_modifiers = [
        Modifier(
            id=i,
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PIETY,
            modifier_value=value,
            modifier_description=f"Active {i}",
            is_active=True,
        )
        for i, value in enumerate(active_values)
    ]
    
    # Generate inactive modifiers (should be ignored)
    inactive_modifiers = [
        Modifier(
            id=len(active_values) + i,
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PIETY,
            modifier_value=value,
            modifier_description=f"Inactive {i}",
            is_active=False,
        )
        for i, value in enumerate(inactive_values)
    ]
    
    all_modifiers = active_modifiers + inactive_modifiers
    result = calculate_stat(base_value, all_modifiers, ModifierStat.PIETY)
    expected = base_value + sum(active_values)
    expected = max(expected, 0)
    
    assert result == expected
