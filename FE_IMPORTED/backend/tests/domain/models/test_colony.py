"""Tests for Colony domain model validators and properties."""

import pytest
from datetime import date

from pydantic import ValidationError

from colony_manager.domain.models.colony import Colony
from colony_manager.domain.enums import ColonyType, DynastyOutcome, ResourceType


class TestColonyValidators:
    """Tests for Colony model field validators."""

    def test_age_days_cannot_be_negative(self):
        """age_days validator rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            Colony(
                name="Test Colony",
                owner="Test Owner",
                colony_type=ColonyType.MINING_AND_INDUSTRY,
                age_days=-1,
                age_last_updated=date.today(),
                base_complacency=5,
                base_order=5,
                base_productivity=5,
                base_piety=5,
                base_size=5,
            )
        assert "age_days" in str(exc_info.value)
        assert "greater than" in str(exc_info.value).lower()

    def test_age_days_zero_is_valid(self):
        """age_days accepts zero (newly founded colony)."""
        colony = Colony(
            name="New Colony",
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
        assert colony.age_days == 0

    def test_age_days_positive_is_valid(self):
        """age_days accepts positive values."""
        colony = Colony(
            name="Old Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=365,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        assert colony.age_days == 365

    def test_base_complacency_cannot_be_negative(self):
        """base_complacency validator rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            Colony(
                name="Test Colony",
                owner="Test Owner",
                colony_type=ColonyType.MINING_AND_INDUSTRY,
                age_days=0,
                age_last_updated=date.today(),
                base_complacency=-1,
                base_order=5,
                base_productivity=5,
                base_piety=5,
                base_size=5,
            )
        assert "base_complacency" in str(exc_info.value)

    def test_base_order_cannot_be_negative(self):
        """base_order validator rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            Colony(
                name="Test Colony",
                owner="Test Owner",
                colony_type=ColonyType.MINING_AND_INDUSTRY,
                age_days=0,
                age_last_updated=date.today(),
                base_complacency=5,
                base_order=-1,
                base_productivity=5,
                base_piety=5,
                base_size=5,
            )
        assert "base_order" in str(exc_info.value)

    def test_base_productivity_cannot_be_negative(self):
        """base_productivity validator rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            Colony(
                name="Test Colony",
                owner="Test Owner",
                colony_type=ColonyType.MINING_AND_INDUSTRY,
                age_days=0,
                age_last_updated=date.today(),
                base_complacency=5,
                base_order=5,
                base_productivity=-1,
                base_piety=5,
                base_size=5,
            )
        assert "base_productivity" in str(exc_info.value)

    def test_base_piety_cannot_be_negative(self):
        """base_piety validator rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            Colony(
                name="Test Colony",
                owner="Test Owner",
                colony_type=ColonyType.MINING_AND_INDUSTRY,
                age_days=0,
                age_last_updated=date.today(),
                base_complacency=5,
                base_order=5,
                base_productivity=5,
                base_piety=-1,
                base_size=5,
            )
        assert "base_piety" in str(exc_info.value)

    def test_base_size_cannot_be_negative(self):
        """base_size validator rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            Colony(
                name="Test Colony",
                owner="Test Owner",
                colony_type=ColonyType.MINING_AND_INDUSTRY,
                age_days=0,
                age_last_updated=date.today(),
                base_complacency=5,
                base_order=5,
                base_productivity=5,
                base_piety=5,
                base_size=-1,
            )
        assert "base_size" in str(exc_info.value)

    def test_base_stats_zero_is_valid(self):
        """Base stats accept zero (critical state)."""
        colony = Colony(
            name="Critical Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=0,
            base_order=0,
            base_productivity=0,
            base_piety=0,
            base_size=0,
        )
        assert colony.base_complacency == 0
        assert colony.base_order == 0
        assert colony.base_productivity == 0
        assert colony.base_piety == 0
        assert colony.base_size == 0

    def test_base_stats_positive_is_valid(self):
        """Base stats accept positive values."""
        colony = Colony(
            name="Thriving Colony",
            owner="Test Owner",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=10,
        )
        assert colony.base_complacency == 10
        assert colony.base_order == 10
        assert colony.base_productivity == 10
        assert colony.base_piety == 10
        assert colony.base_size == 10


class TestColonyLockFlags:
    """Tests for Colony lock flag interactions."""

    def test_default_lock_flags_are_false(self):
        """Lock flags default to False."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        assert colony.complacency_locked is False
        assert colony.order_locked is False
        assert colony.productivity_locked is False

    def test_lock_flags_can_be_set_true(self):
        """Lock flags can be explicitly set to True."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
            complacency_locked=True,
            order_locked=True,
            productivity_locked=True,
        )
        assert colony.complacency_locked is True
        assert colony.order_locked is True
        assert colony.productivity_locked is True


class TestColonyCollections:
    """Tests for Colony collection fields."""

    def test_default_empty_collections(self):
        """Collection fields default to empty lists."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        assert colony.infrastructure == []
        assert colony.support_upgrades == []
        assert colony.planetary_resources == []
        assert colony.modifiers == []

    def test_planetary_resources_accepts_valid_enums(self):
        """planetary_resources accepts valid ResourceType enums."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
            planetary_resources=[ResourceType.MINERAL, ResourceType.ARCHEOTECH_CACHE],
        )
        assert ResourceType.MINERAL in colony.planetary_resources
        assert ResourceType.ARCHEOTECH_CACHE in colony.planetary_resources

    def test_dynasty_outcome_accepts_valid_enum(self):
        """dynasty_outcome accepts valid DynastyOutcome enums."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
            dynasty_outcome=DynastyOutcome.THRILLING_HEROICS,
        )
        assert colony.dynasty_outcome == DynastyOutcome.THRILLING_HEROICS

    def test_dynasty_outcome_can_be_none(self):
        """dynasty_outcome can be None for non-Dynasty representatives."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
            dynasty_outcome=None,
        )
        assert colony.dynasty_outcome is None


class TestColonyGetCycleInfo:
    """Tests for Colony.get_cycle_info method."""

    def test_days_since_and_until_event_roll(self):
        """get_cycle_info correctly calculates event roll timing."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=45,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        info = colony.get_cycle_info(event_interval=60, development_interval=90)
        assert info["days_since_event_roll"] == 45
        assert info["days_until_event_roll"] == 15

    def test_days_since_and_until_development_roll(self):
        """get_cycle_info correctly calculates development roll timing."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=100,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        info = colony.get_cycle_info(event_interval=60, development_interval=90)
        assert info["days_since_development_roll"] == 10
        assert info["days_until_development_roll"] == 80

    def test_exact_multiple_returns_zero_for_both(self):
        """When age is exact multiple, both since and until are 0."""
        colony = Colony(
            name="Test",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=180,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        info = colony.get_cycle_info(event_interval=60, development_interval=90)
        assert info["days_since_event_roll"] == 0
        assert info["days_until_event_roll"] == 0
        assert info["days_since_development_roll"] == 0
        assert info["days_until_development_roll"] == 0

    def test_new_colony_zero_age(self):
        """New colony (age 0) shows 0 days since, full interval until."""
        colony = Colony(
            name="New",
            owner="Test",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=0,
            age_last_updated=date.today(),
            base_complacency=5,
            base_order=5,
            base_productivity=5,
            base_piety=5,
            base_size=5,
        )
        info = colony.get_cycle_info(event_interval=60, development_interval=90)
        assert info["days_since_event_roll"] == 0
        assert info["days_until_event_roll"] == 0
        assert info["days_since_development_roll"] == 0
        assert info["days_until_development_roll"] == 0
