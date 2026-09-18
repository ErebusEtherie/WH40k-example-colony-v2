# Frontend Testing Constraints

## Risk Priority

High risk (RTL + MSW):

- Query/mutation wiring
- Rendering derived state from API
- Forms with conditional fields
- Error-path rendering per status code

Medium risk (standard RTL):

- Presentational components
- Theme switching

Low risk (light coverage):

- Layout/wrapper components
- Static config modules

## MSW

Mock at network layer, not by mocking Query hooks or fetch directly.
Type handler response bodies against generated API types.

## E2E (Playwright)

Reserve for what needs real browser + real backend:

- Auth/security flows (cookies, CSRF, CORS)
- Session expiry and refresh race conditions
- Critical user flows (one or two representative paths)

Don't use E2E to re-verify game rules or substitute for flaky component tests.

## What NOT to do

- Don't re-verify game rules independently of backend behavior
- Don't build shared fixtures until duplication is an actual problem
- Don't use `waitFor`/timeouts as substitute for MSW resolving
- Don't let MSW shapes diverge from generated types
