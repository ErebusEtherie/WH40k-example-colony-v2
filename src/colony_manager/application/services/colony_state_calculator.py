"""Service for calculating derived colony state."""

from __future__ import annotations

from datetime import date

from colony_manager.domain.enums import ModifierStat
from colony_manager.domain.models.colony import Colony
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider
from colony_manager.domain.rules.lore_state_resolver import resolve_lore_state
from colony_manager.domain.rules.profit_factor_calculator import calculate_profit_factor
from colony_manager.domain.rules.size_calculator import calculate_size
from colony_manager.domain.rules.stat_calculator import calculate_stat


class ColonyStateCalculator:
    """
    Assemble a colony's derived state from domain rules.
    
    Filters out expired modifiers before calculating stats to ensure
    time-based modifier expiry is respected.
    """

    def __init__(self, config_provider: RuleConfigProvider) -> None:
        self._config_provider = config_provider

    def _get_active_modifiers(self, colony: Colony, as_of: date | None = None) -> list:
        """
        Get all non-expired, active modifiers for a colony.
        
        Args:
            colony: The colony to get modifiers for.
            as_of: Date to check expiry against. Defaults to today.
        
        Returns:
            List of modifiers that are active and not expired.
        """
        return [
            mod for mod in colony.modifiers
            if mod.is_active and not mod.is_expired(as_of)
        ]

    def calculate(self, colony: Colony, as_of: date | None = None) -> dict[str, object]:
        """
        Calculate the current derived state for a colony.
        
        Args:
            colony: The colony to calculate state for.
            as_of: Date to check modifier expiry against. Defaults to today.
        
        Returns:
            Dict with calculated stats: size, complacency, order, productivity,
            piety, leadership_modifier, profit_factor, lore_state.
        """
        active_modifiers = self._get_active_modifiers(colony, as_of)
        
        current_size = calculate_size(colony.base_size, active_modifiers)
        current_complacency = calculate_stat(colony.base_complacency, active_modifiers, ModifierStat.COMPLACENCY)
        current_order = calculate_stat(colony.base_order, active_modifiers, ModifierStat.ORDER)
        current_productivity = calculate_stat(
            colony.base_productivity,
            active_modifiers,
            ModifierStat.PRODUCTIVITY,
        )
        current_piety = calculate_stat(colony.base_piety, active_modifiers, ModifierStat.PIETY)
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
            active_modifiers,
            leadership_modifier,
            current_order > current_size,
            self._config_provider.get_pf_state_bonuses(),
        )
        return {
            "size": current_size,
            "complacency": current_complacency,
            "order": current_order,
            "productivity": current_productivity,
            "piety": current_piety,
            "leadership_modifier": leadership_modifier,
            "profit_factor": profit_factor,
            "lore_state": {
                "size": "stable",
                "complacency": resolve_lore_state(ModifierStat.COMPLACENCY, current_complacency, current_size).value,
                "order": resolve_lore_state(ModifierStat.ORDER, current_order, current_size).value,
                "productivity": resolve_lore_state(ModifierStat.PRODUCTIVITY, current_productivity, current_size).value,
                "piety": resolve_lore_state(ModifierStat.PIETY, current_piety, current_size).value,
            },
        }
