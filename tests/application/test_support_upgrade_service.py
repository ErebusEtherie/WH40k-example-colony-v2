"""Tests for the support upgrade service."""

from datetime import date

import pytest

from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.support_upgrade_repository_impl import (
    SqlAlchemySupportUpgradeRepository,
)
from colony_manager.application.services.support_upgrade_service import SupportUpgradeService
from colony_manager.domain.enums import ModifierStat, SupportUpgradeType
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.support_upgrade import SupportUpgrade


class TestSupportUpgradeService:
    def setup_method(self):
        self.db_url = "sqlite:///:memory:"
        self.colony_repo = SqlAlchemyColonyRepository(self.db_url)
        self.upgrade_repo = SqlAlchemySupportUpgradeRepository(self.db_url)
        self.service = SupportUpgradeService(self.upgrade_repo, self.colony_repo)

    def _create_colony(self) -> Colony:
        colony = Colony(name="Test Colony", owner="Owner", colony_type="mining", age_days=0, age_last_updated=date.today(),
                        base_complacency=10, base_order=10, base_productivity=10, base_piety=10, base_size=5)
        return self.colony_repo.create(colony)

    def test_create_upgrade(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT)
        created = self.service.create_upgrade(upgrade)
        assert created.id is not None
        assert created.colony_id == colony.id

    def test_create_upgrade_for_missing_colony_raises(self):
        upgrade = SupportUpgrade(colony_id=9999, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT)
        with pytest.raises(NotFoundError, match="Colony 9999 not found"):
            self.service.create_upgrade(upgrade)

    def test_create_upgrade_with_custom_stat_choice(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT, custom_stat_choice=ModifierStat.ORDER)
        created = self.service.create_upgrade(upgrade)
        assert created.custom_stat_choice == ModifierStat.ORDER

    def test_create_upgrade_with_custom_product(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.INDUSTRIAL_FACILITY, custom_product="Vehicles")
        created = self.service.create_upgrade(upgrade)
        assert created.custom_product == "Vehicles"

    def test_create_upgrade_with_affiliated_group(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.CONTACTS, affiliated_group="Merchant Guild")
        created = self.service.create_upgrade(upgrade)
        assert created.affiliated_group == "Merchant Guild"

    def test_get_upgrade(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT)
        created = self.service.create_upgrade(upgrade)
        fetched = self.service.get_upgrade(created.id)
        assert fetched.id == created.id

    def test_get_upgrade_missing_raises(self):
        with pytest.raises(NotFoundError, match="SupportUpgrade 9999 not found"):
            self.service.get_upgrade(9999)

    def test_update_upgrade(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT, custom_stat_choice=ModifierStat.ORDER)
        created = self.service.create_upgrade(upgrade)
        created.custom_stat_choice = ModifierStat.PIETY
        updated = self.service.update_upgrade(created)
        assert updated.custom_stat_choice == ModifierStat.PIETY

    def test_delete_upgrade(self):
        colony = self._create_colony()
        upgrade = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT)
        created = self.service.create_upgrade(upgrade)
        self.service.delete_upgrade(created.id)
        with pytest.raises(NotFoundError):
            self.service.get_upgrade(created.id)

    def test_delete_upgrade_missing_raises(self):
        self.service.delete_upgrade(9999)

    def test_list_by_colony(self):
        colony1 = self._create_colony()
        colony2 = self._create_colony()
        colony2.name = "Colony 2"
        colony2 = self.colony_repo.update(colony2)
        self.service.create_upgrade(SupportUpgrade(colony_id=colony1.id, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT))
        self.service.create_upgrade(SupportUpgrade(colony_id=colony1.id, upgrade_type=SupportUpgradeType.TRAPPINGS))
        self.service.create_upgrade(SupportUpgrade(colony_id=colony2.id, upgrade_type=SupportUpgradeType.CONTACTS))
        assert len(self.service.list_by_colony(colony1.id)) == 2
        assert len(self.service.list_by_colony(colony2.id)) == 1

    def test_upgrade_has_stat_effect_property(self):
        colony = self._create_colony()
        arbites = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.ARBITES_PRECINCT)
        assert arbites.has_stat_effect is True
        cultural_no_stat = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT)
        assert cultural_no_stat.has_stat_effect is False
        cultural_with_stat = SupportUpgrade(colony_id=colony.id, upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT, custom_stat_choice=ModifierStat.ORDER)
        assert cultural_with_stat.has_stat_effect is True