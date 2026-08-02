from datetime import date

from colony_manager.adapters.persistence.colony_repository_impl import SqlAlchemyColonyRepository
from colony_manager.adapters.persistence.representative_repository_impl import SqlAlchemyRepresentativeRepository
from colony_manager.domain.enums import ModifierSourceType, ModifierStat, RepresentativeType, SkillLevel
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.representative import Personality, Representative, RepresentativeStats, Skill, Talent


def test_colony_repository_round_trip():
    repository = SqlAlchemyColonyRepository("sqlite:///:memory:")
    colony = Colony(
        name="Test Colony",
        owner="Owner",
        colony_type="example",
        age_days=5,
        age_last_updated=date(2024, 1, 1),
        base_complacency=10,
        base_order=10,
        base_productivity=10,
        base_piety=10,
        base_size=5,
        modifiers=[
            Modifier(
                colony_id=0,
                modifier_source_type=ModifierSourceType.GM_CUSTOM,
                modifier_stat=ModifierStat.ORDER,
                modifier_value=2,
                modifier_description="test",
                is_active=True,
            )
        ],
    )

    saved = repository.create(colony)
    loaded = repository.get(saved.id)

    assert loaded is not None
    assert loaded.name == colony.name
    assert loaded.modifiers[0].modifier_description == "test"


def test_representative_repository_round_trip():
    repository = SqlAlchemyRepresentativeRepository("sqlite:///:memory:")
    representative = Representative(
        name="Test Rep",
        type=RepresentativeType.JUDGE,
        personalities=[Personality(name="Calm", description="desc", effect="effect")],
        stats=RepresentativeStats(ws=10, bs=10, s=10, t=10, ag=10, int=10, per=10, wp=10, fel=10),
        skills=[Skill(name="Skill", level=SkillLevel.KNOWN, description="desc")],
        talents=[Talent(name="Talent", description="desc")],
    )

    saved = repository.create(representative)
    loaded = repository.get(saved.id)

    assert loaded is not None
    assert loaded.name == representative.name
    assert loaded.personalities[0].name == "Calm"
