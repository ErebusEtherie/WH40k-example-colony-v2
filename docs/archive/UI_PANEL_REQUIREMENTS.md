# UI Panel Requirements — Colony Dashboard

**Version:** 1.1 (Cleanup Complete)
**Date:** 2026-08-24
**Status:** Requirements Defined

This document defines the three main panels of the Colony Dashboard view, including
what data is displayed, what fields are editable, and how values are calculated.

---

## Panel 1: Colony Basic Information

**Purpose:** "At a glance" short information panel with basic colony identity and age.

**Location:** Top section of Colony Dashboard

**Fields:**

| Field | Example | Editable | Source/Notes |
|-------|---------|----------|--------------|
| **Colony Name** | Yukonia III | ✅ Yes (edit) | Mandatory at creation |
| **Colony Owner** | Valmar Valtheran | ✅ Yes (edit) | Mandatory at creation |
| **Colony Type** | Industrial | ❌ No | Set at creation, defines starting base stats |
| **Colony Age (Days)** | 162 days | ✅ Yes (input or +/- buttons) | Integer, starts at 0, cannot be negative |
| **Colony Age (Formatted)** | 5 months and 12 days | ❌ No | Calculated from `age_days` |
| **Colony Current Status** | See Panel 2 | ❌ No | Reference to Panel 2 summary |
| **Colony Infrastructure Status** | See Panel 3 | ❌ No | Reference to Panel 3 summary |

### Age Calculation Formula

```python
years = age_days // 365
remaining_days = age_days % 365
months = remaining_days // 30
days = remaining_days % 30

# Display format: "X years, Y months, Z days"
# Omit zero values: "5 months and 12 days" (not "0 years, 5 months, 12 days")
```

### Size Calculation

**Important:** Size is a **calculated value**, not directly editable. The formula is:

```python
actual_size = clamp(base_size + sum(size modifiers), min=0, max=10)
```

- **Base Size**: Set at colony creation from colony type, can be modified by GM via Custom Modifiers (e.g., growth/decay events)
- **Actual Size**: Display value, automatically calculated, capped at 10
- **GM Modifications**: To change Size, GM creates Custom Modifiers with `stat: size`, `value: +/-X` (e.g., "Growth Check: Size +2", "Plague Event: Size -1")

**User Actions:**

- Edit colony name (text input)
- Edit colony owner (text input)
- Edit age in days (number input with +/- buttons)
- **View Size** (read-only, calculated from base_size + modifiers)
- View colony type (read-only, set at creation)

---

## Panel 2: Colony Current Status

**Purpose:** Presents current colony status with calculated values of colony stats, size, and descriptive status labels.

**Location:** Main section of Colony Dashboard, below Panel 1

**Fields:**

| Field | Example | Editable | Source/Notes |
|-------|---------|----------|--------------|
| **Size** | 3 | ❌ No (calculated) | `base_size` + applicable modifiers, clamped 0-10; see Size section below |
| **Size Description** | Freehold | ❌ No | Based on Size value (see mapping below) |
| **Base Size** | 3 | ✅ Yes (input or +/- buttons) | Starting Size from colony type, can be modified by GM via Custom Modifiers |
| **Profit Factor** | 4 | ❌ No | Calculated from stats, representative, infrastructure; min 0 |
| **Complacency** | 3 | ❌ No | Calculated, min 0; starts from colony type base stats |
| **Complacency Description** | Placated | ❌ No | Based on Complacency value (see rules below) |
| **Order** | 0 | ❌ No | Calculated, min 0; starts from colony type base stats |
| **Order Description** | Anarchy | ❌ No | Based on Order value (see rules below) |
| **Productivity** | 1 | ❌ No | Calculated, min 0; starts from colony type base stats |
| **Productivity Description** | Stable | ❌ No | Based on Productivity value (see rules below) |
| **Piety** | 0 | ❌ No | Calculated, min 0; starts from colony type base stats |
| **Piety Description** | Heretical | ❌ No | Based on Piety value (see rules below) |

### Size Description Mapping

Per `config/rule_tables.yaml` size_to_pf_lookup:

| Size | Description | Profit Factor |
|------|-------------|---------------|
| 0 | Ghost Town | 0 |
| 1 | Settlement | 1 |
| 2 | Outpost | 2 |
| 3 | Freehold | 3 |
| 4 | Domense | 4 |
| 5 | Holding | 6 |
| 6 | Dominion | 8 |
| 7 | Territory | 10 |
| 8 | City | 12 |
| 9 | Metropolis | 14 |
| 10 | Hive | 18 |

**Note:** Size descriptions are looked up from configuration, not calculated from ranges.

### Stat Description Rules

Per `domain/rules/lore_state_resolver.py`:

