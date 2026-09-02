"""Tests for EventRepository - event persistence."""

from pathlib import Path

import pytest

from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.event_repository_impl import (
    SqlAlchemyEventRepository,
)
from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.event import Event, EventModifier


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestEventCreate:
    """Tests for event creation."""

    def test_create_event(self, tmp_path):
        """Test creating a new event."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        event = Event(
            colony_id=1,
            name="Resource Shortage",
            description="Food supplies running low",
            created_by=50,
            is_active=True,
        )

        created = repo.create(event)

        assert created.id is not None
        assert created.colony_id == 1
        assert created.name == "Resource Shortage"
        assert created.description == "Food supplies running low"
        assert created.is_active is True
        assert created.created_at is not None

    def test_create_inactive_event(self, tmp_path):
        """Test creating an inactive event."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        event = Event(
            colony_id=1,
            name="Resolved Crisis",
            description="Crisis has been resolved",
            created_by=50,
            is_active=False,
        )

        created = repo.create(event)

        assert created.id is not None
        assert created.is_active is False

    def test_create_event_with_modifiers(self, tmp_path):
        """Test creating event with modifiers."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        event = Event(
            colony_id=1,
            name="Warp Storm",
            description="Warp storm disrupting trade",
            created_by=50,
            modifiers=[
                EventModifier(
                    stat=ModifierStat.PRODUCTIVITY, value=-2, description="Trade disrupted"
                ),
                EventModifier(
                    stat=ModifierStat.ORDER, value=-1, description="Communication issues"
                ),
            ],
        )

        created = repo.create(event)

        assert created.id is not None
        assert len(created.modifiers) == 2


class TestEventGetById:
    """Tests for retrieving event by ID."""

    def test_get_by_id_success(self, tmp_path):
        """Test retrieving event by ID."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        created = repo.create(
            Event(
                colony_id=1,
                name="Test Event",
                description="Test description",
                created_by=50,
                is_active=True,
            )
        )

        retrieved = repo.get_by_id(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.name == "Test Event"

    def test_get_by_id_not_found(self, tmp_path):
        """Test retrieving non-existent event returns None."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        result = repo.get_by_id(99999)

        assert result is None


class TestEventGetByColony:
    """Tests for retrieving events by colony."""

    def test_get_by_colony_all_events(self, tmp_path):
        """Test getting all events for a colony."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        repo.create(
            Event(colony_id=1, name="Event 1", description="Desc 1", created_by=50, is_active=True)
        )
        repo.create(
            Event(colony_id=1, name="Event 2", description="Desc 2", created_by=50, is_active=True)
        )
        repo.create(
            Event(colony_id=1, name="Event 3", description="Desc 3", created_by=50, is_active=False)
        )

        # Create event for different colony
        repo.create(
            Event(
                colony_id=2, name="Other Event", description="Other", created_by=50, is_active=True
            )
        )

        events = repo.get_by_colony(colony_id=1)

        assert len(events) == 3
        assert all(e.colony_id == 1 for e in events)

    def test_get_by_colony_active_only(self, tmp_path):
        """Test getting only active events for a colony."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        repo.create(
            Event(colony_id=1, name="Active 1", description="Active", created_by=50, is_active=True)
        )
        repo.create(
            Event(colony_id=1, name="Active 2", description="Active", created_by=50, is_active=True)
        )
        repo.create(
            Event(
                colony_id=1,
                name="Inactive 1",
                description="Inactive",
                created_by=50,
                is_active=False,
            )
        )
        repo.create(
            Event(
                colony_id=1,
                name="Inactive 2",
                description="Inactive",
                created_by=50,
                is_active=False,
            )
        )

        events = repo.get_by_colony(colony_id=1, active_only=True)

        assert len(events) == 2
        assert all(e.is_active is True for e in events)

    def test_get_by_colony_empty(self, tmp_path):
        """Test getting events for colony with none."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        events = repo.get_by_colony(colony_id=999)

        assert len(events) == 0

    def test_get_by_colony_active_only_empty(self, tmp_path):
        """Test getting active events when none are active."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        repo.create(
            Event(
                colony_id=1, name="Inactive", description="Inactive", created_by=50, is_active=False
            )
        )

        events = repo.get_by_colony(colony_id=1, active_only=True)

        assert len(events) == 0


class TestEventUpdate:
    """Tests for updating events."""

    def test_update_name(self, tmp_path):
        """Test updating event name."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        created = repo.create(
            Event(
                colony_id=1,
                name="Old Name",
                description="Description",
                created_by=50,
                is_active=True,
            )
        )

        created.name = "New Name"
        updated = repo.update(created)

        assert updated.name == "New Name"

    def test_update_description(self, tmp_path):
        """Test updating event description."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        created = repo.create(
            Event(
                colony_id=1,
                name="Event",
                description="Old description",
                created_by=50,
                is_active=True,
            )
        )

        created.description = "New description"
        updated = repo.update(created)

        assert updated.description == "New description"

    def test_update_is_active(self, tmp_path):
        """Test updating event active status."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        created = repo.create(
            Event(
                colony_id=1,
                name="Event",
                description="Description",
                created_by=50,
                is_active=True,
            )
        )

        created.is_active = False
        updated = repo.update(created)

        assert updated.is_active is False

    def test_update_nonexistent_raises(self, tmp_path):
        """Test updating non-existent event raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        event = Event(
            id=99999,
            colony_id=1,
            name="Test",
            description="Test",
            created_by=50,
            is_active=True,
        )

        with pytest.raises(NotFoundError, match="not found"):
            repo.update(event)

    def test_update_without_id_raises(self, tmp_path):
        """Test updating without ID raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        event = Event(
            colony_id=1,
            name="Test",
            description="Test",
            created_by=50,
            is_active=True,
        )

        with pytest.raises(NotFoundError, match="ID is required"):
            repo.update(event)


class TestEventDelete:
    """Tests for deleting events (soft delete)."""

    def test_delete_success(self, tmp_path):
        """Test soft deleting an event."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        created = repo.create(
            Event(
                colony_id=1,
                name="To Delete",
                description="Will be deleted",
                created_by=50,
                is_active=True,
            )
        )

        repo.delete(created.id)

        # Verify soft delete - event still exists but is inactive
        retrieved = repo.get_by_id(created.id)
        assert retrieved is not None
        assert retrieved.is_active is False

        # Should not appear in active-only queries
        active = repo.get_by_colony(colony_id=1, active_only=True)
        assert len(active) == 0

    def test_delete_already_inactive(self, tmp_path):
        """Test soft deleting already inactive event."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        created = repo.create(
            Event(
                colony_id=1,
                name="Already Inactive",
                description="Inactive",
                created_by=50,
                is_active=False,
            )
        )

        repo.delete(created.id)

        retrieved = repo.get_by_id(created.id)
        assert retrieved is not None
        assert retrieved.is_active is False

    def test_delete_nonexistent_raises(self, tmp_path):
        """Test deleting non-existent event raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyEventRepository(db_url)

        with pytest.raises(NotFoundError, match="not found"):
            repo.delete(99999)
