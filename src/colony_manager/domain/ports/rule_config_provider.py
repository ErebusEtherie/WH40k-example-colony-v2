"""Repository protocol for rule configuration data."""

from __future__ import annotations

from typing import Protocol

from colony_manager.domain.enums import LoreState, ModifierStat


class RuleConfigProvider(Protocol):
    def get_base_profit_factor(self, size: int) -> int:
        ...

    def get_leadership_modifier(self, stat_bonus: int) -> int:
        ...

    def get_lore_state_for_stat(self, stat: ModifierStat, value: int, size: int) -> LoreState:
        ...

    def get_colony_type_config(self, colony_type_name: str) -> dict[str, object]:
        ...

    def get_event_roll_interval_days(self) -> int:
        """Get the global event roll interval in days (default: 60)."""
        ...

    def get_development_roll_interval_days(self) -> int:
        """Get the global development roll interval in days (default: 90)."""
        ...
    
    def get_pf_state_bonuses(self) -> dict[str, int]:
        """Get Profit Factor bonuses for colony states (placated, productive, orderly)."""
        ...

    def get_infrastructure_type_config(self, infrastructure_name: str) -> dict[str, object]:
        """Get infrastructure type configuration by name."""
        ...

    def get_representative_type_config(self, representative_name: str) -> dict[str, object]:
        """Get representative type configuration by name."""
        ...

    def get_support_upgrade_config(self, upgrade_name: str) -> dict[str, object]:
        """Get support upgrade configuration by name."""
        ...

    # List accessors for API endpoints
    @property
    def colony_types(self) -> list:
        """Get list of all colony type configurations."""
        ...

    @property
    def representative_types(self) -> list:
        """Get list of all representative type configurations."""
        ...

    @property
    def infrastructure_types(self) -> list:
        """Get list of all infrastructure type configurations."""
        ...

    @property
    def support_upgrades(self) -> list:
        """Get list of all support upgrade configurations."""
        ...

    def get_profit_factor_table(self) -> dict[str, int]:
        """Get colony size to profit factor lookup table."""
        ...

    def get_lore_thresholds(self) -> dict[str, object]:
        """Get threshold configuration for state transitions."""
        ...