| Stat | Condition | Description | Effect |
|------|-----------|-------------|--------|
| **Complacency** | Value > Size | Placated | Colony is stable, no unrest |
| | Value = 0 | Riots and Unrest | Severe unrest, colony dysfunction |
| | Otherwise | Stable | Normal operation |
| **Order** | Value = 0 | Anarchy | Complete breakdown of law and order |
| | Value > Size | Orderly | Highly disciplined, controlled colony |
| | Otherwise | Stable | Normal operation |
| **Productivity** | Value > Size | Productive | Exceeding production expectations |
| | Value = 0 | Halted | Production has completely stopped |
| | Otherwise | Stable | Normal operation |
| **Piety** | Value > Size | Pious | Highly devout population |
| | Value = 0 | Heretical | Population turning away from Imperial Creed |
| | Otherwise | Stable | Normal operation |

**Implementation Note:** All stat values are clamped to minimum 0. Lore states are computed after all modifiers are applied.

### Calculation Dependencies

**Profit Factor** is calculated from:

1. Colony Size → base PF (from lookup table)
2. Representative's Leadership Modifier (highest of Int/Per/Fel bonus)
3. Infrastructure modifiers (working/disrupted)
4. Support Upgrade modifiers
5. Custom GM modifiers
6. State penalties (Anarchy = 0, Halted = halved)

**Complacency, Order, Productivity, Piety** are calculated from:

1. Colony Type base stats
2. Infrastructure modifiers
3. Support Upgrade modifiers

---

## Panel 3: Colony Infrastructure

**Purpose:** Presents short current colony infrastructure information based on full
infrastructure details. Shows Hard Infrastructure and Support Upgrades in a sorted list.

**Location:** Section of Colony Dashboard, below Panel 2

### Display Format

Sorted list with **Hard Infrastructure presented first**, then Support Upgrades.

**Fields:** Per Infrastructure Item

| Field | Example | Editable | Notes |
|-------|---------|----------|-------|
| **Name** | Garnizon Bitewnych Burzycieli | ❌ No | Descriptive, lore-friendly name |
| **Type** | Infantry Garrison | ❌ No | Infrastructure/Upgrade type |
| **Status** | Operational | ❌ No | Lore-friendly status based on real state |

### Status Mapping

**Hard Infrastructure:**

| Internal State | Display Status |
|----------------|----------------|
| `planned` | Planned |
| `working` | Operational |
| `disrupted` | Out of Service |

**Support Upgrades:**

| Internal State | Display Status |
|----------------|----------------|
| `active` | Operational |
| `inactive` | Inactive |
| `faulty` | Out of Service |

### Example Display

```text
INFRASTRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙ Łączność Astropatyczna
  Type: Communications
  Status: Out of Service

⚙ Garnizon Bitewnych Burzycieli
  Type: Infantry Garrison
  Status: Operational

⚙ Water Reclamation Plant
  Type: Water Management
  Status: Operational
```

## Data Flow Summary

```text

┌─────────────────────────────────────────────────────────┐
│                  COLONY DASHBOARD                        │
├─────────────────────────────────────────────────────────┤
│  PANEL 1: Basic Information                              │
│  - Name, Owner, Type (from Colony model)                │
│  - Age (days) ← editable, triggers recalculation        │
│  - Age (formatted) ← calculated from age_days           │
├─────────────────────────────────────────────────────────┤
│  PANEL 2: Current Status                                 │
│  - Size ← editable, triggers recalculation              │
│  - All stats ← calculated (base + modifiers)            │
│  - All descriptions ← calculated from stat values       │
│  - Profit Factor ← calculated from all sources          │
├─────────────────────────────────────────────────────────┤
│  PANEL 3: Infrastructure Summary                         │
│  - List of Infrastructure + Support Upgrades            │
│  - Name, Type, Status (all read-only)                   │
│  - Sorted: Hard Infrastructure first, then Upgrades     │
│  - Click to navigate to detailed management view        │
└─────────────────────────────────────────────────────────┘

```

---

## Implementation Notes

### Editable Fields Trigger Recalculation

When user edits:

- **Age (days)**: Update `colony.age_days`, recalculate formatted display
- **Base Size** (via Custom Modifiers): GM creates size modifiers, trigger full stat recalculation

### Calculation Chain

```text

age_days edited
    ↓
formatted_age recalculated (display only)
    ↓
base_size modified (via Custom Modifiers)
    ↓
stat_calculator.run()
    ├─ base_stats (from ColonyType)
    ├─ infrastructure_modifiers
    ├─ support_upgrade_modifiers
    ├─ representative_modifiers
    ├─ gm_custom_modifiers
    └─ final_stats (Complacency, Order, Productivity, Piety)
    ↓
```

## Open Questions

1. **Age editing**: Should age editing trigger automatic event/development rolls, or
   is it purely for display/calculation purposes? (Currently: no auto-rolls, GM handles
   events manually)

