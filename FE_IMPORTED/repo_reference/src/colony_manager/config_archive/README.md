# Archived Configuration Module

## Purpose

This directory contains the legacy configuration loading system that was replaced in Phase 3-4 of the config migration (August 2026).

## Archived Files

### Core Module Files

- `__init__.py` - Old module exports for rule tables config
- `loader.py` - Legacy config loader using global state (`get_config()`, `load_and_set_config()`)
- `models.py` - Pydantic models for rule tables configuration

### Legacy Data Files

- `support_upgrades.yaml` - Old support upgrades configuration (replaced by root `config/support_upgrades.yaml`)
- `upgrade_limits.json` - Old upgrade limits configuration (now handled in domain rules)

## Migration Summary

The old system used:

- Global state via `load_and_set_config()` and `get_config()`
- Single `rule_tables.yaml` file with all config data
- Direct imports from `colony_manager.config`

The new system uses:

- Protocol-based `RuleConfigProvider` interface
- `FileRuleConfigProvider` implementation with singleton pattern
- Separate YAML files per config type in root `config/` directory
- Dependency injection via FastAPI's `Depends()`
- Application settings (`settings.py`) kept separate in `colony_manager.config.settings`

## What Was Kept

The `settings.py` file remains in `src/colony_manager/config/` because it handles:

- Application settings (JWT, CORS, database, logging)
- Environment variable configuration via pydantic-settings
- Security settings and password policies

This is intentionally separate from game rule configuration.

## Reference

For the new configuration system, see:

- `src/colony_manager/adapters/config/loader.py` - New config loader
- `src/colony_manager/adapters/config/schemas.py` - New config schemas
- `src/colony_manager/domain/ports/rule_config_provider.py` - Protocol definition
- `config/` (root directory) - YAML configuration files
