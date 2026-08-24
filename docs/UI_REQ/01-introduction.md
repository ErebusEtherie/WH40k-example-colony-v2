# 01 — Introduction

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 1.1 Purpose & Scope

This document defines the complete user interface requirements for the WH40k Colony Manager web application. It covers all screens, user flows, components, and states required to interact with the colony management system.

### What This Document Covers

- ✅ All application screens and their purposes
- ✅ User flows and workflows
- ✅ UI components and their behavior
- ✅ State management (loading, errors, empty states)
- ✅ API integration patterns
- ✅ Responsive and accessibility requirements

### What This Document Does NOT Cover

- ❌ Visual design details (see `../UI_DESIGN_SYSTEM.md`)
- ❌ Detailed panel specifications (see `../UI_PANEL_REQUIREMENTS.md`)
- ❌ Business logic and game rules (see `../business_analysis.md`)
- ❌ API endpoint specifications (see `../api/openapi.json`)

---

## 1.2 Target Users

### Game Master (GM)

**Description:** The GM administers the campaign, creates colonies, and manages game events.

**Primary Tasks:**

- Create new colonies for players
- Apply event outcomes via modifiers
- Manage user access and permissions
- Oversee all colonies in the campaign
- Export/import colony data for backup

**UI Needs:**

- Quick access to all colonies
- Modifier management tools prominently available
- Audit log visibility
- User management capabilities

---

### Player (Editor Role)

**Description:** A Rogue Trader or colony governor managing their assigned colony.

**Primary Tasks:**

- View colony statistics and status
- Add/remove infrastructure
- Add/remove support upgrades
- Assign representatives
- Track colony age and development

**UI Needs:**

- Clear stat displays with lore states
- Easy infrastructure management
- Visual feedback on colony health
- Quick access to colony dashboard

---

### Player (Viewer Role)

**Description:** An observer or secondary player with read-only access.

**Primary Tasks:**

- View colony status
- Review colony history
- Check infrastructure and upgrades

**UI Needs:**

- Read-only dashboard access
- Clear information hierarchy
- No editing controls visible

---

## 1.3 Design Principles

### Core Principle

> *"The spreadsheet is the UI"* — Preserve the usability patterns users already understand from the Excel-based colony manager, but render them as an immersive Warhammer 40k Mechanicum data-slate interface.

### Guiding Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Data Density** | Show all relevant information at once; avoid excessive navigation | Colony dashboard shows all stats in one view |
| **Clear Hierarchy** | Primary stats visible, secondary details collapsible | Stats always visible; modifier list collapsible |
| **Immediate Feedback** | Calculated values update instantly on input changes | Adding infrastructure immediately updates Profit Factor |
| **Lore-Immersion** | Mechanicum aesthetic without sacrificing readability | Plasma-blue calculated values, copper accents |
| **GM Control** | All game rules visible; GM can override via modifiers | Custom modifiers allow any stat adjustment |
| **Progressive Disclosure** | Show complexity only when needed | Infrastructure details expand on click |
| **Forgiving** | Easy to undo mistakes; confirm destructive actions | Delete requires confirmation; modifiers can be removed |

---

## 1.4 Technology Assumptions

### Frontend Framework

These requirements are **framework-agnostic**. Implementation can use:

- React
- Vue 3
- Svelte
- Or any modern component-based framework

### Required Capabilities

| Capability | Purpose |
|------------|---------|
| Component system | Reusable UI components |
| State management | Handle colony state, auth state |
| HTTP client | API communication |
| Routing | Navigation between screens |
| Form handling | Input validation, submission |

### CSS Framework

Use the Mechanicum Design System:

- **Location:** `../UI_DESIGN_SYSTEM.md`
- **Implementation:** `src/assets/css/mechanicum-design-system.css`
- **Key Classes:** `.mech-panel`, `.mech-input`, `.purity-seal`, etc.

---

## 1.5 Terminology

| Term | Definition |
|------|------------|
| **Colony** | A player's settlement in the Rogue Trader campaign |
| **Dashboard** | The main colony view with 3 panels (Basic Info, Stats, Infrastructure) |
| **Infrastructure** | Hard infrastructure buildings (Power Network, Water Purification, etc.) |
| **Support Upgrades** | Modular upgrades that provide bonuses |
| **Modifiers** | Custom bonuses/penalties applied by the GM |
| **Representative** | The character governing the colony |
| **Lore State** | Descriptive label for stat levels (e.g., "Anarchy", "Placated") |
| **Profit Factor (PF)** | Derived stat representing colony profitability |
| **Purity Seal** | Checkbox component styled as a wax seal |

---

## 1.6 Document Maintenance

**When to Update:**

- Adding new screens or features
- Changing user flows
- Adding new components
- API endpoint changes affecting UI

**Review Cycle:**

- Review before each development sprint
- Update after major feature completion

---

**Related Documents:**

- [Application Structure](./02-application-structure.md)
- [UI Design System](../UI_DESIGN_SYSTEM.md)
- [Business Analysis](../business_analysis.md)
