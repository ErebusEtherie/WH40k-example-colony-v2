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
   - **One schema per resource shape, reused across endpoints — don't let
     two modules independently define the same response shape.** If two
     endpoints return what is conceptually "the current user" (e.g. one
     defined in an `auth` schemas module, one in a `user` schemas module),
     that's one `UserResponse` class, imported by both, not two classes
     that happen to look alike today. FastAPI/OpenAPI will happily
     generate two long, near-duplicate schema names from this without
     complaint — the duplication doesn't announce itself, so it has to be
     caught by convention, not tooling. If the two endpoints genuinely need
     different fields (e.g. a login response intentionally omits something
     the user-management list includes), give them clearly different,
     intention-revealing names (`AuthUserResponse` vs. `UserResponse`)
     rather than two identically-shaped classes with different import
     paths — the second case is almost always an accident, not a decision.

3. **Persistence models** (`adapters/persistence/models.py`) — SQLModel or
   SQLAlchemy models (or a Pydantic model tied to the storage schema), with
   explicit mapping to/from the domain model.

Collapsing these into one model is the single easiest anti-pattern to fall
into given "Pydantic everywhere" — call it out explicitly if you see it
happening.

## Rule tables are data, not code

The infrastructure/upgrade bonus tables, colony-size-to-PF mapping, and
similar lookup tables (see the "Data" sheet in the reference spreadsheet)
belong in `config/` as **YAML** (confirmed — see `config/colony_types.yaml`
as the reference example), loaded at startup into typed structures
(Pydantic models validating the config shape). Do not encode them as
if/elif chains or scattered numeric literals in the rule engine, and don't
introduce JSON for new rule tables — YAML is the one format for this
purpose, for consistency with the existing config files.

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

## Auth & authorization domain

Per `00-overview.md`, this system is multi-user with two distinct
authorization dimensions. Both are domain concepts and belong here, not
scattered across adapter code:

1. **System role** — a global hierarchy on `User`: `viewer` <
   `colony_manager` < `admin`. This ordering is business logic (it decides
   who can do what) and must live in `domain` (e.g. a `Role` enum with a
   defined ordering/comparison, or an explicit `AuthorizationService` in
   `application` that consumes it) — not hardcoded as a dict literal inside
   an `adapters/api` dependency function. If you find a role-hierarchy
   mapping inside `adapters/api/auth.py` or similar, that's a violation of
   `01-architecture.md`'s dependency-direction rule and should be flagged
   and moved, not extended in place.
2. **Colony role** — a separate, per-colony membership level on
   `ColonyUser` (the join between `User` and `Colony`): `owner` / `editor`
   / `viewer`. This is scoped to one colony and answers a different
   question than system role ("can this user edit *this* colony" vs. "what
   can this user do at the system level"). Model it as its own enum; don't
   reuse or overload the system-role enum for it even though some level
   names look superficially similar ("viewer" appears in both — they are
   not the same value space).

Domain invariants worth encoding explicitly (confirm exact behavior with
the user before assuming — per `06-collaboration-and-uncertainty.md`):

- A colony has exactly one `owner` at a time; ownership transfer is an
  explicit operation (not just editing a membership role) and should read
  as one in the domain/application layer, not as a generic "update member"
  call that happens to change the role to `owner`.
- Deactivated users (`is_active = False`) should not be treated as
  authorized for anything regardless of their role — this check belongs
  next to the role-ordering logic, not duplicated ad hoc at each call site.

## Colony ↔ Representative relationship

**Confirmed cardinality: one-to-one.** A `Colony` has at most one
`Representative`; a `Representative` belongs to at most one `Colony` at a
time. Two consequences for how this is modeled and exposed:

**Canonical endpoint: colony-scoped, not representative-scoped.** The API
currently exposes this relationship two ways — `PUT`/`DELETE
/colonies/{colony_id}/representative` and `POST
/representatives/{rep_id}/assign` / `/unassign`. Keep the colony-scoped
pair as canonical and remove the representative-scoped one:

- The FE's actual interaction (an Assign/Unassign control on the colony
  screen) is naturally "set or clear this colony's representative slot" —
  that's what `PUT`/`DELETE .../colonies/{id}/representative` expresses
  directly. `PUT` is also the semantically correct verb here: assigning is
  idempotent and replaces whatever's currently in the slot, which matches
  REST's meaning of `PUT` better than the assign-as-action framing of
  `POST /representatives/{id}/assign`.
