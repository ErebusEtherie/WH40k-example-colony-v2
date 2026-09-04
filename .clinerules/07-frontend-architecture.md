# Frontend Architecture

## Stack

- React + TypeScript, built with Vite.
- `oxlint` for linting (replaces ESLint in this project — see "Linting"
  below).
- TanStack Query v5 for all server state.
- Tailwind CSS v4 + a hand-maintained Mechanicum design-system CSS layer for
  theming (see "Styling").
- Vitest + React Testing Library + MSW for testing — see
  `08-frontend-testing.md`.

The frontend talks to the FastAPI backend over REST only. Per
`01-architecture.md`, it must never import Python domain code or reimplement
rule-engine logic client-side — colony math, thresholds, and stat derivation
belong entirely to the backend. The frontend's job is to display what the
API returns and to send GM-entered inputs (roll results, upgrade
installs, custom modifiers) back to it.

## Layering

```text
frontend/src/
  components/     # presentational UI, minimal logic
  features/        # (or equivalent) feature-scoped containers that wire
                    # components to queries/mutations
  api/             # TanStack Query hooks, one module per backend resource
                    # (colonies, representatives, modifiers, ...)
  types/           # generated API types (see "API Contract & Type Safety")
  hooks/           # shared non-API hooks (UI-only state, effects)
  data/            # static config for the FE itself (themes.ts, etc.) —
                    # NOT game rule tables; those stay server-side
  assets/          # mechanicum-design-system.css, fonts
```

**Open item — exact `components/` vs `features/` split**: not yet confirmed
against the actual current folder layout. If the codebase already has an
established pattern, this section should be corrected to match it rather
than imposed from here — flag the mismatch rather than silently picking one.

## API Contract & Type Safety

The single most common source of FE↔BE breakage is hand-maintained
TypeScript interfaces silently drifting from the backend's Pydantic
schemas. This project avoids that by generating types instead of writing
them by hand.

- Backend FastAPI app exposes its OpenAPI schema (`/openapi.json`) as usual
  — no extra work required there.
- Frontend generates TypeScript types from that schema via
  `openapi-typescript` into `frontend/src/types/api.d.ts`. This is a
  checked-in generated file, run manually (`npm run generate:types`) or in
  CI when the backend schema changes — not on every dev save.
- `api/` hooks (TanStack Query) import from the generated types for request
  and response shapes. Do not hand-write a parallel interface for a
  request/response body that already has a generated type.
- Do **not** introduce a full runtime client generator (e.g. `orval`
  generating the hooks themselves) at this stage — that's a second
  abstraction layer on top of TanStack Query and duplicates work already
  done by hand in `api/`. Revisit only if hand-writing hooks becomes actual
  duplication pain across many resources (same two-or-more-uses test as
  `01-architecture.md`).
- If the generated types and a hand-written hook's assumptions diverge
  (e.g. a field the FE expects isn't in the schema), that's a signal to
  fix the mismatch, not to widen the hook's types with an `any`/cast.
- **Check the generated output once, before wiring hooks to it.** FastAPI
  disambiguates same-named Pydantic models from different modules by their
  full module path, which can surface as multiple long, near-identical
  generated type names for what's conceptually one resource (this project
  currently has two distinct `UserResponse` schemas — one from the auth
  module, one from the user module — with the same shape). If the
  generated types file has near-duplicate types like this, raise it with
  whoever owns the backend schema (consolidate to one model) rather than
  picking one of the duplicates silently and hand-waving the other, since
  a future backend change could easily update only one of them.

## Error Handling Contract

Standardize on FastAPI's default error shapes rather than inventing a
custom envelope:

- Simple errors: `{"detail": "<message>"}`.
- Validation errors (422): `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`.

Frontend rule: all mutations pass their error through **one** shared
error-normalizing function (e.g. `normalizeApiError`), not a per-feature
`try/catch` pattern. That function maps status code to UI treatment:

| Status | Meaning | UI treatment |
| --- | --- | --- |
| 422 | Field-level validation failure | Map `loc` to the offending form field, show inline |
| 409 / domain-rule rejection | Backend rejected a valid-shaped request for a business reason (e.g. "prerequisite upgrade missing") | Inline message near the action, not a generic toast |
| 401 | Not authenticated | See "Auth & Session" below |
| 500 / network failure | Unexpected server/connection error | Generic toast, do not attempt to interpret `detail` as structured |

