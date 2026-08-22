"""Tests for Event domain model validators and properties."""

import pytest

from pydantic import ValidationError

from colony_manager.domain.models.event import Event, EventModifier
from colony_manager.domain.enums import ModifierStat


class TestEventModifierValidators:
    """Tests for EventModifier field validators."""

    def test_description_min_length_1(self):
        """EventModifier description must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            EventModifier(stat=ModifierStat.ORDER, value=-5, description="")
        assert "description" in str(exc_info.value)

    def test_description_max_length_500(self):
        """EventModifier description must be at most 500 characters."""
        with pytest.raises(ValidationError) as exc_info:
            EventModifier(stat=ModifierStat.ORDER, value=-5, description="a" * 501)
        assert "description" in str(exc_info.value)

    def test_valid_event_modifier(self):
        """Valid EventModifier with all fields."""
        mod = EventModifier(stat=ModifierStat.ORDER, value=-5, description="Warp storm causes unrest")
        assert mod.stat == ModifierStat.ORDER
        assert mod.value == -5
        assert mod.description == "Warp storm causes unrest"

    def test_positive_modifier_value_allowed(self):
        """EventModifier can have positive values."""
        mod = EventModifier(stat=ModifierStat.PIETY, value=3, description="Religious festival")
        assert mod.value == 3

    def test_zero_modifier_value_allowed(self):
        """EventModifier can have zero value."""
        mod = EventModifier(stat=ModifierStat.COMPLACENCY, value=0, description="No effect")
        assert mod.value == 0


class TestEventValidators:
    """Tests for Event model field validators."""

    def test_colony_id_required(self):
        """colony_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            Event(name="Test Event", description="A test event", created_by=1)
        assert "colony_id" in str(exc_info.value)

    def test_created_by_required(self):
        """created_by is required."""
        with pytest.raises(ValidationError) as exc_info:
            Event(colony_id=1, name="Test Event", description="A test event")
        assert "created_by" in str(exc_info.value)

    def test_name_min_length_1(self):
        """Event name must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            Event(colony_id=1, name="", description="A test event", created_by=1)
        assert "name" in str(exc_info.value)

    def test_name_max_length_100(self):
        """Event name must be at most 100 characters."""
        with pytest.raises(ValidationError) as exc_info:
            Event(colony_id=1, name="a" * 101, description="A test event", created_by=1)
        assert "name" in str(exc_info.value)

    def test_description_min_length_1(self):
        """Event description must be at least 1 character."""
        with pytest.raises(ValidationError) as exc_info:
            Event(colony_id=1, name="Test", description="", created_by=1)
        assert "description" in str(exc_info.value)

    def test_description_max_length_2000(self):
        """Event description must be at most 2000 characters."""
        with pytest.raises(ValidationError) as exc_info:
            Event(colony_id=1, name="Test", description="a" * 2001, created_by=1)
        assert "description" in str(exc_info.value)


class TestEventDefaults:
    """Tests for Event default values."""

    def test_is_active_defaults_to_true(self):
        """Event is_active defaults to True."""
        event = Event(colony_id=1, name="Test Event", description="A test event", created_by=1)
        assert event.is_active is True

    def test_created_at_defaults_to_none(self):
        """created_at defaults to None."""
        event = Event(colony_id=1, name="Test Event", description="A test event", created_by=1)
        assert event.created_at is None

    def test_modifiers_defaults_to_empty_list(self):
        """modifiers defaults to empty list."""
        event = Event(colony_id=1, name="Test Event", description="A test event", created_by=1)
        assert event.modifiers == []

    def test_can_set_is_active_false(self):
        """is_active can be set to False (soft delete)."""
        event = Event(
            colony_id=1,
            name="Test Event",
            description="A test event",
            created_by=1,
            is_active=False,
        )
        assert event.is_active is False

    def test_can_set_modifiers(self):
        """modifiers can be set with EventModifier list."""
        event = Event(
            colony_id=1,
            name="Warp Storm",
            description="A warp storm disrupts communications",
            created_by=1,
            modifiers=[
                EventModifier(stat=ModifierStat.ORDER, value=-2, description="Communication blackout"),
                EventModifier(stat=ModifierStat.PRODUCTIVITY, value=-1, description="Supply delays"),
            ],
        )
        assert len(event.modifiers) == 2
        assert event.modifiers[0].stat == ModifierStat.ORDER
        assert event.modifiers[0].value == -2
