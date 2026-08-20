"""Tests for ColonyStateCalculator with modifier expiry."""

from datetime import date, timedelta

import pytest

from colony_manager.adapters.config.loader import FileRuleConfigProvider
from colony_manager.domain.enums import ColonyType, ModifierSourceType, ModifierStat
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.application.services.colony_state_calculator import ColonyStateCalculator


@pytest.fixture
def config_provider():
    """Create a rule config provider for testing."""
    return FileRuleConfigProvider()


@pytest.fixture
def state_calculator(config_provider):
    """Create a state calculator for testing."""
    return ColonyStateCalculator(config_provider)


class TestColonyStateCalculatorWithExpiry:
    """Tests for modifier expiry in state calculation."""

    def test_expired_modifiers_excluded_from_calculation(self, state_calculator):
        """Expired modifiers should not affect calculated stats."""
        colony = Colony(
            name="Test Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING,
            age_days=100,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        
        permanent_mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=5,
            description="Permanent bonus",
            expires_at=None,
        )
        
        expired_mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=10,
            description="Expired bonus",
            expires_at=date.today() - timedelta(days=10),
        )
        
        colony.modifiers = [permanent_mod, expired_mod]
        state = state_calculator.calculate(colony)
        assert state["productivity"] == 15

    def test_active_modifiers_included_in_calculation(self, state_calculator):
        """Non-expired modifiers should affect calculated stats."""
        colony = Colony(
            name="Test Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING,
            age_days=100,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        
        future_mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=10,
            description="Future bonus",
            expires_at=date.today() + timedelta(days=30),
        )
        
        colony.modifiers = [future_mod]
        state = state_calculator.calculate(colony)
        assert state["productivity"] == 20

    def test_calculate_with_as_of_date(self, state_calculator):
        """State calculation respects as_of date for expiry."""
        colony = Colony(
            name="Test Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING,
            age_days=100,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        
        expiry_date = date(2025, 7, 1)
        mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=10,
            description="Temporary bonus",
            expires_at=expiry_date,
        )
        
        colony.modifiers = [mod]
        state_before = state_calculator.calculate(colony, as_of=date(2025, 6, 15))
        assert state_before["productivity"] == 20
        
        state_after = state_calculator.calculate(colony, as_of=date(2025, 7, 15))
        assert state_after["productivity"] == 10

    def test_inactive_modifiers_excluded_regardless_of_expiry(self, state_calculator):
        """Inactive modifiers are excluded even if not expired."""
        colony = Colony(
            name="Test Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING,
            age_days=100,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        
        inactive_mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=10,
            description="Disabled bonus",
            is_active=False,
            expires_at=None,
        )
        
        colony.modifiers = [inactive_mod]
        state = state_calculator.calculate(colony)
        assert state["productivity"] == 10
