# Documentation Index — WH40k Colony Manager

**Last Updated:** 2026-08-23  
**Status:** Phase 3b + 4a complete, Phase 5 in progress

---

## Quick Navigation

### 🎯 Start Here

| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`README.md`](README.md) | **This file** — Documentation index and project overview | Everyone |
| [`business_analysis.md`](business_analysis.md) | **Single source of truth** for business rules, entities, calculations | Everyone |
| [`architecture_phase_1.md`](architecture_phase_1.md) | Technical architecture, stack decisions, project structure | Developers |
| [`.clinerules/00-overview.md`](../.clinerules/00-overview.md) | Project engineering rules and agent guidelines | AI agents, developers |

### 📋 Implementation Status

| Document | Purpose | Status |
|----------|---------|--------|
| [`implementation_plan.md`](implementation_plan.md) | Overall phase sequencing and history | Reference |
| [`implementation_plan_phase_5.md`](implementation_plan_phase_5.md) | Phase 5 detailed requirements (Personalities, Infrastructure) | Active |
| [`implementation_plan_phases_6-12.md`](implementation_plan_phases_6-12.md) | Phases 6-12 roadmap (Migration, Frontend, Events, Audit, DevOps) | Planning Complete |

### 🔌 API & Frontend

| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`api_guide_phase_3.md`](api_guide_phase_3.md) | REST API reference + frontend integration guide | Frontend developers |
| [`api_future_phase_4.md`](api_future_phase_4.md) | Phase 4+ API roadmap (events, audit logs, collaboration) | Architects |
| [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) | Cult Mechanicus design system, components, patterns | UI developers |
| [`UI_QUICK_REFERENCE.md`](UI_QUICK_REFERENCE.md) | Quick CSS/HTML reference for Mechanicum theme | UI developers |
| [`UI_PANEL_REQUIREMENTS.md`](UI_PANEL_REQUIREMENTS.md) | Colony Dashboard panel specifications | UI developers |

### 📚 Reference & Analysis

| Document | Purpose | Status |
|----------|---------|--------|
| [`Colony_Sheet_Analysis.md`](Colony_Sheet_Analysis.md) | Analysis of reference Excel workbook (Polish) | Reference |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Production deployment instructions | DevOps |
| [`MOCK_SERVER_SETUP.md`](MOCK_SERVER_SETUP.md) | Mock API server for frontend development | Frontend |
| [`agent_briefing.md`](agent_briefing.md) | Quick onboarding for AI coding agents | AI agents |

---

## Document Consolidation (2026-08-23)

To reduce redundancy, documentation was reorganized into phase-based files:

**New Phase-Based Structure:**

- `architecture_phase_1.md` — Foundation architecture (from `technical_analysis.md`)
- `api_guide_phase_3.md` — Current API (from `FRONTEND_GUIDE.md`)
- `api_future_phase_4.md` — Future roadmap (from `BACKEND_API_IMPLEMENTATION_PLAN.md`)
- `implementation_plan_phase_5.md` — Phase 5 checklist (from `AGENT_BRIEFING_ADDENDUM_PHASE5.md`)
- `agent_briefing.md` — Simplified agent onboarding

**Removed Redundant Files:**

- `AGENT_BRIEFING_ADDENDUM_PHASE5.md` → Merged into `implementation_plan_phase_5.md`
- `AGENT_BRIEFING.md` → Replaced with simplified `agent_briefing.md`
- `DECISIONS_AND_QUESTIONS.md` → Content in `business_analysis.md`
- `FRONTEND_REQUIREMENTS_ANSWERED.md` → Merged into `api_guide_phase_3.md`
- `FRONTEND_REQUIREMENTS_INDEPTH.md` → Merged into `api_guide_phase_3.md` + `implementation_plan_phase_5.md`
- `BACKEND_API_IMPLEMENTATION_PLAN.md` → Renamed to `api_future_phase_4.md`
- `technical_analysis.md` → Renamed to `architecture_phase_1.md`

**Why:** Multiple documents had overlapping content (decisions in 3+ places, requirements split across Q&A). This ensures:

1. Business rules in one place (`business_analysis.md`)
2. Technical architecture in one place (`architecture_phase_1.md`)
3. API/frontend requirements in one place (`api_guide_phase_3.md`)
4. Phase 5 work clearly scoped (`implementation_plan_phase_5.md`)
5. Future roadmap separate from current work (`api_future_phase_4.md`)

---

## Current Implementation Status

**Phase 5 In Progress:** Representative Personalities & Hard Infrastructure

See [`implementation_plan_phase_5.md`](implementation_plan_phase_5.md) for detailed checklist.

### Completed Phases (1-4)

- ✅ Phase 1-2: Environment, structure, domain models
- ✅ Phase 3: Config schemas, state effects, special rules
- ✅ Phase 4: Application services, persistence, API, CLI
- ✅ Testing: 188+ tests passing
- ✅ Code Quality: Ruff ✅, Mypy ✅

### Next Steps

1. Complete Phase 5 (Personalities, Infrastructure integration, Dashboard UI)
2. Phase 6+ (Events, Audit Logs, Collaboration) — see [`api_future_phase_4.md`](api_future_phase_4.md)

---

## Key Business Rules (Quick Reference)

### Colony Stats

- **5 Core Stats:** Complacency, Order, Productivity, Piety, Size
- **All stats clamped at 0** — never negative
- **Current = Base + Modifiers** — always calculated, never stored

### Profit Factor Calculation

1. Base PF from Size lookup table
2. Add Leadership Modifier (Rep's best of Int/Per/Fel bonus)
3. Add Infrastructure/Upgrade/Resource bonuses
4. **Order == 0 → PF = 0** (zero-forcing rule)
5. **Productivity == 0 → PF halved** (round-half-up)

### Lore States

| Stat | Condition | State |
|------|-----------|-------|
| Complacency | > Size | Placated |
| Complacency | == 0 | Locked (Order/Productivity can't increase) |
| Order | == 0 | Anarchy (PF = 0) |
| Order | > Size | Orderly (+2 Productivity) |
| Piety | > Size | Pious (+1 Order, +1 Complacency) |
| Piety | == 0 | Heretical (Locked) |
| Piety | < 20 | Heretical warning state |

### Colony Types (9 total)

Ecclesiastical, Agricultural, Mining, Industrial, Research Mission, Mining & Industrial, Shrine World, Fortress World, Paradise World

### Infrastructure (5 types)

Power Network, Transportation, Water Processing, Waste Management, Communications

- Each provides bonuses when **working**
- Penalties apply when **disrupted**
- Toggle state via API/UI

### Support Upgrades (13 types)

Limited by colony base size. Examples: Mechanicum Station, Ecclesiastical Court, Military Garrison, etc.

---

## Configuration Files

All game rule data lives in YAML files under `config/`:

| File | Contents |
|------|----------|
| `colony_types.yaml` | Colony type definitions, base stats, special rules |
| `rule_tables.yaml` | PF lookup, leadership modifiers, lore thresholds, infrastructure, upgrades, resources |
| `personalities.yaml` | Representative personalities with mechanical effects |

---

## Questions?

If you find inconsistencies or outdated information:

1. Check [`business_analysis.md`](business_analysis.md) first — it's the source of truth for business rules
2. Check [`architecture_phase_1.md`](architecture_phase_1.md) for technical decisions
3. Update this index if you add new documentation
4. Don't create duplicate decision-tracking files — merge into existing phase-based docs
