# Documentation Index — WH40k Colony Manager

**Last Updated:** 2026-08-23 — corrected several facts that had drifted from
`business_analysis.md` (source of truth): Hard Infrastructure type names, the
Lore States quick-reference table (an invented "Piety < 20" rule and a
conflated lock/lore-state entry are removed), and personality/upgrade counts.
**Status:** Phase 3b + 4a complete, Phase 5 in progress

---

## Quick Navigation

### 🎯 Start Here

| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`README.md`](README.md) | **This file** — Documentation index and project overview | Everyone |
| [`business_analysis.md`](business_analysis.md) | **Single source of truth** for business rules, entities, calculations | Everyone |
| [`architecture.md`](architecture.md) | Technical architecture, stack decisions, project structure | Developers |
| [`.clinerules/00-overview.md`](../.clinerules/00-overview.md) | Project engineering rules and agent guidelines | AI agents, developers |

### 📋 Implementation Status

| Document | Purpose | Status |
|----------|---------|--------|
| [`TESTING_TODO.md`](../TESTING_TODO.md) | Current development tasks and test coverage tracking | Active |
| [`business_analysis.md`](business_analysis.md) | Phase 5 requirements (Personalities, Infrastructure) | Reference |

**Note on phase numbering:** Historical documents referenced "Phase 5" for
different scopes. Current work is tracked in `TESTING_TODO.md` and business
requirements are in `business_analysis.md`.

### 🔌 API & Frontend

| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`api_reference.md`](api_reference.md) | Complete REST API reference with examples | Frontend developers, API users |
| [`API_TODO.md`](API_TODO.md) | API enhancement roadmap (events, audit logs, collaboration) | Architects |
| [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) | Cult Mechanicus design system, components, patterns | UI developers |
| [`API_TODO.md`](API_TODO.md) | API enhancement roadmap and minor gaps | Backend developers, architects |

**Archived UI Documents:** The following documents are archived for historical reference only:

- `archive/UI_QUICK_REFERENCE.md` — Quick CSS/HTML reference (superseded by UI_DESIGN_SYSTEM.md)
- `archive/UI_PANEL_REQUIREMENTS.md` — Colony Dashboard panel specs (superseded)
- `archive/UI_VISUALIZATION_PROMPT.md` — External mockup prompt

### 📖 Guides & Documentation

| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`configuration.md`](configuration.md) | Configuration files reference and modification guide | Developers, GMs |
| [`troubleshooting.md`](troubleshooting.md) | Common issues, error messages, and solutions | Everyone |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Contribution guidelines and development workflow | Contributors |
| [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Community standards and enforcement | Everyone |
| [`README.md`](../README.md) | Main project README with quick start | Everyone |

### 📚 Reference & Analysis

| Document | Purpose | Status |
|----------|---------|--------|
| [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) | Production deployment instructions | DevOps |
| [`FRONTEND_DOCKER_DEPLOYMENT.md`](FRONTEND_DOCKER_DEPLOYMENT.md) | Frontend Docker & Compose deployment guide | Frontend, DevOps |
| [`PORTAINER_DEPLOYMENT.md`](PORTAINER_DEPLOYMENT.md) | Portainer stack deployment for mini-PC | DevOps |
| [`SECURITY_CONFIGURATION.md`](SECURITY_CONFIGURATION.md) | Security hardening guide | DevOps |
| [`colony-manager-rules-reference.md`](colony-manager-rules-reference.md) | Rulebook reference and game mechanics | Reference |

**Archived Documents:** The following documents are archived for historical reference only:

- `archive/UI_VISUALIZATION_PROMPT.md` — External mockup prompt
- `archive/agent_briefing.md` — AI agent onboarding (superseded by `.clinerules/`)
- `archive/UI_PANEL_REQUIREMENTS.md` — UI feature specifications (superseded by UI_DESIGN_SYSTEM.md)

---

## Current Implementation Status

**Phase 5 In Progress:** Representative Personalities & Hard Infrastructure

See [`TESTING_TODO.md`](../TESTING_TODO.md) for detailed checklist.

### Completed Phases (1-4)

- ✅ Phase 1-2: Environment, structure, domain models
- ✅ Phase 3: Config schemas, state effects, special rules
- ✅ Phase 4: Application services, persistence, API, CLI
- ✅ Testing: 188+ tests passing
- ✅ Code Quality: Ruff ✅, Mypy ✅

### Next Steps

1. Complete Phase 5 (Personalities, Infrastructure integration, Dashboard UI)
2. Phase 6+ (Events, Audit Logs, Collaboration) — see [`API_TODO.md`](API_TODO.md)

---

## Key Business Rules (Quick Reference)

**These are summaries. `business_analysis.md` is the source of truth — if
anything here disagrees with it, `business_analysis.md` wins.**

### Colony Stats

- **5 Core Stats:** Complacency, Order, Productivity, Piety, Size
- **All stats clamped at 0** — never negative
- **Current = Base + Modifiers** — always calculated, never stored

### Profit Factor Calculation

1. Base PF from Size lookup table (per-size, e.g. Size 5 → PF 6, Size 10 → PF 18 — see `business_analysis.md` §4.5)
2. Add Leadership Modifier (Rep's best of Int/Per/Fel bonus) — **table is
   complete for valid range 2–6 (values outside this range are invalid per
   game rules), see §4.5**
3. Add Infrastructure/Upgrade/Resource bonuses
4. **Order == 0 → PF = 0** (zero-forcing rule)
5. **Productivity == 0 → PF halved** (round-half-up)

### Lore States

Threshold is always relative to **Colony Size** (`stat > actual_size` /
`stat == 0`), not a fixed absolute number for any stat:

| Stat | Condition | State | Notes |
|------|-----------|-------|-------|
| Complacency | > Size | Placated | |
| Complacency | == 0 | Riots and Unrest | Ongoing effect: Order/Productivity locked from increasing (separate mechanic from the lore-state label itself — see `business_analysis.md` §4.7) |
| Order | == 0 | Anarchy | Forces PF = 0 |
| Order | > Size | Orderly | +2 Productivity |
| Productivity | > Size | Productive | |
| Productivity | == 0 | Halted | Halves PF |
| Piety | > Size | Pious | +1 Order, +1 Complacency |
| Piety | == 0 | Heretical | Ongoing effect: Order/Complacency locked from increasing |

(A previous revision of this table listed "Piety < 20 → Heretical warning
state" — that absolute threshold does not exist anywhere in
`business_analysis.md` and has been removed as fabricated.)

### Colony Types (4 total)

**Only these 4 colony types are valid** (per `colony-manager-rules-reference.md`):

- Research Mission
- Mining and Industry
- Ecclesiastical
- Agricultural

### Hard Infrastructure (5 types)

Transportation, Power Network, Water Management, Food Production, Communications

(A previous revision of this list used "Water Processing" and "Waste
Management" — those names appear nowhere else in the project and have been
corrected to match `business_analysis.md` and `UI_QUICK_REFERENCE.md`.)

- Each provides bonuses when **working**
- Penalties apply when **disrupted**
- Toggle state via API/UI

### Support Upgrades

Limited by colony base size, plus a per-type limit for some types (see
`business_analysis.md` §4.9 for the authoritative list and limits — the count
and names have varied across documents; §4.9 is the one to trust). Examples:
Mechanicum Station, Ecclesiarchy Mission, Infantry Garrison, Arbites Precinct.

### Representative Personalities

18 traits with confirmed mechanical effects, verified against rulebook source
text. Full table: `business_analysis.md` §4.7a. Two of the eighteen (Scholarly, Ties
With…) require a GM-chosen stat set at Representative-assignment time; Mad
requires a 1d5 roll set the same way. See `business_analysis.md` §3.2a for the
assignment/reassignment lifecycle rule.

---

## Configuration Files

All game rule data lives in YAML files under `config/`. See [`configuration.md`](configuration.md) for detailed documentation.

| File | Contents |
|------|----------|
| `colony_types.yaml` | Colony type definitions, base stats, special rules |
| `rule_tables.yaml` | PF lookup, leadership modifiers, lore thresholds, game cycles |
| `infrastructure_types.yaml` | Hard Infrastructure types and bonuses |
| `support_upgrades.yaml` | Support Upgrade types and effects |
| `representative_types.yaml` | Representative types (Judge, Cardinal, Satrap) |
| `personalities.yaml` | Representative personalities with mechanical effects |

---

## Questions?

If you find inconsistencies or outdated information:

1. Check [`business_analysis.md`](business_analysis.md) first — it's the source of truth for business rules
2. Check [`architecture.md`](architecture.md) for technical decisions
3. Update this index if you add new documentation
4. Don't create duplicate decision-tracking files — merge into existing phase-based docs
5. If a fact in a secondary doc (README, UI docs, addenda) conflicts with
   `business_analysis.md`, treat the secondary doc as wrong and fix it —
   don't assume `business_analysis.md` needs to change to match
