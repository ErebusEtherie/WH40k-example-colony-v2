"""Configuration module for rule tables and game data."""

from colony_manager.config.loader import get_config, load_and_set_config, load_config
from colony_manager.config.models import RuleTablesConfig

__all__ = ["RuleTablesConfig", "get_config", "load_and_set_config", "load_config"]