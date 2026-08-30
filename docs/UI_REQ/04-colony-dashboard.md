# 04 — Colony Dashboard

**Version:** 1.0
**Date:** 2026-08-24
**Status:** Complete

---

## 4.1 Overview

The Colony Dashboard is the primary view for managing a colony. It displays all critical information in a three-panel layout.

**Detailed Specifications:** See [`../archive/UI_PANEL_REQUIREMENTS.md`](../archive/UI_PANEL_REQUIREMENTS.md) for complete panel specifications, calculations, and API integration details.

This document provides:

- Screen layout and navigation
- Component integration summary
- Permission-based UI behavior
- Quick reference for developers

---

## 4.2 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Yukonia III | [Edit Colony]                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ PANEL 1: Colony Basic Information                         ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║ Name: [Yukonia III ✏️]  Owner: [Valmar Valtheran ✏️]      ║ │
│  ║ Type: Industrial (read-only)  Age: [162 days] [+][-]      ║ │
│  ║ Formatted Age: 5 months and 12 days                       ║ │
│  ║ Size: 3 (Freehold) — Calculated from base + modifiers     ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ PANEL 2: Colony Current Status                            ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║ ┌──────────┬──────────┬──────────┬──────────┬──────────┐ ║ │
│  ║ │ Size     │Complacency│  Order   │Productiv.│  Piety   │ ║ │
│  ║ │   3      │    8     │    5     │    6     │    5     │ ║ │
│  ║ │ Stable   │ Placated │  Stable  │Productive│  Stable  │ ║ │
│  ║ └──────────┴──────────┴──────────┴──────────┴──────────┘ ║ │
│  ║ Profit Factor: 5 (calculated)                             ║ │
│  ║ Leadership Modifier: +2 (from Representative)             ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ PANEL 3: Infrastructure & Upgrades Summary                ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║ HARD INFRASTRUCTURE                    [View All →]       ║ │
│  ║ • Power Network (Working)                                 ║ │
│  ║ • Water Purification (Working)                            ║ │
│  ║ • Housing Complex (Not Working)                             ║ │
│  ║                                                           ║ │
│  ║ SUPPORT UPGRADES                       [View All →]       ║ │
│  ║ • Cogitator Banks (+1 PF)                                 ║ │
│  ║ • Trade Routes (+1 PF)                                    ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4.3 Panel Summaries

### Panel 1: Colony Basic Information

| Field | Editable | Notes |
|-------|----------|-------|
| Colony Name | ✅ Editor+ | Text input |
| Colony Owner | ✅ Editor+ | Text input |
| Colony Type | ❌ | Set at creation |
| Age (Days) | ✅ Editor+ | Number input with +/- buttons |
| Age (Formatted) | ❌ | Auto-calculated |
| Size | ❌ | Calculated from base + modifiers |
| Size Lore State | ❌ | Auto-calculated |

**See:** [`../archive/UI_PANEL_REQUIREMENTS.md`](../archive/UI_PANEL_REQUIREMENTS.md) §Panel 1

---

### Panel 2: Colony Current Status

| Stat | Editable | Notes |
|------|----------|-------|
| Size | ❌ | Display only |
| Complacency | ❌ | Display only |
| Order | ❌ | Display only |
| Productivity | ❌ | Display only |
| Piety | ❌ | Display only |
| Profit Factor | ❌ | Calculated |
| Leadership Modifier | ❌ | From Representative |
| All Lore States | ❌ | Auto-calculated |

**See:** [`../archive/UI_PANEL_REQUIREMENTS.md`](../archive/UI_PANEL_REQUIREMENTS.md) §Panel 2

---

## 4.4 Permission-Based UI

| Element | Viewer | Editor | Admin |
|---------|--------|--------|-------|
| Edit colony name/owner | ❌ Hidden | ✅ Visible | ✅ Visible |
| Edit age | ❌ Hidden | ✅ Visible | ✅ Visible |
| View All (Infra) | ✅ Visible | ✅ Visible | ✅ Visible |
| View All (Upgrades) | ✅ Visible | ✅ Visible | ✅ Visible |
| Add buttons (Panel 3) | ❌ Hidden | ✅ Visible | ✅ Visible |

---

## 4.5 Component Integration

### Required Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `StatCard` | `./11-components.md` | Display individual stats with lore state |
| `PuritySealCheckbox` | `./11-components.md` | Infrastructure working state toggle (in detail view) |
| `LoreBadge` | `./11-components.md` | Display lore state labels |
| `EditableField` | `./11-components.md` | Inline text editing for name/owner |
| `NumberInput` | `./11-components.md` | Age input with +/- buttons |
| `Panel` | `./11-components.md` | Mechanicum-styled container |

### API Calls on Load

```javascript
// Load colony detail
GET /api/v1/colonies/:id
→ Returns ColonyResponse with nested ColonyStateNested

// Load infrastructure summary
GET /api/v1/colonies/:id/infrastructure
→ Returns list for Panel 3

// Load support upgrades summary
GET /api/v1/colonies/:id/support-upgrades
→ Returns list for Panel 3
```

---

## 4.6 Navigation

### From Dashboard

| Click Target | Destination |
|--------------|-------------|
| "View All" Infrastructure | `/colony/:id/infrastructure` |
| "View All" Upgrades | `/colony/:id/upgrades` |
| Back button | `/dashboard` (colony list) |

### To Dashboard

| Source | Navigation |
|--------|------------|
| Colony List | Click colony name → Dashboard |
| Infrastructure Page | Back button / breadcrumb |
| Upgrades Page | Back button / breadcrumb |
| Sidebar | Click "Colony" → Dashboard |

---

## 4.7 States

| State | Display |
|-------|---------|
| Loading | Show skeleton panels with shimmer effect |
| Error | Show error panel with retry button |
| Empty (no infra) | Show "No infrastructure built" message |
| Empty (no upgrades) | Show "No support upgrades installed" message |
| No Representative | Show "No representative assigned" in Panel 2 |

---

## 4.8 Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1200px) | 3-panel vertical stack, full width |
| Tablet (768-1199px) | 3-panel vertical stack, full width |
| Mobile (<768px) | Panels stack vertically; stats show 2 per row |

**Mobile Considerations:**

- Stats grid becomes 2 columns instead of 5
- Edit icons become buttons below fields
- "View All" links become prominent buttons

---

**Related Documents:**

- [Panel Specifications](../archive/UI_PANEL_REQUIREMENTS.md) — Complete panel details
- [Infrastructure Management](./05-infrastructure-management.md)
- [Support Upgrades](./06-support-upgrades.md)
- [Shared Components](./11-components.md)
