# Testing ToDo List

**Last Updated:** 2026-08-24
**Current Status:** 640 tests passing, 100% pass rate

This document tracks testing priorities and progress for the WH40k Colony Manager project.
It complements .clinerules/04-testing-strategy.md with specific implementation tasks.

---

## Current Test Coverage Summary

### ✅ Existing Tests (48 files, 630 tests)

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| **Domain Models** | 10 files | 100+ | ✅ Complete |
| **Domain Rules** | 9 files | 80+ | ✅ Complete (includes Hypothesis) |
| **Application Services** | 8 files | 50+ | ✅ Complete |
| **Persistence Repositories** | 9 files | 60+ | ✅ Complete |
| **API Routers** | 13 files | 200+ | ✅ Complete |
| **Security** | 4 files | 40+ | ✅ Complete |
| **Integration** | 3 files | 20+ | ✅ Complete |
| **CLI/Config/IO** | 4 files | 30+ | ✅ Complete |
| **Total** | **48 files** | **640 tests** | ✅ **100% passing** |

### Test Patterns in Use

1. **Hypothesis property-based testing** for domain rules (stat calculator, profit factor, size, state effects)
2. **pytest fixtures** for shared test data and mock repositories
3. **Example-based tests** for boundary conditions and specific scenarios
4. **Round-trip tests** for persistence (save → load → verify)
5. **API integration tests** using FastAPI TestClient with SQLite in-memory DB

---

## Priority Tasks

### Phase 1: High-Risk Hypothesis Tests (Priority: HIGH)

**Status:** ✅ COMPLETE

- [x]  ests/domain/rules/test_stat_calculator.py
  - [x]  est_calculate_stat_never_negative_property
  - [x]  est_calculate_stat_locked_prevents_increases_property

- [x]  ests/domain/rules/test_profit_factor_calculator.py
  - [x]  est_profit_factor_zero_when_order_is_zero_property
  - [x]  est_profit_factor_halved_when_productivity_zero_property
  - [x]  est_profit_factor_never_negative_property

- [x]  ests/domain/rules/test_size_calculator_hypothesis.py
  - [x]  est_single_positive_modifier_increases_size
  - [x]  est_single_negative_modifier_decreases_size

- [x]  ests/domain/rules/test_state_effects_hypothesis.py
  - [x] Orderly effect properties
  - [x] Pious effect properties
  - [x] Anarchy decay properties

---

### Phase 2: Domain Model Validator Tests (Priority: MEDIUM)

**Status:** ✅ COMPLETE

- [x]  ests/domain/models/test_modifier.py
- [x]  ests/domain/models/test_colony.py
- [x]  ests/domain/models/test_representative.py
- [x]  ests/domain/models/test_user.py
- [x]  ests/domain/models/test_infrastructure.py
- [x]  ests/domain/models/test_support_upgrade.py
- [x]  ests/domain/models/test_colony_user.py
- [x]  ests/domain/models/test_event.py
- [x]  ests/domain/models/test_development_plan.py
- [x]  ests/domain/models/test_audit_log.py

---

### Phase 3: Repository Round-Trip Tests (Priority: MEDIUM)

**Status:** ✅ COMPLETE

- [x]  ests/adapters/persistence/test_persistence.py — Colony, Representative
- [x]  ests/adapters/persistence/test_infrastructure_and_upgrades_repository.py
- [x]  ests/adapters/persistence/test_resource_repository.py
- [x]  ests/adapters/persistence/test_modifier_repository.py
- [x]  ests/adapters/persistence/test_colony_user_repository.py
- [x]  ests/adapters/persistence/test_event_repository.py
- [x]  ests/adapters/persistence/test_development_plan_repository.py
- [x]  ests/adapters/persistence/test_audit_log_repository.py
- [x]  ests/adapters/persistence/test_token_blacklist_repository.py
- [x]  ests/adapters/persistence/test_token_issuance_repository.py
- [x]  ests/adapters/persistence/test_login_attempt_repository.py

---

### Phase 4: Application Service Tests (Priority: MEDIUM)

**Status:** ✅ COMPLETE — All 8 service test files exist and pass

- [x]  ests/application/services/test_colony_service.py (via test_services.py)
- [x]  ests/application/services/test_colony_service_roll_status.py
- [x]  ests/application/services/test_colony_state_calculator.py
- [x]  ests/application/services/test_resource_service.py
- [x]  ests/application/services/test_auth_service.py
- [x]  ests/application/services/test_colony_user_service.py
- [x]  ests/application/services/test_event_service.py
- [x]  ests/application/services/test_development_plan_service.py
- [x] tests/application/services/test_infrastructure_service.py ✅
- [x] tests/application/services/test_support_upgrade_service.py ✅

---

### Phase 5: API Router Tests (Priority: HIGH)

**Status:** ✅ COMPLETE

- [x]  ests/adapters/api/test_api.py — General API tests
- [x]  ests/adapters/api/test_auth.py — Authentication endpoints
- [x]  ests/adapters/api/test_cors.py — CORS configuration
- [x]  ests/adapters/api/test_permission_enforcement.py — Permission checks
- [x]  ests/adapters/api/test_rate_limiting.py — Rate limit config
- [x]  ests/adapters/api/test_rate_limiting_integration.py — Rate limit enforcement
- [x]  ests/adapters/api/test_audit_logs_api.py
- [x]  ests/adapters/api/test_colony_users_api.py
- [x]  ests/adapters/api/test_development_plans_api.py
- [x]  ests/adapters/api/test_events_api.py
- [x]  ests/adapters/api/test_infrastructure_api.py
- [x]  ests/adapters/api/test_support_upgrades_api.py

---

### Phase 6: Security & Permission Tests (Priority: HIGH)

**Status:** ✅ COMPLETE

- [x]  ests/test_security.py — Password validation, token security
- [x]  ests/adapters/api/test_permission_enforcement.py — Role-based access
- [x]  ests/adapters/api/test_rate_limiting_integration.py — Brute force prevention
- [x]  ests/domain/rules/test_security_invariants.py — Security properties

---

### Phase 7: Integration Tests (Priority: LOW)

**Status:** ✅ COMPLETE

- [x]  ests/integration/test_auth_flow.py — Registration → login → authenticated request
- [x]  ests/integration/test_colony_lifecycle.py — Create → modify → calculate stats
- [x]  ests/integration/test_import_export_flow.py — Export/import round-trip

---

## Test Execution Guidelines

### Running Tests

`ash

## All tests

uv run pytest

## By category

uv run pytest tests/domain/
uv run pytest tests/application/
uv run pytest tests/adapters/

## With coverage

uv run pytest --cov=src/colony_manager

## Hypothesis verbose

uv run pytest tests/domain/rules/ -v --hypothesis-verbosity=verbose
`

## Hypothesis Settings

`python
from hypothesis import settings, HealthCheck

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(...)
def test_property(...): ...
`

---

## Remaining Work

### HIGH PRIORITY

None — all service tests complete.

### MEDIUM PRIORITY

None — all service tests complete.

### LOW PRIORITY

1. **Expand Hypothesis Tests** (2-4 hours)
   - Additional state effects properties
   - Cascading effects verification
   - Multiple bonus stacking

---

## Notes

- **Do not build shared test helpers prematurely** — only abstract when duplication causes maintenance problems
- **Domain tests should not mock domain code** — domain has no I/O
- **API tests verify wiring/serialization**, not domain math (covered in domain tests)
- **Add corresponding tests when adding new models/repositories**

