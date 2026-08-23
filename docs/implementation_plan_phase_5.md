# Phase 5 Implementation Plan — Representative Personalities & Hard Infrastructure

**Created:** 2026-08-23  
**Status:** In Progress  
**Priority:** High

---

## Overview

Phase 5 completes the core colony simulation engine by implementing:

1. **Representative Personality mechanics** (18 traits with special rules)
2. **Hard Infrastructure integration** with stat calculations
3. **Colony Dashboard UI** (3-panel layout)

This phase reconciles documentation with actual implementation — most domain models exist, but three gaps must be filled.

---

## Implementation Checklist

### 5.1: Domain Model Gaps

- [ ] **Add `pending_infrastructure_growth: bool = False`** to `Colony` model
  - Location: `src/colony_manager/domain/models/colony.py`
  - Purpose: Flag when Size increase should trigger Complacency penalty
  - Rule: When Size increases, set flag; GM applies -1d5 Complacency manually via modifier

- [ ] **Create `PersonalityAssignment` model**
  - Location: `src/colony_manager/domain/models/personality.py` (new file)
  - Fields:

    ```python
    class PersonalityAssignment(BaseModel):
        personality_type: PersonalityType  # enum from config
        mad_order_roll: int | None = None  # 1-5, only for Mad personality
        chosen_stat: ModifierStat | None = None  # for Ties With... or Scholarly
    ```

  - Purpose: Wrapper that holds personality + GM-provided inputs

- [ ] **Update `Representative.personalities`** type
  - Change from: `list[Personality]`
  - Change to: `list[PersonalityAssignment]`
  - Location: `src/colony_manager/domain/models/representative.py`

- [ ] **Add `special_trait_description: str | None`** to `Representative` model
  - Location: `src/colony_manager/domain/models/representative.py`

### 5.3: API Updates

- [ ] **Update Representative schemas**
  - Add `mad_order_roll` and `chosen_stat` to personality assignment schema
  - Add `special_trait_description` field
  - Location: `src/colony_manager/adapters/api/schemas/representative.py`

- [ ] **Update Colony schemas**
  - Add `pending_infrastructure_growth` to response schema
  - Location: `src/colony_manager/adapters/api/schemas/colony.py`

- [ ] **Add/Update endpoints if needed**
  - Personality assignment may need PATCH endpoint for roll/chosen_stat
  - Verify existing endpoints support new fields

### 5.4: Persistence Updates

- [ ] **Update ORM models**
  - Add columns for new fields
  - Create migration script (if using Alembic) or update schema

- [ ] **Update mappers**
  - Ensure `to_domain()` and `to_orm()` handle new fields
  - Test round-trip (save → load → compare)

### 5.5: Colony Dashboard UI

Build per `UI_PANEL_REQUIREMENTS.md` 3-panel layout:

- [ ] **Panel 1: Basic Info (Editable)**
  - Colony Name, Colony Type (read-only), Representative Name
  - Age display (years, months, days from `age_days`)
  - Inline edit for age_days

- [ ] **Panel 2: Current Status (Calculated)**
  - 5 stats with current values (base + modifiers)
  - Highlight if changed from base
  - Lore state badges (Anarchy, Placated, Orderly, Pious, etc.)
  - Profit Factor with breakdown tooltip

- [ ] **Panel 3: Infrastructure Summary (Read-only)**
  - List of Hard Infrastructure (count by type, working/disrupted)
  - List of Support Upgrades (count, within limit)
  - Total modifier summary per stat

### 5.6: Testing

- [ ] **Domain tests** for Personality mechanics
  - Mad with roll = 3 → -3 Order
  - Scholarly with chosen_stat = Productivity → +1 Productivity
  - Multiple personalities stack correctly

- [ ] **Integration tests** for infrastructure growth flag
  - Increase Size → flag set
  - Verify flag persists through save/load

---

## Business Rules Reference

### Personality Mechanics (18 traits)

