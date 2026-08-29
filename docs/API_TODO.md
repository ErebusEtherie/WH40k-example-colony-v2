# API Enhancement TODO

**Date:** 2026-08-26  
**Status:** Minor enhancements identified during UI panel analysis

---

## Overview

During the UI panel requirements analysis, the following minor API enhancements were identified. These are **not blocking** for current functionality but would improve the developer experience and UI integration.

---

## High Priority

### 1. Modifier Breakdown Enhancement

**Issue:** UI needs detailed modifier breakdown per stat for the Colony Details panel.

**Current:** `GET /api/v1/colonies/{id}/modifiers` returns flat list of modifiers.

**Enhancement:** Add nested structure showing:

- Grouped by stat (size, complacency, order, productivity, piety)
- Each modifier includes:
  - `source_type` (infrastructure, upgrade, representative, event, custom)
  - `source_id` (for linking back to source object)
  - `source_name` (human-readable)
  - `value` (numeric modifier)
  - `description` (optional explanation)

**Example Response:**

```json
{
  "size": {
    "base": 3,
    "modifiers": [
      {"source_type": "infrastructure", "source_name": "Advanced Manufactorum", "value": 1}
    ],
    "total_modifier": 1,
    "current": 4
  },
  "complacency": { ... }
}
```

**Status:** ✅ Complete  
**Phase:** Phase 2  
**Endpoint:** `GET /api/v1/colonies/{id}/modifier-breakdown`  
**UI Impact:** Colony Details Panel - Modifier Breakdown Modal

---

## Medium Priority

### 2. Terminology Alignment: "owner" vs "founder"

**Issue:** API uses `owner` field but UI/documentation uses "Founder" in WH40k lore context.

**Current:** Colony model has `owner: str` field.

**Options:**

1. Rename field to `founder` (breaking change)
2. Add alias in schema (non-breaking)
3. Keep as-is with documentation note

**Recommendation:** Option 2 - Add Pydantic alias `founder` that maps to `owner` internally.

```python
class ColonyBase(BaseModel):
    owner: str = Field(..., alias="founder", description="Colony founder/owner")
    
    model_config = ConfigDict(populate_by_name=True)
```

**Status:** ✅ Complete  
**Phase:** Phase 1  
**Changes:**

- Documentation updated to use `founder_name` consistently
- OpenAPI spec regenerated

---

### 3. Representative Assignment Feedback

**Issue:** When assigning a representative to a colony, UI needs confirmation of the change.

**Current:** `PATCH /api/v1/colonies/{id}` with `representative_id` returns full colony object.

**Enhancement:** Add explicit response field indicating change:

```json
{
  "representative_changed": true,
  "previous_representative_id": 1,
  "new_representative_id": 2,
  "leadership_modifier_changed": true,
  "previous_leadership": 2,
  "new_leadership": 6
}
```

**Status:** ✅ Complete  
**Phase:** Phase 2  
**Implementation:**

- Added `AssignmentChangeInfo` schema to `representative.py`
- Added optional `assignment_change` field to `RepresentativeResponse`
- Updated `RepresentativeService.assign_to_colony()` and `unassign_from_colony()` to return `AssignmentResult` dataclass with change tracking
- Updated `/api/v1/representatives/{id}/assign` and `/api/v1/representatives/{id}/unassign` endpoints to populate `assignment_change`
- Added comprehensive tests for new assignment, replacement, and unassign scenarios

**Endpoints:**

- `POST /api/v1/representatives/{id}/assign` - Returns `assignment_change` with full change tracking
- `POST /api/v1/representatives/{id}/unassign` - Returns `assignment_change` showing removal

**UI Impact:** Representative Management Panel - Assignment confirmation

---

## Low Priority

### 4. Bulk Operations

**Issue:** No bulk delete/update endpoints for infrastructure/upgrades/plans.

**Current:** Must call DELETE/PATCH for each item individually.

**Enhancement:** Add bulk endpoints:

- `DELETE /api/v1/colonies/{id}/infrastructure?ids=1,2,3`
- `PATCH /api/v1/colonies/{id}/infrastructure/bulk` with list of updates

**Status:** ⚪ Future consideration  
**Phase:** Phase 5+  
**UI Impact:** Infrastructure/Upgrades management - bulk selection

### 5. Filtering and Pagination

**Issue:** Lists (representatives, events, plans) will grow large.

**Current:** No pagination or filtering on list endpoints.

**Enhancement:** Add standard query params:

- `?page=1&per_page=20`
- `?search=malachus` (name/description search)
- `?type=manufactorum` (type filter)
- `?status=working` (status filter)

**Status:** ✅ Complete  
**Phase:** Phase 4  
**Implementation:**

