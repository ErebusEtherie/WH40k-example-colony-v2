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

## Test execution — hard constraints

Tests are not considered executed or passed until the test process has **completed**.

When running tests through `run_commands`:

1. Start the complete requested test command.
2. WAIT for the command/process to terminate.
3. Do not assume success from partial or intermediate output.
4. Do not continue implementation work while the test process is still running.
5. Inspect the FINAL process exit code.
6. Inspect the FINAL test summary/output.
7. Only after completion may you conclude that tests passed or failed.

### Test result rules

- Exit code `0` does not replace inspection of the final test output.
- A test run is **PASSING** only when the process has terminated and the final result indicates success.
- A test run is **FAILING** when the process has terminated with a failure exit code or the final test summary reports failures/errors.
- If the command was interrupted, terminated prematurely, timed out, or its final status cannot be determined, the test result is **UNKNOWN**, not PASSING.
- Partial output such as `10 passed` while additional tests are still running is NOT a completed test result.
- Never report "tests pass" based only on tests that have completed so far.

### Long-running test commands

Some test suites may take a significant amount of time.

Do NOT replace a complete test run with an arbitrarily shortened run merely because it takes time.

If the command is still running, wait for completion.

If the execution environment imposes a timeout or otherwise prevents waiting for completion:

1. Report that the complete test result could not be established.
2. Do not claim that the tests passed.
3. Ask the user how to proceed if further action is required.

### pytest

When running pytest, intermediate output such as:

    1 passed
    2 passed
    3 passed

is NOT the final result.

Wait until pytest terminates and inspect its final summary, for example:

    123 passed in 45.67s

or:

    120 passed, 3 failed in 45.67s

Only the completed pytest run determines the test result.

### Validation workflow

When tests are used to validate a change, follow this sequence:

`run tests → WAIT FOR COMPLETION → inspect final result → decide next action`

Never:

`run tests → observe first successful tests → assume success → modify code`

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
