"""Tests for state effects rules (Placated, Anarchy, etc.)."""

from datetime import date

import pytest

from colony_manager.adapters.config.loader import FileRuleConfigProvider
from colony_manager.application.services.colony_state_calculator import ColonyStateCalculator
from colony_manager.domain.enums import (
    ColonyType,
    LoreState,
    ModifierCategory,
    ModifierSourceType,
    ModifierStat,
)
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state


@pytest.fixture
def config_provider():
    """Create a rule config provider for testing."""
    return FileRuleConfigProvider()


@pytest.fixture
def colony_state_calculator(config_provider):
    """Create a state calculator for testing."""
    return ColonyStateCalculator(config_provider)


class TestLoreStateResolver:
    """Tests for lore state resolution based on stat values vs. Size."""

    def test_complacency_placated_when_greater_than_size(self) -> None:
        """Complacency > Size should return PLACATED."""
        result = resolve_lore_state(ModifierStat.COMPLACENCY, value=6, size=5)
        assert result == LoreState.PLACATED

    def test_complacency_stable_when_equal_to_size(self) -> None:
        """Complacency == Size should return STABLE."""
        result = resolve_lore_state(ModifierStat.COMPLACENCY, value=5, size=5)
        assert result == LoreState.STABLE

    def test_complacency_riots_when_zero(self) -> None:
        """Complacency == 0 should return RIOTS_AND_UNREST."""
        result = resolve_lore_state(ModifierStat.COMPLACENCY, value=0, size=5)
        assert result == LoreState.RIOTS_AND_UNREST

    def test_order_anarchy_when_zero(self) -> None:
        """Order == 0 should return ANARCHY."""
        result = resolve_lore_state(ModifierStat.ORDER, value=0, size=5)
        assert result == LoreState.ANARCHY

    def test_order_orderly_when_greater_than_size(self) -> None:
        """Order > Size should return ORDERLY."""
        result = resolve_lore_state(ModifierStat.ORDER, value=6, size=5)
        assert result == LoreState.ORDERLY

    def test_order_stable_when_between_zero_and_size(self) -> None:
        """Order between 0 and Size should return STABLE."""
        result = resolve_lore_state(ModifierStat.ORDER, value=3, size=5)
        assert result == LoreState.STABLE

    def test_productivity_halted_when_zero(self) -> None:
        """Productivity == 0 should return HALTED."""
        result = resolve_lore_state(ModifierStat.PRODUCTIVITY, value=0, size=5)
        assert result == LoreState.HALTED

    def test_productivity_productive_when_greater_than_size(self) -> None:
        """Productivity > Size should return PRODUCTIVE."""
        result = resolve_lore_state(ModifierStat.PRODUCTIVITY, value=6, size=5)
        assert result == LoreState.PRODUCTIVE

    def test_productivity_stable_when_between_zero_and_size(self) -> None:
        """Productivity between 0 and Size should return STABLE."""
        result = resolve_lore_state(ModifierStat.PRODUCTIVITY, value=3, size=5)
        assert result == LoreState.STABLE

    def test_piety_heretical_when_zero(self) -> None:
        """Piety == 0 should return HERETICAL."""
        result = resolve_lore_state(ModifierStat.PIETY, value=0, size=5)
        assert result == LoreState.HERETICAL

    def test_piety_stable_when_between_zero_and_size(self) -> None:
        """Piety between 0 and Size should return STABLE."""
        result = resolve_lore_state(ModifierStat.PIETY, value=3, size=5)
        assert result == LoreState.STABLE


