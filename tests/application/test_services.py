from datetime import UTC, datetime

import pytest

from colony_manager.application.services.colony_service import ColonyService
from colony_manager.application.services.representative_service import RepresentativeService
from colony_manager.domain.enums import (
    ColonyType,
    LoreState,
    ModifierSourceType,
    ModifierStat,
    RepresentativeType,
    SkillLevel,
)
from colony_manager.domain.errors import NotFoundError
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.colony_user import ColonyUser, ColonyUserRole
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
        if colony.id is not None:
            self._items[colony.id] = colony
        return colony

    def get(self, colony_id: int) -> Colony | None:
        return self._items.get(colony_id)

    def update(self, colony: Colony) -> Colony:
        if colony.id is not None:
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
        if representative.id is not None:
            self._items[representative.id] = representative
        return representative

    def get(self, representative_id: int) -> Representative | None:
        return self._items.get(representative_id)

    def update(self, representative: Representative) -> Representative:
        if representative.id is not None:
            self._items[representative.id] = representative
        return representative

    def delete(self, representative_id: int) -> None:
        self._items.pop(representative_id, None)

    def list(self) -> list[Representative]:
        return list(self._items.values())


class InMemoryColonyUserRepository:
    def __init__(self) -> None:
        self._items: dict[int, ColonyUser] = {}
        self._next_id = 1

    def create(self, colony_user: ColonyUser) -> ColonyUser:
        colony_user.id = self._next_id
        self._next_id += 1
        if colony_user.id is not None:
            self._items[colony_user.id] = colony_user
        return colony_user

    def get_by_id(self, membership_id: int) -> ColonyUser | None:
        return self._items.get(membership_id)

    def get_by_colony_and_user(self, colony_id: int, user_id: int) -> ColonyUser | None:
        for membership in self._items.values():
            if membership.colony_id == colony_id and membership.user_id == user_id:
                return membership
        return None

    def update(self, colony_user: ColonyUser) -> ColonyUser:
        if colony_user.id is not None:
            self._items[colony_user.id] = colony_user
        return colony_user

    def delete(self, membership_id: int) -> None:
        self._items.pop(membership_id, None)

    def get_by_colony(self, colony_id: int) -> list[ColonyUser]:
        return [m for m in self._items.values() if m.colony_id == colony_id]

    def get_by_user(self, user_id: int) -> list[ColonyUser]:
        return [m for m in self._items.values() if m.user_id == user_id]

    def list(self) -> list[ColonyUser]:
        return list(self._items.values())

    def list_by_colony(self, colony_id: int) -> list[ColonyUser]:
        return [m for m in self._items.values() if m.colony_id == colony_id]


class FakeRuleConfigProvider:
    def get_base_profit_factor(self, size: int) -> int:
        return 2

    def get_leadership_modifier(self, stat_bonus: int) -> int:
        return 1

    def get_lore_state_for_stat(self, stat: ModifierStat, value: int, size: int) -> LoreState:
        return LoreState.STABLE

    def get_colony_type_config(self, colony_type_name: str) -> dict[str, object]:
        return {}

    def get_event_roll_interval_days(self) -> int:
        return 60

    def get_development_roll_interval_days(self) -> int:
        return 90
    
    def get_pf_state_bonuses(self) -> dict[str, int]:
        """Get Profit Factor bonuses for colony states."""
        return {"placated": 1, "productive": 2, "orderly": 2}


def test_colony_service_update_age_sets_last_updated():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider(), InMemoryColonyUserRepository())
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type=ColonyType.RESEARCH_MISSION,
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    created_colony = service.create_colony(colony)
    assert created_colony.id is not None

    updated = service.update_age(created_colony.id, 30)

    assert updated.age_days == 30
    assert updated.age_last_updated == datetime.now(UTC).date()


def test_colony_service_add_modifier_updates_colony():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider(), InMemoryColonyUserRepository())
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type=ColonyType.RESEARCH_MISSION,
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    created_colony = service.create_colony(colony)
    assert created_colony.id is not None
    modifier = Modifier(
        colony_id=created_colony.id,
        modifier_source_type=ModifierSourceType.GM_CUSTOM,
        modifier_stat=ModifierStat.ORDER,
        modifier_value=2,
        description="test",
        is_active=True,
    )

    service.add_modifier(created_colony.id, modifier)

    retrieved_colony = colony_repo.get(created_colony.id)
    assert retrieved_colony is not None
    assert len(retrieved_colony.modifiers) == 1


def test_colony_service_get_state_returns_state():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider(), InMemoryColonyUserRepository())
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type=ColonyType.RESEARCH_MISSION,
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    created_colony = service.create_colony(colony)
    assert created_colony.id is not None

    state = service.get_state(created_colony.id)

    assert state["size"] == 5
    assert state["profit_factor"] == 8  # Base(2)+Placated(1)+Productive(2)+Orderly(2)+Leadership(1)


def test_colony_service_raises_for_missing_colony():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider(), InMemoryColonyUserRepository())

    with pytest.raises(NotFoundError):
        service.get_state(999)


def test_representative_service_assigns_colony():
    colony_repo = InMemoryColonyRepository()
    representative_repo = InMemoryRepresentativeRepository()
    colony_service = ColonyService(colony_repo, representative_repo, FakeRuleConfigProvider(), InMemoryColonyUserRepository())
    representative_service = RepresentativeService(colony_repo, representative_repo)

    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type=ColonyType.RESEARCH_MISSION,
        age_days=0,
        age_last_updated=datetime.now(UTC).date(),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
    )
    created_colony = colony_service.create_colony(colony)
    assert created_colony.id is not None
    representative = Representative(
        name="Test Rep",
        type=RepresentativeType.JUDGE,
        personalities=[Personality(name="Calm", description="desc", stat_effects=[])],
        stats=RepresentativeStats(ws=10, bs=10, s=10, t=10, ag=10, int=10, per=10, wp=10, fel=10),
        skills=[Skill(name="Skill", level=SkillLevel.KNOWN, description="desc")],
        talents=[Talent(name="Talent", description="desc")],
    )
    created_rep = representative_service.create_representative(representative)
    assert created_rep.id is not None

    updated = representative_service.assign_to_colony(created_colony.id, created_rep.id)

    assert updated.assigned_to_colony_id == created_colony.id