- Two endpoints doing the same underlying operation is exactly the
  duplication `01-architecture.md` warns against — one of them will
  quietly drift from the other's validation/side-effects over time. Remove
  `POST /representatives/{rep_id}/assign` and `/unassign`; route any
  existing caller through the colony-scoped pair instead.
- This also matches the existing style used for other 1:1-or-owned
  sub-resources on `Colony` (e.g. audit logs, members) — nested under the
  owning resource, not modeled as actions on the child.

**Colony-creation shortcut.** Creating a colony can optionally create its
Representative in the same request, auto-assigning it — this is a
convenience path on `ColonyCreate` (an optional nested representative
payload), not a separate call sequence the FE has to orchestrate
client-side. Domain-level, this means `RepresentativeCreate` must support
being created either standalone (for later assignment via the colony
endpoint) or inline as part of colony creation — both paths end at the
same "one representative, one colony" invariant.

**Open question — cascade behavior on reassignment (confirm before
implementing):** if a `Representative` already assigned to Colony A is
assigned to Colony B via `PUT /colonies/{B}/representative`, does that
silently unassign them from Colony A, or does the request get rejected
until Colony A explicitly unassigns first? Both are defensible; pick one
explicitly rather than letting whichever behavior the ORM/FK constraint
happens to produce become the de facto answer. Related: after `DELETE
.../representative` (unassign), does the `Representative` row persist as
an unassigned/orphaned entity available for reassignment, or is unassign
effectively a delete? The naming ("unassign," not "delete") suggests the
former — confirm this is intentional before it's load-bearing for the FE's
"pick an existing unassigned representative" flow, if one exists.

## Mutually exclusive request fields — prefer separate endpoints over optional-field soup

`ColonyAgeAdvance` currently has three optional fields (`add`, `set`,
`subtract`) with nothing in the schema preventing more than one being sent
at once — this is the general pattern to avoid, not just a one-off fix:

- **Confirmed fix:** split into two endpoints — one for the relative
  operation (`advance`, taking mutually-exclusive `add`/`subtract`) and a
  separate one for the absolute operation (`set`). A relative adjustment
  and an absolute overwrite are different operations with different
  semantics (and arguably different authorization/audit-logging
  requirements — "set the colony's age to X" is a more privileged action
  than "advance by N cycles"), so they shouldn't share one ambiguous
  request shape.
- **For the remaining `add`/`subtract` pair on the advance endpoint,**
  enforce mutual exclusivity at the schema level (a Pydantic
  `model_validator` rejecting a request with both set), not just in a
  docstring or the application-layer handler — the same principle as
  "don't invent a plausible-sounding rule," applied to request validation:
  an ambiguous request shape invites exactly the guessing this rule set
  tries to avoid elsewhere.
- **General principle for future endpoints:** if two operations on a
  resource are semantically different (relative vs. absolute, additive vs.
  destructive), prefer separate endpoints over one endpoint with optional
  fields selecting the operation. Reserve the mutual-exclusivity-validator
  pattern for cases where the operations are genuinely the same shape and
  only differ by sign/direction (as with `add`/`subtract` here).

## Do not invent game rules

If a calculation, threshold, or interaction isn't clearly present in the
reference data or explicitly described by the user, do not guess a
plausible-sounding number or rule. See `06-collaboration-and-uncertainty.md`.
