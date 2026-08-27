"""Tests for DevelopmentPlanService - colony development plan management."""

from pathlib import Path

import pytest

from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.audit_log_repository_impl import (
    SqlAlchemyAuditLogRepository,
)
from colony_manager.adapters.persistence.repositories.development_plan_repository_impl import (
    SqlAlchemyDevelopmentPlanRepository,
)
from colony_manager.application.services.development_plan_service import DevelopmentPlanService
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.development_plan import DevelopmentPlanStatus


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestDevelopmentPlanServiceCreation:
    """Tests for development plan creation."""

    def test_create_plan_success(self, tmp_path):
        """Test successfully creating a development plan."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = DevelopmentPlanService(
            plan_repository=plan_repo,
            audit_log_repository=audit_repo,
        )

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Space Port",
            priority=3,
            description="Build a space port for trade.",
            target_type="Gather resources and hire engineers.",
            created_by=50,
        )

        assert plan.id is not None
        assert plan.colony_id == 1
        assert plan.upgrade_type == "infrastructure"
        assert plan.target_name == "Space Port"
        assert plan.priority == 3
        assert plan.description == "Build a space port for trade."
        # acquisition_plan renamed to target_type
        assert plan.created_by == 50
        assert plan.status == DevelopmentPlanStatus.PLANNED
        # progress field removed

    def test_create_plan_support_upgrade(self, tmp_path):
        """Test creating a support upgrade plan."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="support_upgrade",
            target_name="Security Detail",
            priority=5,
            description="Add security personnel.",
            target_type="Recruit from local population.",
            created_by=50,
        )

        assert plan.id is not None
        assert plan.upgrade_type == "support_upgrade"
        assert plan.target_name == "Security Detail"

    def test_create_plan_priority_validation(self, tmp_path):
        """Test plan creation with priority in valid range."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        # Priority 1 (lowest)
        plan1 = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Low Priority",
            priority=1,
            description="Test",
            target_type="Test",
            created_by=50,
        )
        assert plan1.priority == 1

        # Priority 5 (highest)
        plan5 = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="High Priority",
            priority=5,
            description="Test",
            target_type="Test",
            created_by=50,
        )
        assert plan5.priority == 5


class TestDevelopmentPlanServiceQueries:
    """Tests for development plan queries."""

    def test_get_plan_by_id(self, tmp_path):
        """Test retrieving plan by ID."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        created = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test Plan",
            priority=3,
            description="Test description.",
            target_type="Test plan.",
            created_by=50,
        )

        retrieved = service.get_plan(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.target_name == "Test Plan"

    def test_get_nonexistent_plan(self, tmp_path):
        """Test retrieving non-existent plan returns None."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        result = service.get_plan(99999)

        assert result is None

    def test_get_plans_by_colony(self, tmp_path):
        """Test getting all plans for a colony."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Plan 1",
            priority=1,
            description="Desc 1",
            target_type="Plan 1",
            created_by=50,
        )
        service.create_plan(
            colony_id=1,
            upgrade_type="support_upgrade",
            target_name="Plan 2",
            priority=2,
            description="Desc 2",
            target_type="Plan 2",
            created_by=50,
        )
        service.create_plan(
            colony_id=2,
            upgrade_type="infrastructure",
            target_name="Plan 3",
            priority=3,
            description="Desc 3",
            target_type="Plan 3",
            created_by=50,
        )

        plans = service.get_plans_by_colony(colony_id=1)

        assert len(plans) == 2
        assert all(p.colony_id == 1 for p in plans)


