"""Configuration module for rule tables and game data."""

from colony_manager.config.loader import load_config, load_and_set_config, get_config
from colony_manager.config.models import RuleTablesConfig

__all__ = ["load_config", "load_and_set_config", "get_config", "RuleTablesConfig"]