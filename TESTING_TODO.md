# Testing ToDo List

**Last Updated:** 2026-08-28
**Current Status:** 733 tests passing, 100% pass rate (4 skipped)

This document tracks testing priorities and progress for the WH40k Colony Manager project.
It complements .clinerules/04-testing-strategy.md with specific implementation tasks.

---

## Current Test Coverage Summary

### ✅ Existing Tests (52+ files, 685 tests)

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| **Domain Models** | 10 files | 100+ | ✅ Complete |
| **Domain Rules** | 9 files | 80+ | ✅ Complete (includes Hypothesis) |
| **Application Services** | 8 files | 50+ | ✅ Complete |
| **Persistence Repositories** | 9 files | 60+ | ✅ Complete |
| **API Routers** | 14 files | 200+ | ✅ Complete |
| **Security** | 4 files | 40+ | ✅ Complete |
| **Integration** | 3 files | 20+ | ✅ Complete |
| **CLI/Config/IO** | 4 files | 30+ | ✅ Complete |
| **Total** | **52+ files** | **685 tests** | ✅ **100% passing** |

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

## Documentation Completion

### ✅ Phase 1 & 2: Comprehensive Documentation (2026-08-26)

**Status:** COMPLETE

#### Created Documents

| Document | Lines | Purpose |
|----------|-------|---------|
| `docs/api_guide_phase_3.md` | 1,312 | Complete REST API reference with curl examples |
| `docs/configuration.md` | 267 | Configuration files reference and modification guide |
| `CONTRIBUTING.md` | 206 | Contribution guidelines and development workflow |
| `CODE_OF_CONDUCT.md` | 82 | Community standards and enforcement |
| `docs/troubleshooting.md` | 280 | Common issues, error messages, and solutions |

#### Updated Documents

| Document | Changes |
|----------|---------|
| `README.md` | Added badges, quick start, architecture diagram, API examples |
| `docs/README.md` | Updated documentation index with new files |
| `docs/architecture_phase_1.md` | Added 6 Mermaid diagrams (layered architecture, ER, request lifecycle, rule engine, config loading, lore states) |

#### Documentation Statistics

- **Total Markdown files:** 19
- **Total documentation lines:** ~5,500+
- **Coverage:** API, architecture, configuration, contributing, code of conduct, troubleshooting

---
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

## Completed Migrations

### ✅ Config System Migration (2026-08-25)

**Status:** COMPLETE — All 695 tests passing

Migrated from legacy global config system to protocol-driven dependency injection.

**Changes:**

- Created `RuleConfigProvider` protocol in `domain/ports/rule_config_provider.py`
- Implemented `FileRuleConfigProvider` singleton in `adapters/config/loader.py`
- Updated all 8 config API endpoints to use dependency injection
- Archived legacy `colony_manager/config/` module to `config_archive/`
- Kept `config/settings.py` for application settings (JWT, CORS, database)

**Files Modified:**

- `domain/ports/rule_config_provider.py` — Protocol definition (14 methods/properties)
- `adapters/config/loader.py` — Implementation with YAML loading
- `adapters/api/dependencies.py` — Singleton pattern (`init_rule_config_provider()`)
- `adapters/api/app.py` — Lifespan initialization
- `adapters/api/routers/config.py` — Uses protocol methods
- `tests/conftest.py` — Test fixtures initialize config provider

**Architecture Benefits:**

- Clean separation: domain layer has zero I/O
- Testable: protocol allows easy mocking in tests
- Encapsulated: no private attribute access from adapters
- Singleton: single config instance shared across application

### ✅ Hypothesis Test Expansion (2026-08-25)

**Status:** COMPLETE — 10 new hypothesis tests added

Expanded property-based testing coverage for the rule engine.

**Changes:**

- Added cascading effects tests (multiple states active simultaneously)
- Added multiple modifier stacking tests
- Added state transition boundary tests

**Files Modified:**

- `tests/domain/rules/test_state_effects_hypothesis.py` — Added `TestCascadingEffects` class with 4 tests
- `tests/domain/rules/test_stat_calculator.py` — Added 4 tests for modifier stacking
- `tests/domain/rules/test_profit_factor_calculator.py` — Added 2 tests for PF modifier stacking

**Test Coverage:**

- Cascading effects: Anarchy + Piety = 0, Complacency = 0 + Piety = 0, Orderly + Pious coexistence
- Modifier stacking: Multiple modifiers combine additively, positive/negative combination, inactive modifiers ignored
- All tests use Hypothesis property-based testing with 100 examples each

