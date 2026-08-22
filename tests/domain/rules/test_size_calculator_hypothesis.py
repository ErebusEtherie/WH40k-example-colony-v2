"""Hypothesis property-based tests for size calculator."""

from hypothesis import HealthCheck, assume, given, settings
from hypothesis import strategies as st

from colony_manager.domain.enums import ColonyType, ModifierSourceType, ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.size_calculator import (
    GrowthRollResult,
    calculate_size,
    calculate_size_decrease_penalty,
    resolve_growth_roll,
)


@st.composite
def size_modifiers(draw):
    """Generate a list of size modifiers."""
    num_modifiers = draw(st.integers(min_value=0, max_value=10))
    modifiers = []
    for _ in range(num_modifiers):
        modifier = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_stat=ModifierStat.SIZE,
            modifier_value=draw(st.integers(min_value=-5, max_value=5)),
            modifier_description=draw(st.text(min_size=1, max_size=50)),
            is_active=draw(st.booleans()),
        )
        modifiers.append(modifier)
    return modifiers


class TestCalculateSizeProperties:
    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=0, max_value=10), size_modifiers())
    def test_size_never_negative(self, base_size: int, modifiers: list[Modifier]):
        """Calculated size is never negative."""
        result = calculate_size(base_size, modifiers)
        assert result >= 0

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=0, max_value=10), size_modifiers())
    def test_inactive_modifiers_dont_affect_size(self, base_size: int, modifiers: list[Modifier]):
        """Inactive modifiers don't affect size calculation."""
        inactive = [m.model_copy(update={"is_active": False}) for m in modifiers]
        result = calculate_size(base_size, inactive)
        assert result == base_size

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=0, max_value=10), st.integers(min_value=1, max_value=5))
    def test_single_positive_modifier_increases_size(self, base_size: int, mod_value: int):
        """A single positive modifier increases size."""
        modifier = Modifier(source="Test", modifier_source_type=ModifierSourceType.GM_CUSTOM,
                          modifier_stat=ModifierStat.SIZE, modifier_value=mod_value,
                          modifier_description="Test", duration_days=90, is_active=True)
        result = calculate_size(base_size, [modifier])
        assert result == base_size + mod_value

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=0, max_value=10), st.integers(min_value=-5, max_value=-1))
    def test_single_negative_modifier_decreases_size(self, base_size: int, mod_value: int):
        """A single negative modifier decreases size (but not below 0)."""
        modifier = Modifier(source="Test", modifier_source_type=ModifierSourceType.GM_CUSTOM,
                          modifier_stat=ModifierStat.SIZE, modifier_value=mod_value,
                          modifier_description="Test", duration_days=90, is_active=True)
        result = calculate_size(base_size, [modifier])
        expected = max(base_size + mod_value, 0)
        assert result == expected


class TestResolveGrowthRollProperties:
    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=1, max_value=20))
    def test_low_roll_causes_decrease(self, roll: int):
        """Modified roll <= 2 causes size decrease."""
        result = resolve_growth_roll(roll, pf_investment=0, resource_bonus=0)
        if roll <= 2:
            assert result.effect == GrowthRollResult.DECREASE
            assert result.size_change == -1
        elif roll <= 7:
            assert result.effect == GrowthRollResult.NO_CHANGE
            assert result.size_change == 0
        else:
            assert result.effect == GrowthRollResult.INCREASE
            assert result.size_change == 1

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=1, max_value=10), st.integers(min_value=0, max_value=10))
    def test_pf_investment_increases_modified_roll(self, roll: int, pf_investment: int):
        """PF investment increases the modified roll value."""
        result_with = resolve_growth_roll(roll, pf_investment=pf_investment, resource_bonus=0)
        result_without = resolve_growth_roll(roll, pf_investment=0, resource_bonus=0)
        assert result_with.size_change >= result_without.size_change

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=1, max_value=10), st.integers(min_value=0, max_value=5))
    def test_resource_bonus_increases_modified_roll(self, roll: int, resource_bonus: int):
        """Resource bonus increases the modified roll value."""
        result_with = resolve_growth_roll(roll, pf_investment=0, resource_bonus=resource_bonus)
        result_without = resolve_growth_roll(roll, pf_investment=0, resource_bonus=0)
        assert result_with.size_change >= result_without.size_change

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow, HealthCheck.filter_too_much])
    @given(st.integers(min_value=1, max_value=2), st.integers(min_value=0, max_value=10), st.integers(min_value=1, max_value=10))
    def test_agricultural_resilience_prevents_decrease(self, roll: int, pf_investment: int, resilience_roll: int):
        """Agricultural colonies with resilience_roll >= 8 avoid size decrease."""
        modified_roll = roll + pf_investment
        assume(modified_roll <= 2)
        result = resolve_growth_roll(roll, pf_investment=pf_investment, resource_bonus=0,
                                    colony_type=ColonyType.AGRICULTURAL, resilience_roll=resilience_roll)
        if resilience_roll >= 8:
            assert result.effect == GrowthRollResult.NO_CHANGE
            assert result.size_change == 0
            assert result.agricultural_resilience_success is True
        else:
            assert result.effect == GrowthRollResult.DECREASE
            assert result.size_change == -1

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=1, max_value=10))
    def test_non_agricultural_ignores_resilience_roll(self, roll: int):
        """Non-Agricultural colonies don't benefit from resilience roll."""
        result_industry = resolve_growth_roll(roll, pf_investment=0, resource_bonus=0,
                                             colony_type=ColonyType.INDUSTRY, resilience_roll=10)
        result_mining = resolve_growth_roll(roll, pf_investment=0, resource_bonus=0,
                                           colony_type=ColonyType.MINING, resilience_roll=10)
        assert result_industry.agricultural_resilience_rolled is False
        assert result_mining.agricultural_resilience_rolled is False


class TestSizeDecreasePenaltyProperties:
    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=1, max_value=5))
    def test_penalty_is_always_positive(self, penalty_roll: int):
        """Size decrease penalty is always at least 1."""
        result = calculate_size_decrease_penalty(penalty_roll)
        assert result >= 1

    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
    @given(st.integers(min_value=1, max_value=5))
    def test_penalty_values(self, penalty_roll: int):
        """Penalty values: 1d5-3, min 1."""
        result = calculate_size_decrease_penalty(penalty_roll)
        if penalty_roll == 5:
            assert result == 2
        else:
            assert result == 1
