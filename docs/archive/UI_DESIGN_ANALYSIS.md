# UI Design Data Analysis & Implementation Alignment

**Version:** 1.1 (Updated)  
**Date:** 2026-08-23  
**Status:** ✅ Documentation Updates Complete  

---

## Completion Summary

The following documentation updates have been completed to align UI docs with implementation:

### ✅ Completed Documentation Updates

1. **UI_QUICK_REFERENCE.md**
   - Updated state color mapping with all 10 lore states
   - Added missing states: Riots and Unrest, Orderly, Productive, Halted, Pious
   - Fixed file references to point to phase-based docs

2. **UI_PANEL_REQUIREMENTS.md**
   - Updated size description mapping to match `config/rule_tables.yaml`
   - Changed from ranged mapping to per-size lookup table
   - Updated stat description rules to match `lore_state_resolver.py`
   - Updated API endpoints section to reflect actual implementation
   - Added response structure example for GET /api/v1/colonies/{id}

3. **UI_DESIGN_SYSTEM.md**
   - Updated color variables to match actual CSS (`--mech-*` prefix)
   - Updated component library class names to match CSS implementation
   - Replaced BEM-style naming with actual simpler class names
   - Updated stat box examples to match production CSS

4. **UI_DESIGN_ANALYSIS.md** (New)
   - Created comprehensive analysis document
   - Documents all inconsistencies found
   - Provides resolution recommendations
   - Lists action items and related documents

### ⚠️ Remaining Implementation Gaps (Phase 5)

The following items are documented gaps that require implementation:

1. **Colony model** missing `pending_infrastructure_growth: bool = False`
2. **Representative model** missing `special_trait_description: str | None`
3. **PersonalityAssignment model** doesn't exist
4. **Dashboard endpoint** `/api/v1/colonies/{id}/dashboard` not implemented (workaround documented)

---

## Original Analysis (Pre-Implementation)

**Version:** 1.0  
**Date:** 2026-08-23  
**Status:** Analysis Complete — Updates Required  

---

## Executive Summary

This document analyzes inconsistencies between UI design documentation and actual implementation, providing corrections and identifying gaps.

### Critical Findings

1. **3 Phase 5 model gaps** documented in `business_analysis.md` remain unimplemented
2. **Size description mapping** in UI docs doesn't match config/implementation
3. **Dashboard endpoint** documented but not implemented
4. **CSS class naming** differs between design docs and actual stylesheet
5. **Lore state labels** incomplete in UI docs vs full enum in code

---

## 1. Size Description Mapping — MISMATCH

### UI_PANEL_REQUIREMENTS.md States

| Size Range | Description |
|------------|-------------|
| 0 | Ruined |
| 1-5 | Freehold |
| 6-10 | Settlement |
| 11-20 | Town |
| 21-40 | City |
| 41-80 | Metropolis |
| 81+ | Hive |

### Implementation (config/rule_tables.yaml)

```yaml
size_to_pf_lookup:
  - size: 0
    profit_factor: 0
    description: "Ghost Town"
  - size: 1
    profit_factor: 1
    description: "Settlement"
  - size: 2
    profit_factor: 2
    description: "Outpost"
  - size: 3
    profit_factor: 3
    description: "Freehold"
  - size: 4
    profit_factor: 4
    description: "Domense"
  - size: 5
    profit_factor: 6
    description: "Holding"
  - size: 6
    profit_factor: 8
## 3. Dashboard Endpoint — NOT IMPLEMENTED

### UI_PANEL_REQUIREMENTS.md States:

```

GET /api/v1/colonies/{id}/dashboard

```http
GET /api/v1/colonies/{id}/dashboard
```

Returns all panel data in one response.

### Implementation Status

❌ **Endpoint does not exist** in `src/colony_manager/adapters/api/routers/colonies.py`

**Available endpoints:**

- `GET /api/v1/colonies` — List colonies
- `GET /api/v1/colonies/{id}` — Get colony with state
- `GET /api/v1/colonies/{id}/roll-status` — Get roll timing

### Resolution

**Option A:** Implement dashboard endpoint as documented  
**Option B:** Update UI docs to use existing endpoints  
**Option C:** Use `GET /api/v1/colonies/{id}` which includes full state

**Recommendation:** Option C — existing endpoint provides all needed data via `ColonyResponse` with nested `ColonyStateNested`.

---

## 4. CSS Class Naming — INCONSISTENT

### UI_DESIGN_SYSTEM.md Uses (BEM-style)

```html
<div class="data-panel">
  <div class="data-panel__header">
    <h2 class="data-panel__title">
```

```css
.data-panel { ... }
.data-panel__header { ... }
.stat-box--order[data-state="anarchy"] { ... }
.status-badge--critical { ... }
```

### Implementation (mechanicum-design-system.css)

```html
<div class="mech-panel">
  <div class="panel-header">
    <span class="panel-title">
```

```css
.mech-panel { ... }
.panel-header { ... }
.stat-box.anarchy { ... }
.stat-box.placated { ... }
```

### Resolution: CSS Class Names

Update `UI_DESIGN_SYSTEM.md` to match actual CSS implementation. The simpler naming in the CSS file is production-ready.

## 6. Phase 5 Model Gaps — CONFIRMED