### ✅ Validation Preview Feature (2026-08-27)

**Status:** COMPLETE — All 28 API adapter tests passing

Added `name`/`notes` fields to Infrastructure and Support Upgrade APIs with `validate_only` preview functionality.

**Changes:**

- Added `name` (required) and `notes` (optional) fields to domain models and API schemas
- Implemented `validate_only` query parameter on PATCH endpoints for preview without applying changes
- Moved validation preview logic from router layer to service layer methods:
  - `InfrastructureService.preview_state_transition()`
  - `SupportUpgradeService.preview_upgrade_changes()`
- Added dedicated update methods for consistency:
  - `SupportUpgradeService.update_upgrade_custom_stat_choice()`
  - `SupportUpgradeService.update_upgrade_custom_product()`
  - `SupportUpgradeService.update_upgrade_affiliated_group()`
- Updated routers to use service layer methods (thin router pattern)
- Integrated audit logging for name/notes changes

**Files Modified:**

- `src/colony_manager/application/services/infrastructure_service.py` — Added `preview_state_transition()` method
- `src/colony_manager/application/services/support_upgrade_service.py` — Added `preview_upgrade_changes()` and dedicated update methods
- `src/colony_manager/adapters/api/routers/infrastructure.py` — Refactored to use service preview method
- `src/colony_manager/adapters/api/routers/support_upgrades.py` — Refactored to use service preview method
- `src/colony_manager/adapters/api/schemas/infrastructure.py` — Added validation response schema
- `src/colony_manager/adapters/api/schemas/support_upgrade.py` — Added validation response schema
- `tests/adapters/api/test_infrastructure_api.py` — Updated tests for new fields
- `tests/adapters/api/test_support_upgrades_api.py` — Updated tests for new fields

**Architecture Benefits:**

- Routers are thin (orchestration only, no business logic)
- Validation logic testable at service layer
- Follows dependency inversion properly
- Consistent update patterns across services

---

## Remaining Work

### HIGH PRIORITY

None — all service tests complete.

### MEDIUM PRIORITY

None — all service tests complete.

### LOW PRIORITY

1. **Expand Hypothesis Tests** (2-4 hours)
   - [x] Additional state effects properties
   - [x] Cascading effects verification
   - [x] Multiple bonus stacking

---

## Notes

- **Do not build shared test helpers prematurely** — only abstract when duplication causes maintenance problems
- **Domain tests should not mock domain code** — domain has no I/O
- **API tests verify wiring/serialization**, not domain math (covered in domain tests)
- **Add corresponding tests when adding new models/repositories**

---

## Completed: Pagination & Filtering Tests (2026-08-28)

**Status:** ✅ COMPLETE — 14 new tests added in `test_pagination_and_filtering_api.py`

Added comprehensive integration tests for pagination and filtering on list endpoints:

### Infrastructure (7 tests)
- `test_list_infrastructure_pagination` — Tests offset, limit, has_more, total_pages
- `test_list_infrastructure_pagination_edge_cases` — Boundary conditions (exact page, offset beyond total, limit=1)
- `test_list_infrastructure_filter_by_state` — Filter by operational state
- `test_list_infrastructure_filter_by_type` — Filter by infrastructure type
- `test_list_infrastructure_filter_by_search` — Filter by name search
- `test_list_infrastructure_combined_filters` — Multiple filters together
- `test_list_infrastructure_filters_with_pagination` — Filters + pagination

### Development Plans (7 tests)
- `test_list_development_plans_pagination` — Tests offset, limit, has_more, total_pages
- `test_list_development_plans_filter_by_status` — Filter by plan status
- `test_list_development_plans_filter_by_upgrade_type` — Filter by upgrade type
- `test_list_development_plans_filter_by_priority` — Filter by priority level
- `test_list_development_plans_filter_by_search` — Filter by target name search
- `test_list_development_plans_combined_filters` — Multiple filters together
- `test_list_development_plans_filters_with_pagination` — Filters + pagination

**Note:** Support Upgrades tests were removed as the API endpoint uses `/upgrades` (not `/support-upgrades`) with a different schema (no `tier` or `state` fields on create). See existing `test_support_upgrades_api.py` for correct tests.

**Test Count:** 733 passed, 4 skipped (added 14 tests)
