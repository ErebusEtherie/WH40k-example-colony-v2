"""Tests for the infrastructure service."""

import pytest
from datetime import date

from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.infrastructure_repository_impl import SqlAlchemyInfrastructureRepository
from colony_manager.application.services.infrastructure_service import InfrastructureService
from colony_manager.domain.enums import InfrastructureState, InfrastructureType
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.infrastructure import Infrastructure


class TestInfrastructureService:
    def setup_method(self):
        self.db_url = "sqlite:///:memory:"
        self.colony_repo = SqlAlchemyColonyRepository(self.db_url)
        self.infra_repo = SqlAlchemyInfrastructureRepository(self.db_url)
        self.service = InfrastructureService(self.infra_repo, self.colony_repo)

    def _create_colony(self) -> Colony:
        colony = Colony(name="Test Colony", owner="Owner", colony_type="mining", age_days=0, age_last_updated=date.today(),
                        base_complacency=10, base_order=10, base_productivity=10, base_piety=10, base_size=5)
        return self.colony_repo.create(colony)

    def test_create_infrastructure(self):
        colony = self._create_colony()
        infra = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        created = self.service.create_infrastructure(infra)
        assert created.id is not None
        assert created.colony_id == colony.id
        assert created.infrastructure_type == InfrastructureType.POWER_NETWORK

    def test_create_infrastructure_for_missing_colony_raises(self):
        infra = Infrastructure(colony_id=9999, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        with pytest.raises(NotFoundError, match="Colony 9999 not found"):
            self.service.create_infrastructure(infra)

    def test_get_infrastructure(self):
        colony = self._create_colony()
        infra = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        created = self.service.create_infrastructure(infra)
        fetched = self.service.get_infrastructure(created.id)
        assert fetched.id == created.id

    def test_get_infrastructure_missing_raises(self):
        with pytest.raises(NotFoundError, match="Infrastructure 9999 not found"):
            self.service.get_infrastructure(9999)

    def test_update_infrastructure_state(self):
        colony = self._create_colony()
        infra = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.PLANNED)
        created = self.service.create_infrastructure(infra)
        updated = self.service.update_infrastructure_state(created.id, InfrastructureState.DISRUPTED)
        assert updated.state == InfrastructureState.DISRUPTED

    def test_update_infrastructure_state_missing_raises(self):
        with pytest.raises(NotFoundError, match="Infrastructure 9999 not found"):
            self.service.update_infrastructure_state(9999, InfrastructureState.WORKING)

    def test_delete_infrastructure(self):
        colony = self._create_colony()
        infra = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        created = self.service.create_infrastructure(infra)
        self.service.delete_infrastructure(created.id)
        with pytest.raises(NotFoundError):
            self.service.get_infrastructure(created.id)

    def test_delete_infrastructure_missing_raises(self):
        self.service.delete_infrastructure(9999)

    def test_list_by_colony(self):
        colony1 = self._create_colony()
        colony2 = self._create_colony()
        colony2.name = "Colony 2"
        colony2 = self.colony_repo.update(colony2)
        self.service.create_infrastructure(Infrastructure(colony_id=colony1.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING))
        self.service.create_infrastructure(Infrastructure(colony_id=colony1.id, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.PLANNED))
        self.service.create_infrastructure(Infrastructure(colony_id=colony2.id, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.WORKING))
        assert len(self.service.list_by_colony(colony1.id)) == 2
        assert len(self.service.list_by_colony(colony2.id)) == 1

    def test_infrastructure_properties(self):
        colony = self._create_colony()
        planned = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.PLANNED)
        assert planned.has_effect is False
        working = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        assert working.has_effect is True
        disrupted = Infrastructure(colony_id=colony.id, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.DISRUPTED)
        assert disrupted.is_disrupted is True