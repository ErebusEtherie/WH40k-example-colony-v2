# Testing ToDo List

**Last Updated:** 2026-08-22

This document tracks testing priorities and progress for the WH40k Colony Manager project.
It complements `.clinerules/04-testing-strategy.md` with specific implementation tasks.

---

## Current Test Coverage Summary

### ✅ Existing Tests (33 files, ~200+ tests)

| Category | Files | Coverage |
|----------|-------|----------|
| Security | `test_security.py` | Password validation, token security, settings (12 tests) |
| Domain Rules | `test_stat_calculator.py`, `test_profit_factor_calculator.py`, `test_state_effects.py`, `test_infrastructure_rules.py`, `test_leadership_modifier_resolver.py`, `test_lore_state_resolver.py`, `test_size_calculator.py` | Stat/PF calculation with Hypothesis property tests |
| Domain Models | `test_modifier.py` | Modifier expiry logic |
| Domain Utils | `test_rounding.py` | Rounding utilities |
| Application Services | `test_infrastructure_service.py`, `test_resource_service.py`, `test_services.py`, `test_support_upgrade_service.py`, `test_colony_service_roll_status.py`, `test_colony_state_calculator.py` | Service orchestration |
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

**Status:** Partially complete — stat_calculator and profit_factor_calculator have Hypothesis tests

- [x] `tests/domain/rules/test_stat_calculator.py`
  - [x] `test_calculate_stat_never_negative_property` — Stats never < 0
  - [x] `test_calculate_stat_locked_prevents_increases_property` — Locked stats ignore positive modifiers

- [x] `tests/domain/rules/test_profit_factor_calculator.py`
  - [x] `test_profit_factor_zero_when_order_is_zero_property` — Order=0 → PF=0
  - [x] `test_profit_factor_halved_when_productivity_zero_property` — Productivity=0 → PF halved
  - [x] `test_profit_factor_never_negative_property` — PF never < 0

- [ ] `tests/domain/rules/test_state_effects_hypothesis.py` **(MISSING)**
  - [ ] Property: State transitions are deterministic at boundaries
  - [ ] Property: Cascading effects (e.g., Piety=0 locks Order/Complacency increases) apply consistently
  - [ ] Property: Multiple state bonuses stack correctly

- [ ] `tests/domain/rules/test_size_calculator_hypothesis.py` **(MISSING)**
  - [ ] Property: Size calculation is monotonic (more population → same or larger size)

---

### Phase 2: Domain Model Validator Tests (Priority: MEDIUM)

**Status:** Only `test_modifier.py` exists

- [x] `tests/domain/models/test_modifier.py` — Expiry logic tests

- [ ] `tests/domain/models/test_colony.py` **(MISSING)**
  - [ ] `age_days` validator (≥ 0)
  - [ ] Lock flag interactions
  - [ ] `planetary_resources` validation
  - [ ] `dynasty_outcome` validation

- [ ] `tests/domain/models/test_representative.py` **(MISSING)**
  - [ ] `RepresentativeStats` validators (all > 0)
  - [ ] Bonus properties (`int_bonus`, `per_bonus`, `fel_bonus`)
  - [ ] `highest_leadership_bonus` property
  - [ ] `loss_mitigation_stat` property
  - [ ] `get_total_personality_calamity_modifier` method
  - [ ] `update_calamitous_modifier` method

- [ ] `tests/domain/models/test_user.py` **(MISSING)**
  - [ ] `username` length validation (3-50 chars)
  - [ ] `email` length validation (5-100 chars)
  - [ ] `role` default (VIEWER), `is_active` default (True)

- [ ] `tests/domain/models/test_infrastructure.py` **(MISSING)**
  - [ ] `state` validation, `has_effect`/`is_disrupted` properties

- [ ] `tests/domain/models/test_support_upgrade.py` **(MISSING)**
  - [ ] `is_installed` property, cost validation

- [ ] `tests/domain/models/test_colony_user.py` **(MISSING)**
- [ ] `tests/domain/models/test_event.py` **(MISSING)**
- [ ] `tests/domain/models/test_development_plan.py` **(MISSING)**

---

### Phase 3: Repository Round-Trip Tests (Priority: MEDIUM)

**Status:** Basic round-trips exist for Colony, Representative, Infrastructure, Resource

- [x] `tests/adapters/persistence/test_persistence.py` — Colony & Representative round-trips
- [x] `tests/adapters/persistence/test_infrastructure_and_upgrades_repository.py` — Infrastructure/Upgrade CRUD
- [x] `tests/adapters/persistence/test_resource_repository.py` — Resource CRUD

- [ ] `tests/adapters/persistence/test_token_blacklist_repository.py` **(MISSING)**
  - [ ] Add/query blacklist, `revoke_all_user_tokens`, expired entry queries

- [ ] `tests/adapters/persistence/test_token_issuance_repository.py` **(MISSING)**
  - [ ] Token creation, active token queries, revocation

- [ ] `tests/adapters/persistence/test_login_attempt_repository.py` **(MISSING)**
  - [ ] Failed attempt tracking, cleanup old entries

