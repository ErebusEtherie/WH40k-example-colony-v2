# Frontend Testing Strategy

## Tools

- `Vitest` — test runner (Vite-native).
- `@testing-library/react` — component testing, queries by role/text over
  implementation details.
- `@testing-library/jest-dom` — DOM matchers.
- `MSW` (Mock Service Worker) — intercepts network calls so tests run
  against realistic API responses without hitting the real backend.

## Same risk-based principle as the backend, different risk profile

`04-testing-strategy.md` prioritizes the backend by "how easy to get subtly
wrong, how bad if wrong silently." The frontend's risk surface is different
because it must not re-derive game math — that's covered at the domain
layer already. Testing the same calculation again through a rendered
component would violate the backend rule "don't test the rule engine
indirectly through the API in unit tests," applied one layer further out.

**High risk — test with RTL + MSW:**

- Query/mutation wiring: does the right API call fire with the right
  payload when a GM enters a roll result, installs an upgrade, or adds a
  custom modifier? Does a failed mutation surface an error state instead of
  failing silently?
- Rendering of derived/threshold state returned by the API (e.g. an
  "Anarchy" or "Placated" badge appears when the API says so) — this tests
  *that the FE reads the API's field correctly and renders the right
  badge*, not that the threshold logic itself is correct (that's backend's
  job, already covered).
- Forms with required conditional fields (e.g. `chosen_stat` /
  `mad_order_roll`-equivalent inputs required only when the applicable
  personality is present) — the FE-side validation gating, not the rule
  behind it.
- Error-path rendering per the error contract in
  `07-frontend-architecture.md` (422 → inline field error, 409/domain
  rejection → inline action message, 500 → generic toast). Test that each
  status code maps to the right UI treatment through the shared
  error-normalizing function, not that every feature independently gets it
  right.

**Medium risk — standard RTL, a handful of cases:**

- Individual presentational components: correct props render correct
  output, correct interaction handlers fire.
- Theme switching renders the expected `data-theme` attribute / variable
  set.

**Lower risk — light coverage is fine:**

- Pure layout/wrapper components with no logic.
- Static config modules (`themes.ts` and similar) — test only if they
  contain non-trivial derivation, not for existing.

## MSW as the boundary

Mock API responses at the network layer via MSW handlers, not by mocking
TanStack Query hooks or fetch calls directly — this keeps tests exercising
the real query/cache/error-handling code paths instead of bypassing them,
mirroring the backend's "don't mock the domain layer, mock at the real
boundary" stance.

## Contract drift between MSW handlers and the real API

A known MSW pitfall: hand-written mock handlers quietly go stale relative
to the actual FastAPI schema (a field gets renamed or removed on the
backend, the mock still returns the old shape), and component tests keep
passing while the real integration is broken. This defeats the purpose of
testing against "realistic" responses.

Mitigation, per the type-generation approach in
`07-frontend-architecture.md`:

- MSW handler response bodies should be typed against the same generated
  API types (`frontend/src/types/api.d.ts`) used by the `api/` hooks, so a
  backend schema change that regenerates those types breaks the mock
  handler at type-check time rather than failing silently.
- This is a type-level safeguard, not a full contract-test suite (e.g. no
  live schema-validation step against a running backend) — that's a
  heavier addition and not yet justified. If drift issues show up in
  practice despite the type-level check, revisit whether a real contract
  test (e.g. validating MSW fixtures against the live OpenAPI schema in
  CI) is warranted.
- Until type generation is in place, treat this as a known residual risk:
  MSW fixtures are trusted to reflect the API's actual current shape, and
  that assumption is not independently verified.

## What NOT to do

- Don't write a frontend test that re-verifies a game rule/threshold value
  independently of the backend's stated behavior — assert on what the
  component does with a given API response, not on whether that response's
  numbers are game-rule-correct.
- Don't reach for a shared test-fixture/factory layer until duplication
  across 2–3 test files is an actual maintenance problem (same guardrail as
  `04-testing-strategy.md`).
- Don't use `waitFor`/arbitrary timeouts as a substitute for MSW resolving
  or an actual loading-state assertion.
- Don't let MSW handler shapes diverge from the generated API types without
  it being visible at type-check time.

## End-to-end testing — confirmed: Playwright

**Confirmed: Playwright is in scope**, specifically for what component
tests (RTL + MSW) and backend tests structurally cannot cover: real
browser behavior against the real backend, particularly around cookies,
CORS, and CSRF — none of which MSW's mocked network layer exercises
meaningfully, since MSW intercepts before a real cookie/CORS negotiation
ever happens.

### What belongs in E2E vs. component tests

The same risk-based principle as everywhere else in this rule set: E2E is
expensive to write and run, so it's reserved for what actually needs a
real browser + real backend, not used as a second, slower copy of the
component test suite.

**High priority for E2E — auth/security flows, given the project's safety
priority:**

- Full login → authenticated request → logout round-trip against the real
  backend, confirming the session cookie is actually set `HttpOnly`,
  `Secure`, and with the expected `SameSite` value (inspectable via
  Playwright's cookie APIs, not achievable through a mocked request).
- CSRF: a mutating request without a valid `X-CSRF-Token` is rejected by
  the real backend; a request with a valid one succeeds. MSW can't
  validate this because MSW doesn't run the backend's actual CSRF check —
  this is the one test in the whole suite that can catch a real
  CSRF-protection regression before it reaches production.
- Session expiry and the 401-triggers-one-refresh flow (per "Auth &
  Session" in `07-frontend-architecture.md`), including the concurrent-401
  case, against real token expiry timing — not just the FE's own retry
  logic in isolation.
- Logout/revoke actually invalidates the session server-side (a second
  request after logout, using the same browser context, is rejected).
- Cross-origin/CORS behavior in a real browser, if the deployed frontend
  and backend are ever on different origins — this is exactly the kind of
  thing that "works in dev, breaks in prod" if only unit/component-tested.

**Medium priority — critical user flows, not exhaustive coverage:**

- One or two representative "GM does a full session's worth of colony
  updates" happy-path flows, covering the most-used screens end to end.
- Not every CRUD screen — that's what component + backend tests already
  cover; E2E here is about catching integration wiring mistakes, not
  re-verifying business logic already tested elsewhere.

**Not E2E's job:**

- Don't re-verify game rule correctness end-to-end — that's the backend's
  job (`04-testing-strategy.md`) and, one layer up, the component tests'
  job to confirm the FE renders what the API returns correctly (the risk
  table above). E2E confirms the whole stack is wired together correctly,
  not that the math is right.
- Don't use E2E as a substitute for fixing a flaky/ambiguous component
  test — if a component test needs `waitFor`/timeouts to pass reliably,
  fix that test, don't route around it with a slower E2E equivalent.

### Where E2E tests live and run

Not yet decided: exact directory structure, CI trigger (every PR vs.
nightly, given Playwright suites are slower than component tests), and
whether they run against a fully seeded test database or an ephemeral one
per run. Flag this explicitly and confirm before scaffolding the first E2E
test rather than picking a structure silently.

## Open items

- **Full contract testing.** Not yet decided: whether a live
  schema-validation step (MSW fixtures vs. running backend's OpenAPI
  schema, in CI) is worth adding beyond the type-level safeguard above.
  Revisit if type-level checking proves insufficient in practice.
