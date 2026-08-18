"""Service for calculating derived colony state."""

from __future__ import annotations

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider
from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state
from colony_manager.domain.rules.profit_factor_calculator import calculate_profit_factor
from colony_manager.domain.rules.size_calculator import calculate_size
from colony_manager.domain.rules.stat_calculator import calculate_stat


class ColonyStateCalculator:
    """Assemble a colony's derived state from domain rules."""

    def __init__(self, config_provider: RuleConfigProvider) -> None:
        self._config_provider = config_provider

    def calculate(self, colony: Colony) -> dict[str, object]:
        current_size = calculate_size(colony.base_size, colony.modifiers)
        current_complacency = calculate_stat(colony.base_complacency, colony.modifiers, ModifierStat.COMPLACENCY)
        current_order = calculate_stat(colony.base_order, colony.modifiers, ModifierStat.ORDER)
        current_productivity = calculate_stat(
            colony.base_productivity,
            colony.modifiers,
            ModifierStat.PRODUCTIVITY,
        )
        current_piety = calculate_stat(colony.base_piety, colony.modifiers, ModifierStat.PIETY)
        leadership_modifier = self._config_provider.get_leadership_modifier(
            max(
                current_order,
                current_complacency,
                current_productivity,
                current_piety,
            )
        )
        profit_factor = calculate_profit_factor(
            self._config_provider.get_base_profit_factor(current_size),
            current_complacency,
            current_order,
            current_productivity,
            current_piety,
            current_size,
            colony.modifiers,
            leadership_modifier,
        )
        return {
            "size": current_size,
            "complacency": current_complacency,
            "order": current_order,
            "productivity": current_productivity,
            "piety": current_piety,
            "leadership_modifier": leadership_modifier,
            "profit_factor": profit_factor,
            "lore_state": resolve_lore_state(ModifierStat.COMPLACENCY, current_complacency, current_size),
        }
