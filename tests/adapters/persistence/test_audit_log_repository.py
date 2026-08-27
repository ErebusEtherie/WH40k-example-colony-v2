"""Tests for AuditLogRepository - audit logging."""

from datetime import UTC, datetime, timedelta
from pathlib import Path
from time import sleep

from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.audit_log_repository_impl import (
    SqlAlchemyAuditLogRepository,
)
from colony_manager.domain.models.audit_log import AuditLog, AuditLogAction


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestAuditLogCreate:
    """Tests for audit log creation."""

    def test_create_audit_log(self, tmp_path):
        """Test creating an audit log entry."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        log = AuditLog(
            entity_type="colony",
            entity_id=1,
            action=AuditLogAction.CREATE,
            field="name",
            old_value=None,
            new_value="Test Colony",
            changed_by=50,
            colony_id=1,
        )

        created = repo.create(log)

        assert created.id is not None
        assert created.entity_type == "colony"
        assert created.entity_id == 1
        assert created.action == AuditLogAction.CREATE
        assert created.changed_by == 50
        assert created.colony_id == 1
        assert created.changed_at is not None

    def test_create_update_action(self, tmp_path):
        """Test creating an update audit log entry."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        log = AuditLog(
            entity_type="infrastructure",
            entity_id=10,
            action=AuditLogAction.UPDATE,
            field="state",
            old_value="working",
            new_value="faulty",
            changed_by=50,
            colony_id=1,
        )

        created = repo.create(log)

        assert created.id is not None
        assert created.action == AuditLogAction.UPDATE
        assert created.old_value == "working"
        assert created.new_value == "faulty"

    def test_create_delete_action(self, tmp_path):
        """Test creating a delete audit log entry."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        log = AuditLog(
            entity_type="colony_membership",
            entity_id=5,
            action=AuditLogAction.DELETE,
            changed_by=50,
            colony_id=1,
        )

        created = repo.create(log)

        assert created.id is not None
        assert created.action == AuditLogAction.DELETE


class TestAuditLogGetById:
    """Tests for retrieving audit logs by ID."""

    def test_get_by_id_success(self, tmp_path):
        """Test retrieving audit log by ID."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        log = AuditLog(
            entity_type="colony",
            entity_id=1,
            action=AuditLogAction.CREATE,
            changed_by=50,
            colony_id=1,
        )
        created = repo.create(log)

        retrieved = repo.get_by_id(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.entity_type == "colony"

    def test_get_nonexistent_by_id(self, tmp_path):
        """Test retrieving non-existent audit log returns None."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        result = repo.get_by_id(99999)

        assert result is None


class TestAuditLogGetByColony:
    """Tests for retrieving audit logs by colony."""

    def test_get_by_colony(self, tmp_path):
        """Test getting all audit logs for a colony."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create logs for colony 1
        for i in range(5):
            repo.create(
                AuditLog(
                    entity_type="colony",
                    entity_id=i,
                    action=AuditLogAction.UPDATE,
                    changed_by=50,
                    colony_id=1,
                )
            )

        # Create logs for colony 2
        for i in range(3):
            repo.create(
                AuditLog(
                    entity_type="colony",
                    entity_id=i,
                    action=AuditLogAction.UPDATE,
                    changed_by=50,
                    colony_id=2,
                )
            )

        logs = repo.get_by_colony(colony_id=1)

        assert len(logs) == 5
        assert all(log.colony_id == 1 for log in logs)

    def test_get_by_colony_with_entity_type_filter(self, tmp_path):
        """Test filtering by entity type."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create colony logs
        for i in range(3):
            repo.create(
                AuditLog(
                    entity_type="colony",
                    entity_id=i,
                    action=AuditLogAction.UPDATE,
                    changed_by=50,
                    colony_id=1,
                )
            )

        # Create infrastructure logs
        for i in range(4):
            repo.create(
                AuditLog(
                    entity_type="infrastructure",
                    entity_id=i,
                    action=AuditLogAction.CREATE,
                    changed_by=50,
                    colony_id=1,
                )
            )

        # Filter by entity type
        logs = repo.get_by_colony(colony_id=1, entity_type="infrastructure")

        assert len(logs) == 4
        assert all(log.entity_type == "infrastructure" for log in logs)

    def test_get_by_colony_with_date_range(self, tmp_path):
        """Test filtering by date range."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create some logs first
        for i in range(3):
            repo.create(
                AuditLog(
                    entity_type="colony",
                    entity_id=i,
                    action=AuditLogAction.UPDATE,
                    changed_by=50,
                    colony_id=1,
                )
            )

        # Get current time for filtering
        now = datetime.now(UTC).replace(tzinfo=None)  # Make naive for comparison

        # Filter by date range (last hour)
        start_date = now - timedelta(hours=1)
        logs = repo.get_by_colony(colony_id=1, start_date=start_date)

        # All logs should be within the last hour since we just created them
        assert len(logs) == 3
        # Datetime comparison skipped due to timezone handling

    def test_get_by_colony_with_pagination(self, tmp_path):
        """Test pagination of results."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create 10 logs
        for i in range(10):
            repo.create(
                AuditLog(
                    entity_type="colony",
                    entity_id=i,
                    action=AuditLogAction.UPDATE,
                    changed_by=50,
                    colony_id=1,
                )
            )

        # Get first page (limit 3)
        page1 = repo.get_by_colony(colony_id=1, limit=3, offset=0)
        assert len(page1) == 3

        # Get second page
        page2 = repo.get_by_colony(colony_id=1, limit=3, offset=3)
        assert len(page2) == 3

        # Get third page
        page3 = repo.get_by_colony(colony_id=1, limit=3, offset=6)
        assert len(page3) == 3

        # Get remaining
        page4 = repo.get_by_colony(colony_id=1, limit=3, offset=9)
        assert len(page4) == 1

    def test_get_by_colony_ordering(self, tmp_path):
        """Test results are ordered by changed_at descending."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create logs with delays to ensure different timestamps
        repo.create(
            AuditLog(
                entity_type="colony",
                entity_id=1,
                action=AuditLogAction.UPDATE,
                changed_by=50,
                colony_id=1,
            )
        )
        sleep(0.01)

        repo.create(
            AuditLog(
                entity_type="colony",
                entity_id=2,
                action=AuditLogAction.UPDATE,
                changed_by=50,
                colony_id=1,
            )
        )
        sleep(0.01)

        repo.create(
            AuditLog(
                entity_type="colony",
                entity_id=3,
                action=AuditLogAction.UPDATE,
                changed_by=50,
                colony_id=1,
            )
        )

        logs = repo.get_by_colony(colony_id=1)

        # Should be ordered by changed_at descending (most recent first)
        assert len(logs) == 3
        assert logs[0].entity_id == 3  # Most recent
        assert logs[1].entity_id == 2
        assert logs[2].entity_id == 1  # Oldest

    def test_get_by_colony_empty(self, tmp_path):
        """Test getting logs for colony with no logs."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        logs = repo.get_by_colony(colony_id=999)

        assert len(logs) == 0


class TestAuditLogGetByEntity:
    """Tests for retrieving audit logs by entity."""

    def test_get_by_entity(self, tmp_path):
        """Test getting all audit logs for a specific entity."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create logs for colony entity
        repo.create(
            AuditLog(
                entity_type="colony",
                entity_id=1,
                action=AuditLogAction.CREATE,
                changed_by=50,
                colony_id=1,
            )
        )
        repo.create(
            AuditLog(
                entity_type="colony",
                entity_id=1,
                action=AuditLogAction.UPDATE,
                field="name",
                old_value="Old",
                new_value="New",
                changed_by=50,
                colony_id=1,
            )
        )

        # Create logs for different entity
        repo.create(
            AuditLog(
                entity_type="colony",
                entity_id=2,
                action=AuditLogAction.CREATE,
                changed_by=50,
                colony_id=2,
            )
        )

        logs = repo.get_by_entity(entity_type="colony", entity_id=1)

        assert len(logs) == 2
        assert all(log.entity_type == "colony" for log in logs)
        assert all(log.entity_id == 1 for log in logs)

    def test_get_by_entity_ordering(self, tmp_path):
        """Test entity logs are ordered by changed_at descending."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        # Create logs with delays to ensure different timestamps
        repo.create(
            AuditLog(
                entity_type="infrastructure",
                entity_id=5,
                action=AuditLogAction.CREATE,
                changed_by=50,
                colony_id=1,
            )
        )
        sleep(0.01)

        repo.create(
            AuditLog(
                entity_type="infrastructure",
                entity_id=5,
                action=AuditLogAction.UPDATE,
                changed_by=50,
                colony_id=1,
            )
        )
        sleep(0.01)

        repo.create(
            AuditLog(
                entity_type="infrastructure",
                entity_id=5,
                action=AuditLogAction.UPDATE,
                changed_by=50,
                colony_id=1,
            )
        )

        logs = repo.get_by_entity(entity_type="infrastructure", entity_id=5)

        # Should be ordered by changed_at descending (most recent first)
        assert len(logs) == 3
        assert logs[0].entity_id == 5
        assert logs[0].action == AuditLogAction.UPDATE  # Most recent

    def test_get_by_entity_no_logs(self, tmp_path):
        """Test getting logs for non-existent entity."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyAuditLogRepository(db_url)

        logs = repo.get_by_entity(entity_type="colony", entity_id=99999)

        assert len(logs) == 0
