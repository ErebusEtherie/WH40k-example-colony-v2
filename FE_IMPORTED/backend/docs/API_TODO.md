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

**Status:** 🟡 Planned  
**Phase:** Phase 2  
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

**Status:** 🟡 Planned  
**Phase:** Phase 1  
**UI Impact:** Colony Details Panel - Basic Info section

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

**Status:** 🟢 Nice-to-have  
**Phase:** Phase 3  
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

**Status:** ⚪ Future consideration  
**Phase:** Phase 4+  
**UI Impact:** All list views - pagination controls

### 6. Export/Import Colony

**Issue:** No way to backup/restore or share colony configurations.

**Enhancement:** Add export/import endpoints:
- `GET /api/v1/colonies/{id}/export` → JSON/YAML file
- `POST /api/v1/colonies/import` ← Upload file

**Status:** ⚪ Future consideration  
**Phase:** Phase 6  
**UI Impact:** Colony management - backup/restore features

---

## Completed Enhancements

### ✅ Colony State Roll Status

**Endpoint:** `GET /api/v1/colonies/{id}/roll-status`

Returns days until next event/development roll (every 90 days).

**Status:** ✅ Complete (Phase 3)  
**UI Impact:** Dashboard - Event timer display

### ✅ Modifier Endpoint

**Endpoint:** `GET /api/v1/colonies/{id}/modifiers`

Returns all active modifiers affecting colony stats.

**Status:** ✅ Complete (Phase 3)  
**UI Impact:** Colony Details - Modifier breakdown

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
