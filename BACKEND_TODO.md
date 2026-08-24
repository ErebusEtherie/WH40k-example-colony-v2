# Backend Development TODO

**Last Updated:** 2026-08-24
**Project Status:** Core backend complete, 121 Python modules, 640 tests passing

This document tracks remaining backend development work for the WH40k Colony Manager project.

---

## ✅ Completed Core Features

### Domain Layer

- [x] Colony model with stat tracking (Size, Complacency, Order, Productivity, Piety)
- [x] Representative model with skills and talents
- [x] User model with role-based access (admin, colony_manager, colonist, viewer)
- [x] Infrastructure & Support Upgrade models
- [x] Event model with modifiers
- [x] Development Plan model
- [x] Resource model
- [x] ColonyUser (membership) model
- [x] AuditLog model
- [x] TokenBlacklist & TokenIssuance models
- [x] LoginAttempt model
- [x] Stat calculator with bonus stacking
- [x] Profit Factor calculator
- [x] Size calculator
- [x] State effects (Orderly, Pious, Anarchy, Placated, Productive, Halted, Heretical)

### Application Services

- [x] AuthService (JWT, token revocation, account lockout)
- [x] ColonyService (CRUD, stat calculation)
- [x] ColonyStateCalculator (state transitions, decay)
- [x] ColonyUserService (membership management)
- [x] DevelopmentPlanService
- [x] EventService
- [x] InfrastructureService
- [x] RepresentativeService
- [x] ResourceService
- [x] SupportUpgradeService

### Persistence Layer

- [x] SQLAlchemy ORM models
- [x] Repository implementations for all domain models
- [x] SQLite database with migrations
- [x] Repository interfaces in domain/ports

### API Layer

- [x] FastAPI application with CORS
- [x] Authentication endpoints (register, login, logout, refresh)
- [x] Colony endpoints (CRUD, stats)
- [x] Colony Users endpoints
- [x] Development Plans endpoints
- [x] Events endpoints
- [x] Infrastructure endpoints
- [x] Support Upgrades endpoints
- [x] Representatives endpoints
- [x] Resources endpoints
- [x] Modifiers endpoints
- [x] Audit Logs endpoints
- [x] Export/Import endpoints
- [x] Notifications endpoints (placeholder)
- [x] Role-based permission enforcement
- [x] Rate limiting (SlowAPI)

### Security

- [x] Password hashing (passlib)
- [x] JWT token management
- [x] Token blacklist for logout
- [x] Account lockout after failed attempts
- [x] Role-based authorization
- [x] Colony membership permission checks
- [x] CORS configuration

### Testing

- [x] 640 tests, 100% pass rate
- [x] Hypothesis property-based tests for domain rules
- [x] Repository round-trip tests
- [x] API integration tests
- [x] Security tests

---

## 🔴 High Priority

### 1. Missing Service Tests (COMPLETE)\n\n**Status:** ✅ COMPLETE\n\nBoth service test files exist and pass:\n\n- [x] tests/application/services/test_infrastructure_service.py\n- [x] tests/application/services/test_support_upgrade_service.py

---

### 2. Event System Completion

**Status:** ✓ Clarified per rules reference

Per the rules reference, events are GM-defined only. No auto-roll or automated triggering needed.

**Tasks:**

- [ ] Define event rule tables in `config/rules.yaml`
- [ ] Implement event application logic (apply modifiers to colony stats)
- [ ] Add event scheduling/triggering mechanism (time-based or manual)

---

## 🟡 Medium Priority

### 3. Development Plan Status Transitions

**Estimated:** 2-3 hours

Development plans have a `status` field but transitions aren't fully implemented.

**Tasks:**

- [ ] Define status transition rules (planned → in_progress → completed)
- [ ] Add service method to advance plan status
- [ ] Add API endpoint for status transitions
- [ ] Add tests for status transitions

---

### 4. Resource System Integration

**Estimated:** 3-4 hours

Resource model exists but integration with colony stats is unclear.

**Tasks:**

- [ ] Define how resources affect colony stats (if at all)
- [ ] Add resource acquisition/decay rules
- [ ] Add resource tracking to colony lifecycle
- [ ] Add tests for resource effects

---

### 5. Notification System