Do not build a bespoke error-handling pattern per feature — if the shared
function doesn't cover a new case, extend it and say so, rather than
working around it locally.

## Data Fetching Conventions

### Query defaults

Set `staleTime` and retry behavior once at the `QueryClient` level, not
per-query. Given the ~5–15 minute backend data refresh cadence, a
`staleTime` on that order (a few minutes) is a reasonable default;
`retry: 1–2` with default exponential backoff. Override per-query only
with a stated reason (e.g. a resource known to change far more or less
often than the norm).

**Correction — the backend exposes a real-time channel; prefer it over
polling where it covers the resource.** `GET /api/v1/notifications/stream`
(Server-Sent Events) pushes colony, event, development-plan, and
colony-membership changes as they happen. Where a resource is covered by
this stream:

- Subscribe to the stream once (e.g. in a top-level provider), and on a
  relevant notification, call `queryClient.invalidateQueries` for the
  affected query key — the same invalidate-and-refetch pattern already
  used after mutations, just triggered by the server instead of by a local
  mutation.
- Don't also poll that same resource with `refetchInterval` — that's
  redundant network traffic and a second source of "when does this
  update," fighting the stream instead of relying on it.
- `staleTime`/interval-based refetching remains the right default for
  anything the stream doesn't cover (config/reference data, resources not
  listed in the stream's description) — the correction above narrows where
  polling applies, it doesn't remove it everywhere.
- The stream requires the auth cookie like any other request (per "Auth &
  Session" below) — implement reconnection with backoff, per the API's own
  documented expectation that "clients should implement automatic
  reconnection logic," and treat a dropped/reconnecting stream as a reason
  to fall back to a one-off refetch of affected queries, not as a silent
  gap in freshness.

### Loading vs. background refetch

Distinguish initial load from a background refetch of already-cached data:

- `isPending` → initial load, show a skeleton/loading state.
- `isFetching && !isPending` → background refetch, show a small unobtrusive
  indicator (if any) — never re-show a full skeleton over existing data.

This distinction should be a shared convention (e.g. a small shared hook or
UI pattern), not reinvented per component.

### Query key rules (race conditions / stale responses)

**Hard rule: a query key must include every parameter that affects the
response** — filters, pagination, colony ID, sort order, all of it. No
exceptions "because it's simple right now." Getting this wrong is how
stale responses silently overwrite newer state or unrelated views share a
cache entry they shouldn't. This is cheap to get right up front and
expensive to retrofit once cache collisions start producing what look like
random UI bugs.

### Mutations and cache updates

Per the existing rule: invalidate affected query keys on success rather
than manually patching cached data, unless a specific optimistic-update
need is identified and confirmed (see below).

### Optimistic updates

Default is **invalidate-and-refetch**, everywhere. Reserve optimistic
updates for a named exception, not a general technique to reach for:

- Good candidate: high-frequency, low-conflict-risk actions where perceived
  latency genuinely matters at the table (e.g. toggling an infrastructure
  item working/faulty).
- Bad candidate: anything destructive, anything where a rejected mutation
  would be confusing to visually roll back, or anything low-frequency
  enough that the round-trip latency doesn't matter.

Keep an explicit, short list of confirmed optimistic-update cases in this
file as they're agreed on — don't let "optimistic updates" become an
ambient default someone reaches for because it feels more polished.

### Pagination

**Open item — not yet needed.** Infrastructure/modifier lists per colony
are expected to be small (tens, not thousands, of rows), so full-fetch is
likely fine for now. Do not build `useInfiniteQuery`/cursor-pagination
scaffolding speculatively — this fails the "used in ≥2 places, real harm"
test from `01-architecture.md` today. Revisit if/when a specific list
screen's row count becomes an actual problem, and flag it explicitly when
that happens rather than silently picking a pagination strategy then.

## Forms & Validation

Domain validation (e.g. `Order`/`Complacency` can't go below 0,
conditional-required fields tied to Representative personality) lives in
the backend, per `02-domain-modeling.md`. The frontend does not reimplement
those rules in a client-side schema (Zod/Yup/etc.) — that would create the
same drift risk described in "API Contract & Type Safety," at the form
layer instead.

- Client-side validation is limited to **cheap, non-domain** checks:
  required-field-present, numeric format, string length/format.
- Domain-rule violations are surfaced from the backend's 422 response (see
  "Error Handling Contract") and rendered inline against the relevant
  field.