2. **Infrastructure summary sorting**: Within Hard Infrastructure and Support Upgrades
   sections, what sort order? (Suggested: alphabetically by name, or by state with
   disrupted/faulty first)

3. **Lore-friendly names**: Are these user-provided (custom names for each instance)
   or generated from type? (Currently: user provides name when creating infrastructure)

---

## Related Documents

- `api_guide_phase_3.md` — API integration guide for frontend developers
- `UI_DESIGN_SYSTEM.md` — Mechanicum data-slate visual design specifications
- `business_analysis.md` §3 — Colony stat calculation rules
- `architecture_phase_1.md` §4 — Domain model definitions
- `TESTING_TODO.md` — Phase 5 scope and implementation checklist

```text
profit_factor_calculator.run()
    ├─ size_to_pf_lookup
    ├─ leadership_modifier
    ├─ stat_modifiers
    └─ state_penalties (Anarchy, Halted)
    ↓
state_effects.run()
    ├─ Anarchy (Order = 0)
    ├─ Placated (Complacency > Size)
    ├─ Heretical (Piety = 0)
    └─ Halted (Productivity = 0)
    ↓
UI updates all calculated fields

```

### API Endpoints

**Note:** The dashboard endpoint originally planned (`/api/v1/colonies/{id}/dashboard`) has been superseded by the existing colony detail endpoint which provides all necessary data.

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Get colony with full state | GET | `/api/v1/colonies/{id}` | Returns `ColonyResponse` with nested `ColonyStateNested` including all stats, lore states, profit factor |
| List all colonies | GET | `/api/v1/colonies` | Returns list of `ColonyListItem` with summary stats |
| Update colony basic info | PATCH | `/api/v1/colonies/{id}` | Name, owner, age_days, current_event |
| Get roll status | GET | `/api/v1/colonies/{id}/roll-status` | Days until next event/development roll |
| Get infrastructure list | GET | `/api/v1/colonies/{id}/infrastructure` | Summary list for Panel 3 |
| Get support upgrades list | GET | `/api/v1/colonies/{id}/support-upgrades` | Summary list for Panel 3 |

**Response Structure (GET /api/v1/colonies/{id}):**

```json
{
  "id": 1,
  "name": "Yukonia III",
  "founder_name": "Valmar Valtheran",
  "colony_type": "industry",
  "age_days": 162,
  "state": {
    "size": { "base": 3, "current": 3, "lore_state": "stable" },
    "complacency": { "base": 5, "current": 8, "lore_state": "placated" },
    "order": { "base": 5, "current": 5, "lore_state": "stable" },
    "productivity": { "base": 5, "current": 6, "lore_state": "productive" },
    "piety": { "base": 5, "current": 5, "lore_state": "stable" },
    "leadership_modifier": 2,
    "profit_factor": 5,
    "lore_state": {
      "size": "stable",
      "complacency": "placated",
      "order": "stable",
      "productivity": "productive",
      "piety": "stable"
    }
  }
}
```

**User Actions:**

- View infrastructure list (read-only summary)
- Click/tap item to navigate to detailed Infrastructure Management view
- No inline editing in this panel — all changes made in detailed view
- Edit Size (number input with +/- buttons)
- View all other stats (read-only, auto-calculated)
- View stat descriptions (read-only, auto-calculated)

---

## API Integration Notes (Updated 2026-08-26)

### API Coverage Analysis

**Status:** 95% of UI panel requirements have corresponding API endpoints.

All 6 UI panels (Colony At a Glance, Colony Details, Infrastructure, Upgrades, Representatives, Development Plans) have corresponding API endpoints implemented in Phase 3.

### Minor Gaps Identified

1. **Modifier Breakdown Structure** — Current `/modifiers` endpoint returns flat list; UI needs nested structure grouped by stat for the Colony Details panel modifier breakdown modal.

2. **Terminology Alignment** — API uses `owner` field but UI/documentation uses "Founder" in WH40k lore context. Recommendation: Add Pydantic alias `founder` that maps to `owner`.

See `API_TODO.md` for detailed enhancement proposals and prioritization.

### Enhanced Documentation

For complete UI implementation guidance including:

- ASCII wireframes for all 5 panels
- Detailed API endpoint mapping per UI element
- Lore state descriptions with icons
- Status workflows
- Permission matrix
- 6-phase implementation checklist

**See:** `UI_VISUALIZATION_PROMPT.md`

---

## Related Documents

- `api_guide_phase_3.md` — API integration guide for frontend developers
- `UI_DESIGN_SYSTEM.md` — Mechanicum data-slate visual design specifications
- `business_analysis.md` §3 — Colony stat calculation rules
- `architecture_phase_1.md` §4 — Domain model definitions
- `TESTING_TODO.md` — Phase 5 scope and implementation checklist
- `UI_VISUALIZATION_PROMPT.md` — Enhanced UI specification with wireframes and API mappings
- `API_TODO.md` — API enhancement roadmap
