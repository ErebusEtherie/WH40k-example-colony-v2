# Testing Strategy

## Tools

- `pytest` for all tests.
- `hypothesis` for property-based testing of the rule engine's numeric core.

## Prioritize by risk, not by coverage percentage

Not all code deserves the same testing investment. Risk here means: how
easy is it to get subtly wrong, and how bad is it if it's wrong silently?

**High risk — test heavily, including with hypothesis:**
- Stat derivation and stacking (multiple infrastructure/upgrade modifiers
  combining).
- Threshold-based state transitions (Order == 0 → Anarchy; Complacency >
  Size → Placated; Productivity == 0 → halved Profit Factor, etc.).
- Profit Factor calculation with all its modifiers and penalties.

For these, write explicit example-based tests for the documented boundary
cases (the ones visible in the reference sheet/rules text), *and*
hypothesis-based property tests for invariants that should hold regardless
of input, e.g.:
- Stats never go below 0 regardless of how many penalties stack.
- Order == 0 always forces Profit Factor to 0, regardless of other
  modifiers.
- Adding a working infrastructure item never decreases the stat it's
  documented to increase.

**Medium risk — standard pytest, a handful of cases:**
- Use cases/application services (e.g. "install upgrade", "advance cycle")
  — test orchestration and error handling, not the math they delegate to
  the rule engine (that's already covered separately).
- Repository and importer/exporter round-trips (save then load returns an
  equivalent domain object).

**Lower risk — light coverage is fine:**
- API request/response schema validation (Pydantic mostly does this for
  you — test the interesting edge cases, not every field).
- CLI argument parsing.

## Test code follows the same anti-abstraction guardrail

Don't build shared fixtures, factories, or test helpers until duplication
across tests actually causes a maintenance problem. A few repeated lines of
setup across 2-3 tests is not that problem; a `ColonyBuilder` used in one
test file is premature.

## What NOT to do

- Don't mock the domain layer in domain tests — it has no I/O, so there's
  nothing to mock. If you find yourself wanting to mock something inside
  `domain`, that's a sign an interface (like `DiceRoller`) is missing.
- Don't test the rule engine indirectly through the API in unit tests —
  API tests should confirm wiring/serialization, not re-verify game math
  already covered at the domain level.
