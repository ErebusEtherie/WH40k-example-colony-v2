# Context: Database Migration

Applies when the change touches the persistent schema or existing data.
Additional rules on top of the base rules.

## Canonical migration location

- Alembic migrations live in `alembic/versions/` (configured by
  `alembic.ini`, `script_location = alembic`). Each has a `revision` /
  `down_revision` chain and `upgrade()` / `downgrade()`.
- Apply with `python -m alembic upgrade head`.
- The older `src/colony_manager/adapters/persistence/migrations/` script is
  a hand-run legacy migration (raw sqlite3, not part of the Alembic chain)
  — do not extend that pattern; use Alembic for new migrations.

## Before creating a migration

1. Read the current schema from `src/colony_manager/domain/models/`
   (source of truth) and `src/colony_manager/adapters/persistence/orm_models.py`.
2. Check `src/colony_manager/adapters/persistence/mappers.py` for the
   mapping layer affected.
3. Read the most recent file in `alembic/versions/` to follow the
   established revision pattern.

## Migration contents

Every Alembic migration MUST include:

- `upgrade()` with explicit, reversible column/table operations.
- `downgrade()` that reverses `upgrade()`.
- A comment explaining the business reason for the change.

## Data transformation

If the migration transforms data:

- Separate schema changes from data changes within the migration.
- Make the data change idempotent (safe to re-run).

## Testing

- Test both `upgrade` and `downgrade` on a scratch database.
- If adding indexes on large tables, test with realistic data volumes.

## Files to inspect

- `alembic/versions/` (recent migrations, revision chain)
- `src/colony_manager/adapters/persistence/orm_models.py`
- `src/colony_manager/adapters/persistence/mappers.py`
- `src/colony_manager/domain/models/` (source of truth)
- `docs/persistence.md`

## Completion checklist

- [ ] Migration created in `alembic/versions/` (or reason it is not needed)
- [ ] `upgrade()` and `downgrade()` both present and tested
- [ ] ORM model updated (if needed)
- [ ] Mappers updated (if needed)
- [ ] Domain model updated (if the domain changed)
