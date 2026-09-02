"""Tests for SupportUpgrade domain model validators and properties."""

from colony_manager.domain.enums import ModifierStat, SupportUpgradeType
from colony_manager.domain.models.support_upgrade import SupportUpgrade


class TestSupportUpgradeProperties:
    """Tests for SupportUpgrade computed properties."""

    def test_has_stat_effect_custom_stat_choice(self):
        """has_stat_effect is True when custom_stat_choice is set."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT,
            custom_stat_choice=ModifierStat.ORDER,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_false_for_cultural_without_choice(self):
        """has_stat_effect is False for Cultural Improvement without stat choice."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT,
            custom_stat_choice=None,
        )
        assert upgrade.has_stat_effect is False

    def test_has_stat_effect_arbites_precinct(self):
        """Arbites Precinct has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.ARBITES_PRECINCT,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_ecclesiarchy_mission(self):
        """Ecclesiarchy Mission has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.ECCLESIOARCHY_MISSION,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_mechanicum_station(self):
        """Mechanicum Station has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.MECHANICUM_STATION,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_infantry_garrison(self):
        """Infantry Garrison has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.INFANTRY_GARRISON,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_imperial_navy_station(self):
        """Imperial Navy Station has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.IMPERIAL_NAVY_STATION,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_industrial_facility(self):
        """Industrial Facility has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.INDUSTRIAL_FACILITY,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_personal_lodgings(self):
        """Personal Lodgings has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.PERSONAL_LODGINGS,
        )
        assert upgrade.has_stat_effect is True

    def test_has_stat_effect_trappings(self):
        """Trappings has stat effect."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.TRAPPINGS,
        )
        assert upgrade.has_stat_effect is True

    def test_optional_fields_can_be_none(self):
        """Optional fields (custom_stat_choice, custom_product, affiliated_group) can be None."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CULTURAL_IMPROVEMENT,
            custom_stat_choice=None,
            custom_product=None,
            affiliated_group=None,
        )
        assert upgrade.custom_stat_choice is None
        assert upgrade.custom_product is None
        assert upgrade.affiliated_group is None

    def test_can_set_custom_product(self):
        """Industrial Facility can have custom_product set."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.INDUSTRIAL_FACILITY,
            custom_product="Lasgun Components",
        )
        assert upgrade.custom_product == "Lasgun Components"

    def test_can_set_affiliated_group(self):
        """Contacts upgrade can have affiliated_group set."""
        upgrade = SupportUpgrade(
            colony_id=1,
            upgrade_type=SupportUpgradeType.CONTACTS,
            affiliated_group="Rogue Traders",
        )
        assert upgrade.affiliated_group == "Rogue Traders"
