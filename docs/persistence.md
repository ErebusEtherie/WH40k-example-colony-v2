# Persistence

## Engine

**SQLite** is the only database. The URL is derived from `DATABASE_PATH`
(default `colony_manager.sqlite`) → `sqlite:///<absolute path>` in
`config/settings.py`. PostgreSQL appears only as a commented-out suggestion
in deployment notes — it is **not** used.

## Schema

SQLAlchemy 2.0 ORM models in `adapters/persistence/orm_models.py`. Tables:

`colonies` · `modifiers` · `infrastructure` · `support_upgrades` ·
`resources` · `representatives` · `events` · `development_plans` ·
`audit_logs` · `colony_users` · `users` · `token_blacklist` ·
`login_attempts` · `token_issuance`

### `colonies` (key columns)

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| name / founder_name | VARCHAR(255) | |
| patron_name | VARCHAR(255) | nullable |
| colony_type | VARCHAR(255) | enum string |
| age_days | INTEGER | ≥ 0 |
| age_last_updated | DATE | audit; auto-set when age changes |
| base_complacency / base_order / base_productivity / base_piety / base_size | INTEGER | from colony type |
| representative_id | INTEGER | FK → representatives, nullable (1:1) |
| dynasty_outcome | VARCHAR(255) | nullable |
| complacency_locked / order_locked / productivity_locked | BOOLEAN | crisis locks |
| planetary_resources | TEXT | JSON array |

IDs are **integers** (not UUIDs).

## Repository pattern

- One Protocol per aggregate in `domain/ports/` (e.g.
  `colony_repository.py`, `representative_repository.py`).
- SQLAlchemy implementations in `adapters/persistence/repositories/*.py`
  (e.g. `colony_repository_impl.py`).
- Explicit mapping (`to_domain()` / `to_row()`) lives in
  `adapters/persistence/mappers.py` — never rely on `.model_dump()`
  matching by accident.

## Schema evolution

- Alembic: `alembic.versions/` + `alembic.ini`; apply with
  `python -m alembic upgrade head`.
- Note assumptions likely to change in code comments; no migration tooling
  beyond Alembic.

## Import / Export

- Separate from repositories — JSON portability via
  `adapters/io/colony_exporter.py` and the routers
  `GET /colonies/{id}/export` · `POST /colonies/import`.
- Export carries the full colony graph; import assigns fresh IDs.
