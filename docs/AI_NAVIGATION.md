# AI Navigation — WH40k Colony Manager

A single-file orientation to the codebase: where things live, the normal
patterns, and the anti-patterns to avoid. Read the relevant section
before diving into code; `docs/.manifest.yaml` maps tasks to docs.

All backend paths are under `src/colony_manager/`.

## Backend layer map

| Area | Where | What it is |
|---|---|---|
| Domain models | `domain/models/` | Business entities (Colony, Modifier, Representative, ...) |
| Domain rules | `domain/rules/` | Pure calculations (stat/size/lore-state/PF/state effects) |
| Domain ports | `domain/ports/` | Repository Protocols (interfaces, implemented in adapters) |
| Domain util | `domain/util/` | auth, token, rounding helpers |
| Application | `application/services/` | Use cases / orchestration |
| API | `adapters/api/` | FastAPI app, routers, schemas, middleware |
| Persistence | `adapters/persistence/` | ORM models, repositories, mappers |
| Migrations | `alembic/versions/` | Alembic migration chain (root `alembic/` per `alembic.ini`) |
| Import/Export | `adapters/io/` | JSON colony exporter/importer |
| Config loader | `adapters/config/` | YAML rule-table loader + typed schemas |
| Config data | `config/` | YAML rule tables (data, not code) |
| CLI | `adapters/cli/` | Typer CLI |

## Entry points by task

- **Add a stat / change calculations** → `domain/models/colony.py`,
  `domain/rules/stat_calculator.py`, `domain/rules/lore_state_resolver.py`,
  `domain/rules/profit_factor_calculator.py`, then
  `application/services/colony_state_calculator.py`.
- **Add a modifier type** → `domain/models/modifier.py`,
  `domain/rules/leadership_modifier_resolver.py`.
- **Add an endpoint** → new router in `adapters/api/routers/`, schema in
  `adapters/api/schemas/`, service in `application/services/`, port in
  `domain/ports/` if new persistence is needed. See
  `.clinerules/contexts/new-endpoint.md`.
- **Change persistence** → `adapters/persistence/orm_models.py` +
  `mappers.py` + a new migration in `alembic/versions/`. See
  `.clinerules/contexts/database-migration.md`.
- **Audit / verify docs, rules, or config** → narrow-scan discipline,
  claims-as-hypotheses, and secrets hygiene. See
  `.clinerules/contexts/investigation-audit.md`.
- **UI work** → frontend `src/` (below) + `docs/UI_REQ/SUMMARY.md`.

## Domain layer

- `domain/models/` = business invariants, framework-agnostic.
- `domain/rules/` = derived values computed on read; nothing stored.
- `domain/ports/` = Protocol interfaces; implementations live in
  `adapters/persistence/repositories/`.
- Anti-patterns: importing from application/adapters; storing derived
  values; encoding rule tables as literals instead of `config/*.yaml`.

## API layer

- One router per resource in `adapters/api/routers/`, registered in
  `adapters/api/app.py` under `/api/v1`.
- One schema per resource shape in `adapters/api/schemas/`, reused across
  endpoints; do not duplicate shapes.
- Middleware in `adapters/api/middleware/`: cookie auth, CSRF, rate limit,
  security headers, permissions.
- Route handlers stay thin — delegate business logic to services.
- Anti-patterns: business logic in a route handler; relying on
  `.model_dump()` mapping matching by accident.

## Persistence layer

- ORM models: `adapters/persistence/orm_models.py`.
- Repositories: `adapters/persistence/repositories/*_repository_impl.py`,
  one per `domain/ports/` Protocol.
- Mapping: `adapters/persistence/mappers.py` (explicit `to_domain` /
  `to_row`).
- Migrations: `alembic/versions/` is the canonical Alembic chain; the
  older `adapters/persistence/migrations/` script is a hand-run legacy
  migration (raw sqlite3) — do not extend that pattern.

## Test layout

- `tests/domain/` — pure domain/business logic (incl. Hypothesis).
- `tests/application/` — service/use-case tests.
- `tests/adapters/` — API, persistence, config, io.
- `tests/integration/` — end-to-end flows (auth, colony lifecycle,
  import/export).

## Frontend (repo root `src/`)

- `src/App.tsx`, `src/main.tsx` — app shell and entry.
- `src/components/` — presentational components.
- `src/lib/` — client wiring/hooks/utilities.
- `src/types/` — generated API types (`api.d.ts`, from `npm run generate:types`).
- `src/data/` — static frontend config (not game rule tables).
- `src/config/` — frontend configuration.
- `src/test/` — Vitest / React Testing Library / MSW tests.

## See also

- `docs/architecture.md` — full layering/architecture write-up.
- `docs/.manifest.yaml` — task → doc mapping.
- `.clinerules/10-context-budget.md` — how to keep inspection minimal.
