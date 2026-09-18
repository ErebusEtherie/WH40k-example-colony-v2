# Testing Strategy

## Backend

- **pytest** (+ **Hypothesis** for property-based tests), **httpx** for API
  tests, **freezegun** for date-dependent logic. Tests live in `tests/`
  (`domain/`, `application/`, `adapters/`, `integration/`); configured in
  `pyproject.toml` (`testpaths`, `pythonpath`).
- **Risk-based priority**
  - High (heavy, incl. Hypothesis): stat derivation & stacking,
    threshold-based state transitions, Profit Factor, auth & authorization.
  - Medium (standard pytest): use-case/application services, repository
    round-trips, API endpoints.
  - Low (light): API schema validation, CLI argument parsing, config loading.
- **Anti-abstraction:** no shared fixtures/factories until duplication
  across 2–3 test files is an actual maintenance problem.
- **What NOT to do:** don't mock the domain layer in domain tests; don't
  test the rule engine only through the API in unit tests.

```bash
uv run pytest -q          # tests
uv run ruff check src tests
uv run mypy src
```

## Frontend

- **Vitest** (jsdom) + **React Testing Library** + **MSW** (network-layer
  mocks in `src/test/msw/`) + **Playwright** E2E.
- **Risk-based priority**
  - High (RTL + MSW): query/mutation wiring, rendering derived state,
    forms with conditional fields, error-path rendering per status code.
  - Medium (RTL): presentational components, theme switching, utilities.
  - Low: layout/wrapper components, static config modules.
- **What NOT to do:** don't re-verify game rules client-side; don't let MSW
  shapes diverge from generated types; don't use `waitFor` as a stand-in
  for MSW resolving.

```bash
npm test                 # vitest run
npm run lint             # oxlint
npm run typecheck        # tsc --noEmit
```

## Contract testing

1. Backend generates `docs/api/openapi.json`.
2. `npm run generate:types` (`openapi-typescript`) → `src/types/api.d.ts`.
3. Frontend code and MSW handlers are typed against those generated types.
4. Contract drift fails at build / typecheck time.
