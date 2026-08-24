from datetime import date

from colony_manager.adapters.io.colony_exporter import ColonyExporter
from colony_manager.adapters.io.colony_importer import ColonyImporter
from colony_manager.domain.enums import (
    ModifierCategory,
    ModifierSourceType,
    ModifierStat,
    RepresentativeType,
    SkillLevel,
)
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.representative import (
    Personality,
    Representative,
    RepresentativeStats,
    Skill,
    Talent,
)


def test_export_and_import_round_trip(tmp_path):
    colony = Colony(
        name="Exported Colony",
        owner="Owner",
        colony_type="research_mission",
        age_days=3,
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
                modifier_category=ModifierCategory.CUSTOM,
                modifier_stat=ModifierStat.ORDER,
                modifier_value=2,
                modifier_description="test",
                is_active=True,
            )
        ],
    )
    representative = Representative(
        name="Rep",
        type=RepresentativeType.JUDGE,
        personalities=[Personality(name="Calm", description="desc", effect="effect")],
        stats=RepresentativeStats(ws=10, bs=10, s=10, t=10, ag=10, int=10, per=10, wp=10, fel=10),
        skills=[Skill(name="Skill", level=SkillLevel.KNOWN, description="desc")],
        talents=[Talent(name="Talent", description="desc")],
    )

    path = tmp_path / "colony.json"
    exporter = ColonyExporter()
    exporter.export(colony=colony, representative=representative, path=path)

    importer = ColonyImporter()
    import_data = importer.import_from_path(path)
    imported_colony = import_data["colony"]
    imported_rep = import_data["representative"]

    assert imported_colony.name == colony.name
    assert imported_colony.modifiers[0].modifier_description == "test"
    assert imported_rep is not None
    assert imported_rep.name == representative.name
