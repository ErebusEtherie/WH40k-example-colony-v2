# Documentation Index — WH40k Colony Manager

**Last Updated:** 2026-08-20  
**Status:** All business rules confirmed and implemented

---

## Quick Navigation

### 🎯 Start Here
| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`business_analysis.md`](business_analysis.md) | **Single source of truth** for business rules, entities, calculations, and configuration | Everyone |
| [`implementation_plan.md`](implementation_plan.md) | Phase-by-phase implementation status and sequencing | Developers |
| [`.clinerules/00-overview.md`](../.clinerules/00-overview.md) | Project architecture, coding standards, and agent guidelines | AI agents, developers |

### 📐 Technical Documentation
| Document | Purpose | Status |
|----------|---------|--------|
| [`technical_analysis.md`](technical_analysis.md) | Technical architecture, folder structure, database design | ✅ Complete |
| [`BACKEND_API_IMPLEMENTATION_PLAN.md`](BACKEND_API_IMPLEMENTATION_PLAN.md) | API design, endpoints, Phase 4+ roadmap | ✅ Design complete |
| [`Colony_Sheet_Analysis.md`](Colony_Sheet_Analysis.md) | Analysis of reference Excel workbook (Polish) | ✅ Complete |

### 🎨 Frontend Documentation
| Document | Purpose | Who Should Read |
|----------|---------|-----------------|
| [`FRONTEND_GUIDE.md`](FRONTEND_GUIDE.md) | API integration guide + frontend requirements | Frontend developers |
| [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) | Cult Mechanicus design system, components, patterns | UI developers |
| [`UI_QUICK_REFERENCE.md`](UI_QUICK_REFERENCE.md) | Quick CSS/HTML reference for Mechanicum theme | UI developers |
| [`FRONTEND_REQUIREMENTS_INDEPTH.md`](FRONTEND_REQUIREMENTS_INDEPTH.md) | Detailed user flows, wireframes, permission matrix | UI/UX designers |

### 🚀 Deployment
| Document | Purpose | Status |
|----------|---------|--------|
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Deployment instructions and environment setup | DevOps |
| [`AGENT_BRIEFING.md`](AGENT_BRIEFING.md) | Quick onboarding for AI coding agents | AI agents |

---

## Document Status Summary

### ✅ Complete & Current
All documentation has been updated to reflect the current implementation state:

- **Business Rules:** All confirmed and implemented (Phase 3b + 4a complete)
- **Configuration:** All game data in YAML config files (no placeholders)
- **API Design:** All decisions made, ready for Phase 4 implementation
- **Frontend Requirements:** All stakeholder questions answered

### 📋 What Changed (Cleanup Summary)

**Removed Redundant Files:**
- `DECISIONS_AND_QUESTIONS.md` → Merged into `business_analysis.md`
- `FRONTEND_REQUIREMENTS_ANSWERED.md` → Merged into `FRONTEND_GUIDE.md`

**Updated Documents:**
- `business_analysis.md` — Removed "[TBD]" language, all items now confirmed
- `implementation_plan.md` — Removed outdated "open items" references
- `FRONTEND_GUIDE.md` — Consolidated requirements, removed question/answer split
- `BACKEND_API_IMPLEMENTATION_PLAN.md` — Marked all design decisions as resolved

---

## Current Implementation Status

**Completed Phases:**
- ✅ Phase 0-2: Environment, structure, domain models
- ✅ Phase 3: Config schemas, state effects, special rules
- ✅ Phase 4: Application services
- ✅ Phase 5: Persistence (SQLite repositories)
- ✅ Phase 6: Import/Export (JSON/YAML)
- ✅ Phase 7: REST API (FastAPI with JWT auth)
- ✅ Phase 8: CLI (Typer-based)
- ✅ Phase 9: Tooling (ruff, mypy, tests)

**Test Coverage:** 188+ tests passing  
**Code Quality:** Ruff ✅, Mypy ✅

**Next:** Phase 4+ features (events, audit logs, real-time collaboration, export/import)

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
| Complacency > Size | Placated |
| Complacency == 0 | Locked (Order/Productivity can't increase) |
| Order == 0 | Anarchy (PF = 0) |
| Order > Size | Orderly (+2 Productivity) |
| Piety > Size | Pious (+1 Order, +1 Complacency) |
| Piety == 0 | Heretical (Locked) |
| Piety < 20 | Heretical warning state |

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
1. Check `business_analysis.md` first — it's the source of truth
2. Update this index if you add new documentation
3. Don't create duplicate decision-tracking files — use `business_analysis.md`