# Implementation Plan — Phases 6-12 (Future Work)

**Created:** 2026-08-23  
**Status:** Planning Complete, Not Started  
**Predecessor:** `implementation_plan_phase_5.md`

---

## Overview

This document outlines Phases 6-12 of the WH40k Colony Manager implementation.

**Prerequisites:** Phase 5 complete (Representative Personalities with `mad_order_roll`, `chosen_stat`, `pending_infrastructure_growth`).

---

## Phase Dependency Map

```text
Phase 5 ──→ Phase 6 ──→ Phase 7 ──→ Phase 8 ──→ Phase 9 ──→ Phase 10 ──→ Phase 11 ──→ Phase 12
           ↑            ↑            ↑            ↑            ↑             ↑
           └────────────┴────────────┴────────────┴────────────┴─────────────┘
                      (All depend on Phase 5 domain models)
```

**Key Dependencies:**

- Phase 6 → Stable domain models (Phase 5)
- Phase 8 → Complete API (Phase 5 + 6-7 changes)
- Phase 9 → Event models (exist, need automation)
- Phase 10 → Stable service layers
- Phase 11 → Audit logging (Phase 10)
- Phase 12 → Can run parallel

---

## Phase Summary

| Phase | Focus | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| 5 | Personalities & Infrastructure | 4-6h | Critical | In Progress |
| 6 | Excel Migration | 4-6h | High | Not Started |
| 7 | Skills/Talents Effects | 3-4h | Medium | Not Started |
| 8 | Frontend Dashboard | 8-12h | High | Not Started |
| 9 | Event Automation | 6-8h | Medium | Not Started |
| 10 | Audit Logging | 4-6h | Medium | Not Started |

## Phase 6: Excel Migration Utility

**Priority:** High | **Effort:** 4-6h | **Status:** Not Started

**Goal:**

Create a one-off migration tool to import data from the existing Excel workbook into JSON/YAML or SQLite format.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 6.1 | Analyze Excel structure | `tools/analyze_excel.py` | Confirm sheet names, columns |
| 6.2 | Create Excel reader | `tools/migrate_excel.py` | Use `openpyxl` or `pandas` |
| 6.3 | Map Colony sheet → domain | Same | Handle base stats, age, modifiers |
| 6.4 | Map Representative sheet → domain | Same | Stats, skills, talents, personalities |
| 6.5 | Map Data/Calculations → modifiers | Same | Extract infrastructure, upgrades |
| 6.6 | Export to JSON/YAML | Same | Use existing `adapters/io/` exporters |
| 6.7 | Test with sample Excel file | `tests/tools/test_migrate_excel.py` | Validate round-trip |

**Decisions:**

| Question | Recommended | Rationale |
|----------|-------------|-----------|
| Migration target format? | JSON/YAML | Portable, reusable |
| Handle missing/invalid data? | Skip + log warnings | Non-blocking |
| Direct SQLite seeding? | No — use JSON/YAML intermediate | Cleaner separation |

**Acceptance Criteria:**

- [ ] Reads Excel workbook (Colony, Representative, Data, Calculations sheets)
- [ ] Produces valid JSON/YAML save file
- [ ] Handles missing/invalid data gracefully
- [ ] Test coverage for happy path + edge cases
- [ ] Documented usage in `docs/migration_guide.md`

---

## Phase 7: Skills/Talents Mechanical Effects

**Priority:** Medium | **Effort:** 3-4h | **Status:** Not Started

**Goal:**

Implement mechanical effects for Representative skills and talents.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 7.1 | Define skill/talent effect rules | `config/skills_talents.yaml` | Per rulebook or houserules |
| 7.2 | Update `Skill` and `Talent` models | `domain/models/representative.py` | Add effect fields |
| 7.3 | Integrate with stat calculator | `domain/rules/colony_state_calculator.py` | Apply as modifiers |
| 7.4 | Update API schemas | `adapters/api/schemas/representative.py` | Expose effects |
| 7.5 | Add tests | `tests/domain/test_representative_rules.py` | Verify stacking |

**Decisions (Needs User Input):**

| Question | Options | Recommended |
|----------|---------|-------------|
| Which skills/talents have effects? | User list vs. rulebook | User-provided |
| How do effects stack? | Additive / Highest / Unique | Additive |
| Multiple representatives? | Stack / Only assigned | Only assigned |

**Acceptance Criteria (Needs to be defined):**

## Phase 8: Colony Dashboard UI (Frontend)

**Priority:** High | **Effort:** 8-12h | **Status:** Not Started

**Goal:**

