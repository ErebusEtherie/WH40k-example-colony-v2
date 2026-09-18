# UI Requirements — Summary

Quick reference for the screen/area documents in this folder. Filenames
are `NN-name.md`; read `README.md` (index) and this summary first, then
open only the doc(s) you need.

## Quick Reference

| Doc | What You'll Find |
|---|---|
| 01-introduction | Purpose, scope, conventions for the UI docs |
| 02-application-structure | App shell, layout, navigation |
| 03-authentication | Login, session, role handling |
| 04-colony-dashboard | Colony stat display, derived values |
| 05-infrastructure-management | Infrastructure CRUD, working/faulty states |
| 06-support-upgrades | Support upgrade install/limits |
| 07-representatives | Representative screens, assignment |
| 08-modifiers | GM modifier tools |
| 09-resources-events | Resources & events screens |
| 10-admin-screens | Administration and role management |
| 11-components | Shared components library |
| 12-user-flows | End-to-end user flows |
| 13-states-and-errors | Loading/empty/error states |
| 14-api-integration | API wiring patterns |
| 15-responsive-accessibility | Responsive & accessibility requirements |

## Common Tasks

- **Build a new screen:** read the matching `NN-*.md`,
  `11-components.md`, `13-states-and-errors.md`, then
  `docs/frontend-architecture.md` and `docs/UI_DESIGN_SYSTEM.md`.
- **Auth-gated screen:** `03-authentication.md` +
  `docs/SECURITY_CONFIGURATION.md`.
- **Error handling:** `13-states-and-errors.md` + the shared error
  normalizer in `docs/frontend-architecture.md`.
- **Query/mutation wiring:** `14-api-integration.md` +
  `docs/frontend-architecture.md`.