| Personality | Effect | Input Required |
|-------------|--------|----------------|
| Beloved | +1 Complacency | — |
| Military-Minded | +1 Order | — |
| Corrupt | +2 Productivity, −1 Order | — |
| Idle | +2 Complacency, −1 Productivity | — |
| Ambitious | +2 Productivity, −1 Complacency | — |
| Zealous | +1 Piety | — |
| Patron of the Arts | +2 Complacency, −1 Piety | — |
| Unlucky | +2 Piety | — |
| Cruel | +2 Productivity, −1 Complacency | — |
| Spymaster | +2 Order, −1 Complacency | — |
| Generalissimo | +2 Order, −1 Piety | — |
| Paranoid | +2 Order, −1 Productivity | — |
| Charitable | +1 Complacency, +1 Piety, −1 Productivity | — |
| Vainglorious | +2 Productivity, −1 Piety | — |
| Avaricious | +1 Productivity | — |
| **Mad** | +1 Complacency, +1 Piety, +1 Productivity, −[roll] Order | roll (1d5) |
| **Ties With…** | +1 to [chosen stat] | GM choice (C/O/P/P) |
| **Scholarly** | +1 to [chosen stat] | GM choice (simplified from rulebook) |

**Note:** Administrative Expert (+2 Productivity if Order > Size) is **excluded from V1** — conditional, may be added later.

### Hard Infrastructure (5 types)

| Type | Working | Disrupted |
|------|---------|-----------|
| Transportation | +1 Productivity, +1 Complacency | −2 Productivity, −2 Order |
| Power Network | +2 Productivity | −3 Productivity, −1 Complacency |
| Water Management | +1 Order, +1 Complacency | −2 Order, −2 Complacency |
| Food Production | +1 Productivity, +1 Complacency | −2 Productivity, −2 Complacency |
| Communications | +1 Productivity, +1 Order | −2 Productivity, −2 Order |

**Rules:**

- Unlimited instances per type
- No build-order validation
- Working/disrupted state per instance
- Growth trigger: When Size increases, GM applies -1d5 Complacency (manual, via `pending_infrastructure_growth` flag)
- [ ] **UI tests** for 3-panel layout
  - Panels render correctly
  - Calculated values update on modifier change
  - Editable fields save correctly

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `domain/models/colony.py` | Add `pending_infrastructure_growth` | Critical |
| `domain/models/representative.py` | Add `special_trait_description`, change `personalities` type | Critical |
| `domain/models/personality.py` | Create new file with `PersonalityAssignment` | Critical |
| `domain/rules/representative_rules.py` | Handle Mad roll, Scholarly/Ties chosen_stat | Critical |
| `application/services/colony_service.py` | Wire growth flag on Size increase | High |
| `adapters/api/schemas/representative.py` | Update schemas | High |
| `adapters/api/schemas/colony.py` | Add growth flag to schema | High |
| `adapters/persistence/orm_models.py` | Add columns | High |
| `adapters/persistence/mappers.py` | Update mapping logic | High |
| `tests/domain/test_representative_rules.py` | Add personality tests | High |
| `tests/domain/test_colony.py` | Add growth flag tests | Medium |

---

## Acceptance Criteria

Phase 5 is complete when:

1. ✅ All 18 personality traits apply correct modifiers
2. ✅ Mad's Order penalty uses saved roll value
3. ✅ Scholarly/Ties With... use saved chosen_stat value
4. ✅ `pending_infrastructure_growth` flag set on Size increase
5. ✅ Hard Infrastructure bonuses/penalties stack correctly
6. ✅ Colony Dashboard UI shows 3 panels with correct data
7. ✅ All new tests passing (domain + integration)
8. ✅ Ruff ✅, Mypy ✅ on all modified files

---

## Out of Scope (Phase 6+)

- Event system with GM-created events
- Audit log / version history
- Real-time collaboration notifications
- Development plans tracking
- Infrastructure "shortage" mechanic (no rulebook source)

These will be addressed in `implementation_plan_phase_6.md`.

---

- Purpose: GM notes for Representative Type (Satrap, Judge, etc.) — reference only

### 5.2: Rule Engine Updates

- [ ] **Update `representative_rules.py`** to handle special personalities
  - **Mad:** Apply -`mad_order_roll` to Order (if roll provided, else 0)
  - **Scholarly:** Apply +1 to `chosen_stat` (if provided, else 0)
  - **Ties With...:** Apply +1 to `chosen_stat` (if provided, else 0)
  - Location: `src/colony_manager/domain/rules/representative_rules.py`

- [ ] **Wire `pending_infrastructure_growth` flag**
  - Find Size increase trigger in `application/services/colony_service.py`
  - Set flag when Size increases
  - Document that GM must apply -1d5 Complacency penalty manually

- [ ] **Verify Hard Infrastructure bonuses apply correctly**
  - Check `infrastructure_rules.py` applies bonuses/penalties per instance
  - Verify working vs. disrupted states handled correctly
  - Confirm stacking rules (unlimited instances, net all modifiers)
