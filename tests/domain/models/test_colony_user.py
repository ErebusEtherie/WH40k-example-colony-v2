"""Tests for ColonyUser domain model validators and properties."""

from datetime import UTC

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

    def test_joined_at_defaults_to_datetime(self):
        """joined_at defaults to current datetime (Warsaw timezone)."""
        cu = ColonyUser(colony_id=1, user_id=2)
        assert cu.joined_at is not None
        assert cu.joined_at.tzinfo is not None

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

    def test_can_set_explicit_joined_at(self):
        """joined_at can be explicitly set."""
        from datetime import datetime

        explicit_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=UTC)
        cu = ColonyUser(colony_id=1, user_id=2, joined_at=explicit_time)
        assert cu.joined_at == explicit_time
