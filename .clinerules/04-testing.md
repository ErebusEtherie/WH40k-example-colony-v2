# Testing Constraints

## Test Execution

Tests are not complete until the process terminates. Do not assume success
from partial output. Wait for final exit code and summary.

A test run is PASSING only when:

- Process has terminated
- Final result indicates success

If interrupted or timed out, result is UNKNOWN — do not claim tests pass.

## Risk-Based Priority

Test by risk: how easy to get subtly wrong, how bad if wrong silently.

High risk (heavy testing, including hypothesis):

- Stat derivation and stacking
- Threshold-based state transitions
- Profit Factor calculation
- Auth & authorization (security holes are invisible until exploited)

Medium risk (standard pytest):

- Use cases/application services
- Repository round-trips

Low risk (light coverage):

- API schema validation
- CLI argument parsing

## Anti-Abstraction

Don't build shared fixtures or factories until duplication across 2–3
test files is an actual maintenance problem.

## What NOT to do

- Don't mock the domain layer in domain tests
- Don't test rule engine indirectly through API in unit tests
