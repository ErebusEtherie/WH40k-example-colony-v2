"""Tests for ColonyUserRepository - colony membership management."""

from datetime import UTC, datetime
from pathlib import Path

import pytest

from colony_manager.adapters.persistence.db import init_db
from colony_manager.adapters.persistence.repositories.colony_user_repository_impl import SqlAlchemyColonyUserRepository
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony_user import ColonyUser, ColonyUserRole


def _create_db_url(tmp_path: Path) -> str:
    """Helper to create and initialize a test database."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    return f"sqlite:///{db_path.as_posix()}"


class TestColonyUserCreate:
    """Tests for colony user membership creation."""

    def test_create_membership(self, tmp_path):
        """Test creating a new colony-user membership."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        membership = ColonyUser(
            colony_id=1,
            user_id=100,
            role=ColonyUserRole.EDITOR,
        )
        
        created = repo.create(membership)
        
        assert created.id is not None
        assert created.colony_id == 1
        assert created.user_id == 100
        assert created.role == ColonyUserRole.EDITOR
        assert created.joined_at is not None

    def test_create_duplicate_membership_raises(self, tmp_path):
        """Test creating duplicate membership raises ValueError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        membership = ColonyUser(
            colony_id=1,
            user_id=100,
            role=ColonyUserRole.EDITOR,
        )
        
        repo.create(membership)
        
        # Try to create duplicate
        duplicate = ColonyUser(
            colony_id=1,
            user_id=100,
            role=ColonyUserRole.VIEWER,
        )
        
        with pytest.raises(ValueError, match="already a member"):
            repo.create(duplicate)

    def test_create_same_user_different_colony(self, tmp_path):
        """Test user can be member of multiple colonies."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR))
        created2 = repo.create(ColonyUser(colony_id=2, user_id=100, role=ColonyUserRole.VIEWER))
        
        assert created2.id is not None
        assert created2.colony_id == 2

    def test_create_same_colony_different_user(self, tmp_path):
        """Test colony can have multiple members."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR))
        created2 = repo.create(ColonyUser(colony_id=1, user_id=200, role=ColonyUserRole.VIEWER))
        
        assert created2.id is not None
        assert created2.user_id == 200


class TestColonyUserGetById:
    """Tests for retrieving membership by ID."""

    def test_get_by_id_success(self, tmp_path):
        """Test retrieving membership by ID."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        created = repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.OWNER))
        
        retrieved = repo.get_by_id(created.id)
        
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.role == ColonyUserRole.OWNER

    def test_get_by_id_not_found(self, tmp_path):
        """Test retrieving non-existent membership returns None."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        result = repo.get_by_id(99999)
        
        assert result is None


class TestColonyUserGetByColonyAndUser:
    """Tests for retrieving membership by colony and user."""

    def test_get_by_colony_and_user_success(self, tmp_path):
        """Test retrieving membership by colony and user IDs."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        created = repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR))
        
        retrieved = repo.get_by_colony_and_user(colony_id=1, user_id=100)
        
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.role == ColonyUserRole.EDITOR

    def test_get_by_colony_and_user_not_found(self, tmp_path):
        """Test retrieving non-existent membership returns None."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        result = repo.get_by_colony_and_user(colony_id=1, user_id=100)
        
        assert result is None

    def test_get_by_colony_and_user_wrong_colony(self, tmp_path):
        """Test with correct user but wrong colony."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR))
        
        result = repo.get_by_colony_and_user(colony_id=2, user_id=100)
        
        assert result is None

    def test_get_by_colony_and_user_wrong_user(self, tmp_path):
        """Test with correct colony but wrong user."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR))
        
        result = repo.get_by_colony_and_user(colony_id=1, user_id=200)
        
        assert result is None


class TestColonyUserGetByColony:
    """Tests for retrieving all memberships for a colony."""

    def test_get_by_colony(self, tmp_path):
        """Test getting all members of a colony."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.OWNER))
        repo.create(ColonyUser(colony_id=1, user_id=200, role=ColonyUserRole.EDITOR))
        repo.create(ColonyUser(colony_id=1, user_id=300, role=ColonyUserRole.VIEWER))
        
        members = repo.get_by_colony(colony_id=1)
        
        assert len(members) == 3
        assert all(m.colony_id == 1 for m in members)

    def test_get_by_colony_empty(self, tmp_path):
        """Test getting members of colony with no members."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        members = repo.get_by_colony(colony_id=999)
        
        assert len(members) == 0

    def test_get_by_colony_excludes_other_colonies(self, tmp_path):
        """Test filtering by colony ID."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.OWNER))
        repo.create(ColonyUser(colony_id=2, user_id=200, role=ColonyUserRole.EDITOR))
        repo.create(ColonyUser(colony_id=2, user_id=300, role=ColonyUserRole.VIEWER))
        
        members = repo.get_by_colony(colony_id=1)
        
        assert len(members) == 1
        assert members[0].user_id == 100


class TestColonyUserGetByUser:
    """Tests for retrieving all memberships for a user."""

    def test_get_by_user(self, tmp_path):
        """Test getting all colonies a user belongs to."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.OWNER))
        repo.create(ColonyUser(colony_id=2, user_id=100, role=ColonyUserRole.EDITOR))
        repo.create(ColonyUser(colony_id=3, user_id=100, role=ColonyUserRole.VIEWER))
        
        memberships = repo.get_by_user(user_id=100)
        
        assert len(memberships) == 3
        assert all(m.user_id == 100 for m in memberships)

    def test_get_by_user_empty(self, tmp_path):
        """Test getting memberships for user with none."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        memberships = repo.get_by_user(user_id=999)
        
        assert len(memberships) == 0

    def test_get_by_user_excludes_other_users(self, tmp_path):
        """Test filtering by user ID."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.OWNER))
        repo.create(ColonyUser(colony_id=2, user_id=200, role=ColonyUserRole.EDITOR))
        
        memberships = repo.get_by_user(user_id=100)
        
        assert len(memberships) == 1
        assert memberships[0].colony_id == 1


class TestColonyUserUpdate:
    """Tests for updating colony user membership."""

    def test_update_role(self, tmp_path):
        """Test updating membership role."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        created = repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.VIEWER))
        
        created.role = ColonyUserRole.EDITOR
        updated = repo.update(created)
        
        assert updated.role == ColonyUserRole.EDITOR

    def test_update_nonexistent_raises(self, tmp_path):
        """Test updating non-existent membership raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        membership = ColonyUser(id=99999, colony_id=1, user_id=100, role=ColonyUserRole.EDITOR)
        
        with pytest.raises(NotFoundError, match="not found"):
            repo.update(membership)

    def test_update_without_id_raises(self, tmp_path):
        """Test updating without ID raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        membership = ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR)
        
        with pytest.raises(NotFoundError, match="ID is required"):
            repo.update(membership)


class TestColonyUserDelete:
    """Tests for deleting colony user membership."""

    def test_delete_success(self, tmp_path):
        """Test deleting a membership."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        created = repo.create(ColonyUser(colony_id=1, user_id=100, role=ColonyUserRole.EDITOR))
        
        repo.delete(created.id)
        
        # Verify deleted
        assert repo.get_by_id(created.id) is None
        assert repo.get_by_colony_and_user(1, 100) is None

    def test_delete_nonexistent_raises(self, tmp_path):
        """Test deleting non-existent membership raises NotFoundError."""
        db_url = _create_db_url(tmp_path)
        repo = SqlAlchemyColonyUserRepository(db_url)
        
        with pytest.raises(NotFoundError, match="not found"):
            repo.delete(99999)
