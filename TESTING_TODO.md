# Testing ToDo List

**Last Updated:** 2026-08-30
**Current Status:**

- Backend: 777 tests passing, 100% pass rate (4 skipped)
- Frontend: 87 tests passing, 0 skipped (11 test files)

This document tracks testing priorities and progress for the WH40k Colony Manager project.
It complements .clinerules/04-testing-strategy.md with specific implementation tasks.

---

## Current Test Coverage Summary

### ✅ Backend Tests (52+ files, 777 tests)

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
| **Total** | **52+ files** | **777 tests** | ✅ **100% passing** |

### Test Patterns in Use

#### Backend

1. **Hypothesis property-based testing** for domain rules (stat calculator, profit factor, size, state effects)
2. **pytest fixtures** for shared test data and mock repositories
3. **Example-based tests** for boundary conditions and specific scenarios
4. **Round-trip tests** for persistence (save → load → verify)
5. **API integration tests** using FastAPI TestClient with SQLite in-memory DB
