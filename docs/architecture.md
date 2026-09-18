# Architecture

## Repository layout

```
src/colony_manager/
├── adapters/
│   ├── api/            # FastAPI app factory, routers, schemas, middleware (auth/csrf/rate-limit/security)
│   ├── persistence/    # SQLAlchemy ORM model, repositories, mappers, Alembic migrations
│   ├── cli/            # Typer CLI
│   ├── io/             # colony exporter (import/export)
│   └── config/         # YAML rule-table loader + typed schemas
├── application/services/   # use cases (ColonyService, AuthService, ...)
├── domain/
│   ├── models/         # business entities (Colony, Modifier, Representative, ...)
│   ├── rules/          # calculations (stat/size/lore-state/profit-factor, state effects)
│   ├── ports/          # repository Protocols
│   ├── util/           # auth, token, rounding
│   └── enums.py
└── config/settings.py  # env-driven settings (pydantic-settings)

config/                 # YAML rule tables (colony_types, rule_tables, infrastructure_types, ...)
src/                    # frontend (see frontend-architecture.md)
```

## Dependency direction

`adapters → application → domain`. Domain never imports from application or
adapters. External capabilities (persistence, time) are defined as Protocols
in `domain/ports/` and implemented in `adapters/persistence/`.

## API boundary

Frontends interact with the backend only through REST (`/api/v1`) and the
SSE notification stream. Never import Python domain code into frontend code.

## Three model families (kept separate)

1. **Domain models** (`domain/models/`) — business invariants, framework-agnostic.
2. **API schemas** (`adapters/api/schemas/`) — request/response shapes.
3. **Persistence models** (`adapters/persistence/orm_models.py`) — storage schema.

Mapped explicitly via `adapters/persistence/mappers.py`. Don't collapse the
families, and don't rely on Pydantic `.model_dump()` matching by accident.

## Rule engine

- Game-rule data lives in `config/*.yaml` (data, not code), loaded by
  `adapters/config/loader.py` into typed structures
  (`adapters/config/schemas.py`) and exposed to the domain through
  `domain/ports/rule_config_provider.py`.
- Derived values are **computed, never stored**: `stat_calculator.py`,
  `size_calculator.py`, `lore_state_resolver.py`,
  `profit_factor_calculator.py`, `state_effects.py`,
  `colony_type_effects.py`, `leadership_modifier_resolver.py`.

## Repository vs Import/Export

- **Repositories** (runtime SQLite storage): one Protocol per aggregate in
  `domain/ports/`, implemented in `adapters/persistence/repositories/`.
- **Importer/Exporter** (JSON portability): `adapters/io/colony_exporter.py`
  with `/colonies/{id}/export` and `/colonies/import`.
- Separate concerns, separate implementations — do not force them behind one
  interface.

## API app

- `adapters/api/app.py::create_app()` — FastAPI factory under prefix
  `/api/v1`; one router per resource; custom cookie-aware Swagger `/docs`;
  CORS from `ALLOWED_ORIGINS`; middleware stack: cookie auth, CSRF,
  rate limit, security headers.

## What NOT to do

- Don't let API models double as domain models.
- Don't put business logic in route handlers or CLI commands.
- Don't store derived state (lore states, PF) redundantly — compute it.
- Don't invent game rules not present in `config/` or the reference data.