class TestStateEffectsOnProfitFactor:
    """Tests for how state affects Profit Factor calculation."""

    @pytest.fixture
    def base_colony(self) -> Colony:
        """Create a base colony for testing."""
        return Colony(
            id=1,
            name="Test Colony",
            owner="Test Owner",
            colony_type=ColonyType.RESEARCH_MISSION,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )

    def test_anarchy_sets_profit_factor_to_zero(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """When Order is 0, Profit Factor should be 0 regardless of other stats."""
        colony = base_colony.model_copy(update={"base_order": 0})
        state = colony_state_calculator.calculate(colony)
        assert state["profit_factor"] == 0

    def test_halted_halves_profit_factor(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """When Productivity is 0, Profit Factor should be halved."""
        colony = base_colony.model_copy(update={"base_productivity": 0})
        state = colony_state_calculator.calculate(colony)
        # Base PF for size 5 is 6, leadership modifier adds +1 = 7, halved = 3.5 -> floor(3.5) = 3
        assert state["profit_factor"] == 3

    def test_placated_adds_bonus_to_profit_factor(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """When Complacency > Size, should add +1 PF (Placated)."""
        colony = base_colony.model_copy(update={"base_complacency": 6})
        state = colony_state_calculator.calculate(colony)
        # Base PF for size 5 is 6, +1 for Placated = 7 (plus leadership if applicable)
        assert state["profit_factor"] >= 7
        assert state["lore_state"]["complacency"] == "placated"

    def test_productive_adds_bonus_to_profit_factor(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """When Productivity > Size, should add +2 PF (Productive)."""
        colony = base_colony.model_copy(update={"base_productivity": 6})
        state = colony_state_calculator.calculate(colony)
        # Base PF for size 5 is 6, +2 for Productive = 8 (plus leadership if applicable)
        assert state["profit_factor"] >= 8
        assert state["lore_state"]["productivity"] == "productive"

    def test_orderly_state_triggered_by_modifiers(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """Orderly state should trigger when modifiers push Order > Size."""
        
        # Base Order = 5, Size = 5 (not Orderly)
        colony = base_colony.model_copy(
            update={
                "base_order": 5,
                "base_size": 5,
            }
        )
        
        # Without modifier: not Orderly
        state = colony_state_calculator.calculate(colony)
        assert state["lore_state"]["order"] == "stable"
        assert state["productivity"] == 5  # No +2 bonus
        
        # Add +1 Order modifier
        order_modifier = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.PERMANENT,
            modifier_stat=ModifierStat.ORDER,
            modifier_value=1,
            description="Test order bonus",
        )
        colony_with_modifier = colony.model_copy(
            update={"modifiers": colony.modifiers + [order_modifier]}
        )
        
        # With modifier: Order = 6 > Size = 5, so Orderly triggers
        state = colony_state_calculator.calculate(colony_with_modifier)
        assert state["lore_state"]["order"] == "orderly"
        assert state["productivity"] == 7  # Base 5 + Orderly +2

    def test_pious_state_triggered_by_modifiers(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """Pious state should trigger when modifiers push Piety > Size."""
        
        # Base Piety = 5, Size = 5 (not Pious)
        colony = base_colony.model_copy(
            update={
                "base_piety": 5,
                "base_size": 5,
            }
        )
        
        # Without modifier: not Pious
        state = colony_state_calculator.calculate(colony)
        assert state["lore_state"]["piety"] == "stable"
        assert state["order"] == 5  # No +1 bonus
        assert state["complacency"] == 5  # No +1 bonus
        
        # Add +1 Piety modifier
        piety_modifier = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.PERMANENT,
            modifier_stat=ModifierStat.PIETY,
            modifier_value=1,
            description="Test piety bonus",
        )
        colony_with_modifier = colony.model_copy(
            update={"modifiers": colony.modifiers + [piety_modifier]}
        )
        
        # With modifier: Piety = 6 > Size = 5, so Pious triggers
        state = colony_state_calculator.calculate(colony_with_modifier)
        assert state["lore_state"]["piety"] == "pious"
        assert state["order"] == 6  # Base 5 + Pious +1
        assert state["complacency"] == 6  # Base 5 + Pious +1


    def test_orderly_adds_bonus_to_profit_factor(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """When Order > Size, should add +2 PF (Orderly)."""
        colony = base_colony.model_copy(update={"base_order": 6})
        state = colony_state_calculator.calculate(colony)
        # Base PF for size 5 is 6, +2 for Orderly = 8 (plus leadership if applicable)
        assert state["profit_factor"] >= 8
        assert state["lore_state"]["order"] == "orderly"

    def test_multiple_state_bonuses_stack(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """Multiple state bonuses should stack."""
        colony = base_colony.model_copy(
            update={
                "base_complacency": 6,  # Placated +1
                "base_order": 6,  # Orderly +2
                "base_productivity": 6,  # Productive +2
            }
        )
        state = colony_state_calculator.calculate(colony)
        # Base PF for size 5 is 6, +1+2+2 = 11 (plus leadership if applicable)
        assert state["profit_factor"] >= 11
        assert state["lore_state"]["complacency"] == "placated"
        assert state["lore_state"]["order"] == "orderly"
        assert state["lore_state"]["productivity"] == "productive"


class TestColonyStateCalculatorLoreState:
    """Tests for ColonyStateCalculator returning lore_state for all stats."""

    @pytest.fixture
    def base_colony(self) -> Colony:
        """Create a base colony for testing."""
        return Colony(
            id=1,
            name="Test Colony",
            owner="Test Owner",
            colony_type=ColonyType.RESEARCH_MISSION,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )

    def test_lore_state_includes_all_stats(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """lore_state should include all four stats, not just Complacency."""
        state = colony_state_calculator.calculate(base_colony)
        assert "lore_state" in state
        assert "complacency" in state["lore_state"]
        assert "order" in state["lore_state"]
        assert "productivity" in state["lore_state"]
        assert "piety" in state["lore_state"]
        assert "size" in state["lore_state"]

    def test_lore_state_reflects_actual_states(
        self, base_colony: Colony, colony_state_calculator
    ) -> None:
        """lore_state values should reflect actual stat conditions."""
        colony = base_colony.model_copy(
            update={
                "base_complacency": 6,  # Placated
                "base_order": 0,  # Anarchy
                "base_productivity": 0,  # Halted
                "base_piety": 6,  # Pious
            }
        )
        state = colony_state_calculator.calculate(colony)
        assert state["lore_state"]["complacency"] == "placated"
        assert state["lore_state"]["order"] == "anarchy"
        assert state["lore_state"]["productivity"] == "halted"
        assert state["lore_state"]["piety"] == "pious"

    def test_piety_pious_when_greater_than_size(self) -> None:
        """Piety > Size should return PIOUS."""
        result = resolve_lore_state(ModifierStat.PIETY, value=6, size=5)
        assert result == LoreState.PIOUS

    def test_piety_stable_when_between_zero_and_size(self) -> None:
        """Piety between 0 and Size should return STABLE."""
        result = resolve_lore_state(ModifierStat.PIETY, value=3, size=5)
        assert result == LoreState.STABLE