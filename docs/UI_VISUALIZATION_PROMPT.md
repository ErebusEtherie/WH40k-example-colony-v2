# UI Visualization Prompt — WH40k Colony Manager Dashboard

**Version:** 2.0 (Enhanced with API Integration Details)  
**Date:** 2026-08-26  
**Target:** Frontend Developers / UI Designers  
**Theme:** Cult Mechanicus Data-Slate (Dark, Industrial, Gothic)

---

## 🎯 Project Overview

Build a **Warhammer 40k Rogue Trader Colony Manager** web application for Game Masters and Players to track and manage their colony's development, infrastructure, and representatives.

**Key Principles:**
- **Read-heavy interface** — Most data is displayed, not edited
- **GM-controlled modifications** — Players view; GMs edit stats via modifiers
- **Lore-accurate presentation** — Use WH40k terminology and theming
- **Dark theme** — Cult Mechanicus aesthetic (dark backgrounds, amber/orange accents, gothic UI elements)

---

## 📐 Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WH40k Colony Manager UI                       │
├─────────────────────────────────────────────────────────────────┤
│  Navigation Bar                                                  │
│  [Dashboard] [Infrastructure] [Representatives] [Events] [Plans]│
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Panel 1: Colony "At a Glance" (Dashboard Home)              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Panel 2: Colony Details (Full Stats + Modifiers)            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Panel 3: Infrastructure & Upgrades Management               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Panel 4: Representative Management                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Panel 5: Development Planning                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System Reference

**See:** `docs/UI_DESIGN_SYSTEM.md` for complete Cult Mechanicus styling

**Key Visual Elements:**
- **Background:** Dark gray/black (`#0a0a0f`, `#1a1a2e`)
- **Primary Accent:** Amber/Orange (`#ff6b00`, `#ffa500`)
- **Secondary Accent:** Steel Gray (`#4a4a5a`)
- **Text:** Light gray/white (`#e0e0e0`, `#ffffff`)
- **Status Colors**:
  - ✅ Working/Good: Green (`#00aa00`)
  - ⚠️ Disrupted/Warning: Amber (`#ffaa00`)
  - ❌ Not Working/Critical: Red (`#aa0000`)
- **Fonts**: Monospace for data, Gothic-style headers (if available)
- **UI Components**: Data-slate panels, bordered sections, technical readout aesthetic

---

## 📊 Panel 1: Colony "At a Glance" (Dashboard Home)

**Purpose**: First screen users see. Quick overview of colony status. **Read-only**.

**API Endpoint**: `GET /api/v1/colonies/{id}`

### Data Mapping

| UI Field | API Field | Notes |
|----------|-----------|-------|
| Colony Name | `name` | Editable via PATCH |
| Colony Type | `colony_type` | Display enum label |
| Founder | `owner` | User-provided text |
| Age (Days) | `age_days` | Integer |
| Age (Formatted) | Calculated | years = age_days // 365, months = (age_days % 365) // 30 |
| Representative | `representative_name` | From related Representative object |
| Size | `state.size.current` | Calculated, clamped 0-10 |
| Complacency | `state.complacency.current` | Min 0 |
| Order | `state.order.current` | Min 0 |
| Productivity | `state.productivity.current` | Min 0 |
| Piety | `state.piety.current` | Min 0 |
| Profit Factor | `state.profit_factor` | Calculated, min 0 |

### Lore State Descriptions

| Stat | Value Condition | Lore State | Display Label |
|------|-----------------|------------|---------------|
| Size | 0 | `extinct` | Extinct |
| Size | 1-2 | `hamlet` | Hamlet |
| Size | 3-4 | `freehold` | Freehold |
| Size | 5-6 | `city` | City |
| Size | 7-8 | `metropolis` | Metropolis |
| Size | 9-10 | `hive` | Hive World |
| Complacency | > Size | `placated` | Placated (Warning) |
| Order | 0 | `anarchy` | Anarchy (Critical) |
| Productivity | 0 | `halted` | Halted (Critical) |
| Productivity | > Size | `productive` | Productive |
| Piety | 0 | `heretical` | Heretical (Critical) |
| Piety | > Size | `pious` | Pious |
| All others | Normal | `stable` | Stable |

---

## 📋 Panel 2: Colony Details (Full View)

**Purpose**: Detailed colony view with modifier breakdowns. **Mostly read-only, some edits**.

