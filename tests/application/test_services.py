from datetime import UTC, datetime

import pytest

from colony_manager.application.services.colony_service import ColonyService
from colony_manager.application.services.representative_service import RepresentativeService
from colony_manager.domain.enums import (
    ModifierSourceType,
    ModifierStat,
    RepresentativeType,
    SkillLevel,
)
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.representative import (
    Personality,
    Representative,
    RepresentativeStats,
    Skill,
    Talent,
)


class InMemoryColonyRepository:
    def __init__(self) -> None:
        self._items: dict[int, Colony] = {}
        self._next_id = 1

    def create(self, colony: Colony) -> Colony:
        colony.id = self._next_id
        self._next_id += 1
        self._items[colony.id] = colony
        return colony

    def get(self, colony_id: int) -> Colony | None:
        return self._items.get(colony_id)

    def update(self, colony: Colony) -> Colony:
        self._items[colony.id] = colony
        return colony

    def delete(self, colony_id: int) -> None:
        self._items.pop(colony_id, None)

    def list(self) -> list[Colony]:
        return list(self._items.values())


class InMemoryRepresentativeRepository:
    def __init__(self) -> None:
        self._items: dict[int, Representative] = {}
        self._next_id = 1

    def create(self, representative: Representative) -> Representative:
        representative.id = self._next_id
        self._next_id += 1
        self._items[representative.id] = representative
        return representative

    def get(self, representative_id: int) -> Representative | None:
        return self._items.get(representative_id)

    def update(self, representative: Representative) -> Representative:
        self._items[representative.id] = representative
        return representative

    def delete(self, representative_id: int) -> None:
        self._items.pop(representative_id, None)

    def list(self) -> list[Representative]:
        return list(self._items.values())


class FakeRuleConfigProvider:
    def get_base_profit_factor(self, size: int) -> int:
        return 2

    def get_leadership_modifier(self, stat_bonus: int) -> int:
        return 1

    def get_lore_state_for_stat(self, stat, value, size):
        return None

    def get_leadership_table(self) -> list[object]:
        return []
    
    def get_pf_state_bonuses(self) -> dict[str, int]:
        """Get Profit Factor bonuses for colony states."""
        return {"placated": 1, "productive": 2, "orderly": 2}


def test_colony_service_update_age_sets_last_updated():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider())
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type="research_mission",
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    service.create_colony(colony)

    updated = service.update_age(colony.id, 30)

    assert updated.age_days == 30
    assert updated.age_last_updated == datetime.now(UTC).date()


def test_colony_service_add_modifier_updates_colony():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider())
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type="research_mission",
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    service.create_colony(colony)
    modifier = Modifier(
        colony_id=colony.id,
        modifier_source_type=ModifierSourceType.GM_CUSTOM,
        modifier_stat=ModifierStat.ORDER,
        modifier_value=2,
        modifier_description="test",
        is_active=True,
    )

    service.add_modifier(colony.id, modifier)

    assert len(colony_repo.get(colony.id).modifiers) == 1


def test_colony_service_get_state_returns_state():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider())
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type="research_mission",
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    service.create_colony(colony)

    state = service.get_state(colony.id)

    assert state["size"] == 5
    assert state["profit_factor"] == 8  # Base(2)+Placated(1)+Productive(2)+Orderly(2)+Leadership(1)


def test_colony_service_raises_for_missing_colony():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider())

    with pytest.raises(NotFoundError):
        service.get_state(999)


def test_representative_service_assigns_colony():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    colony_service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider())
    representative_service = RepresentativeService(colony_repo, representative_repo)

    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type="research_mission",
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    created_colony = colony_service.create_colony(colony)
    representative = Representative(
        name="Test Rep",
        type=RepresentativeType.JUDGE,
        personalities=[Personality(name="Calm", description="desc", stat_effects=[])],
        stats=RepresentativeStats(ws=10, bs=10, s=10, t=10, ag=10, int=10, per=10, wp=10, fel=10),
        skills=[Skill(name="Skill", level=SkillLevel.KNOWN, description="desc")],
        talents=[Talent(name="Talent", description="desc")],
    )
    created_rep = representative_service.create_representative(representative)

    updated = representative_service.assign_to_colony(created_colony.id, created_rep.id)

    assert updated.assigned_to_colony_id == created_colony.id
