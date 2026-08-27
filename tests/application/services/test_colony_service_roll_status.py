"""Tests for ColonyService roll status functionality."""

from datetime import date
from unittest.mock import Mock

import pytest

from colony_manager.application.services.colony_service import ColonyService
from colony_manager.domain.enums import ColonyType
from colony_manager.domain.models.colony import Colony


@pytest.fixture
def mock_repositories():
    """Create mock repositories for testing."""
    colony_repo = Mock()
    rep_repo = Mock()
    colony_user_repo = Mock()
    config_provider = Mock()
    config_provider.get_event_roll_interval_days.return_value = 60
    config_provider.get_development_roll_interval_days.return_value = 90
    return colony_repo, rep_repo, config_provider, colony_user_repo


@pytest.fixture
def colony_service(mock_repositories):
    """Create a colony service for testing."""
    colony_repo, rep_repo, config_provider, colony_user_repo = mock_repositories
    return ColonyService(colony_repo, rep_repo, config_provider, colony_user_repo)


class TestColonyServiceRollStatus:
    """Tests for colony roll status queries."""

    def test_roll_status_at_interval_boundary(self, colony_service, mock_repositories):
        """At exact interval boundary, roll is due."""
        colony_repo, _, _, _ = mock_repositories

        # Colony at exactly 60 days (event roll due) and 90 days (dev roll due)
        colony = Colony(
            name="Test Colony",
            founder_name="Test Founder",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=180,  # Multiple of both 60 and 90
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        colony_repo.get.return_value = colony

        status = colony_service.get_roll_status(1)

        assert status["event_roll_due"] is True
        assert status["development_roll_due"] is True
        assert status["days_until_event_roll"] == 0
        assert status["days_until_development_roll"] == 0

    def test_roll_status_mid_cycle(self, colony_service, mock_repositories):
        """Mid-cycle shows days until next roll."""
        colony_repo, _, _, _ = mock_repositories

        # Colony at 45 days (15 days until event roll, 45 days until dev roll)
        colony = Colony(
            name="Test Colony",
            founder_name="Test Founder",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=45,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        colony_repo.get.return_value = colony

        status = colony_service.get_roll_status(1)

        assert status["event_roll_due"] is False
        assert status["development_roll_due"] is False
        assert status["days_until_event_roll"] == 15  # 60 - 45
        assert status["days_until_development_roll"] == 45  # 90 - 45

    def test_roll_status_returns_intervals(self, colony_service, mock_repositories):
        """Roll status includes configured intervals."""
        colony_repo, _, _, _ = mock_repositories

        colony = Colony(
            name="Test Colony",
            founder_name="Test Founder",
            colony_type=ColonyType.MINING_AND_INDUSTRY,
            age_days=30,
            age_last_updated=date.today(),
            base_complacency=10,
            base_order=10,
            base_productivity=10,
            base_piety=10,
            base_size=3,
        )
        colony_repo.get.return_value = colony

        status = colony_service.get_roll_status(1)

        assert status["event_interval_days"] == 60
        assert status["development_interval_days"] == 90

    def test_roll_status_not_found(self, colony_service, mock_repositories):
        """Roll status raises NotFoundError for non-existent colony."""
        from colony_manager.domain.errors import NotFoundError

        colony_repo, _, _, _ = mock_repositories
        colony_repo.get.return_value = None

        with pytest.raises(NotFoundError):
            colony_service.get_roll_status(999)