class TestDevelopmentPlanServiceUpdates:
    """Tests for development plan updates."""

    def test_update_plan_priority(self, tmp_path):
        """Test updating plan priority."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test Plan",
            priority=2,
            description="Test.",
            target_type="Test.",
            created_by=50,
        )

        updated = service.update_plan(plan.id, priority=5, changed_by=50)

        assert updated.priority == 5
        assert updated.target_name == "Test Plan"

    def test_update_plan_status_to_delivered(self, tmp_path):
        """Test that status can be updated to DELIVERED following valid transitions."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test Plan",
            priority=3,
            description="Test.",
            target_type="Test.",
            created_by=50,
        )

        # Transition: PLANNED -> IN_PROGRESS -> ACQUIRED -> DELIVERED
        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.IN_PROGRESS,
            changed_by=50,
        )
        assert updated.status == DevelopmentPlanStatus.IN_PROGRESS

        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.ACQUIRED,
            changed_by=50,
        )
        assert updated.status == DevelopmentPlanStatus.ACQUIRED

        updated = service.update_plan(
            plan.id,
            status=DevelopmentPlanStatus.DELIVERED,
            changed_by=50,
        )
        assert updated.status == DevelopmentPlanStatus.DELIVERED

    def test_update_plan_multiple_fields(self, tmp_path):
        """Test updating multiple fields at once."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Old Name",
            priority=2,
            description="Old description.",
            target_type="Old plan.",
            created_by=50,
        )

        updated = service.update_plan(
            plan.id,
            target_name="New Name",
            priority=5,
            description="New description.",
            changed_by=50,
        )

        assert updated.target_name == "New Name"
        assert updated.priority == 5
        assert updated.description == "New description."

    def test_update_nonexistent_plan_raises(self, tmp_path):
        """Test updating non-existent plan raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        with pytest.raises(NotFoundError, match="Development plan with ID 99999 not found"):
            service.update_plan(99999, priority=5, changed_by=50)


class TestDevelopmentPlanServiceDeletion:
    """Tests for development plan deletion."""

    def test_delete_plan_success(self, tmp_path):
        """Test deleting a development plan."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = DevelopmentPlanService(
            plan_repository=plan_repo,
            audit_log_repository=audit_repo,
        )

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="To Delete",
            priority=3,
            description="Will be deleted.",
            target_type="Delete me.",
            created_by=50,
        )

        service.delete_plan(plan.id, changed_by=50)

        # Plan should be deleted
        assert service.get_plan(plan.id) is None

    def test_delete_nonexistent_plan_raises(self, tmp_path):
        """Test deleting non-existent plan raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        with pytest.raises(NotFoundError, match="Development plan with ID 99999 not found"):
            service.delete_plan(99999, changed_by=50)


class TestDevelopmentPlanServiceAuditLogging:
    """Tests for audit logging in plan operations."""

    def test_audit_log_created_on_create(self, tmp_path):
        """Test audit log entry created when creating plan."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = DevelopmentPlanService(
            plan_repository=plan_repo,
            audit_log_repository=audit_repo,
        )

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test Plan",
            priority=3,
            description="Test.",
            target_type="Test.",
            created_by=50,
        )

        logs = audit_repo.get_by_entity("development_plan", plan.id)
        assert len(logs) == 1
        assert logs[0].action.value == "create"
        assert logs[0].changed_by == 50

    def test_audit_log_created_on_update(self, tmp_path):
        """Test audit log entry created when updating plan."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = DevelopmentPlanService(
            plan_repository=plan_repo,
            audit_log_repository=audit_repo,
        )

        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test Plan",
            priority=3,
            description="Test.",
            target_type="Test.",
            created_by=50,
        )
        service.update_plan(plan.id, priority=5, changed_by=60)

        logs = audit_repo.get_by_entity("development_plan", plan.id)
        assert len(logs) == 2  # CREATE + UPDATE
        update_log = next(log for log in logs if log.action.value == "update")
        assert update_log.changed_by == 60

    def test_service_without_audit_repo(self, tmp_path):
        """Test service works without audit log repository."""
        db_url = _create_db_url(tmp_path)
        plan_repo = SqlAlchemyDevelopmentPlanRepository(db_url)
        service = DevelopmentPlanService(plan_repository=plan_repo)

        # Should not raise even without audit repo
        plan = service.create_plan(
            colony_id=1,
            upgrade_type="infrastructure",
            target_name="Test Plan",
            priority=3,
            description="Test.",
            target_type="Test.",
            created_by=50,
        )
        service.update_plan(plan.id, priority=5, changed_by=50)
        service.delete_plan(plan.id, changed_by=50)

        assert plan.id is not None
