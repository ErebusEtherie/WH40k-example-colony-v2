# Frontend Testing

## Tools

- **Vitest** (jsdom) + React Testing Library + `@testing-library/jest-dom`
- **MSW** (Mock Service Worker) at the **network layer** — never mock Query
  hooks or `fetch` directly (`src/test/msw/{handlers,server}.ts`)
- **Playwright** for E2E (`e2e/`, excluded from the Vitest run by
  `vitest.config.ts`)

## Unit / integration (Vitest + RTL)

- Wrap components in a `QueryClientProvider` (retry disabled in tests).
- MSW handlers are typed against the generated API types, so response
  shapes stay in sync with the OpenAPI contract.

## Risk-based priority

- **High (RTL + MSW):** query/mutation wiring, rendering derived state from
  the API, forms with conditional fields, error-path rendering per status code.
- **Medium (RTL):** presentational components, theme switching, utilities.
- **Low:** layout/wrapper components, static config modules.

## E2E (Playwright)

- Reserve for what needs a real browser + real backend: auth/security flows
  (cookies, CSRF, CORS), session expiry and refresh races, one or two
  representative critical user flows.
- Don't use E2E to re-verify game rules or substitute for flaky component
  tests.

## Contract testing

1. Backend generates `docs/api/openapi.json`.
2. `npm run generate:types` → `src/types/api.d.ts`.
3. MSW handlers and tests use those generated types — drift fails at
   build/typecheck time.

## What NOT to do

- Don't re-verify game rules independently of backend behavior.
- Don't build shared fixtures until duplication is an actual problem.
- Don't use `waitFor` / timeouts as a substitute for MSW resolving.
- Don't let MSW shapes diverge from generated types.
