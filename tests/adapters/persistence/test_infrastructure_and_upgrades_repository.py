"""Tests for infrastructure and support upgrade repositories."""

from colony_manager.adapters.persistence.infrastructure_repository_impl import (
    SqlAlchemyInfrastructureRepository,
)
from colony_manager.adapters.persistence.support_upgrade_repository_impl import (
    SqlAlchemySupportUpgradeRepository,
)
from colony_manager.domain.enums import (
    InfrastructureState,
    InfrastructureType,
    ModifierStat,
    SupportUpgradeType,
)
from colony_manager.domain.models.infrastructure import Infrastructure
from colony_manager.domain.models.support_upgrade import SupportUpgrade


class TestInfrastructureRepository:
    def test_create_and_get(self):
        repo = SqlAlchemyInfrastructureRepository("sqlite:///:memory:")
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.WORKING,
        )

        saved = repo.create(infra)
        assert saved.id is not None
        assert saved.infrastructure_type == InfrastructureType.POWER_NETWORK
        assert saved.state == InfrastructureState.WORKING

        loaded = repo.get(saved.id)
        assert loaded is not None
        assert loaded.id == saved.id
        assert loaded.infrastructure_type == saved.infrastructure_type

    def test_update(self):
        repo = SqlAlchemyInfrastructureRepository("sqlite:///:memory:")
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.PLANNED,
        )
        saved = repo.create(infra)

        saved.state = InfrastructureState.NOT_WORKING
        updated = repo.update(saved)

        assert updated.state == InfrastructureState.NOT_WORKING
        loaded = repo.get(saved.id)
        assert loaded.state == InfrastructureState.NOT_WORKING

    def test_delete(self):
        repo = SqlAlchemyInfrastructureRepository("sqlite:///:memory:")
        infra = Infrastructure(
            colony_id=1,
            infrastructure_type=InfrastructureType.POWER_NETWORK,
            state=InfrastructureState.WORKING,
        )
        saved = repo.create(infra)

        repo.delete(saved.id)
        loaded = repo.get(saved.id)
        assert loaded is None

    def test_list_by_colony(self):
        repo = SqlAlchemyInfrastructureRepository("sqlite:///:memory:")
        infra1 = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING)
        infra2 = Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.PLANNED)
        infra3 = Infrastructure(colony_id=2, infrastructure_type=InfrastructureType.WATER_MANAGEMENT, state=InfrastructureState.WORKING)

        repo.create(infra1)
        repo.create(infra2)
        repo.create(infra3)

        colony1_items = repo.list_by_colony(1)
        assert len(colony1_items) == 2
        assert all(item.colony_id == 1 for item in colony1_items)

    def test_list_all(self):
        repo = SqlAlchemyInfrastructureRepository("sqlite:///:memory:")
        repo.create(Infrastructure(colony_id=1, infrastructure_type=InfrastructureType.POWER_NETWORK, state=InfrastructureState.WORKING))
        repo.create(Infrastructure(colony_id=2, infrastructure_type=InfrastructureType.TRANSPORT, state=InfrastructureState.PLANNED))

        all_items = repo.list()
        assert len(all_items) == 2


class TestSupportUpgradeRepository:
    def test_create_and_get(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.ARBITES_PRECINCT,
        )

        saved = repo.create(upgrade)
        assert saved.id is not None
        assert saved.upgrade_type == SupportUpgradeType.ARBITES_PRECINCT

        loaded = repo.get(saved.id)
        assert loaded is not None
        assert loaded.id == saved.id

    def test_create_with_custom_stat_choice(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT,
            custom_stat_choice=ModifierStat.ORDER,
        )

        saved = repo.create(upgrade)
        loaded = repo.get(saved.id)

        assert loaded.custom_stat_choice == ModifierStat.ORDER

    def test_create_with_custom_product(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.INDUSTRIAL_FACILITY,
            custom_product="Vehicles",
        )

        saved = repo.create(upgrade)
        loaded = repo.get(saved.id)

        assert loaded.custom_product == "Vehicles"

    def test_create_with_affiliated_group(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CONTACTS,
            affiliated_group="Merchant Guild",
        )

        saved = repo.create(upgrade)
        loaded = repo.get(saved.id)

        assert loaded.affiliated_group == "Merchant Guild"

    def test_update(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT,
            custom_stat_choice=ModifierStat.ORDER,
        )
        saved = repo.create(upgrade)

        saved.custom_stat_choice = ModifierStat.PIETY
        updated = repo.update(saved)

        assert updated.custom_stat_choice == ModifierStat.PIETY

    def test_delete(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.ARBITES_PRECINCT,
        )
        saved = repo.create(upgrade)

        repo.delete(saved.id)
        loaded = repo.get(saved.id)
        assert loaded is None

    def test_list_by_colony(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        upg1 = SupportUpgrade(colony_id=1, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT)
        upg2 = SupportUpgrade(colony_id=1, upgrade_type=SupportUpgradeType.TRAPPINGS)
        upg3 = SupportUpgrade(colony_id=2, upgrade_type=SupportUpgradeType.CONTACTS)

        repo.create(upg1)
        repo.create(upg2)
        repo.create(upg3)

        colony1_items = repo.list_by_colony(1)
        assert len(colony1_items) == 2
        assert all(item.colony_id == 1 for item in colony1_items)

    def test_list_all(self):
        repo = SqlAlchemySupportUpgradeRepository("sqlite:///:memory:")
        repo.create(SupportUpgrade(colony_id=1, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT))
        repo.create(SupportUpgrade(colony_id=2, upgrade_type=SupportUpgradeType.CONTACTS))

        all_items = repo.list()
        assert len(all_items) == 2