Per `business_analysis.md` Assumptions Log:

### Missing Fields

1. **Colony model** missing `pending_infrastructure_growth: bool = False`
2. **Representative model** missing `special_trait_description: str | None`
3. **PersonalityAssignment model** doesn't exist (should wrap `Personality` with `mad_order_roll` and `chosen_stat`)

### Impact on UI

- UI cannot display/track pending infrastructure growth state
- UI cannot show special trait descriptions for representatives
- UI cannot handle Mad personality order roll or Scholarly/Ties chosen stat mechanics

### Resolution: Missing Model Fields

Implement missing model fields per Phase 5 implementation plan.

---

## 7. Stat Description Rules — INCOMPLETE

### UI_PANEL_REQUIREMENTS.md Table (truncated)

| Stat | Condition | Description |
|------|-----------|-------------|
| Complacency | Complacency > Size | Placated |
| Complacency | Complacency ≤ Size | Stable |
| Complacency | Complacency = 0 | Restle... (cut off) |

### Implementation (`domain/rules/lore_state_resolver.py`)

```python
# Complacency
if value > size: return PLACATED
if value == 0: return RIOTS_AND_UNREST
return STABLE

# Order
if value == 0: return ANARCHY
if value > size: return ORDERLY
return STABLE

# Productivity
if value > size: return PRODUCTIVE
if value == 0: return HALTED
return STABLE

# Piety
if value > size: return PIOUS
if value == 0: return HERETICAL
return STABLE
```

### Resolution: Stat Description Rules

Update UI docs with complete stat description rules from implementation.

---

## Action Items

### Documentation Updates (High Priority)

- [ ] Update `UI_DESIGN_SYSTEM.md` to match actual CSS class names
- [ ] Update `UI_DESIGN_SYSTEM.md` to use correct color variable names
- [ ] Update `UI_QUICK_REFERENCE.md` with all 10 lore states
- [ ] Update `UI_PANEL_REQUIREMENTS.md` size description mapping
- [ ] Update `UI_PANEL_REQUIREMENTS.md` stat description rules
- [ ] Update `UI_PANEL_REQUIREMENTS.md` to reference existing API endpoints

### Implementation Gaps (Phase 5)

- [ ] Add `pending_infrastructure_growth: bool` to Colony model
- [ ] Add `special_trait_description: str | None` to Representative model
- [ ] Create `PersonalityAssignment` model
- [ ] Implement dashboard endpoint OR document alternative approach

---

## Related Documents

- `business_analysis.md` — Authoritative business rules
- `architecture_phase_1.md` — System architecture
- `api_guide_phase_3.md` — API implementation guide
- `config/rule_tables.yaml` — Size/PF lookup table (source of truth)
- `src/colony_manager/domain/enums.py` — LoreState enum
- `src/colony_manager/domain/rules/lore_state_resolver.py` — Stat state logic
- `src/assets/css/mechanicum-design-system.css` — Canonical CSS

---

## 5. Color Variables — PARTIAL MISMATCH

### UI_DESIGN_SYSTEM.md Documents

```css
--void-black: #0D0D0D
--void-dark: #151515
--steel-dark: #1E1E1E
--copper: #B87333
--plasma-blue: #00D4FF
```

### Implementation: mechanicum-design-system.css

```css
--mech-void: #0d0d0d
--mech-dark: #1a1a1a
--mech-steel: #2d2d2d
--mech-copper: #b87333
--mech-plasma: #00d4ff
```

### Resolution: CSS Variable Names

Update `UI_DESIGN_SYSTEM.md` to document actual variable names from CSS file.

---

```yaml
- size: 5
    profit_factor: 6
    description: "Dominion"
- size: 7
    profit_factor: 10
    description: "Territory"
- size: 8
    profit_factor: 12
    description: "City"
- size: 9
    profit_factor: 14
    description: "Metropolis"
- size: 10
    profit_factor: 18
    description: "Hive"
```

### Resolution Required

**Option A:** Update UI docs to match implementation (per-size granularity)  
**Option B:** Add `get_size_description()` function with ranged mapping  
**Option C:** Update config to match UI doc ranges

**Recommendation:** Option A — implementation already has per-size descriptions in config, use those.

---

## 2. Lore State Labels — INCOMPLETE IN UI DOCS

### UI_QUICK_REFERENCE.md Lists

| State | Condition |
|-------|-----------|
| Placated | Complacency > Size |
| Anarchy | Order = 0 |
| Heretical | Piety < 20 |
| Stable | Normal |
| Warning | Low stats |

### Implementation (LoreState enum in `domain/enums.py`)

```python
class LoreState(StrEnum):
    # Base states
    STABLE = "stable"
    # Complacency states
    PLACATED = "placated"
    RIOTS_AND_UNREST = "riots_and_unrest"  # ← Missing in UI docs
    # Order states
    ANARCHY = "anarchy"
    ORDERLY = "orderly"  # ← Missing in UI docs
    # Productivity states
    PRODUCTIVE = "productive"  # ← Missing in UI docs
    HALTED = "halted"
    # Piety states
    PIOUS = "pious"  # ← Missing in UI docs
    HERETICAL = "heretical"
```

### Resolution: Lore States

Update UI docs to include all 10 lore states from implementation.

---