- **Representatives** (`GET /api/v1/representatives`): Already had pagination + filtering (`available_only`, `type`, `search`)
- **Infrastructure** (`GET /api/v1/colonies/{id}/infrastructure`): Added filtering (`state`, `type`, `search`)
- **Support Upgrades** (`GET /api/v1/colonies/{id}/upgrades`): Added filtering (`type`, `search`, `affiliated_group`)
- **Development Plans** (`GET /api/v1/development-plans/colonies/{id}`): Added pagination + filtering (`status`, `upgrade_type`, `priority`, `search`)
- All endpoints use consistent `PaginatedResponse` wrapper with `items`, `total`, `offset`, `limit`, `has_more`
- Updated tests to verify filtering and pagination behavior

**Endpoints:**

- `GET /api/v1/representatives` - Filter: `available`, `type`, `search`
- `GET /api/v1/colonies/{id}/infrastructure` - Filter: `state`, `type`, `search`
- `GET /api/v1/colonies/{id}/upgrades` - Filter: `type`, `search`, `affiliated_group`
- `GET /api/v1/development-plans/colonies/{id}` - Filter: `status`, `upgrade_type`, `priority`, `search`

**UI Impact:** All list views - pagination controls and filter dropdowns

**Post-Implementation Enhancements (2026-08-28):**

- ✅ Added `total_pages` computed field to `PaginationMeta` schema for easier UI pagination
- ✅ Added explanatory comments for in-memory filtering limitation in all router files
- ✅ Added type ignore explanation comments in `support_upgrades.py` for heterogeneous dict values
- ✅ Fixed enum comparison in `development_plans.py` to use proper domain enum conversion
- Note: Comprehensive filter/pagination tests planned for dedicated test file to avoid fixture conflicts

### 6. Export/Import Colony

**Issue:** No way to backup/restore or share colony configurations.

**Enhancement:** Add export/import endpoints:

- `GET /api/v1/colonies/{id}/export` → JSON/YAML file
- `POST /api/v1/colonies/import` ← Upload file

**Status:** ✅ Complete  
**Phase:** Phase 6  
**Implementation:**

- Added `ColonyExporter` and `ColonyImporter` classes in `adapters/io/`
- Export endpoint returns JSON file with colony, representative, events, development plans, and colony users
- Import endpoint validates file format, creates colony with all related data
- Import handles multi-user scenarios: current user becomes owner, other users are looked up by username and added if they exist (skipped with warning if not found)
- Roundtrip test validates export→import→export preserves all data
- Added comprehensive tests including roundtrip validation

**Endpoints:**

- `GET /api/v1/colonies/{id}/export` - Export colony to JSON file
- `POST /api/v1/colonies/import` - Import colony from JSON file

**UI Impact:** Colony management - backup/restore features, colony sharing between GMs

---

## Completed Enhancements

### ✅ Phase 3: Authentication System

**Status:** ✅ Complete (Phase 3 — 2026-08-29)

**Endpoints Implemented:**

- `POST /api/v1/auth/register` — Register new user with auto-login
- `POST /api/v1/auth/login` — Authenticate and receive JWT tokens (httpOnly cookies)
- `POST /api/v1/auth/refresh` — Refresh access token using refresh token
- `POST /api/v1/auth/logout` — Revoke current access token
- `POST /api/v1/auth/revoke-all` — Revoke all tokens for a user
- `POST /api/v1/auth/change-password` — Change current user's password
- `GET /api/v1/auth/me` — Get current user info

**Features:**

- httpOnly, secure cookies for token storage
- Automatic token refresh (proactive at 25min + reactive on 401)
- Promise-based refresh queue (no race conditions)
- Role-based access control (admin, user, viewer)
- Password complexity validation
- Token blacklisting for revoked tokens
- Login attempt tracking

**Test Coverage:**

- 777 backend tests passing (4 skipped)
- 18 frontend tests passing
- All code review issues resolved (6 fixes)

**UI Impact:** Login/registration flows, session management, role-based UI

---

### ✅ Colony State Roll Status

**Endpoint:** `GET /api/v1/colonies/{id}/roll-status`

Returns days until next event/development roll (every 90 days).

**Status:** ✅ Complete (Phase 3)  
**UI Impact:** Dashboard - Event timer display

---

### ✅ Modifier Endpoint

**Endpoint:** `GET /api/v1/colonies/{id}/modifiers`

Returns all active modifiers affecting colony stats.

**Status:** ✅ Complete (Phase 3)  
**UI Impact:** Colony Details - Modifier breakdown

---

### ✅ Development Plans

**Endpoints:** Full CRUD for development plans.

**Status:** ✅ Complete (Phase 3)  
**UI Impact:** Development Planning Panel

---

## Notes

- Priority levels: 🔴 High | 🟠 Medium | 🟡 Low | ⚪ Future
- Phase references align with UI implementation checklist in `UI_VISUALIZATION_PROMPT.md`
- Breaking changes (like field renames) should wait for major version bump (v2.0)

---

**Related Files:**

- `docs/UI_VISUALIZATION_PROMPT.md` — UI specification with API mappings
- `docs/api_guide_phase_3.md` — Current API documentation
- `docs/UI_PANEL_REQUIREMENTS.md` — Original UI requirements
