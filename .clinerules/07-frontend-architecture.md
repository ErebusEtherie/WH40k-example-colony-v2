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
  hooks/           # shared non-API hooks (UI-only state, effects)
  data/            # static config for the FE itself (themes.ts, etc.) —
                    # NOT game rule tables; those stay server-side
  assets/          # mechanicum-design-system.css, fonts
```

**Open item — exact `components/` vs `features/` split**: not yet confirmed
against the actual current folder layout. If the codebase already has an
established pattern, this section should be corrected to match it rather
than imposed from here — flag the mismatch rather than silently picking one.

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
  specific optimistic-update need is identified and confirmed.
- No separate global state library (Redux/Zustand/Context-as-store) unless a
  concrete cross-cutting need emerges that server state + local state can't
  cover (e.g. active theme, current user session) — ask before introducing
  one. Theme selection is the one confirmed exception (see below).

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
