# Frontend Architecture

## Stack (from `package.json`)

- **React 19** + **Vite 8**, TypeScript (strict)
- **TanStack Query v5** — client-level defaults in `src/main.tsx`
  (`retry: 1`, `staleTime: 5 min`, `refetchOnWindowFocus: false`)
- **Tailwind CSS v4** (via `@tailwindcss/vite`) + Mechanicum `--mech-*` CSS
  variables
- lucide-react, motion, clsx, tailwind-merge
- `openapi-typescript`-generated API types (`src/types/api.d.ts`)
- Express 5 + tsx mock/dev server (`server.ts`, port 8001)
- **Not in use:** no router library (views switch via App state), no React
  Hook Form / Zod / shadcn.

## Layout

```text
src/
├── App.tsx                # app shell, tab navigation, client state
├── lib/
│   ├── api.ts             # fetch client (cookie/CSRF/refresh) + TanStack Query hooks
│   ├── error.ts           # shared error normalizer
│   └── statCalculator.ts / domainCalculator.ts   # STUBS — backend computes state
├── components/            # feature components + modals/
├── types/                 # colony.ts + api.d.ts (generated)
└── test/                  # vitest setup + MSW handlers/server
```

## API integration

- **Fetch-based** client with `credentials: 'include'`. Never store tokens
  in JS-reachable storage (`localStorage`/`sessionStorage`).
- **CSRF:** `GET /auth/csrf-token` once; echo it as `X-CSRF-Token` on
  `POST`/`PUT`/`PATCH`/`DELETE`.
- **401 handling:** a single shared `POST /auth/refresh` call behind a
  promise mutex, then retry the original request; redirect to login on
  failure.
- **TanStack Query hooks** for every resource in `lib/api.ts`; query keys
  include every parameter affecting the response; default to
  invalidate-and-refetch (optimistic updates only for confirmed exceptions).
- **SSE:** `GET /api/v1/notifications/stream` (EventSource) pushes colony /
  event / plan / membership changes → invalidate affected queries instead
  of polling.

## Error handling

All mutation errors flow through one shared normalizer (`lib/error.ts`)
mapping status → UI treatment: `422` inline field error · `409`/domain
rejection inline action message · `401` shared refresh/redirect · `500`
or network → generic toast.

## State & rules

- Server state → **TanStack Query only**; UI-only state → local component
  state; no global state library.
- Client-side validation: cheap non-domain checks only (required, format,
  length); domain validation lives in the backend; surface `422` inline.
- **Never recompute derived stats client-side** — the backend returns the
  computed `state` (e.g. `GET /colonies/{id}/state`); the local calculators
  are stubs.
- `VITE_API_BASE_URL` from env (never hardcoded; `.env.example` committed);
  backend CORS uses explicit `ALLOWED_ORIGINS` — never `*`.
- Don't conflate system role (`viewer`/`colony_manager`/`admin`) with colony
  membership role (`owner`/`editor`/`viewer`).

## Styling

- Tailwind v4 for layout/spacing; `--mech-*` CSS variables (defined in
  `src/index.css`) for theme values; no CSS-in-JS; no hardcoded colors where
  `--mech-*` variables exist; ornamentation confined to chrome, data
  surfaces stay legible.
- Full design system: `docs/UI_DESIGN_SYSTEM.md`.
