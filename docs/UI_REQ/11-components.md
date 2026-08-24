# 11 — Shared Components

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 11.1 Overview

This document defines reusable UI components used across the application. All components follow the Mechanicum Design System (`../UI_DESIGN_SYSTEM.md`).

---

## 11.2 Layout Components

### Panel

**Purpose:** Container with Mechanicum styling (border, background, header bar).

```
╔═══════════════════════════════════════════════════════════╗
║ PANEL TITLE                                    [Action]  ║
║ ───────────────────────────────────────────────────────── ║
║ Content area...                                          ║
╚═══════════════════════════════════════════════════════════╝
```

**Props:**

- `title` (string, required)
- `action` (slot/node, optional)
- `variant` ('default' | 'warning' | 'error')

**CSS Class:** `.mech-panel`

---

### StatCard

**Purpose:** Display a single colony stat with value and lore state.

```
┌──────────────┐
│    SIZE      │
│      3       │
│   [Stable]   │
└──────────────┘
```

**Props:**

- `label` (string, required)
- `value` (number, required)
- `loreState` (string, optional)
- `loreStateColor` ('green' | 'yellow' | 'red')

**CSS Class:** `.stat-card`

---

### LoreBadge

**Purpose:** Display lore state label with color coding.

| State | Color | Example |
|-------|-------|---------|
| Stable | Green | [Stable] |
| Productive | Green | [Productive] |
| Placated | Yellow | [Placated] |
| Anarchy | Red | [Anarchy] |
| Heretical | Red | [Heretical] |

**Props:**

- `state` (string, required)
- `size` ('sm' | 'md' | 'lg')

**CSS Class:** `.lore-badge`

---

## 11.3 Form Components

### MechInput

**Purpose:** Styled text/email/password input.

```
┌─────────────────────────────────────────────────────┐
│ Label                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ [Error message in red]                              │
└─────────────────────────────────────────────────────┘
```

**Props:**

- `label` (string, required)
- `type` ('text' | 'email' | 'password' | 'number')
- `value` (string/number)
- `error` (string, optional)
- `disabled` (boolean)

**CSS Class:** `.mech-input`

---

### MechSelect

**Purpose:** Styled dropdown select.

**Props:**

- `label` (string, required)
- `options` (array, required)
- `value` (string)
- `error` (string, optional)

**CSS Class:** `.mech-select`

---

### PuritySealCheckbox

**Purpose:** Checkbox styled as a wax purity seal.

```
☑ Working   ☐ Not Working
```

**Props:**

- `checked` (boolean)
- `label` (string)
- `onChange` (function)
- `disabled` (boolean)

**CSS Class:** `.purity-seal`

---

### MechButton

**Purpose:** Styled button with variants.

| Variant | Use Case | Color |
|---------|----------|-------|
| Primary | Main actions | Plasma blue |
| Secondary | Cancel, back | Copper/bronze |
| Danger | Delete, destructive | Red |
| Ghost | Inline actions | Transparent |

**Props:**

- `variant` ('primary' | 'secondary' | 'danger' | 'ghost')
- `size` ('sm' | 'md' | 'lg')
- `disabled` (boolean)
- `loading` (boolean)
- `onClick` (function)

**CSS Class:** `.mech-button`

---

## 11.4 Feedback Components

### Toast

**Purpose:** Temporary notification messages.

| Type | Color | Icon |
|------|-------|------|
| Success | Green | ✓ |
| Error | Red | ✗ |
| Warning | Yellow | ⚠ |
| Info | Blue | ℹ |

**Props:**

- `type` ('success' | 'error' | 'warning' | 'info')
- `message` (string, required)
- `duration` (number, ms)
- `onDismiss` (function)

**CSS Class:** `.toast`

---

### LoadingSpinner

**Purpose:** Loading indicator with Mechanicum styling.

**CSS Class:** `.mech-spinner`

---

### Skeleton

**Purpose:** Placeholder for loading content.

**Variants:**

- `text` - Horizontal bars
- `card` - Card-shaped placeholder
- `list` - List item placeholders

**CSS Class:** `.skeleton`

---

## 11.5 Navigation Components

### Breadcrumb

**Purpose:** Show current location in navigation hierarchy.

```
Dashboard > Yukonia III > Infrastructure
```

**Props:**

- `items` (array of {label, href})

**CSS Class:** `.breadcrumb`

---

### Sidebar

**Purpose:** Main navigation sidebar.

**Props:**

- `items` (array of navigation items)
- `collapsed` (boolean)
- `onNavigate` (function)

**CSS Class:** `.mech-sidebar`

---

## 11.6 Component Usage Example

```jsx
<Panel title="Colony Stats">
  <div className="stat-grid">
    <StatCard 
      label="Size" 
      value={colony.size.current} 
      loreState={colony.size.lore_state}
    />
    <StatCard 
      label="Order" 
      value={colony.order.current} 
      loreState={colony.order.lore_state}
    />
  </div>
</Panel>
```

---

**Related Documents:**

- [UI Design System](../UI_DESIGN_SYSTEM.md)
- All screen specifications reference these components