**API Endpoints**: `GET /api/v1/colonies/{id}` + `GET /api/v1/colonies/{id}/modifiers`

### Editable Fields
- Name (text input)
- Star System (text input)  
- Founder/Owner (text input)
- Age in Days (number input with +/- buttons)

### Calculated Fields (Read-only)
- Size (base + modifiers, clamped 0-10)
- Complacency, Order, Productivity, Piety (base + modifiers, min 0)
- Profit Factor (calculated from Size, leadership, penalties)
- All lore state descriptions

### Modifier Breakdown
Each stat shows: Base Value | Modifiers List | Total Modifier | Final Value
Sources: Infrastructure, Support Upgrades, Representatives, Events, Custom Modifiers

---

## 👤 Panel 3: Representative Management

**Purpose**: View and manage colony Representatives.

**API Endpoints**:
- `GET /api/v1/representatives` — List all
- `GET /api/v1/representatives/{id}` — Get details
- `POST /api/v1/representatives` — Create new
- `PATCH /api/v1/representatives/{id}` — Update
- `PATCH /api/v1/colonies/{id}` — Assign via representative_id

### Characteristic Display
Format: `WS: 40 (4)` where bonus = floor(value / 10)

Characteristics: WS, BS, S, T, Agi, Int, Per, W, Fel, Wounds, Fate

### Editable Fields
- Name (text)
- Skills (text list, one per line, format: "Skill" or "Skill +10")
- Talents (text list, one per line)
- Personalities (enum list, 1-4 selections based on "Quite a Character" position)

### Personality Count Rules
- **Base limit**: 2 personalities maximum
- **Quite a Character first**: Up to 4 personalities allowed
- **Quite a Character second**: Up to 3 personalities allowed
- **Minimum**: 1 personality required
- Display validation error if count exceeds limit based on **"Quite a Character"** position

### Read-only Fields
- Type (enum: Judge, Cardinal, Satrap, Merchant, etc.)
- Characteristic values and bonuses
- Leadership modifier (calculated)

---

## 🏗️ Panel 4: Infrastructure & Upgrades Management

**Purpose**: Manage Hard Infrastructure and Support Upgrades.

**API Endpoints**:
- Infrastructure: `GET/POST /colonies/{id}/infrastructure`, `PATCH/DELETE /colonies/{id}/infrastructure/{id}`
- Upgrades: `GET/POST /colonies/{id}/upgrades`, `PATCH/DELETE /colonies/{id}/upgrades/{id}`

### Infrastructure Fields
- Name (editable)
- Type (enum: Manufactorum, Habitation, Utility, Agricultural, Mining, Spaceport, Defense, Administrative)
- Status (enum: Working, Disrupted, Not Working)
- Modifiers (read-only, from API)
- Notes (editable)

### Status Workflow
Working → Disrupted → Not Working (and reverse)

### Upgrade Fields
- Name (editable)
- Type (enum)
- Status (enum: Working, Disrupted, Not Working)
- Custom Stat Choice (for flexible upgrades)
- Modifiers (read-only)
- Notes (editable)

---

## 📅 Panel 5: Development Planning

**Purpose**: Plan future colony development projects.

**API Endpoints**:
- `GET/POST /development-plans/colonies/{id}`
- `PATCH/DELETE /development-plans/{plan_id}`

### Plan Fields
- Project Name (editable)
- Infrastructure Type (enum)
- Target Type (enum: Infrastructure, Support Upgrade)
- Priority (enum: Low, Medium, High, Critical)
- Status (enum: Planned, In Progress, Delivered, Cancelled)
- Description (text area)
- Progress Notes (text area)
- Order/Priority in List (number)

### Status Workflow
Planned ↔ In Progress ↔ Delivered (terminal)
Planned ↔ In Progress ↔ Cancelled (terminal)

### Priority Display
- Critical: Red indicator
- High: Orange indicator
- Medium: Yellow indicator
- Low: Gray indicator

---

## 🔌 API Integration Summary

### Core Endpoints

