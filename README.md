# WH40k Colony Manager

Rogue Trader Colony Manager prototype for Warhammer 40k tabletop roleplaying.

## Overview

This repository contains a prototype of the Colony Manager system described in `business_analysis.md` and `architecture_phase_1.md`.

**Architecture:** Layered architecture with clean separation between domain, application, and adapters. The domain layer has zero I/O and zero framework coupling.

## Setup

1. Install Python 3.12+.
2. Install dependencies with `uv sync --extra dev`.
3. Run the test suite with `uv run pytest -q`.

## Project Layout

```
src/colony_manager/
├── domain/              # Pure business logic, zero I/O
│   ├── models/          # Domain entities (Colony, Representative, etc.)
│   ├── rules/           # Game rule calculations
│   ├── ports/           # Protocol interfaces (repositories, providers)
│   └── errors.py        # Domain exceptions
├── application/         # Use cases and services
│   └── services/        # Application services
├── adapters/
│   ├── api/             # FastAPI REST API
│   │   ├── routers/     # API endpoints
│   │   ├── middleware/  # Auth, rate limiting, security headers
│   │   └── dependencies.py  # Dependency injection
│   ├── config/          # Configuration provider implementation
│   ├── persistence/     # SQLAlchemy repositories
│   ├── io/              # JSON/YAML import/export
│   └── cli/             # Command-line interface
└── config/
    └── settings.py      # Application settings (JWT, CORS, database)

config/                  # Game rule configuration (YAML files)
tests/                   # Unit and integration tests
docs/                    # Documentation
.clinerules/             # Project rules and architecture guidance
```

## Test Status

**695 tests passing** (4 skipped) — 100% pass rate

See [`TESTING_TODO.md`](TESTING_TODO.md) for detailed test coverage.

## Configuration

### Game Rules

Game rule data (profit factor tables, infrastructure bonuses, thresholds) is stored in YAML files in the `config/` directory at the project root. These are loaded once at startup via the `RuleConfigProvider` singleton.

### Application Settings

Application settings (JWT secrets, CORS origins, database path) are loaded from environment variables via pydantic-settings. See `src/colony_manager/config/settings.py`.

## Notes

- Domain layer has **zero I/O** — all file/database access is in adapters
- Game rule data is **data, not code** — stored in YAML config files
- API uses **dependency injection** for all services and repositories
- See `.clinerules/` for detailed architecture and coding standards
