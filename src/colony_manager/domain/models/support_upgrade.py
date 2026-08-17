"""Domain model for support upgrades."""

from pydantic import BaseModel, ConfigDict

from colony_manager.domain.enums import ModifierStat, SupportUpgradeType


class SupportUpgrade(BaseModel):
    """
    Support Upgrades are non-essential but highly valuable additions that
    improve the health, productivity, and well-being of the colony.
    
    Acquiring these requires the successful completion of a Lesser or
    Greater Endeavour.
    """
    model_config = ConfigDict(validate_assignment=True)
    
    id: int | None = None
    colony_id: int
    upgrade_type: SupportUpgradeType
    # For Cultural Improvement: which stat was chosen
    custom_stat_choice: ModifierStat | None = None
    # For Industrial Facility: what product is defined
    custom_product: str | None = None
    # For Contacts: which organization/group
    affiliated_group: str | None = None
    
    @property
    def has_stat_effect(self) -> bool:
        """Check if this upgrade provides a stat bonus."""
        return self.custom_stat_choice is not None or self.upgrade_type in (
            SupportUpgradeType.ARBITES_PRECINCT,
            SupportUpgradeType.ECCLESIOARCHY_MISSION,
            SupportUpgradeType.MECHANICUM_STATION,
            SupportUpgradeType.INFANTRY_GARRISON,
            SupportUpgradeType.IMPERIAL_NAVY_STATION,
            SupportUpgradeType.INDUSTRIAL_FACILITY,
            SupportUpgradeType.PERSONAL_LODGINGS,
            SupportUpgradeType.TRAPPINGS,
        )