- [ ] `tests/adapters/persistence/test_audit_log_repository.py` **(MISSING)**
  - [ ] Audit log CRUD, filtering, pagination

- [ ] `tests/adapters/persistence/test_colony_user_repository.py` **(MISSING)**
- [ ] `tests/adapters/persistence/test_development_plan_repository.py` **(MISSING)**
- [ ] `tests/adapters/persistence/test_event_repository.py` **(MISSING)**

---

### Phase 4: Application Service Tests (Priority: MEDIUM)

**Status:** Infrastructure, Resource, SupportUpgrade services tested

- [x] `tests/application/test_infrastructure_service.py` — CRUD, error handling
- [x] `tests/application/test_resource_service.py` — Resource management
- [x] `tests/application/test_support_upgrade_service.py` — Upgrade installation
- [x] `tests/application/services/test_colony_service_roll_status.py` — Roll status
- [x] `tests/application/services/test_colony_state_calculator.py` — State calculation

- [ ] `tests/application/services/test_auth_service.py` **(MISSING)**
  - [ ] Registration, login, token refresh, logout, bulk revocation

- [ ] `tests/application/services/test_colony_user_service.py` **(MISSING)**
- [ ] `tests/application/services/test_event_service.py` **(MISSING)**
- [ ] `tests/application/services/test_development_plan_service.py` **(MISSING)**

---

### Phase 5: Integration Tests (Priority: LOW)

- [ ] `tests/integration/test_auth_flow.py` **(MISSING)**
  - [ ] Registration → login → authenticated request
  - [ ] Token refresh, logout/blacklist verification

- [ ] `tests/integration/test_colony_lifecycle.py` **(MISSING)**
  - [ ] Create → add infrastructure → calculate stats → advance cycle

- [ ] `tests/integration/test_import_export_flow.py` **(MISSING)**
  - [ ] Export → import → verify equivalence

---

### Phase 6: Security & Edge Cases (Priority: HIGH for security)

- [ ] `tests/domain/rules/test_security_invariants.py` **(MISSING)**
  - [ ] Stats never negative, Order=0 → PF=0, locked stat behavior

- [ ] `tests/adapters/api/test_permission_enforcement.py` **(MISSING)**
  - [ ] Role-based access control, cross-colony prevention

- [ ] `tests/adapters/api/test_rate_limiting_integration.py` **(MISSING)**
  - [ ] Rate limiter triggers, different limits per endpoint

---

## Test Execution Guidelines

### Running Tests

```bash
# All tests
uv run pytest

# By category
uv run pytest tests/domain/
uv run pytest tests/application/
uv run pytest tests/adapters/

# With coverage
uv run pytest --cov=src/colony_manager

# Hypothesis verbose
uv run pytest tests/domain/rules/ -v --hypothesis-verbosity=verbose
```

### Hypothesis Settings

```python
from hypothesis import settings, HealthCheck

@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
@given(...)
def test_property(...): ...
```

### Test Data Patterns

1. Use fixtures for common test data (see `conftest.py`)
2. Use `tmp_path` for isolated SQLite databases
3. Mock external dependencies (RNG, time, config) for deterministic tests
4. Use `model_copy()` for variant test cases (Pydantic v2)

---

## Notes

- **Do not build shared test helpers prematurely** — only abstract when duplication causes maintenance problems
- **Domain tests should not mock domain code** — domain has no I/O
- **API tests verify wiring/serialization**, not domain math (covered in domain tests)
- **Add corresponding tests when adding new models/repositories**
  - [ ] Property: Size thresholds from config are applied correctly

---

### Phase 2: Domain Model Validator Tests (Priority: MEDIUM)

**Status:** Only `test_modifier.py` exists

- [x] `tests/domain/models/test_modifier.py` — Expiry logic tests

- [ ] `tests/domain/models/test_colony.py` **(MISSING)**
  - [ ] `age_days` validator (≥ 0)
  - [ ] Lock flag interactions
  - [ ] `planetary_resources` validation
  - [ ] `dynasty_outcome` validation

- [ ] `tests/domain/models/test_representative.py` **(MISSING)**
  - [ ] `RepresentativeStats` validators (all > 0)
  - [ ] Bonus properties (`int_bonus`, `per_bonus`, `fel_bonus`)
  - [ ] `highest_leadership_bonus` property
  - [ ] `loss_mitigation_stat` property
  - [ ] `get_total_personality_calamity_modifier` method
  - [ ] `update_calamitous_modifier` method

- [ ] `tests/domain/models/test_user.py` **(MISSING)**
  - [ ] `username` length validation (3-50 chars)
  - [ ] `email` length validation (5-100 chars)
  - [ ] `role` default (VIEWER), `is_active` default (True)

- [ ] `tests/domain/models/test_infrastructure.py` **(MISSING)**
  - [ ] `state` validation, `has_effect`/`is_disrupted` properties

- [ ] `tests/domain/models/test_support_upgrade.py` **(MISSING)**
  - [ ] `is_installed` property, cost validation

- [ ] `tests/domain/models/test_colony_user.py` **(MISSING)**
- [ ] `tests/domain/models/test_event.py` **(MISSING)**
- [ ] `tests/domain/models/test_development_plan.py` **(MISSING)**
