# Documentation Index — WH40k Colony Manager

Single index for `docs/`. Compiled and reconciled with the actual codebase
(backend, frontend, config); superseded versions of consolidated docs live
in [`archive/`](archive/).

## Sources of truth

| Topic | Document |
|---|---|
| Game rules & calculations | [`business_analysis.md`](business_analysis.md) (**authoritative**) |
| Rulebook reference | [`colony-manager-rules-reference.md`](colony-manager-rules-reference.md) |
| Engineering rules (dev/agents) | [`.clinerules/`](../.clinerules/) |
| API contract | [`api/openapi.json`](api/openapi.json) (generated) |
| Scope / non-goals | [`SCOPE_CLARIFICATIONS.md`](SCOPE_CLARIFICATIONS.md) |

## Project & architecture

| Document | Purpose |
|---|---|
| [`project-overview.md`](project-overview.md) | What it is, scope, stack, architecture at a glance |
| [`architecture.md`](architecture.md) | Layering, dependency direction, model families, rule engine |
| [`domain-model.md`](domain-model.md) | Entities, stat system, lore states, Profit Factor, rule tables |
| [`persistence.md`](persistence.md) | SQLite schema, repositories, mappings, migrations, import/export |
| [`frontend-architecture.md`](frontend-architecture.md) | Frontend stack, API client, auth/CSRF/SSE, styling |
| [`configuration.md`](configuration.md) | YAML rule tables + environment variables |

## API & testing

| Document | Purpose |
|---|---|
| [`api.md`](api.md) | Compact endpoint map (details: `api/openapi.json`, Swagger `/docs`) |
| [`testing.md`](testing.md) | Backend + frontend test strategy, contract testing |
| [`frontend-testing.md`](frontend-testing.md) | Vitest/RTL/MSW/Playwright details |

## Operations & UI

| Document | Purpose |
|---|---|
| [`deployment.md`](deployment.md) | Docker/bare deployment, images, proxy, update/rollback |
| [`SECURITY_CONFIGURATION.md`](SECURITY_CONFIGURATION.md) | Security hardening (JWT, cookies, CORS, rate limiting) |
| [`troubleshooting.md`](troubleshooting.md) | Common problems and fixes |
| [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) | Mechanicum design system (colors, components, CSS) |
| [`UI_REQ/`](UI_REQ/) | UI requirements per screen |

## Archive

Superseded/retired docs live in [`archive/`](archive/) — for example the
former `API_GUIDE.md`, `AGE_MANAGEMENT_API.md`, `FRONTEND_REQUIREMENTS.md`,
`SWAGGER_UI_GUIDE.md`, the four deployment guides, and older
planning/report files. Kept for history; **do not treat them as current.**

## Notes

- `business_analysis.md` is the single source of truth for game rules —
  where any other doc disagrees, it wins.
- `.clinerules/` is the authoritative engineering rule set; the docs here
  describe the implemented system.
- `docs/.manifest.yaml` is the AI-readable index (relevance, read time,
  task → doc map) — read it (or the matching section) before reading any
  doc in full; `docs/AI_NAVIGATION.md` is the codebase orientation map.
- `docs/api/openapi.json` is the generated API contract — regenerate from
  the backend (and re-run `npm run generate:types`), never hand-edit.
