# Architecture

## Layering

Use a pragmatic layered architecture — clear boundaries, without full
hexagonal/DDD ceremony (no aggregates, no CQRS, no event sourcing unless a
real need emerges).

```text
src/
  domain/          # pure business logic, zero I/O
  application/      # use cases / services, orchestrates domain + ports
  adapters/
    persistence/     # SQLite (or SQLModel/SQLAlchemy) repository impl
    io/              # JSON/YAML import & export
    api/             # FastAPI routers, request/response schemas
    cli/             # command-line entry points
  config/            # rule-table data (bonuses, thresholds, costs) as
                      # JSON/YAML, loaded into typed structures
```

## Dependency direction

Dependencies point inward only: `adapters → application → domain`. Domain
code must never import from `application` or `adapters`. If a domain class
needs something from outside (persistence, current time, RNG for dice
rolls), define the interface *in* `domain` (a `Protocol` or `ABC`) and
implement it in `adapters`. This is dependency inversion, applied only where
it's actually needed — not as a rule to sprinkle everywhere.

Concretely for this project:

- `domain` defines `ColonyRepository` (interface) — `adapters/persistence`
  implements it against SQLite.
- `domain` defines a `DiceRoller` interface if rules require randomness
  (e.g. 1d10 rolls for events) — so tests can inject a deterministic
  fake instead of mocking `random`.

## API relationship

The API is the primary consumer of the domain/application layers. Any future
frontends (web, desktop, CLI) interact with the system through the API — they
do not import Python domain code directly. This keeps the architecture clean:
if direct access to domain internals is needed, that's a sign the API is
missing a capability, not a reason to bypass it.

## When to introduce an abstraction

Before adding an interface, base class, plugin mechanism, or shared helper,
check:

1. Is this used in at least two places right now (not "will be")?
2. Is the duplication it removes actually causing a maintenance problem?
3. Does the abstraction make the code easier or harder to follow for someone
   new to it?

If the answer doesn't clearly favor abstracting, write the direct/duplicated
version instead. This applies especially to the rule engine, where it can be
tempting to build a generic "modifier system" before it's clear what shape
the modifiers actually need.

## What NOT to do

- Don't let API request/response models double as domain models (see
  `02-domain-modeling.md`).
- Don't put business logic (thresholds, stacking rules, PF calculation) in
  API route handlers or CLI commands — those are adapters, they call into
  `application`/`domain` and format the result.
- Don't reach for a plugin/strategy pattern for the rule engine until there's
  a concrete second case that needs it.