Build a web-based Colony Dashboard implementing the 3-panel layout.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 8.1 | Set up frontend project | `frontend/` | React/Vue/Svelte/HTMX |
| 8.2 | Implement Panel 1: Basic Info | `frontend/src/components/BasicInfoPanel.tsx` | Editable fields, age |
| 8.3 | Implement Panel 2: Current Status | `frontend/src/components/StatusPanel.tsx` | Stats, lore states, PF |
| 8.4 | Implement Panel 3: Infrastructure | `frontend/src/components/InfrastructurePanel.tsx` | Infrastructure/upgrades |
| 8.5 | Wire API integration | `frontend/src/api/` | Auth, CRUD, real-time |
| 8.6 | Add authentication UI | `frontend/src/components/Login.tsx` | Login/logout flow |
| 8.7 | Build & deploy config | `vite.config.ts`, `Dockerfile` | Per deployment target |

**Decisions (Needs User Input):**

| Question | Options | Recommended |
|----------|---------|-------------|
| Frontend framework? | React / Vue / Svelte / HTMX | React |
| Hosting target? | Static / Same server / Local | Same server |
| Auth UI needed? | Yes / No | Yes |

**Acceptance Criteria:**

- [ ] 3-panel dashboard renders correctly
- [ ] Calculated values update on modifier change
- [ ] Editable fields save correctly
- [ ] Authentication flow works end-to-end
- [ ] Responsive design (desktop + tablet)
- [ ] Matches `UI_DESIGN_SYSTEM.md` (Cult Mechanicus theme)

---

## Phase 9: Event System Automation

**Priority:** Medium | **Effort:** 6-8h | **Status:** Not Started

**Goal:**

Add automatic event triggering and resolution logic to the existing Event system.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 9.1 | Define event trigger rules | `config/events.yaml` | Time-based, stat-based |
| 9.2 | Implement roll automation | `application/services/event_service.py` | Auto-roll on interval |
| 9.3 | Add background job scheduler | `src/colony_manager/jobs/` | Daily checks |
| 9.4 | Implement outcome resolution | Same | Apply modifiers |
| 9.5 | Add event UI (frontend) | `frontend/src/components/EventPanel.tsx` | Display events |
| 9.6 | Add tests | `tests/application/services/test_event_service.py` | Verify automation |

**Decisions (Needs User Input):**

| Question | Options | Current State |
|----------|---------|---------------|
| Roll automation level? | Auto / Semi-auto / Manual | Manual |
| Which events auto-trigger? | User list vs. all | User-provided |
| Outcome determination? | Fixed / Dice roll / GM choice | GM choice |

**Acceptance Criteria (Needs To be defined):**

## Phase 10: Audit Logging & Version History

**Priority:** Medium | **Effort:** 4-6h | **Status:** Not Started

**Goal:**

Automatically populate `AuditLog` entries for all colony state changes.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 10.1 | Define audit scope | `docs/audit_policy.md` | What changes to log |
| 10.2 | Add audit logging to services | All `*Service` classes | Intercept changes |
| 10.3 | Create audit query endpoints | `adapters/api/routers/audit_log.py` | List, filter, export |
| 10.4 | Add audit UI (timeline view) | `frontend/src/components/AuditTimeline.tsx` | Visual history |
| 10.5 | Implement retention policy | `src/colony_manager/jobs/audit_cleanup.py` | Configurable |
| 10.6 | Add tests | `tests/application/services/` | Verify logging |

**Decisions (Needs User Input):**

| Question | Options | Recommended |
|----------|---------|-------------|
| What changes to log? | All / GM-only / Configurable | All colony stat/modifier changes |
| Retention period? | Forever / N entries / N days | Forever (configurable) |
| Editable? | Never / Admin-only | Never (immutable) |

### Acceptance Criteria

- [ ] All colony changes logged automatically
- [ ] Audit log queryable via API
- [ ] Timeline UI displays history
- [ ] Retention policy enforced
- [ ] Tests verify logging behavior

---

## Phase 11: Real-Time Collaboration (SSE)

**Priority:** Low | **Effort:** 6-8h | **Status:** Not Started

**Goal:**

Implement Server-Sent Events (SSE) for real-time notifications when colony state changes.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 11.1 | Add version field to Colony | `domain/models/colony.py` | Optimistic locking |
| 11.2 | Implement SSE endpoint | `adapters/api/routers/notifications.py` | Stream updates |
| 11.3 | Implement optimistic locking | All update endpoints | Reject stale writes |
| 11.4 | Add SSE listener (frontend) | `frontend/src/services/notifications.ts` | Auto-reconnect |
| 11.5 | Add conflict UI | `frontend/src/components/ConflictModal.tsx` | Notify on stale write |
| 11.6 | Add tests | `tests/integration/test_concurrency.py` | Verify locking |