**Estimated:** 4-6 hours

Notification endpoints exist as placeholders.

**Tasks:**

- [ ] Define notification model (in-app, email, both?)
- [ ] Implement notification service
- [ ] Add notification triggers (state changes, events, etc.)
- [ ] Add API endpoints for notification management
- [ ] Add tests

**Open Question:** Should notifications be real-time (WebSocket) or polling-based?

---

### 6. Audit Log Query API

**Estimated:** 2-3 hours

Audit logs are recorded but query capabilities are limited.

**Tasks:**

- [ ] Add filtering by entity_type, entity_id, date range, user
- [ ] Add pagination
- [ ] Add tests for audit log queries

---

## 🟢 Low Priority

### 7. Representative Skill/Talent Effects

**Estimated:** 3-4 hours

Representative model has skills and talents, but effects on colony aren't implemented.

**Tasks:**

- [ ] Define skill/talent effect rules in config
- [ ] Integrate with stat calculator
- [ ] Add tests for representative effects

---

### 8. Advanced Search & Filtering

**Estimated:** 2-3 hours

Current API endpoints have basic filtering.

**Tasks:**

- [ ] Add OData-style or GraphQL-like query params
- [ ] Add sorting support
- [ ] Add field selection (reduce payload size)
- [ ] Add tests

---

### 9. Caching Layer

**Estimated:** 3-4 hours

Colony stats are recalculated on every request.

**Tasks:**

- [ ] Add Redis or in-memory caching
- [ ] Define cache invalidation rules
- [ ] Add cache headers to API responses
- [ ] Add tests for cache behavior

**Open Question:** Is caching necessary given current performance?

---

### 10. Background Task Processing

**Estimated:** 4-6 hours

Time-based effects (daily decay, event triggers) need background processing.

**Tasks:**

- [ ] Choose task queue (Celery, RQ, or simple cron)
- [ ] Implement daily stat decay job
- [ ] Implement event trigger job
- [ ] Add monitoring/logging for background jobs
- [ ] Add tests

---

### 11. API Versioning

**Estimated:** 1-2 hours

No API versioning strategy yet.

**Tasks:**

- [ ] Decide on versioning strategy (URL path, header, media type)
- [ ] Add versioning infrastructure
- [ ] Document deprecation policy

**Recommendation:** URL path versioning (`/api/v1/...`) for simplicity.

---

## 📋 Infrastructure & DevOps

### 12. Docker Containerization

**Estimated:** 2-3 hours

**Tasks:**

- [ ] Create Dockerfile for application
- [ ] Create docker-compose for app + database
- [ ] Document deployment steps

---

### 13. CI/CD Pipeline

**Estimated:** 3-4 hours

**Tasks:**

- [ ] GitHub Actions or similar CI pipeline
- [ ] Run tests on push/PR
- [ ] Run linting (ruff, mypy)
- [ ] Build and push Docker image (optional)
- [ ] Deploy to staging (optional)

---

### 14. Monitoring & Observability

**Estimated:** 3-4 hours

**Tasks:**

- [ ] Add structured logging (JSON format)
- [ ] Add request ID tracing
- [ ] Add health check endpoint
- [ ] Add metrics endpoint (Prometheus format)
- [ ] Configure alerting (optional)

---

## 📊 Metrics & Goals

| Metric | Current | Target |
|--------|---------|--------|
| Test Count | 640 | 650+ |
| Test Pass Rate | 100% | 100% |
| Domain Coverage | ~95% | 95%+ |
| API Coverage | ~90% | 95%+ |
| Python Modules | 121 | Stable |

---

## Notes

- **Do not add features without tests** — every new feature needs corresponding tests
- **Keep domain pure** — no I/O in domain layer
- **Rule tables are data** — balance changes shouldn't require code changes
- **Security first** — run security-first skill for sensitive changes
- **Ask before abstracting** — follow the 2+ uses rule from architecture guidelines

---

## Priority Legend

| Priority | Description |
|----------|-------------|
| 🔴 **High** | Blocks other work or critical for MVP |
| 🟡 **Medium** | Important but not blocking |
| 🟢 **Low** | Nice to have, can be deferred |

- [ ] Add tests for event effects on colony stats


