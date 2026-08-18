"""Support Upgrade API schemas."""

from pydantic import BaseModel, Field

from colony_manager.domain.enums import ModifierStat, SupportUpgradeType


class SupportUpgradeCreate(BaseModel):
    """Schema for creating new support upgrade."""

    upgrade_type: SupportUpgradeType
    # Optional fields for specific upgrade types
    custom_stat_choice: ModifierStat | None = None  # For Cultural Improvement
    custom_product: str | None = None  # For Industrial Facility
    affiliated_group: str | None = None  # For Contacts


class SupportUpgradeUpdate(BaseModel):
    """Schema for updating support upgrade (partial update)."""

    custom_stat_choice: ModifierStat | None = None
    custom_product: str | None = None
    affiliated_group: str | None = None


class SupportUpgradeResponse(BaseModel):
    """Full support upgrade response."""

    id: int
    colony_id: int
    upgrade_type: SupportUpgradeType
    custom_stat_choice: ModifierStat | None
    custom_product: str | None
    affiliated_group: str | None
    has_stat_effect: bool


class SupportUpgradeListItem(BaseModel):
    """Summary information for support upgrade list."""

    id: int | None
    upgrade_type: SupportUpgradeType
    custom_stat_choice: ModifierStat | None
    custom_product: str | None
    affiliated_group: str | None
    has_stat_effect: bool