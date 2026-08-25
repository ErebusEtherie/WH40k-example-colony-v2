# 07 — Representatives

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 7.1 Overview

Representatives are characters that govern colonies. They provide leadership modifiers and have skills/talents that may affect colony management.

**Two Views:**

1. **Global Representative List** - All representatives in the system
2. **Colony Representative Assignment** - Assign a representative to a colony

---

## 7.2 Representative List Screen

### Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Representatives                 [+ New Rep] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Search: [____________________]  Filter: [All ▼]               │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ Valmar Valtheran                              [Edit] [⋮]  ║ │
│  ║ Level 5 Rogue Trader | WS 45, BS 50, Int 65               ║ │
│  ║ Assigned to: Yukonia III                                  ║ │
│  ║ Leadership: +2                                            ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ Inquisitor Voss                               [Edit] [⋮]  ║ │
│  ║ Level 3 Inquisitor | WS 35, BS 40, Int 75                 ║ │
│  ║ Assigned to: None                                         ║ │
│  ║ Leadership: +1                                            ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### List Item Components

| Element | Description |
|---------|-------------|
| Name | Representative name |
| Title/Level | Character class and level |
| Key Stats | WS, BS, Int (or relevant stats) |
| Assignment | Colony name or "None" |
| Leadership | Leadership modifier value |
| Actions | Edit, Delete (Admin only) |

---

## 7.3 Add/Edit Representative

**Fields:**

- Name (text, required)
- Title/Role (dropdown)
- Level (number)
- Characteristics (WS, BS, Str, Agi, Int, Per)
- Skills/Talents (textarea, optional)

---

## 7.4 Assign to Colony

Dropdown selection from available representatives. Shows leadership modifier for each option.

---

## 7.5 API Integration

| Action | Method | Endpoint | Permission |
|--------|--------|----------|------------|
| List representatives | GET | `/api/v1/representatives` | All |
| List representatives (filtered) | GET | `/api/v1/representatives?available_only=true&type=judge&name_search=cardinal` | All |
| Create representative | POST | `/api/v1/representatives` | Admin |
| Update representative | PATCH | `/api/v1/representatives/:id` | Admin |
| Delete representative | DELETE | `/api/v1/representatives/:id` | Admin |
| Assign to colony | POST | `/api/v1/representatives/:id/assign?colony_id=:id` | Editor+ |
| Remove from colony | POST | `/api/v1/representatives/:id/unassign` | Editor+ |

**Query Parameters for List Endpoint:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `available_only` | boolean | Only show unassigned representatives | `?available_only=true` |
| `type` | string | Filter by representative type | `?type=judge` |
| `name_search` | string | Search by name (case-insensitive substring) | `?name_search=cardinal` |

**Representative Types:** `satrap`, `judge`, `cardinal`, `colonist_representative`, `military_commander`, `dynasty_member`

---

## 7.6 Permission Summary

| Action | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| View list | ✅ | ✅ | ✅ |
| Assign to colony | ❌ | ✅ | ✅ |
| Create/Edit Rep | ❌ | ❌ | ✅ |
| Delete Rep | ❌ | ❌ | ✅ |

---

**Related Documents:**

- [Colony Dashboard](./04-colony-dashboard.md)
- [Shared Components](./11-components.md)