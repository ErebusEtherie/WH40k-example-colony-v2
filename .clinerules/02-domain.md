# Domain Modeling Constraints

## Model Separation

Keep three model families separate:

1. **Domain models** (`domain/models/`) — business invariants
2. **API schemas** (`adapters/api/schemas/`) — request/response shapes
3. **Persistence models** (`adapters/persistence/`) — storage schema

Do not collapse these into one model. Map explicitly between them.

## Schema Reuse

One schema per resource shape, reused across endpoints. Don't let two
modules independently define the same response shape. If endpoints need
different fields, use different names (`AuthUserResponse` vs `UserResponse`).

## Rule Tables

Rule tables (bonuses, thresholds, costs) live in `config/` as YAML, loaded
into typed structures. Do not encode as if/elif chains or scattered literals.

## Request Design

Prefer separate endpoints for semantically different operations (relative
vs absolute, additive vs destructive). Reserve mutual-exclusivity
validators for same-shape operations differing only by sign/direction.

## What NOT to do

- Don't store derived state (Placated, Anarchy) redundantly — compute it
- Don't invent game rules not in reference data — ask instead
