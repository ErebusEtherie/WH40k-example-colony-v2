"""Tests for UserService - user account management."""

from pathlib import Path

import pytest

from colony_manager.application.services.user_service import UserService
from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.user_repository_impl import SqlAlchemyUserRepository
from colony_manager.adapters.persistence.repositories.audit_log_repository_impl import (
    SqlAlchemyAuditLogRepository,
)
from colony_manager.domain.models.user import UserRole
from colony_manager.domain.errors import NotFoundError, ValidationError
from colony_manager.domain.util.auth import verify_password


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestUserServiceCRUD:
    """Tests for user CRUD operations."""

    def test_create_user_success(self, tmp_path):
        """Test successfully creating a user."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        audit_repo = SqlAlchemyAuditLogRepository(db_url)
        service = UserService(
            user_repository=user_repo,
            audit_log_repository=audit_repo,
        )

        user = service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
            role="viewer",
            created_by=1,
        )

        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == UserRole.VIEWER
        assert user.is_active is True
        assert verify_password("securepassword123", user.password_hash)

    def test_create_user_with_admin_role(self, tmp_path):
        """Test creating a user with admin role."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        user = service.create_user(
            username="adminuser",
            email="admin@example.com",
            password="securepassword123",
            role="admin",
        )

        assert user.role == UserRole.ADMIN

    def test_create_user_duplicate_username_raises(self, tmp_path):
        """Test creating user with duplicate username raises error."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        # Create first user
        service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
        )

        # Attempt to create duplicate username
        with pytest.raises(ValidationError, match="Username"):
            service.create_user(
                username="testuser",
                email="different@example.com",
                password="securepassword123",
            )

    def test_create_user_duplicate_email_raises(self, tmp_path):
        """Test creating user with duplicate email raises error."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        # Create first user
        service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
        )

        # Attempt to create duplicate email
        with pytest.raises(ValidationError, match="Email"):
            service.create_user(
                username="differentuser",
                email="test@example.com",
                password="securepassword123",
            )

    def test_get_user_by_id(self, tmp_path):
        """Test retrieving user by ID."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        created = service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
        )

        retrieved = service.get_user(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.username == "testuser"

    def test_get_nonexistent_user_returns_none(self, tmp_path):
        """Test retrieving nonexistent user returns None."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        result = service.get_user(9999)

        assert result is None

    def test_list_users_with_pagination(self, tmp_path):
        """Test listing users with pagination."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        # Create multiple users
        for i in range(5):
            service.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="securepassword123",
            )

        users, total = service.list_users(limit=3, offset=0)

        assert len(users) == 3
        assert total == 5

        users_page2, total2 = service.list_users(limit=3, offset=3)
        assert len(users_page2) == 2
        assert total2 == 5

    def test_update_user_role(self, tmp_path):
        """Test updating user role."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        created = service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
            role="viewer",
        )

        updated = service.update_user(
            user_id=created.id,
            role="colony_manager",
            changed_by=999,  # Admin user ID
        )

        assert updated.role == UserRole.COLONY_MANAGER

    def test_update_user_is_active(self, tmp_path):
        """Test updating user active status."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        created = service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
        )

        updated = service.update_user(
            user_id=created.id,
            is_active=False,
            changed_by=999,
        )

        assert updated.is_active is False

    def test_update_nonexistent_user_raises(self, tmp_path):
        """Test updating nonexistent user raises error."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        with pytest.raises(NotFoundError):
            service.update_user(
                user_id=9999,
                role="admin",
                changed_by=1,
            )

    def test_delete_user_soft_delete(self, tmp_path):
        """Test soft deleting a user."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        created = service.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123",
        )

        service.delete_user(user_id=created.id, changed_by=999)

        # User should still exist but be inactive
        retrieved = service.get_user(created.id)
        assert retrieved is not None
        assert retrieved.is_active is False

    def test_delete_nonexistent_user_raises(self, tmp_path):
        """Test deleting nonexistent user raises error."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        with pytest.raises(NotFoundError):
            service.delete_user(user_id=9999, changed_by=1)

    def test_reset_password(self, tmp_path):
        """Test resetting user password."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        created = service.create_user(
            username="testuser",
            email="test@example.com",
            password="oldpassword123",
        )

        updated = service.reset_password(
            user_id=created.id,
            temporary_password="NewPass456!",
            changed_by=999,
        )

        assert verify_password("NewPass456!", updated.password_hash)
        assert not verify_password("oldpassword123", updated.password_hash)


class TestUserServicePermissions:
    """Tests for user service permission checks."""

    def test_admin_cannot_modify_other_admin(self, tmp_path):
        """Test that admin cannot modify other admins."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        # Create admin user (modifier)
        admin = service.create_user(
            username="admin1",
            email="admin1@example.com",
            password="securepassword123",
            role="admin",
        )

        # Create another admin user (target)
        target_admin = service.create_user(
            username="admin2",
            email="admin2@example.com",
            password="securepassword123",
            role="admin",
        )

        # Admin1 tries to modify admin2
        with pytest.raises(PermissionError, match="Admin accounts cannot be modified"):
            service.update_user(
                user_id=target_admin.id,
                role="viewer",
                changed_by=admin.id,
            )

    def test_non_admin_cannot_modify_admin(self, tmp_path):
        """Test that non-admin cannot modify admin."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        # Create admin user (target)
        admin = service.create_user(
            username="admin",
            email="admin@example.com",
            password="securepassword123",
            role="admin",
        )

        # Create viewer user (modifier)
        viewer = service.create_user(
            username="viewer",
            email="viewer@example.com",
            password="securepassword123",
            role="viewer",
        )

        # Viewer tries to modify admin
        with pytest.raises(PermissionError, match="Admin accounts cannot be modified"):
            service.update_user(
                user_id=admin.id,
                role="viewer",
                changed_by=viewer.id,
            )

    def test_user_cannot_escalate_own_role(self, tmp_path):
        """Test that user cannot escalate their own privileges."""
        db_url = _create_db_url(tmp_path)
        user_repo = SqlAlchemyUserRepository(db_url)
        service = UserService(user_repository=user_repo)

        # Create viewer user
        viewer = service.create_user(
            username="viewer",
            email="viewer@example.com",
            password="securepassword123",
            role="viewer",
        )

        # Viewer tries to escalate own role
        with pytest.raises(PermissionError, match="Users cannot modify their own role"):
            service.update_user(
                user_id=viewer.id,
                role="admin",
                changed_by=viewer.id,
            )
