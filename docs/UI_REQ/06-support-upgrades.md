# 06 — Support Upgrades

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 6.1 Overview

Support Upgrades are modular improvements that provide bonuses to colony stats. Unlike infrastructure, upgrades can have custom choices (e.g., "Security" vs "Surveillance" for Security Systems).

**Permission Required:** Editor+ for modifications; Viewer for read-only access.

---

## 6.2 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Yukonia III > Support Upgrades              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ SUPPORT UPGRADES                              [+ Add New] ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Cogitator Banks                          [Working] ☑  │ ║ │
│  ║ │ Choice: Processing Speed                              │ ║ │
│  ║ │ +1 Profit Factor                     [Edit] [Delete]  │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Trade Routes                             [Working] ☑  │ ║ │
│  ║ │ Choice: Void Trade                                    │ ║ │
│  ║ │ +1 Profit Factor                     [Edit] [Delete]  │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6.3 Add Upgrade Modal

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Add Support Upgrade                             [X]        │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Upgrade Type:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select a type...                              [▼]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Custom Name (optional):                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Orbital Cogitator Array                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Choice (if applicable):                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select choice...                              [▼]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Starting State:                                            │
│  ☑ Working   ☐ Not Working                                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [Cancel]                               [Add Upgrade]       │
└─────────────────────────────────────────────────────────────┘
```

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Upgrade Type | Select | Yes | From available types |
| Custom Name | Text | No | Max 100 characters |
| Choice | Select | Conditional | Only if type has choices |
| Starting State | Radio | Yes | Working or Not Working |

---

## 6.4 Edit Upgrade Modal

**Editable Fields:**

- Custom Name (text input)
- Choice (dropdown, if applicable)
- State (Working/Not Working toggle)

**Read-only:**

- Bonuses (determined by type and choice)

---

## 6.5 API Integration

| Action | Method | Endpoint | Permission |
|--------|--------|----------|------------|
| List upgrades | GET | `/api/v1/colonies/:id/support-upgrades` | Viewer+ |
| Add upgrade | POST | `/api/v1/colonies/:id/support-upgrades` | Editor+ |
| Update upgrade | PATCH | `/api/v1/colonies/:id/support-upgrades/:upgrade_id` | Editor+ |
| Delete upgrade | DELETE | `/api/v1/colonies/:id/support-upgrades/:upgrade_id` | Admin |
| List types | GET | `/api/v1/support-upgrade-types` | All |

---

## 6.6 States

| State | Display |
|-------|---------|
| Loading | Skeleton list items |
| Empty | "No support upgrades installed." |
| Error | Error panel with retry |

---

## 6.7 Permission Summary

| Action | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| View list | ✅ | ✅ | ✅ |
| Add new | ❌ | ✅ | ✅ |
| Edit | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ✅ |

---

**Related Documents:**

- [Colony Dashboard](./04-colony-dashboard.md)
- [Infrastructure](./05-infrastructure-management.md)
- [Shared Components](./11-components.md)
