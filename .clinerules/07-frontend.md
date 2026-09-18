# Frontend Constraints

## API Contract

Use `openapi-typescript` for types only — no runtime client generation.
Generate types from backend OpenAPI schema. Do not hand-write parallel
interfaces for bodies that have generated types.

If generated types diverge from hook assumptions, fix the mismatch — don't
widen types with `any`/cast.

## Error Handling

Pass all mutation errors through one shared error-normalizing function.
Map status codes to UI treatment:

- 422 → inline field error
- 409/domain rejection → inline action message
- 401 → see Auth below
- 500/network → generic toast

## Data Fetching

- Set `staleTime` and retry at `QueryClient` level, not per-query
- Use SSE stream (`/notifications/stream`) where available instead of polling
- Query keys must include every parameter affecting the response
- Default to invalidate-and-refetch; optimistic updates only for confirmed exceptions

## Forms & Validation

Client-side validation: cheap non-domain checks only (required, format,
length). Domain validation lives in backend. Surface 422 responses inline.

## Auth & Session

- Cookie-based auth only (HttpOnly). Never store tokens in JS-reachable
  storage (`localStorage`, `sessionStorage`, JS variables)
- Never decode JWT client-side — use `/auth/me`
- Every request: `credentials: 'include'` (fetch) or `withCredentials: true` (axios)
- 401 handling: one shared refresh call with mutex to prevent races
- CSRF: call `/auth/csrf-token` once, echo as `X-CSRF-Token` header on mutations

## State

- Server state → TanStack Query only
- UI-only state → local component state
- No global state library unless concrete cross-cutting need emerges

## Styling

- Tailwind v4 for layout/spacing
- Mechanicum CSS variables for theme values
- No CSS-in-JS
- Ornamentation confined to chrome; data surfaces stay legible

## Environment

- API base URL from `VITE_API_BASE_URL`, never hardcoded
- `.env.example` committed
- No `allow_origins=["*"]` even locally

## What NOT to do

- Don't recompute derived stats client-side
- Don't let a component both fetch via Query and receive same data as prop
- Don't hardcode theme colors where `--mech-*` variables exist
- Don't reimplement backend validation in client-side schemas
- Don't conflate system role (`viewer`/`colony_manager`/`admin`) with
  colony membership role (`owner`/`editor`/`viewer`)