- This trades a slightly less instant validation UX for a single source of
  truth on business rules. If that UX gap becomes a real problem for a
  specific form, raise it explicitly rather than quietly duplicating the
  rule client-side.

## Auth & Session

**Confirmed: cookie-based authentication (HttpOnly cookies), Bearer-header
auth is being phased out.** The backend currently exposes both (see
`get_current_user`, `get_current_user_from_cookie`, and the migration-
compat `get_current_user_unified` in `auth.py`) — the frontend targets the
cookie flow only and must not be built around Bearer tokens, even though
the backend hasn't fully removed that path yet.

### Why cookie-based is the safer choice here

An HttpOnly cookie is never readable by JavaScript, so there is no token
value for an XSS payload to steal. A Bearer token stored anywhere JS can
reach it — `localStorage`, `sessionStorage`, or a JS-held variable that a
compromised dependency could read — is exfiltratable the moment an XSS
vector exists anywhere in the app (including third-party UI libs). Given
PrimeNG-adjacent* data-heavy UIs pull in a lot of third-party components,
minimizing what's reachable from JS is the higher-value trade here, at the
cost of needing explicit CSRF handling (below) — a well-understood, well-
mitigated problem, unlike token exfiltration.

*(noting this in case the PrimeNG stack context from other tooling in this
workspace applies to this project too — ignore if not relevant here.)

### Frontend rules

- **Never store tokens in FE-reachable storage.** No `localStorage`, no
  `sessionStorage`, no module-level JS variable holding an access or
  refresh token. The browser handles the cookie; the FE never touches the
  token value directly.
- **Never decode the JWT client-side.** Don't parse the access token's
  payload to read user info or roles "since it's right there" — with
  HttpOnly cookies the FE can't read it anyway, but the rule holds
  regardless: user/session info comes from `GET /api/v1/auth/me`, not from
  decoding a token. This also means the FE doesn't need to know or care
  about token internals (claims, expiry format) at all.
- **Every request includes credentials.** `fetch`/axios calls must set
  `credentials: 'include'` (fetch) or `withCredentials: true` (axios) —
  otherwise the browser won't attach the auth cookie even same-site.
- **Session is server state.** Current user (`/auth/me`) is a TanStack
  Query (e.g. `useSession()`), and is the confirmed second exception —
  alongside theme — to "no global state library," only if something
  outside TanStack Query is genuinely needed (e.g. a small "am I
  authenticated at all" flag read before the router decides what to
  render).
- **401 handling:** a shared response interceptor/wrapper (not per-feature
  try/catch) attempts exactly one silent call to `/api/v1/auth/refresh` on
  a 401, then retries the original request once. If refresh also fails,
  clear the session query and redirect to login.
- **Concurrent-401 refresh race — known pitfall, guard against it
  explicitly.** The backend rotates refresh tokens (old one invalidated
  when a new one issues). If several requests 401 at once (common when a
  page fires multiple queries on mount), each naively calling `/refresh`
  independently will race: the first refresh succeeds and rotates the
  token, the second refresh then fails because it's using an
  already-invalidated token. Fix: share a single in-flight refresh
  `Promise` across all concurrent 401s (a simple module-level mutex is
  enough) so only one refresh call is ever made per expiry, and all
  waiting requests retry once it resolves.
