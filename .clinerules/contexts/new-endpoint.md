# Context: New API Endpoint

Applies when adding or changing a REST endpoint. Additional rules on top
of the base rules.

## Before implementation

1. Read `docs/api.md` and check `docs/api/openapi.json` for existing shapes.
2. Read a similar existing endpoint in
   `src/colony_manager/adapters/api/routers/`.
3. Check whether the schema already exists in
   `src/colony_manager/adapters/api/schemas/`.

## Implementation order

1. Domain model changes (if the domain changes) in `domain/models/`.
2. Repository method (if new persistence is needed) — add the matching
   Protocol in `domain/ports/` and its implementation in
   `adapters/persistence/repositories/`.
3. API schema (request/response) in `adapters/api/schemas/`.
4. Route handler — register the router in `adapters/api/app.py`.
5. Tests.

## Schema reuse

One schema per resource shape. Before defining a new one:

- Does a schema for this resource shape already exist in
  `adapters/api/schemas/`?
- Does this endpoint need a different shape, or reuse/extend the existing
  one? Prefer reuse.

## Route handler constraints

- Keep handlers thin: delegate business logic to a service in
  `application/services/`.
- Return appropriate status codes: 404 (missing), 422 (validation),
  409 (domain-rule rejection).
- Apply auth/permission dependencies from `adapters/api/middleware/` as
  needed.

## After implementation

- Regenerate `docs/api/openapi.json` (via `scripts/export_openapi.py`) and
  re-run `npm run generate:types` so frontend types match.

## Completion checklist

- [ ] Schema defined or reused
- [ ] Route implemented and registered
- [ ] Error handling for 404 / 422 / 409 where applicable
- [ ] Tests: success case
- [ ] Tests: error cases
- [ ] OpenAPI regenerated + frontend types regenerated
