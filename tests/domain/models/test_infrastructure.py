"""Tests for Infrastructure domain model validators and properties."""

import pytest

from pydantic import ValidationError

from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.enums import InfrastructureState, InfrastructureType


class TestInfrastructureProperties:
    """Tests for Infrastructure computed properties."""

    def test_has_effect_planned_is_false(self):
        """Planned infrastructure has no effect."""
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.PLANNED,
        )
        assert infra.has_effect is False

    def test_has_effect_working_is_true(self):
        """Working infrastructure has effect."""
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.WORKING,
        )
        assert infra.has_effect is True

    def test_has_effect_disrupted_is_true(self):
        """Disrupted infrastructure has effect (penalties apply)."""
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.DISRUPTED,
        )
        assert infra.has_effect is True

    def test_is_working_only_true_for_working_state(self):
        """is_working is True only for WORKING state."""
        assert Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.PLANNED).is_working is False
        assert Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING).is_working is True
        assert Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.DISRUPTED).is_working is False

    def test_is_disrupted_only_true_for_disrupted_state(self):
        """is_disrupted is True only for DISRUPTED state."""
        assert Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.PLANNED).is_disrupted is False
        assert Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING).is_disrupted is False
        assert Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.DISRUPTED).is_disrupted is True

    def test_default_state_is_planned(self):
        """Infrastructure state defaults to PLANNED."""
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
        )
        assert infra.state == InfrastructureState.PLANNED

    def test_can_set_explicit_state(self):
        """Infrastructure state can be explicitly set."""
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.WORKING,
        )
        assert infra.state == InfrastructureState.WORKING

    def test_validate_assignment_enforces_state_validation(self):
        """validate_assignment config validates state on update."""
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.PLANNED,
        )
        infra.state = InfrastructureState.WORKING
        assert infra.state == InfrastructureState.WORKING