**Decisions (Needs User Input):**

| Question | Options | Recommended |
|----------|---------|-------------|
| What updates trigger notifications? | All / Stat-only / Configurable | All colony changes |
| Conflict resolution? | Last-write / Optimistic / Merge | Optimistic locking |

**Acceptance Criteria:**

- [ ] SSE endpoint streams updates
- [ ] Frontend receives updates in < 5 seconds
- [ ] Stale writes rejected with clear error
- [ ] Auto-reconnect on connection loss
- [ ] Tests cover concurrent edits

## Phase 12: Deployment

**Priority:** Low | **Effort:** 6-8h | **Status:** Not Started

**Goal:**
Containerize the application, set up CI/CD pipeline, and add monitoring.

**Tasks:**

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 12.1 | Create Dockerfile | `Dockerfile` | Multi-stage build |
| 12.2 | Create docker-compose | `docker-compose.yml` | App + PostgreSQL |
| 12.3 | Set up CI pipeline | `.github/workflows/ci.yml` | Test, lint, type-check |
| 12.4 | Add health check endpoint | `adapters/api/routers/health.py` | Liveness/readiness |
| 12.5 | Add structured logging | Throughout API layer | JSON format |
| 12.6 | Add metrics endpoint | `adapters/api/routers/metrics.py` | Prometheus format |
| 12.7 | Document deployment | `docs/deployment.md` | Step-by-step guide |

**Decisions (Needs User Input):**

| Question | Options | Recommended |
|----------|---------|-------------|
| Docker deployment target? | Compose / Kubernetes / None | Docker Compose |
| CI/CD platform? | GitHub Actions / GitLab CI / Manual | GitHub Actions |
| Monitoring requirements? | Health checks / Full metrics / External | Health checks + basic metrics |

**Acceptance Criteria:**

- [ ] Application runs in Docker container
- [ ] docker-compose starts app + database
- [ ] CI pipeline runs on push/PR
- [ ] Health check returns 200 OK
- [ ] Logs are structured (JSON)
- [ ] Deployment documented

## Question Index

Questions to answer before each phase:

### Phase 5 (Blocking)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q1 | Migration strategy for `Representative.personalities`? | Option A (simple conversion) |
| Q2 | Mad personality Order roll timing? | At character creation (saved) |
| Q3 | Scholarly/Ties stat choice timing? | At character creation (fixed) |

### Phase 6 (High)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q4 | Excel file structure confirmation? | Needs sample file |
| Q5 | Migration target format? | JSON/YAML |
| Q6 | Handle missing/invalid data? | Skip + log warnings |

### Phase 7 (Medium)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q7 | Which skills/talents have effects? | User-provided list |
| Q8 | What are the mechanical effects? | User-provided rules |
| Q9 | How do effects stack? | Additive |

### Phase 8 (High)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q10 | Frontend framework preference? | React |
| Q11 | Hosting/deployment target? | Same server as API |
| Q12 | Authentication UI needed? | Yes |

### Phase 9 (Medium)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q13 | Event roll automation level? | Semi-automatic (GM confirms) |
| Q14 | Which events auto-trigger? | User-provided list |
| Q15 | How are event outcomes determined? | GM chooses |

### Phase 10 (Medium)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q16 | What changes should be logged? | All colony stat/modifier changes |
| Q17 | Audit log retention period? | Forever (configurable) |
| Q18 | Should audit logs be editable? | Never (immutable) |

### Phase 11 (Low)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q19 | What updates trigger notifications? | All colony changes |
| Q20 | Multi-user conflict resolution? | Optimistic locking |

### Phase 12 (High)

| Q# | Question | Recommended |
|----|----------|-------------|
| Q21 | Docker deployment target? | Docker Compose |
| Q22 | CI/CD platform preference? | GitHub Actions |
| Q23 | Monitoring requirements? | Health checks + basic metrics |

---

## Next Steps

1. **Complete Phase 5** — Answer Q1-Q3, implement domain model gaps
2. **Prioritize Phase 6-8** — Decide which to tackle next based on user needs
3. **Answer phase-specific questions** — Review and confirm before each phase
4. **Update this document** — Mark phases complete and add learnings

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `business_analysis.md` | Single source of truth for business rules |
| `architecture_phase_1.md` | Technical architecture and layering |
| `implementation_plan.md` | Overall phase sequencing and history |
| `implementation_plan_phase_5.md` | Phase 5 detailed checklist |
| `api_future_phase_4.md` | Phase 4+ API roadmap |
| `UI_PANEL_REQUIREMENTS.md` | Colony Dashboard panel specifications |
| `UI_DESIGN_SYSTEM.md` | Cult Mechanicus design system |

---
