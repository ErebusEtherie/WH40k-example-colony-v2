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
