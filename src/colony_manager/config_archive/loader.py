"""Configuration loader for rule tables."""

from pathlib import Path
from typing import Any

import yaml

from colony_manager.config.models import RuleTablesConfig


def _convert_int_keys_to_str(obj: Any) -> Any:
    """Convert dict with int keys to dict with str keys for Pydantic compatibility."""
    if isinstance(obj, dict):
        return {
            str(k) if isinstance(k, int) else k: _convert_int_keys_to_str(v) for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [_convert_int_keys_to_str(item) for item in obj]
    return obj


def load_config(config_path: str | Path) -> RuleTablesConfig:
    """Load and validate configuration from YAML file.

    Args:
        config_path: Path to the rule_tables.yaml configuration file.

    Returns:
        Validated RuleTablesConfig object.

    Raises:
        FileNotFoundError: If config file doesn't exist.
        yaml.YAMLError: If config file is malformed YAML.
        pydantic.ValidationError: If config doesn't match expected schema.
    """
    config_path = Path(config_path)

    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with open(config_path, encoding="utf-8") as f:
        raw_config = yaml.safe_load(f)

    # Convert int keys to strings for Pydantic compatibility (e.g., leader_quality_modifiers)
    raw_config = _convert_int_keys_to_str(raw_config)

    return RuleTablesConfig.model_validate(raw_config)


# Global config instance - loaded at startup
_config: RuleTablesConfig | None = None


def get_config() -> RuleTablesConfig:
    """Get the global configuration instance.

    Returns:
        RuleTablesConfig object loaded at startup.

    Raises:
        RuntimeError: If config hasn't been loaded yet.
    """
    if _config is None:
        raise RuntimeError(
            "Configuration not loaded. Call load_and_set_config() during application startup."
        )
    return _config


def load_and_set_config(config_path: str | Path) -> RuleTablesConfig:
    """Load configuration and set it as the global instance.

    Args:
        config_path: Path to the rule_tables.yaml configuration file.

    Returns:
        Loaded RuleTablesConfig object.
    """
    global _config
    _config = load_config(config_path)
    return _config