- **Logout** calls `/api/v1/auth/revoke` (or `/revoke-all` for "log out
  everywhere"), then invalidates the session query — don't just clear FE
  state and assume the server-side session is gone.

### CSRF — required because cookies auto-attach

Moving to cookies reintroduces CSRF, which Bearer-in-header doesn't have
(a forged cross-site request can't set a custom header, but it can trigger
a cookie-bearing request). Defense, layered:

1. **`SameSite=Lax` or `Strict`, `Secure`, `HttpOnly`** on both the access
   and refresh cookies — backend-side, but the FE should confirm this is
   actually set (check `Set-Cookie` in a login response) rather than
   assume it.
2. **Explicit non-wildcard CORS origin + `allow_credentials=True`** on the
   backend — this is already required per "Environment & Configuration"
   below, and is a hard requirement once cookies are in play: browsers
   reject credentialed requests against a wildcard origin outright.
3. **Require a custom header on all mutating requests** (e.g. sending
   `Content-Type: application/json`, which already forces a CORS preflight
   for real cross-site requests) as a cheap extra layer — a forged
   cross-site form submission can't add custom headers or trigger a
   preflight the way a legitimate same-origin `fetch` call does.
4. **Open item for backend, not FE:** whether a double-submit CSRF token
   (a second, JS-readable cookie whose value the FE echoes back as a
   header on mutating requests, validated server-side) is added on top of
   1–3. Layers 1–3 already cover the realistic threat model for this app;
   a double-submit token is stronger defense-in-depth but is the backend's
   call to add, not something to build FE-side speculatively. Flag it as a
   question for whoever owns `auth.py`, don't implement it preemptively.

### Two separate role concepts — don't conflate them

The system role vs. colony role distinction is a domain concept, defined
once in `02-domain-modeling.md` ("Auth & authorization domain") — this
section doesn't restate the definitions, only the FE-specific
consequence: name the two distinctly in FE code (e.g. `systemRole` vs.
`colonyRole`) rather than a single ambiguous `role` variable that could be
either, and fetch each from where it actually lives (`User.role` from
`/auth/me` for system role; the relevant `ColonyUserRoleEnum` value from
colony-membership endpoints for colony role) rather than assuming one
implies the other.

**Known schema gap:** `User.role` is typed as a bare `string` in the
generated API types, not an enum — the backend enforces the hierarchy but
doesn't expose it as a typed enum in the OpenAPI schema. Generated types
won't give exhaustive-match safety here. The FE may declare a local
literal-union type mirroring the known values purely as a type-checking
aid (not a duplicated business rule — it doesn't decide anything, it just
names the values), but must still handle an unrecognized role value
defensively (e.g. treat as least-privileged) rather than assuming the
union is exhaustive. Worth raising with whoever owns the backend schema as
a fix (proper `Enum` on the Pydantic model) rather than permanently
working around it FE-side.

## Environment & Configuration

- API base URL is read from a Vite env var (`VITE_API_BASE_URL`), never
  hardcoded (e.g. no `localhost:8000` baked into `api/` modules).
- A `.env.example` is committed showing the expected variable(s).
- FastAPI CORS configuration explicitly allows the Vite dev origin; do not
  use `allow_origins=["*"]` even for local development, to avoid carrying
  that habit into a later deployment.

## State: server state vs. UI state

- **Server state** (anything that originates from the API — colony stats,
  Representatives, infrastructure, modifiers) lives in TanStack Query and
  nowhere else. Do not copy query data into `useState`/`useReducer` "for
  convenience" — that creates a second source of truth that can drift from
  what the backend actually holds.
- **UI-only state** (dialog open/closed, selected tab, form draft values
  before submit, local sort/filter of an already-fetched table) is local
  component state (`useState`/`useReducer`) or lifted to the nearest common
  parent. Don't reach for a global store for this.
- **Mutations** (installing an upgrade, entering a GM roll, adding a custom
  modifier) go through TanStack Query mutations, invalidating the affected
  query keys on success rather than manually patching cached data, unless a
  specific optimistic-update need is identified and confirmed (see "Data
  Fetching Conventions" above).
- No separate global state library (Redux/Zustand/Context-as-store) unless a
  concrete cross-cutting need emerges that server state + local state can't
  cover (e.g. active theme, current user session) — ask before introducing
  one. Theme selection is the one confirmed exception (see below); session
  is a second, pending the Auth & Session decision above.

## Styling

Two layers, used deliberately rather than interchangeably:

| Layer | Purpose | Example |
|---|---|---|
| Tailwind v4 | Layout, spacing, responsive utilities | `flex gap-4 p-6 rounded-lg` |
| Mechanicum design-system CSS | Theme variables, WH40k-styled components, fonts | `--mech-amber`, `.data-slate`, `.ornament-border` |

Rules:

- New theme-able values (colors, fonts, decorative treatments) are added to
  `assets/mechanicum-design-system.css` as CSS variables, not hardcoded
  Tailwind color classes or inline styles — otherwise the 7-theme swap
  breaks silently for that element.
- Per the confirmed UI direction: **Cult Mechanicus / data-slate ornamentation
  is confined to chrome (headers, borders, decorative framing) — data
  surfaces themselves (tables, stat values, numbers a GM needs to read
  quickly) stay accessibility-first and legible first.** If a component
  puts ornamental styling directly on a data-bearing element, that's a
  violation of this rule, not a style preference to negotiate per-component.
- No CSS-in-JS. This was a deliberate choice (zero runtime cost, SSR
  compatibility if ever needed) — don't introduce styled-components/
  emotion/vanilla-extract for a "one-off" component.

## Linting — oxlint

- `oxlint` is the linter of record; there is no ESLint config to keep in
  sync with it.
- Same principle as `05-code-style-and-documentation.md`'s stance on
  ruff/mypy: don't silently add or change lint rule configuration
  (`.oxlintrc.json` or equivalent) without confirmation — propose the
  change and wait.
- Don't add inline disable comments to suppress a rule without a comment
  explaining why (mirrors the backend's "comments explain why" rule in
  `05-code-style-and-documentation.md`).

## When to introduce an abstraction (React-specific application of `01-architecture.md`)

Before extracting a custom hook, a shared component, or a generic
"data table" component, apply the same test as the backend:

1. Is this used in at least two places right now?
2. Is the duplication it removes actually causing a maintenance problem?
3. Does it make the code easier or harder to follow for someone new to it?

Concretely: don't build a generic `<DataSlateTable>` abstracting over every
table in the app before there are at least two tables revealing what's
actually shared vs. incidentally similar. A `useColony(id)` query hook used
by two-plus components is fine; a hook wrapping a single one-off fetch
isn't earning its abstraction yet.

## Do not invent UI/UX behavior

If a screen's behavior isn't specified in `UI_VISUALIZATION_PROMPT_v3.md`
(or explicitly stated by the GM/Erebus), don't guess a plausible-looking
interaction, validation rule, or copy string — this is the same principle
as `02-domain-modeling.md`'s "do not invent game rules," applied to the UI
layer. Ask, or flag the gap explicitly, rather than filling it in silently.

## What NOT to do

- Don't recompute derived stats, thresholds, or Profit Factor client-side —
  even for a "quick preview" before the API responds. If a perceived-latency
  problem justifies this later, it's a decision to make explicitly, not a
  default.
- Don't let a component both fetch its own data via TanStack Query *and*
  receive the same data as a prop from a parent that also fetched it —
  pick one owner per query.
- Don't hardcode theme colors as Tailwind utility classes (`bg-orange-500`)
  where a `--mech-*` variable already exists for that purpose.
- Don't hand-write TypeScript types for API request/response bodies that
  already have a generated type from the OpenAPI schema.
- Don't reimplement backend domain-validation rules in a client-side form
  schema — surface them from the 422 response instead.
- Don't build a query key that omits a parameter affecting the response,
  and don't reach for optimistic updates outside the confirmed exception
  list.
- Don't hardcode the API base URL or loosen CORS to `*`, even locally —
  doubly true now that cookies are in play, since browsers reject
  credentialed requests against a wildcard origin.
- Don't store an access or refresh token anywhere JS-reachable
  (`localStorage`, `sessionStorage`, a held JS variable) and don't decode
  a JWT client-side to read user info or roles — use `/auth/me`.
- Don't let more than one concurrent 401 trigger its own independent
  `/auth/refresh` call — share a single in-flight refresh promise.
- Don't conflate system role (`viewer`/`colony_manager`/`admin`) with
  colony membership role (`owner`/`editor`/`viewer`) — they answer
  different questions.
