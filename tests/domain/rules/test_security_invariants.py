"""Security invariant tests for domain rules.

These tests verify critical security invariants that must always hold:
- Stats never go negative regardless of modifier combinations
- Order == 0 always forces Profit Factor to 0 (anarchy rule)
- Locked stats ignore positive modifiers
- Profit Factor never goes negative
"""

import hypothesis.strategies as st
from hypothesis import given

from colony_manager.domain.enums import ModifierCategory, ModifierSourceType, ModifierStat
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.profit_factor_calculator import calculate_profit_factor
from colony_manager.domain.rules.stat_calculator import calculate_stat


class TestStatSecurityInvariants:
    """Tests for stat calculation security invariants."""

    @given(
        base_value=st.integers(min_value=0, max_value=100),
        modifier_values=st.lists(st.integers(min_value=-50, max_value=10), min_size=0, max_size=20),
    )
    def test_stat_never_negative_property(self, base_value: int, modifier_values: list[int]) -> None:
        """Property: Stats never go below 0 regardless of penalty combinations."""
        modifiers = [
            Modifier(
                colony_id=1,
                modifier_source_type=ModifierSourceType.GM_CUSTOM,
                modifier_category=ModifierCategory.CUSTOM,
                modifier_stat=ModifierStat.ORDER,
                modifier_value=val,
                is_active=True,
            )
            for val in modifier_values
        ]
        result = calculate_stat(base_value, modifiers, ModifierStat.ORDER)
        assert result >= 0, f"Stat went negative: base={base_value}, result={result}"

    def test_locked_stat_ignores_positive_modifiers(self) -> None:
        """Test: Locked stats ignore all positive modifiers."""
        base_value = 50
        modifiers = [
            Modifier(colony_id=1, modifier_source_type=ModifierSourceType.GM_CUSTOM, modifier_category=ModifierCategory.CUSTOM, modifier_stat=ModifierStat.ORDER, modifier_value=20, is_active=True),
            Modifier(colony_id=1, modifier_source_type=ModifierSourceType.GM_CUSTOM, modifier_category=ModifierCategory.CUSTOM, modifier_stat=ModifierStat.ORDER, modifier_value=-10, is_active=True),
        ]
        locked_result = calculate_stat(base_value, modifiers, ModifierStat.ORDER, is_locked=True)
        unlocked_result = calculate_stat(base_value, modifiers, ModifierStat.ORDER, is_locked=False)
        
        # Locked stat should ignore +20, only apply -10: 50 - 10 = 40
        assert locked_result == 40, f"Locked stat should ignore +20, got {locked_result}"
        # Unlocked should apply all modifiers: 50 + 20 - 10 = 60
        assert unlocked_result == 60, f"Unlocked should apply all, got {unlocked_result}"


class TestProfitFactorSecurityInvariants:
    """Tests for Profit Factor calculation security invariants."""

    @given(
        base_pf=st.integers(min_value=1, max_value=20),
        complacency=st.integers(min_value=0, max_value=100),
        productivity=st.integers(min_value=0, max_value=100),
        piety=st.integers(min_value=0, max_value=100),
        size=st.integers(min_value=1, max_value=50),
        leadership_mod=st.integers(min_value=-10, max_value=20),
        custom_pf_mod=st.integers(min_value=-50, max_value=50),
    )
    def test_profit_factor_never_negative_property(
        self, base_pf: int, complacency: int, productivity: int, piety: int,
        size: int, leadership_mod: int, custom_pf_mod: int,
    ) -> None:
        """Property: Profit Factor never goes below 0."""
        modifiers = [
            Modifier(
                colony_id=1,
                modifier_source_type=ModifierSourceType.GM_CUSTOM,
                modifier_category=ModifierCategory.CUSTOM,
                modifier_stat=ModifierStat.PROFIT_FACTOR,
                modifier_value=custom_pf_mod,
                is_active=True,
            )
        ]
        result = calculate_profit_factor(
            base_profit_factor=base_pf,
            current_complacency=complacency,
            current_order=1,
            current_productivity=productivity,
            current_piety=piety,
            actual_size=size,
            modifiers=modifiers,
            leadership_modifier=leadership_mod,
            is_orderly=False,
        )
        assert result >= 0, f"PF went negative: {result}"

    @given(
        base_pf=st.integers(min_value=1, max_value=20),
        complacency=st.integers(min_value=0, max_value=100),
        productivity=st.integers(min_value=1, max_value=100),
        piety=st.integers(min_value=0, max_value=100),
        size=st.integers(min_value=1, max_value=50),
        leadership_mod=st.integers(min_value=-10, max_value=50),
        custom_pf_mod=st.integers(min_value=-50, max_value=50),
    )
    def test_profit_factor_zero_when_order_is_zero_property(
        self, base_pf: int, complacency: int, productivity: int, piety: int,
        size: int, leadership_mod: int, custom_pf_mod: int,
    ) -> None:
        """Property: Order == 0 always forces Profit Factor to 0 (Anarchy)."""
        modifiers = [
            Modifier(
                colony_id=1,
                modifier_source_type=ModifierSourceType.GM_CUSTOM,
                modifier_category=ModifierCategory.CUSTOM,
                modifier_stat=ModifierStat.PROFIT_FACTOR,
                modifier_value=custom_pf_mod,
                is_active=True,
            )
        ]
        result = calculate_profit_factor(
            base_profit_factor=base_pf,
            current_complacency=complacency,
            current_order=0,
            current_productivity=productivity,
            current_piety=piety,
            actual_size=size,
            modifiers=modifiers,
            leadership_modifier=leadership_mod,
            is_orderly=False,
        )
        assert result == 0, f"PF should be 0 when Order=0, got {result}"

    def test_profit_factor_halved_when_productivity_zero(self) -> None:
        """Test: Productivity == 0 halves Profit Factor (Halted)."""
        # Test with various base values - round_half_up rounds 0.5 up
        # Minimum PF of 1 is enforced in calculate_profit_factor() to prevent zero/negative PF
        test_cases = [
            (10, 6),   # 10 / 2 = 5, +1 state bonus (Halted) = 6
            (5, 3),    # 5 / 2 = 2.5 → 3, +0 state bonus = 3
            (1, 1),    # 1 / 2 = 0.5 → 1, +0 state bonus = 1
            (0, 1),    # 0 → minimum PF floor of 1 applied
        ]
        for base_pf, expected in test_cases:
            result = calculate_profit_factor(
                base_profit_factor=base_pf,
                current_complacency=10,
                current_order=10,
                current_productivity=0,
                current_piety=10,
                actual_size=5,
                modifiers=[],
                leadership_modifier=0,
                is_orderly=False,
            )
            assert result == expected, f"PF halved: base={base_pf}, expected={expected}, got={result}"

    def test_profit_factor_order_zero_overrides_all_bonuses(self) -> None:
        """Test: Order=0 overrides all positive bonuses."""
        result = calculate_profit_factor(
            base_profit_factor=10,
            current_complacency=100,
            current_order=0,
            current_productivity=100,
            current_piety=100,
            actual_size=5,
            modifiers=[
                Modifier(colony_id=1, modifier_source_type=ModifierSourceType.GM_CUSTOM, modifier_category=ModifierCategory.CUSTOM, modifier_stat=ModifierStat.PROFIT_FACTOR, modifier_value=1000, is_active=True),
            ],
            leadership_modifier=50,
            is_orderly=False,
        )
        assert result == 0, f"Order=0 should override all bonuses, got {result}"


