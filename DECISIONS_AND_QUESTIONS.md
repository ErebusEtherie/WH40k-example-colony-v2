# Architectural Decisions & Open Questions

**Last Updated:** 2026-08-24

This document tracks key architectural decisions and open questions for the WH40k Colony Manager project.

---

## ✅ Resolved Decisions

### 1. Layered Architecture (2026-08-22)

**Decision:** Use pragmatic layered architecture with clear boundaries

- `domain/` — pure business logic, zero I/O
- `application/` — use cases/services, orchestrates domain + ports
- `adapters/` — persistence, API, CLI, IO implementations
- `config/` — rule tables as data (JSON/YAML)

**Rationale:** Clear separation of concerns without full DDD ceremony. Domain logic remains testable and framework-agnostic.

**Status:** ✅ Implemented

---

### 2. Pydantic for All Model Families (2026-08-22)

**Decision:** Use Pydantic for domain models, API schemas, and persistence models — but keep them separate.

**Rationale:** Pydantic provides validation and type safety everywhere, but models serve different purposes:

- Domain models encode business invariants
- API schemas handle request/response shapes (pagination, partial updates)
- Persistence models map to database schema

**Status:** ✅ Implemented

---

### 3. Rule Tables as Data (2026-08-22)

**Decision:** Infrastructure/upgrade bonus tables, colony-size-to-PF mapping, and similar lookup tables live in `config/` as JSON/YAML.

**Rationale:**

- Houserules/balance changes don't require code changes
- Rule engine becomes trivially testable
- No magic numbers in business logic

**Status:** ✅ Implemented

---

### 4. Repository Pattern for Persistence (2026-08-22)

**Decision:** Define repository interfaces in `domain/ports/`, implement in `adapters/persistence/` against SQLite.

**Rationale:**

- Domain layer doesn't depend on SQLAlchemy/SQLModel
- Easy to swap persistence backend if needed
- Testable with in-memory fakes

**Status:** ✅ Implemented

---

### 5. Error Message Constants in API Routers (2026-08-22)

**Decision:** Define error message constants at module level in API routers (e.g., `ERR_USER_NO_ID`, `ERR_EVENT_NOT_FOUND`).

**Rationale:**

- Eliminates duplicate string literals
- SonarQube compliance
- Easier to maintain consistent messaging

**Status:** ✅ Implemented in `events.py`, `development_plans.py`

---

### 6. Type Safety for Nullable User IDs (2026-08-22)

**Decision:** Assert `user.id is not None` immediately after authentication dependencies, before using the ID.

**Rationale:**

- `User.id` is typed as `int | None` (None before persistence)
- Authentication middleware ensures user exists, but type checker doesn't know this
- Explicit assertion satisfies type checker and documents assumption

**Status:** ✅ Implemented in test code and API routers
---

### 7. No Dice Rolls or Event System (2026-08-24)

**Decision:** Per the rules reference, the system does NOT implement dice rolls or automated event processing.

**Rationale:**

- All random results (1d5, 1d10, 1d100) are provided by Player/GM as input values
- Colony Manager tracks state only; events are handled externally
- No automated tests (Acquisition Tests, skill checks) are performed by the app
- GM maintains full control via Custom Modifiers for situational bonuses/penalties

**Status:** ✅ Implemented — domain rules explicitly exclude randomness

---

### 8. Application Service Tests Complete (2026-08-24)

**Decision:** Both infrastructure and support upgrade service test files exist and pass.

**Files:**

- `tests/application/services/test_infrastructure_service.py` ✅
- `tests/application/services/test_support_upgrade_service.py` ✅

**Status:** ✅ Implemented — all 10 application service test files complete

---

## ❓ Open Questions

### 1. Excel Migration Utility

**Question:** Should the Excel import utility be a one-off script in `tools/` or a proper API endpoint?

**Context:** Current source of truth is an Excel workbook with Colony/Representative/Data/Calculations sheets.

**Options:**

- **A:** One-off migration script (recommended) — brittle, throwaway, uses same import logic
- **B:** Full API endpoint — ongoing maintenance, but users can re-import

**Status:** ⏳ Pending decision

---

### 2. Multi-Colony User Support

**Question:** Can a single user account belong to multiple colonies with different roles?

**Context:** Current `ColonyUser` model links one user to one colony.

**Options:**

- **A:** One user → one colony (simpler, current design)
- **B:** One user → many colonies via separate `ColonyMembership` table

**Status:** ⏳ Pending — current implementation assumes single colony per user

---

### 3. Audit Log Retention Policy

**Question:** How long should audit logs be retained? Should there be automatic cleanup?

**Context:** `AuditLog` entries accumulate over time. No retention policy implemented yet.

**Options:**

- **A:** Indefinite retention (simplest, audit trail always available)
- **B:** Configurable retention (e.g., 90 days, 1 year)
- **C:** Archive old logs to cold storage

**Status:** ⏳ Pending — no cleanup implemented

---

### 4. Rate Limiting Configuration

**Question:** Should rate limits be configurable per-endpoint or global?

**Context:** SlowAPI is integrated, but specific limits not yet tuned.

**Options:**

- **A:** Global default with per-endpoint overrides (recommended)
- **B:** Per-role rate limits (authenticated vs. anonymous)
- **C:** Per-IP and per-user separate limits

**Status:** ⏳ Pending — basic rate limiting infrastructure in place

---

## Decision Log

| Date | Decision | Status |
|------|----------|--------|
| 2026-08-22 | Layered architecture | ✅ Resolved |
| 2026-08-22 | Pydantic for all model families | ✅ Resolved |
| 2026-08-22 | Rule tables as data | ✅ Resolved |
| 2026-08-22 | Repository pattern | ✅ Resolved |
| 2026-08-22 | Error message constants | ✅ Resolved |
| 2026-08-22 | Type safety for nullable IDs | ✅ Resolved |
| 2026-08-24 | No dice rolls or event system | ✅ Resolved |
| 2026-08-24 | Application service tests complete | ✅ Resolved |

---

## Notes

- Decisions should be moved to "Resolved" when implementation is complete
- Open questions should have a clear owner and target resolution date
- Major decisions should reference the relevant `.clinerules/` file if applicable
