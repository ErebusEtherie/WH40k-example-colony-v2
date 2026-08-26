# 05 — Infrastructure Management

**Version:** 1.0
**Date:** 2026-08-24
**Status:** Complete

---

## 5.1 Overview

Infrastructure Management allows users to add, view, edit, and remove Hard Infrastructure buildings for a colony. Each infrastructure item provides bonuses/penalties to colony stats.

**Permission Required:** Editor+ for modifications; Viewer for read-only access.

---

## 5.2 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Yukonia III > Infrastructure                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ HARD INFRASTRUCTURE                           [+ Add New] ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Power Network                            [Working] ☑  │ ║ │
│  ║ │ +1 Order, +1 Productivity              [Edit] [Delete]│ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Water Purification                       [Working] ☑  │ ║ │
│  ║ │ +1 Size, +1 Order                    [Edit] [Delete]  │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Housing Complex                         [Not Working] ☐ │ ║ │
│  ║ │ -1 Complacency, +1 Size              [Edit] [Delete]  │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.3 Infrastructure List View

### List Item Components

| Element | Description | Permission |
|---------|-------------|------------|
| Name | Infrastructure type name | All |
| Working State | Purity seal checkbox | Editor+ |
| Bonuses | Stat modifiers (e.g., "+1 Order") | All |
| Edit Button | Opens edit modal | Editor+ |
| Delete Button | Opens confirmation modal | Admin |

### Sorting & Filtering

| Option | Values | Default |
|--------|--------|---------|
| Sort By | Name, State, Date Added | Name |
| Filter by State | All, Working, Not Working | All |

---

## 5.4 Add Infrastructure Modal

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Add Infrastructure                              [X]        │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Infrastructure Type:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select a type...                              [▼]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Custom Name (optional):                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Main Power Relay                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Starting State:                                            │
│  ☑ Working   ☐ Not Working                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [Cancel]                              [Add Infrastructure] │
└─────────────────────────────────────────────────────────────┘
```

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Infrastructure Type | Select | Yes | Must select from available types |
| Custom Name | Text | No | Max 100 characters |
| Starting State | Radio | Yes | Working or Not Working |

### Available Infrastructure Types

Loaded from API: `GET /api/v1/infrastructure-types`

---

## 5.5 Edit Infrastructure Modal

**Editable Fields:**

- Custom Name (text input)
- State (Working/Not Working toggle)
- Bonuses are read-only (determined by type)

---

## 5.6 Delete Confirmation

Requires confirmation modal before deletion. Shows affected bonuses that will be removed.

---

## 5.7 API Integration

| Action | Method | Endpoint | Permission |
|--------|--------|----------|------------|
| List infrastructure | GET | `/api/v1/colonies/:id/infrastructure` | Viewer+ |
| Add infrastructure | POST | `/api/v1/colonies/:id/infrastructure` | Editor+ |
| Update infrastructure | PATCH | `/api/v1/colonies/:id/infrastructure/:infra_id` | Editor+ |
| Delete infrastructure | DELETE | `/api/v1/colonies/:id/infrastructure/:infra_id` | Admin |
| List types | GET | `/api/v1/infrastructure-types` | All |

---

## 5.8 States

| State | Display |
|-------|---------|
| Loading | Skeleton list items with shimmer |
| Empty | "No infrastructure built yet. Click 'Add New' to build." |
| Error | Error panel with retry button |

---

## 5.9 Permission Summary

| Action | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| View list | ✅ | ✅ | ✅ |
| Add new | ❌ | ✅ | ✅ |
| Edit state/name | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ✅ |
| Toggle working state | ❌ | ✅ | ✅ |

---

**Related Documents:**

- [Colony Dashboard](./04-colony-dashboard.md)
- [Support Upgrades](./06-support-upgrades.md)
- [Shared Components](./11-components.md)
