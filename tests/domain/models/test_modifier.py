"""Tests for the Modifier domain model."""

from datetime import date, timedelta

from colony_manager.domain.enums import ModifierCategory, ModifierSourceType, ModifierStat
from colony_manager.domain.models.modifier import Modifier


class TestModifierExpiry:
    """Tests for modifier expiry functionality."""

    def test_modifier_without_expiry_is_not_expired(self):
        """Modifier with no expires_at is never expired."""
        mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=2,
            description="Test modifier",
        )
        assert mod.expires_at is None
        assert mod.is_expired() is False
        # Check with arbitrary date
        assert mod.is_expired(date(2000, 1, 1)) is False

    def test_modifier_with_future_expiry_is_not_expired(self):
        """Modifier with future expires_at is not expired."""
        future_date = date.today() + timedelta(days=30)
        mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=2,
            description="Test modifier",
            expires_at=future_date,
        )
        assert mod.is_expired() is False

    def test_modifier_with_past_expiry_is_expired(self):
        """Modifier with past expires_at is expired."""
        past_date = date.today() - timedelta(days=30)
        mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=2,
            description="Test modifier",
            expires_at=past_date,
        )
        assert mod.is_expired() is True

    def test_modifier_expires_on_date_boundary(self):
        """Modifier expires the day AFTER expires_at (not on the date itself)."""
        today = date.today()
        mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=2,
            description="Test modifier",
            expires_at=today,
        )
        # On the expiry date itself, not yet expired
        assert mod.is_expired(today) is False
        # One day later, expired
        assert mod.is_expired(today + timedelta(days=1)) is True

    def test_is_expired_with_custom_date(self):
        """is_expired accepts custom date for testing."""
        reference_date = date(2025, 6, 15)
        expires_on = date(2025, 6, 20)
        
        mod = Modifier(
            colony_id=1,
            modifier_source_type=ModifierSourceType.GM_CUSTOM,
            modifier_category=ModifierCategory.CUSTOM,
            modifier_stat=ModifierStat.PRODUCTIVITY,
            modifier_value=2,
            description="Test modifier",
            expires_at=expires_on,
        )
        
        # Before expiry: not expired
        assert mod.is_expired(date(2025, 6, 10)) is False
        # On expiry date: not expired
        assert mod.is_expired(expires_on) is False
        # After expiry: expired
        assert mod.is_expired(date(2025, 6, 25)) is True