| Feature | Method | Endpoint |
|---------|--------|----------|
| Colony List | GET | `/api/v1/colonies` |
| Colony Detail | GET | `/api/v1/colonies/{id}` |
| Update Colony | PATCH | `/api/v1/colonies/{id}` |
| Roll Status | GET | `/api/v1/colonies/{id}/roll-status` |
| Modifiers | GET | `/api/v1/colonies/{id}/modifiers` |
| Infrastructure | GET/POST | `/api/v1/colonies/{id}/infrastructure` |
| Infrastructure Item | GET/PATCH/DELETE | `/api/v1/colonies/{id}/infrastructure/{id}` |
| Upgrades | GET/POST | `/api/v1/colonies/{id}/upgrades` |
| Upgrade Item | GET/PATCH/DELETE | `/api/v1/colonies/{id}/upgrades/{id}` |
| Resources | GET/POST | `/api/v1/colonies/{id}/resources` |
| Representatives | GET/POST | `/api/v1/representatives` |
| Representative Detail | GET/PATCH | `/api/v1/representatives/{id}` |
| Development Plans | GET/POST | `/api/v1/development-plans/colonies/{id}` |
| Plan Item | GET/PATCH/DELETE | `/api/v1/development-plans/{id}` |
| Events | GET/POST | `/api/v1/events/colonies/{id}` |

---

## 🔐 Permission Levels

| Role | View | Edit Colony | Infrastructure | Plans | Manage Users |
|------|------|-------------|----------------|-------|---------------|
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ | ✅ | ✅ | ❌ |
| Colony Manager | ✅ | ✅ | ✅ | ✅ | ✅ (colony) |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ (all) |

---

## 📱 Responsive Design

- **Desktop (1920x1080+)**: All panels visible, multi-column
- **Tablet (768x1024)**: Stacked panels, collapsible sections
- **Mobile (375x667)**: Single column, accordion-style

---

## ✅ Implementation Checklist

### Phase 1: Core Dashboard
- [ ] Colony "At a Glance" panel (read-only)
- [ ] Colony Details panel with stat breakdowns
- [ ] Age calculation (days → years/months/days)
- [ ] Lore state labels and icons
- [ ] Modifier breakdown modals

### Phase 2: Infrastructure Management
- [ ] Infrastructure list view
- [ ] Add/Edit/Delete infrastructure
- [ ] Status workflow (Working ↔ Disrupted ↔ Not Working)
- [ ] Support Upgrades management
- [ ] Custom stat choice for upgrades

### Phase 3: Representative Management
- [ ] Representative list (available + assigned)
- [ ] Representative detail view
- [ ] Edit skills/talents (text list)
- [ ] Assign/Change representative
- [ ] Characteristic display with bonus calculation

### Phase 4: Development Planning
- [ ] Development plan list (grouped by priority)
- [ ] Add/Edit/Delete plans
- [ ] Status workflow
- [ ] Reordering (drag-drop or up/down buttons)
- [ ] Progress tracking

### Phase 5: Resources & Events
- [ ] Planetary resources list
- [ ] Add/Edit resources
- [ ] Event list (active/inactive)
- [ ] Create/Edit events with modifiers

### Phase 6: Polish & UX
- [ ] Loading states
- [ ] Error handling
- [ ] Confirmation dialogs
- [ ] Tooltips for lore terms
- [ ] Keyboard shortcuts
- [ ] Print/export view

---

## 📚 Related Documentation

- `docs/UI_DESIGN_SYSTEM.md` — Cult Mechanicus visual design
- `docs/UI_QUICK_REFERENCE.md` — CSS/HTML snippets
- `docs/api_guide_phase_3.md` — Complete API reference
- `docs/UI_PANEL_REQUIREMENTS.md` — Original requirements document
- `docs/business_analysis.md` — Game rules and calculations

---

## 🎯 Success Criteria

1. **Lore Accuracy:** All terminology matches WH40k Rogue Trader RPG
2. **Usability:** GMs can manage colony in <3 clicks for common actions
3. **Performance:** Page loads <2s, API calls <500ms
4. **Accessibility:** WCAG 2.1 AA compliant (contrast, keyboard nav)
5. **Responsiveness:** Works on desktop, tablet, mobile
6. **Theme:** Cult Mechanicus aesthetic consistently applied

---

**Generated for:** WH40k Colony Manager Project  
**API Version:** 1.0 (Phase 3 Complete)  
**UI Framework:** Flexible (React, Vue, Svelte, or vanilla JS + CSS)  
**Backend:** FastAPI (Python)  
**Database:** SQLite (development), PostgreSQL (production)
