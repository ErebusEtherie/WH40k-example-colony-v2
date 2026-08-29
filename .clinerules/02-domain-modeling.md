# Domain Modeling

## Pydantic is used throughout — but for three *different* model families

Pydantic is the default for models across the project. That does not mean
one model per concept. Keep these separate, even when they look identical
today:

1. **Domain models** (`domain/models/`) — `Colony`, `Representative`,
   `Infrastructure`, `SupportUpgrade`, etc. Validators here encode *business*
   invariants, not just shape:
   - `Order`, `Complacency`, `Productivity`, `Piety` cannot go below 0.
   - Derived state (e.g. "Placated", "Anarchy") is a computed property
     derived from stat values and thresholds — never stored redundantly.
2. **API schemas** (`adapters/api/schemas/`) — separate Pydantic models for
   request/response bodies. Expect these to diverge from domain models
   quickly (pagination, partial-update payloads, display-only fields). Map
   explicitly between the two; don't return a domain model directly from an
   endpoint.
3. **Persistence models** (`adapters/persistence/models.py`) — SQLModel or
   SQLAlchemy models (or a Pydantic model tied to the storage schema), with
   explicit mapping to/from the domain model.

Collapsing these into one model is the single easiest anti-pattern to fall
into given "Pydantic everywhere" — call it out explicitly if you see it
happening.

## Rule tables are data, not code

The infrastructure/upgrade bonus tables, colony-size-to-PF mapping, and
similar lookup tables (see the "Data" sheet in the reference spreadsheet)
belong in `config/` as JSON or YAML, loaded at startup into typed structures
(Pydantic models validating the config shape). Do not encode them as
if/elif chains or scattered numeric literals in the rule engine.

Benefits this is meant to protect:

- Houserules/balance changes don't require touching engine code.
- The rule engine becomes trivially testable against known table values.
- Magic numbers don't leak into business logic.

## Modifier storage architecture

Modifiers come from two sources with different persistence strategies:

**Stored modifiers** (persisted in colony.modifiers):
- Missing infrastructure penalty (computed once, stored for efficiency)
- GM custom modifiers (user-defined, need persistence)
- Event effects (GM-created during play, may include expiry tracking if specified by GM)

**Computed modifiers** (calculated on-the-fly from entities):
- Infrastructure bonuses (derived from Infrastructure entities and their state)
- Support upgrade bonuses (derived from SupportUpgrade entities)
- Representative personality effects (derived from Representative traits)

The ColonyStateCalculator combines both sources when calculating stats. This hybrid approach:
- Avoids data duplication (infrastructure bonuses aren't stored twice)
- Ensures bonuses automatically update when entities change
- Keeps stored modifiers for things that can't be recomputed (GM custom, expired events)


## The rule engine itself

- Pure functions or stateless classes: `(colony_state, rule_tables) →
  derived_state`. No I/O, no mutation of arguments, no hidden globals.
- State transitions (Placated, Anarchy, Productive, Halted, Heretical,
  Pious, etc.) should be explicit enums, computed from thresholds defined
  once in the rule tables — not re-derived ad hoc wherever they're needed.
- Cascading effects (e.g. a faulty Power Network dropping both Productivity
  and Complacency) should be modeled as an explicit list of modifiers
  applied in a defined order, not as nested conditionals per stat.

## Do not invent game rules

If a calculation, threshold, or interaction isn't clearly present in the
reference data or explicitly described by the user, do not guess a
plausible-sounding number or rule. See `06-collaboration-and-uncertainty.md`.
