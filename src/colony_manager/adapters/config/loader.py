"""Configuration loading and validation for the colony manager."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from colony_manager.domain.enums import LoreState, ModifierStat
from colony_manager.domain.errors import ConfigurationError
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider
from colony_manager.adapters.config.schemas import (
    ColonyTypeConfig,
    LeadershipModifierEntry,
    PersonalityConfig,
    ProfitFactorSizeEntry,
    RuleTablesConfig,
)


class FileRuleConfigProvider(RuleConfigProvider):
    """Load rule config from YAML files and expose it via the protocol."""

    def __init__(self, config_dir: str | Path | None = None) -> None:
        self.config_dir = Path(config_dir or Path(__file__).resolve().parents[3] / "config")
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self._colony_types = self._load_colony_types()
        self._personalities = self._load_personalities()
        self._rule_tables = self._load_rule_tables()

    def get_base_profit_factor(self, size: int) -> int:
        entries = [entry for entry in self._rule_tables.size_to_profit_factor if entry.size == size]
        if not entries:
            raise ConfigurationError(f"No profit factor mapping for size {size}")
        return entries[0].profit_factor

    def get_leadership_modifier(self, stat_bonus: int) -> int:
        if not self._rule_tables.leadership_modifier:
            raise ConfigurationError("No leadership modifier entries configured")

        exact_matches = [entry for entry in self._rule_tables.leadership_modifier if entry.stat_bonus == stat_bonus]
        if exact_matches:
            return exact_matches[0].modifier

        closest = min(
            self._rule_tables.leadership_modifier,
            key=lambda entry: (abs(entry.stat_bonus - stat_bonus), abs(entry.stat_bonus)),
        )
        return closest.modifier

    def get_lore_state_for_stat(self, stat: ModifierStat, value: int, size: int) -> LoreState:
        thresholds = self._rule_tables.lore_thresholds
        if stat == ModifierStat.COMPLACENCY:
            if value > size:
                return LoreState.PLACATED
            if value == 0:
                raise NotImplementedError("Complacency == 0 label is not confirmed")
            return LoreState.STABLE
        if stat == ModifierStat.ORDER:
            if value == 0:
                return LoreState.ANARCHY
            if value > size:
                raise NotImplementedError("Order > size label is not confirmed")
            return LoreState.STABLE
        if stat == ModifierStat.PRODUCTIVITY:
            if value > size:
                return LoreState.PRODUCTIVE
            if value == 0:
                return LoreState.HALTED
            return LoreState.STABLE
        if stat == ModifierStat.PIETY:
            if value > size:
                return LoreState.PIOUS
            if value == 0:
                return LoreState.HERETICAL
            return LoreState.STABLE
        raise ConfigurationError(f"Unsupported stat for lore state lookup: {stat}")

    @property
    def colony_types(self) -> list[ColonyTypeConfig]:
        return self._colony_types

    @property
    def personalities(self) -> list[PersonalityConfig]:
        return self._personalities

    def _load_colony_types(self) -> list[ColonyTypeConfig]:
        return self._load_yaml_list("colony_types.yaml", ColonyTypeConfig)

    def _load_personalities(self) -> list[PersonalityConfig]:
        return self._load_yaml_list("personalities.yaml", PersonalityConfig)

    def _load_rule_tables(self) -> RuleTablesConfig:
        path = self.config_dir / "rule_tables.yaml"
        if not path.exists():
            raise ConfigurationError(f"Missing config file: {path}")
        try:
            with path.open("r", encoding="utf-8") as handle:
                data = yaml.safe_load(handle) or {}
        except yaml.YAMLError as exc:  # pragma: no cover - exercised via invalid YAML
            raise ConfigurationError(f"Invalid YAML in {path}: {exc}") from exc
        try:
            return RuleTablesConfig.model_validate(data)
        except Exception as exc:  # pragma: no cover - exercised via invalid config
            raise ConfigurationError(f"Invalid rule tables config: {exc}") from exc

    def _load_yaml_list(self, filename: str, model_type: type[Any]) -> list[Any]:
        path = self.config_dir / filename
        if not path.exists():
            raise ConfigurationError(f"Missing config file: {path}")
        try:
            with path.open("r", encoding="utf-8") as handle:
                data = yaml.safe_load(handle) or []
        except yaml.YAMLError as exc:  # pragma: no cover - exercised via invalid YAML
            raise ConfigurationError(f"Invalid YAML in {path}: {exc}") from exc
        if not isinstance(data, list):
            raise ConfigurationError(f"Expected a list in {path}")
        try:
            return [model_type.model_validate(item) for item in data]
        except Exception as exc:  # pragma: no cover - exercised via invalid config
            raise ConfigurationError(f"Invalid {filename} config: {exc}") from exc
