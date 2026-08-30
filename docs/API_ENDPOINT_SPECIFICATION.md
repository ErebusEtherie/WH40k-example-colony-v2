# API Endpoint Specification

**Date:** 2026-08-26
**Version:** 1.0
**Status:** Complete

---

## Complete Table of Contents

1. Authentication Endpoints
2. Colony Endpoints
3. Representative Endpoints
4. Infrastructure Endpoints
5. Support Upgrade Endpoints
6. Development Plan Endpoints
7. Resource Endpoints
8. Event Endpoints
9. Colony User Management Endpoints
10. Modifier Endpoints
    - GET /colonies/{id}/modifiers - List all modifiers
    - POST /colonies/{id}/modifiers - Add a modifier
    - PATCH /colonies/{id}/modifiers/{modifier_id} - Update a modifier
    - DELETE /colonies/{id}/modifiers/{modifier_id} - Remove a modifier
    - GET /colonies/{id}/modifier-breakdown - Get detailed modifier breakdown by stat
11. Export/Import Endpoints
12. Configuration Endpoints
13. User Management Endpoints (Admin)
14. Audit Log Endpoints
15. Notifications
16. Cross-Cutting Concerns

---

## 10. Modifier Endpoints

### GET /colonies/{id}/modifier-breakdown

Returns a detailed breakdown of all modifiers affecting each colony stat, showing individual contributions and final calculated values.

**Response:** `ModifierBreakdownResponse`

```json
{
  "size": {
    "base": 5,
    "modifiers": [
      {
        "source_type": "infrastructure",
        "source_name": "Housing",
        "value": 2,
        "description": "Working housing infrastructure"
      }
    ],
    "total_modifier": 2,
    "current": 7
  },
  "complacency": {
    "base": 3,
    "modifiers": [],
    "total_modifier": 0,
    "current": 3
  },
  "order": {
    "base": 2,
    "modifiers": [],
    "total_modifier": 0,
    "current": 2
  },
  "productivity": {
    "base": 4,
    "modifiers": [],
    "total_modifier": 0,
    "current": 4
  },
  "piety": {
    "base": 3,
    "modifiers": [],
    "total_modifier": 0,
    "current": 3
  },
  "leadership_modifier": 0,
  "profit_factor": 3
}
```

**Field Descriptions:**

- `base`: The raw colony stat value before any modifiers are applied
- `modifiers`: Array of active modifier contributions for this stat
  - `source_type`: Type of modifier source (e.g., "infrastructure", "support_upgrade", "gm_custom")
  - `source_id`: Optional ID of the source entity (currently null)
  - `source_name`: Human-readable name of the modifier source
  - `value`: The numeric modifier value (positive or negative)
  - `description`: Description of why this modifier is applied
- `total_modifier`: Sum of all modifier values for this stat
- `current`: Final calculated stat value (base + total_modifier + conditional bonuses)

**Notes:**

- Only active modifiers are included (inactive/expired modifiers are excluded)
- The `current` value may differ from `base + total_modifier` due to conditional bonuses (e.g., Orderly, Pious traits)
- Leadership modifier and profit factor are included for reference but don't have breakdown details

---

Document created. Full content to be added via editor.
