"""Tests for EventService - colony event management."""

from pathlib import Path

import pytest

from colony_manager.application.services.event_service import EventService
from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.event_repository_impl import (
    SqlAlchemyEventRepository,
)
from colony_manager.adapters.persistence.repositories.audit_log_repository_impl import (
    SqlAlchemyAuditLogRepository,
)
from colony_manager.domain.models.event import EventModifier
from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.errors import NotFoundError


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestEventServiceCreation:
    """Tests for event creation."""

    def test_create_event_success(self, tmp_path):
        """Test successfully creating an event."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = EventService(
            event_repository=event_repo,
            audit_log_repository=audit_repo,
        )

        event = service.create_event(
            colony_id=1,
            name="Warp Storm",
            description="A violent warp storm disrupts communications.",
            created_by=50,
        )

        assert event.id is not None
        assert event.colony_id == 1
        assert event.name == "Warp Storm"
        assert event.description == "A violent warp storm disrupts communications."
        assert event.created_by == 50
        assert event.is_active is True

    def test_create_event_with_modifiers(self, tmp_path):
        """Test creating event with stat modifiers."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        modifiers = [
            EventModifier(
                stat=ModifierStat.PRODUCTIVITY, value=-2, description="Storm disrupts production"
            ),
            EventModifier(stat=ModifierStat.ORDER, value=-1, description="Communication breakdown"),
        ]

        event = service.create_event(
            colony_id=1,
            name="Warp Storm",
            description="A violent warp storm.",
            created_by=50,
            modifiers=modifiers,
        )

        assert event.id is not None
        assert len(event.modifiers) == 2
        assert event.modifiers[0].stat == ModifierStat.PRODUCTIVITY
        assert event.modifiers[0].value == -2

    def test_create_event_empty_modifiers(self, tmp_path):
        """Test creating event with no modifiers."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        event = service.create_event(
            colony_id=1,
            name="Festival",
            description="A colony-wide celebration.",
            created_by=50,
            modifiers=[],
        )

        assert event.id is not None
        assert len(event.modifiers) == 0


class TestEventServiceQueries:
    """Tests for event queries."""

    def test_get_event_by_id(self, tmp_path):
        """Test retrieving event by ID."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        created = service.create_event(
            colony_id=1,
            name="Test Event",
            description="Test description.",
            created_by=50,
        )

        retrieved = service.get_event(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.name == "Test Event"

    def test_get_nonexistent_event(self, tmp_path):
        """Test retrieving non-existent event returns None."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        result = service.get_event(99999)

        assert result is None

    def test_get_events_by_colony(self, tmp_path):
        """Test getting all events for a colony."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        service.create_event(colony_id=1, name="Event 1", description="Desc 1", created_by=50)
        service.create_event(colony_id=1, name="Event 2", description="Desc 2", created_by=50)
        service.create_event(colony_id=2, name="Event 3", description="Desc 3", created_by=50)

        events = service.get_events_by_colony(colony_id=1)

        assert len(events) == 2
        assert all(e.colony_id == 1 for e in events)

    def test_get_events_by_colony_active_only(self, tmp_path):
        """Test getting only active events for a colony."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        service.create_event(colony_id=1, name="Active Event", description="Desc 1", created_by=50)
        inactive = service.create_event(
            colony_id=1, name="Inactive Event", description="Desc 2", created_by=50
        )
        service.update_event(inactive.id, is_active=False)

        active_events = service.get_events_by_colony(colony_id=1, active_only=True)

        assert len(active_events) == 1
        assert active_events[0].name == "Active Event"


class TestEventServiceUpdates:
    """Tests for event updates."""

    def test_update_event_name(self, tmp_path):
        """Test updating event name."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        event = service.create_event(
            colony_id=1,
            name="Old Name",
            description="Test description.",
            created_by=50,
        )

        updated = service.update_event(event.id, name="New Name", changed_by=50)

        assert updated.name == "New Name"
        assert updated.description == "Test description."

    def test_update_event_description(self, tmp_path):
        """Test updating event description."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        event = service.create_event(
            colony_id=1,
            name="Test Event",
            description="Old description.",
            created_by=50,
        )

        updated = service.update_event(event.id, description="New description.", changed_by=50)

        assert updated.description == "New description."

    def test_update_event_activation(self, tmp_path):
        """Test activating/deactivating event."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        event = service.create_event(
            colony_id=1,
            name="Test Event",
            description="Test.",
            created_by=50,
        )

        # Deactivate
        updated = service.update_event(event.id, is_active=False)
        assert updated.is_active is False

        # Reactivate
        updated = service.update_event(event.id, is_active=True)
        assert updated.is_active is True

    def test_update_nonexistent_event_raises(self, tmp_path):
        """Test updating non-existent event raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        with pytest.raises(NotFoundError, match="Event with ID 99999 not found"):
            service.update_event(99999, name="New Name", changed_by=50)


class TestEventServiceDeletion:
    """Tests for event deletion (soft delete)."""

    def test_delete_event_success(self, tmp_path):
        """Test soft deleting an event."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = EventService(
            event_repository=event_repo,
            audit_log_repository=audit_repo,
        )

        event = service.create_event(
            colony_id=1,
            name="To Delete",
            description="Will be deleted.",
            created_by=50,
        )

        service.delete_event(event.id, changed_by=50)

        # Event should be deactivated (soft delete)
        retrieved = service.get_event(event.id)
        assert retrieved is not None
        assert retrieved.is_active is False

    def test_delete_nonexistent_event_raises(self, tmp_path):
        """Test deleting non-existent event raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        with pytest.raises(NotFoundError, match="Event with ID 99999 not found"):
            service.delete_event(99999, changed_by=50)


class TestEventServiceAuditLogging:
    """Tests for audit logging in event operations."""

    def test_audit_log_created_on_create(self, tmp_path):
        """Test audit log entry created when creating event."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = EventService(
            event_repository=event_repo,
            audit_log_repository=audit_repo,
        )

        event = service.create_event(
            colony_id=1,
            name="Test Event",
            description="Test.",
            created_by=50,
        )

        logs = audit_repo.get_by_entity("event", event.id)
        assert len(logs) == 1
        assert logs[0].action.value == "create"
        assert logs[0].changed_by == 50

    def test_audit_log_created_on_update(self, tmp_path):
        """Test audit log entry created when updating event."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = EventService(
            event_repository=event_repo,
            audit_log_repository=audit_repo,
        )

        event = service.create_event(
            colony_id=1,
            name="Test Event",
            description="Test.",
            created_by=50,
        )
        service.update_event(event.id, name="Updated", changed_by=60)

        logs = audit_repo.get_by_entity("event", event.id)
        assert len(logs) == 2  # CREATE + UPDATE
        update_log = [log for log in logs if log.action.value == "update"][0]
        assert update_log.changed_by == 60

    def test_service_without_audit_repo(self, tmp_path):
        """Test service works without audit log repository."""
        db_url = _create_db_url(tmp_path)
        event_repo = SqlAlchemyEventRepository(db_url)
        service = EventService(event_repository=event_repo)

        # Should not raise even without audit repo
        event = service.create_event(
            colony_id=1,
            name="Test Event",
            description="Test.",
            created_by=50,
        )
        service.update_event(event.id, name="Updated", changed_by=50)
        service.delete_event(event.id, changed_by=50)

        assert event.id is not None
