"""Tests for ColonyUserService - colony membership management."""

from pathlib import Path

import pytest

from colony_manager.application.services.colony_user_service import ColonyUserService
from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.colony_user_repository_impl import (
    SqlAlchemyColonyUserRepository,
)
from colony_manager.adapters.persistence.repositories.audit_log_repository_impl import (
    SqlAlchemyAuditLogRepository,
)
from colony_manager.domain.models.colony_user import ColonyUserRole
from colony_manager.domain.errors import NotFoundError


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestColonyUserServiceMembership:
    """Tests for membership CRUD operations."""

    def test_add_member_success(self, tmp_path):
        """Test successfully adding a member to a colony."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = ColonyUserService(
            membership_repository=membership_repo,
            audit_log_repository=audit_repo,
        )

        membership = service.add_member(
            colony_id=1,
            user_id=100,
            role=ColonyUserRole.EDITOR,
            invited_by=50,
        )

        assert membership.id is not None
        assert membership.colony_id == 1
        assert membership.user_id == 100
        assert membership.role == ColonyUserRole.EDITOR
        assert membership.invited_by == 50

    def test_add_member_without_inviter(self, tmp_path):
        """Test adding member without inviter (self-join)."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        membership = service.add_member(
            colony_id=1,
            user_id=100,
            role=ColonyUserRole.VIEWER,
        )

        assert membership.id is not None
        assert membership.invited_by is None

    def test_add_duplicate_member_raises(self, tmp_path):
        """Test adding duplicate membership raises error."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        # Add first membership
        service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER)

        # Attempt to add duplicate
        with pytest.raises(Exception):  # SQLAlchemy integrity error
            service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR)

    def test_get_membership_by_id(self, tmp_path):
        """Test retrieving membership by ID."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        created = service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER)

        retrieved = service.get_membership(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.user_id == 100

    def test_get_nonexistent_membership(self, tmp_path):
        """Test retrieving non-existent membership returns None."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        result = service.get_membership(99999)

        assert result is None

    def test_get_membership_by_colony_and_user(self, tmp_path):
        """Test retrieving membership by colony and user IDs."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR)

        membership = service.get_membership_by_colony_and_user(colony_id=1, user_id=100)

        assert membership is not None
        assert membership.role == ColonyUserRole.EDITOR

    def test_get_members_by_colony(self, tmp_path):
        """Test getting all members of a colony."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.OWNER)
        service.add_member(colony_id=1, user_id=101, role=ColonyUserRole.EDITOR)
        service.add_member(colony_id=1, user_id=102, role=ColonyUserRole.VIEWER)
        service.add_member(colony_id=2, user_id=100, role=ColonyUserRole.VIEWER)

        members = service.get_members_by_colony(colony_id=1)

        assert len(members) == 3
        assert all(m.colony_id == 1 for m in members)

    def test_get_colonies_by_user(self, tmp_path):
        """Test getting all colonies a user belongs to."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.OWNER)
        service.add_member(colony_id=2, user_id=100, role=ColonyUserRole.EDITOR)
        service.add_member(colony_id=3, user_id=101, role=ColonyUserRole.VIEWER)

        colonies = service.get_colonies_by_user(user_id=100)

        assert len(colonies) == 2
        assert all(m.user_id == 100 for m in colonies)

    def test_update_member_role_success(self, tmp_path):
        """Test updating a member's role."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = ColonyUserService(
            membership_repository=membership_repo,
            audit_log_repository=audit_repo,
        )

        membership = service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER)

        updated = service.update_member_role(
            membership_id=membership.id,
            new_role=ColonyUserRole.EDITOR,
            changed_by=50,
        )

        assert updated.role == ColonyUserRole.EDITOR
        assert updated.id == membership.id

    def test_update_nonexistent_membership_raises(self, tmp_path):
        """Test updating non-existent membership raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        with pytest.raises(NotFoundError, match="Membership with ID 99999 not found"):
            service.update_member_role(
                membership_id=99999,
                new_role=ColonyUserRole.EDITOR,
                changed_by=50,
            )

    def test_remove_member_success(self, tmp_path):
        """Test removing a member from a colony."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = ColonyUserService(
            membership_repository=membership_repo,
            audit_log_repository=audit_repo,
        )

        membership = service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER)

        service.remove_member(membership_id=membership.id, changed_by=50)

        # Verify membership is deleted
        assert service.get_membership(membership.id) is None

    def test_remove_nonexistent_member_raises(self, tmp_path):
        """Test removing non-existent member raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        with pytest.raises(NotFoundError, match="Membership with ID 99999 not found"):
            service.remove_member(membership_id=99999, changed_by=50)

    def test_audit_log_created_on_add(self, tmp_path):
        """Test audit log entry created when adding member."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = ColonyUserService(
            membership_repository=membership_repo,
            audit_log_repository=audit_repo,
        )

        membership = service.add_member(
            colony_id=1,
            user_id=100,
            role=ColonyUserRole.EDITOR,
            invited_by=50,
        )

        # Audit log should be created
        logs = audit_repo.get_by_entity("colony_membership", membership.id)
        assert len(logs) == 1
        assert logs[0].action.value == "create"
        assert logs[0].changed_by == 50

    def test_audit_log_created_on_update(self, tmp_path):
        """Test audit log entry created when updating role."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = ColonyUserService(
            membership_repository=membership_repo,
            audit_log_repository=audit_repo,
        )

        membership = service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER)
        service.update_member_role(membership.id, ColonyUserRole.EDITOR, changed_by=50)

        logs = audit_repo.get_by_entity("colony_membership", membership.id)
        assert len(logs) == 2  # CREATE + UPDATE
        update_log = [log for log in logs if log.action.value == "update"][0]
        assert update_log.changed_by == 50

    def test_service_without_audit_repo(self, tmp_path):
        """Test service works without audit log repository."""
        db_url = _create_db_url(tmp_path)
        membership_repo = SqlAlchemyColonyUserRepository(db_url)
        service = ColonyUserService(membership_repository=membership_repo)

        # Should not raise even without audit repo
        membership = service.add_member(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER)
        service.update_member_role(membership.id, ColonyUserRole.EDITOR, changed_by=50)
        service.remove_member(membership.id, changed_by=50)

        assert membership.id is not None
