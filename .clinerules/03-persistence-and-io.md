# Persistence & I/O

## Two separate capabilities, not one interface

Storage and portability are different concerns and should not be forced
behind the same abstraction:

1. **Repository** — the source of truth at runtime.
   - Interface defined in `domain` (e.g. `ColonyRepository` with `get`,
     `save`, `list`, `delete`).
   - Implemented in `adapters/persistence` against SQLite (SQLModel or
     SQLAlchemy recommended for migrations and querying).
2. **Importer/Exporter** — a separate service in `adapters/io` for
   JSON/YAML. This is how a user saves a portable colony file, shares it, or
   backs it up. It is *not* a second Repository backend.

Reasoning: trying to make flat-file storage satisfy the same interface as a
relational store usually forces the interface down to the lowest common
denominator (no querying, no partial updates), which then constrains the
"real" storage unnecessarily. Keep them separate and let each be good at its
job.

## Mapping

Both the Repository and the Importer/Exporter map between their own schema
and the domain model explicitly (e.g. `ColonyRow.to_domain()` /
`Colony.to_row()`, `ColonySaveFile.to_domain()` / `Colony.to_save_file()`).
Don't rely on Pydantic's `.model_dump()`/`.model_validate()` matching
by accident between unrelated models — that coupling breaks silently the
moment one model changes shape.

## Migrating from the existing Excel sheet

The current source of truth is an Excel workbook (Colony / Representative /
Data / Calculations sheets). Treat a one-off Excel importer as a **migration
utility**, not a core application feature:

- Put it in `tools/` or `scripts/`, separate from `adapters/io`.
- Its job is to read the existing workbook(s) and produce a JSON/YAML save
  file (or seed the SQLite DB directly) using the same Importer path the
  app would otherwise use — don't duplicate mapping logic.
- Expect it to be brittle/throwaway; don't over-engineer it or give it the
  same design rigor as the rest of the app.

## Schema evolution

Since this project is greenfield, don't add migration tooling (e.g. Alembic)
prematurely — but do note in code/comments any assumption likely to change
(e.g. "assumes one Representative per Colony") so it's easy to find when it
needs to.
