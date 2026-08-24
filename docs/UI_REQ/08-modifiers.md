# 08 — Modifiers (GM Tools)

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 8.1 Overview

Custom Modifiers are GM tools for applying arbitrary bonuses/penalties to colony stats. Used for events, discoveries, and narrative outcomes.

**Permission Required:** Editor+ (primarily GM/Admin feature)

---

## 8.2 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Yukonia III > Modifiers         [+ Add New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ CUSTOM MODIFIERS                                          ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Growth Spurt                            [Permanent]   │ ║ │
│  ║ │ Size +2                                               │ ║ │
│  ║ │ Added: Day 145                        [Edit] [Delete] │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Plague Outbreak                         [Permanent]   │ ║ │
│  ║ │ Size -1, Productivity -2                              │ ║ │
│  ║ │ Added: Day 150                        [Edit] [Delete] │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.3 Add Modifier Modal

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Add Custom Modifier                             [X]        │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Description:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Growth Spurt                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Stat to Modify:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Size                                          [▼]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Value:                                                     │
│  ┌─────────┐                                                │
│  │   +2    │                                                │
│  └─────────┘                                                │
│                                                             │
│  Duration:                                                  │
│  ☑ Permanent   ☐ Temporary (expires day: _____)             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [Cancel]                                   [Add Modifier]  │
└─────────────────────────────────────────────────────────────┘
```

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | Text | Yes | Event/source description |
| Stat | Select | Yes | Size, Complacency, Order, Productivity, Piety |
| Value | Number | Yes | Positive or negative integer |
| Duration | Radio | Yes | Permanent or Temporary |
| Expires Day | Number | Conditional | Required if Temporary |

---

## 8.4 API Integration

| Action | Method | Endpoint | Permission |
|--------|--------|----------|------------|
| List modifiers | GET | `/api/v1/colonies/:id/modifiers` | Viewer+ |
| Add modifier | POST | `/api/v1/colonies/:id/modifiers` | Editor+ |
| Update modifier | PATCH | `/api/v1/colonies/:id/modifiers/:mod_id` | Editor+ |
| Delete modifier | DELETE | `/api/v1/colonies/:id/modifiers/:mod_id` | Editor+ |

---

## 8.5 States

| State | Display |
|-------|---------|
| Loading | Skeleton list items |
| Empty | "No custom modifiers applied." |
| Error | Error panel with retry |

---

## 8.6 Permission Summary

| Action | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| View list | ✅ | ✅ | ✅ |
| Add modifier | ❌ | ✅ | ✅ |
| Edit modifier | ❌ | ✅ | ✅ |
| Delete modifier | ❌ | ✅ | ✅ |

---

**Related Documents:**
- [Colony Dashboard](./04-colony-dashboard.md)
- [Shared Components](./11-components.md)