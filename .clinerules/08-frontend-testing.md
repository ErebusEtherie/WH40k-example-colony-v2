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

## Open item — end-to-end testing

Not yet decided: whether E2E (Playwright or similar) is in scope for this
project, and if so, what it covers that component tests + backend tests
don't already. Flagging rather than assuming a tool/scope — needs a
decision before this section can be filled in.
