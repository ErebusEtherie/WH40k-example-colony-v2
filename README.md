# WH40k Colony Manager

Rogue Trader Colony Manager prototype for Warhammer 40k tabletop roleplaying.

## Overview

This repository contains a prototype of the Colony Manager system described in `business_analysis.md` and `technical_analysis.md`.

## Setup

1. Install Python 3.12+.
2. Install dependencies with `uv sync --extra dev`.
3. Run the test suite with `uv run pytest -q`.

## Project Layout

- `src/colony_manager/` — source code.
- `config/` — YAML rule and type configuration.
- `tests/` — unit tests for domain, application, and adapters.
- `.clinerules/` — project rules and architecture guidance.

## Notes

- `config/*.yaml` currently contains placeholder entries. Replace them with confirmed game data before production use.
- `tools/excel_migration.py` is a stub for future Excel migration tooling.
