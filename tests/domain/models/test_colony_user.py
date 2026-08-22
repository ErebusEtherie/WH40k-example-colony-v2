"""Tests for ColonyUser domain model validators and properties."""

import pytest

from pydantic import ValidationError

from colony_manager.domain.models.colony_user import ColonyUser, ColonyUserRole


class TestColonyUserValidators:
    """Tests for ColonyUser model field validators."""

    def test_colony_id_required(self):
        """colony_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            ColonyUser(user_id=1)
        assert "colony_id" in str(exc_info.value)

    def test_user_id_required(self):
        """user_id is required."""
        with pytest.raises(ValidationError) as exc_info:
            ColonyUser(colony_id=1)
        assert "user_id" in str(exc_info.value)

    def test_valid_colony_user(self):
        """Valid ColonyUser with required fields."""
        cu = ColonyUser(colony_id=1, user_id=2)
        assert cu.colony_id == 1
        assert cu.user_id == 2


class TestColonyUserDefaults:
    """Tests for ColonyUser default values."""

    def test_role_defaults_to_viewer(self):
        """ColonyUser role defaults to VIEWER."""
        cu = ColonyUser(colony_id=1, user_id=2)
        assert cu.role == ColonyUserRole.VIEWER

    def test_joined_at_defaults_to_none(self):
        """joined_at defaults to None."""
        cu = ColonyUser(colony_id=1, user_id=2)
        assert cu.joined_at is None

    def test_invited_by_defaults_to_none(self):
        """invited_by defaults to None."""
        cu = ColonyUser(colony_id=1, user_id=2)
        assert cu.invited_by is None

    def test_can_set_explicit_role(self):
        """Role can be explicitly set."""
        cu = ColonyUser(colony_id=1, user_id=2, role=ColonyUserRole.OWNER)
        assert cu.role == ColonyUserRole.OWNER

    def test_can_set_invited_by(self):
        """invited_by can be set."""
        cu = ColonyUser(colony_id=1, user_id=2, invited_by=99)
        assert cu.invited_by == 99
