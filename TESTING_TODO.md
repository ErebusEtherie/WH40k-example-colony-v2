# Testing ToDo List

**Last Updated:** 2026-08-22

This document tracks testing priorities and progress for the WH40k Colony Manager project.
It complements `.clinerules/04-testing-strategy.md` with specific implementation tasks.

---

## Current Test Coverage Summary

### ✅ Existing Tests (37 files, ~500+ tests)

| Category | Files | Coverage |
|----------|-------|----------|
| Security | `test_security.py` | Password validation, token security, settings (12 tests) |
| Domain Rules | `test_stat_calculator.py`, `test_profit_factor_calculator.py`, `test_state_effects.py`, `test_infrastructure_rules.py`, `test_leadership_modifier_resolver.py`, `test_lore_state_resolver.py`, `test_size_calculator.py` | Stat/PF calculation with Hypothesis property tests |
| Domain Models | `test_modifier.py` | Modifier expiry logic |
| Domain Utils | `test_rounding.py` | Rounding utilities |
| Application Services | 	est_infrastructure_service.py, 	est_resource_service.py, 	est_services.py, 	est_support_upgrade_service.py, 	est_colony_service_roll_status.py, 	est_colony_state_calculator.py, 	est_auth_service.py, 	est_colony_user_service.py, 	est_event_service.py, 	est_development_plan_service.py | Service orchestration, auth, membership, events, development plans |
| API Routers | 9 test files | All endpoint tests with TestClient |
| Persistence | `test_persistence.py`, `test_infrastructure_and_upgrades_repository.py`, `test_resource_repository.py` | Repository round-trips (partial) |
| I/O | `test_io.py` | Import/export mappers |
| CLI | `test_cli.py` | CLI commands |
| Config | `test_loader.py` | Config loading |

### Test Patterns in Use

1. **Hypothesis property-based testing** for domain rules (stat calculator, profit factor)
2. **pytest fixtures** for shared test data and mock repositories
3. **Example-based tests** for boundary conditions and specific scenarios
4. **Round-trip tests** for persistence (save → load → verify)
5. **API integration tests** using FastAPI TestClient with SQLite in-memory DB

---

## Testing ToDo List

### Phase 1: High-Risk Hypothesis Tests (Priority: HIGH)

**Status:** ✅ COMPLETE — All Phase 1 Hypothesis tests implemented (23 new tests)

- [x] `tests/domain/rules/test_stat_calculator.py`
  - [x] `test_calculate_stat_never_negative_property` — Stats never < 0
  - [x] `test_calculate_stat_locked_prevents_increases_property` — Locked stats ignore positive modifiers

- [x] `tests/domain/rules/test_profit_factor_calculator.py`
  - [x] `test_profit_factor_zero_when_order_is_zero_property` — Order=0 → PF=0
  - [x] `test_profit_factor_halved_when_productivity_zero_property` — Productivity=0 → PF halved
  - [x] `test_profit_factor_never_negative_property` — PF never < 0

- [x] `tests/domain/rules/test_state_effects_hypothesis.py` — 12 property tests for state transitions, locks, and boundary conditions

- [x] `tests/domain/rules/test_size_calculator_hypothesis.py` — 11 property tests for size calculation and growth rolls



### Phase 5: Integration Tests (Priority: LOW)

**Status:** ✅ COMPLETE — All Phase 5 Integration tests implemented (17 tests, 1 skipped)

- [x] \	ests/integration/test_auth_flow.py\ — 6 tests for registration, login, token refresh, and revocation
- [x] \	ests/integration/test_colony_lifecycle.py\ — 9 tests for colony creation, infrastructure, development plans, events, and stats
- [x] \	ests/integration/test_import_export_flow.py\ — 3 tests for export/import workflows (1 skipped pending endpoint implementation)

### Phase 6: Security & Edge Cases (Priority: HIGH for security)

**Status:** ✅ COMPLETE — All Phase 6 Security tests implemented (25 tests, 1 skipped)

- [x] `tests/domain/rules/test_security_invariants.py` — 6 tests for stats never negative, Order=0 → PF=0, locked stat behavior
- [x] `tests/adapters/api/test_permission_enforcement.py` — Role-based access control, cross-colony prevention
- [x] `tests/adapters/api/test_rate_limiting_integration.py` — Rate limiter triggers, different limits per endpoint


### Phase 7: Permission Enforcement Completion (Priority: HIGH)

**Status:** ⏳ NOT STARTED — Permission dependencies exist but are not applied to most routes

- [ ] Audit all API routes for missing permission checks
- [ ] Apply `require_colony_permission("view")` to read endpoints
- [ ] Apply `require_colony_permission("edit")` to write endpoints
- [ ] Apply `require_colony_permission("admin")` to delete/management endpoints
- [ ] Update tests to expect 403 responses where permission is denied
- [ ] Add integration tests for cross-colony access prevention
- [ ] Enable rate limiting in test environment for strict enforcement testing

---

## Notes

### Permission Enforcement Status

The permission middleware (`src/colony_manager/adapters/api/middleware/permissions.py`) is implemented with:
- `require_colony_permission()` - checks view/edit/admin permissions
- `require_colony_role()` - checks minimum colony role
- Admin user bypass for global administrators

Currently only used in `export_import.py`. Most routes lack colony-level permission checks.

### Rate Limiting Status

Rate limiting is implemented in `rate_limiter.py` but disabled during tests (checks for `pytest` in `sys.modules`).
To test strict enforcement, set `RATE_LIMIT_ENABLED=true` in test environment.




