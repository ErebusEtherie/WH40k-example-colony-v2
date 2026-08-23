# Phase 5 Implementation Plan — Representative Personalities & Hard Infrastructure

**Created:** 2026-08-23
**Revised:** 2026-08-23 — personality table corrected against rulebook source text;
merged verified reference content from the now-retired
`AGENT_BRIEFING_ADDENDUM_PHASE5.md`; added `chosen_stat`/`mad_order_roll`
assignment-time lifecycle rules.
**Status:** In Progress
**Priority:** High

---

## Overview

Phase 5 completes the core colony simulation engine by implementing:

1. **Representative Personality mechanics** (18 traits with special rules)
2. **Hard Infrastructure integration** with stat calculations
3. **Colony Dashboard UI** (3-panel layout)

This phase reconciles documentation with actual implementation — most domain models exist, but gaps must be filled.

---

## ⚠️ Revision Note (read before implementing personalities)

An earlier draft of this checklist (`AGENT_BRIEFING_ADDENDUM_PHASE5.md`) contained
a **different, fabricated personality table** — different names, different
effects, and an internally inconsistent count. It has been checked against the
actual rulebook source text and discarded. **The table in this document
(§ Personality Mechanics below) is the verified, correct one.** Do not consult
the addendum file for personality data; if it still exists on disk, treat it as
superseded — see `CONSOLIDATION_SUMMARY.md`.

Two other tables from that same addendum were also checked and are **not**
reused here because they contradict data confirmed in `business_analysis.md`,
`UI_PANEL_REQUIREMENTS.md`, `Colony_Sheet_Analysis.md`, and `README.md`:

- A "Colony Size → Profit Factor" table using **range buckets** (e.g. "1–5 → PF 1",
  "641+ → PF 9"). The canonical model, confirmed by four independent sources, is a
  **per-size lookup** (Size 0→PF 0, 1→PF 1, 2→PF 2, 3→PF 3, 4→PF 4, 5→PF 6, 6→PF 8,
  7→PF 10, 8→PF 12, 9→PF 14, 10→PF 18), already implemented in
  `config/rule_tables.yaml`. Do not implement the range-bucket version.
- A "State Thresholds" table using `Productivity > 0` for the Productive state and
  `Piety > 0` for the Pious state. The canonical rule (confirmed in
  `business_analysis.md` §4.4 and `lore_state_resolver.py`) is `stat > actual_size`,
  not `stat > 0`. Do not implement the `> 0` version.

The addendum's **Hard Infrastructure** table (bonuses/penalties per type) *was*
consistent with `business_analysis.md` and `UI_QUICK_REFERENCE.md` and has been
folded into § Hard Infrastructure below. Its **Representative Types** table added
an extra type, "Dynasty Member," with a "triggers Consequences table" mechanic
not defined or sourced anywhere in the project docs — this is **not** merged in.
If Dynasty Member is a real design intent, it needs its own source/definition
before implementation.

---

## Personality Mechanics (18 traits, verified against rulebook source)

| Personality | Effect | Input Required |
|-------------|--------|-----------------|
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
| **Mad** | +1 Complacency, +1 Piety, +1 Productivity, −[roll] Order | 1d5 roll, set at **assignment** time |
| **Ties With…** | +1 to [chosen stat] (Complacency/Order/Productivity/Piety) | GM choice, set at **assignment** time |
| **Scholarly** | +1 to [chosen stat] (Complacency/Order/Productivity/Piety) | GM choice, set at **assignment** time |

**Excluded from V1:** Administrative Expert (+2 Productivity if Order > Size) —
continuous condition evaluation deferred.

### Scholarly — design decision (confirmed)

Rulebook text ties Scholarly's bonus to whichever of the four stats is *lowest
at the moment the Representative is installed*. This is **deliberately
simplified for V1**: instead of an automatic lowest-stat lookup, the GM picks
the affected stat manually, same as Ties With…. This was chosen to:

1. Avoid lore inconsistency (an automatic pick could hand a Piety boost to a
   Representative who has nothing to do with the Ecclesiarchy).
2. Avoid an undefined tie-break when multiple stats are equally lowest.

This is a confirmed deviation from the literal rulebook text, not an oversight
— documented here per the project's "flag deviations, don't silently resolve"
principle (`Colony_Sheet_Analysis.md` §21).

---

## `chosen_stat` / `mad_order_roll` Lifecycle (confirmed rule)

Applies to **Mad** (`mad_order_roll`) and to both **Scholarly** and **Ties
With…** (`chosen_stat`):

- These values are set at **Representative-to-Colony assignment time**, not at
  Representative creation.
- On **reassignment** to a different Colony, any previously set value **must be
  cleared** and re-collected — it does not carry over between Colonies. This
  matters because Representative is an independent entity in this system
  (`business_analysis.md` §3.2) that can be reassigned; a stale `chosen_stat`
  from a prior Colony assignment would silently reintroduce the exact lore
  inconsistency the Scholarly simplification was meant to avoid.
- If a Representative with Mad, Scholarly, or Ties With… among its
  personalities is assigned to a Colony without providing the required
  input, the assignment operation should reject the call (validation error),
  not silently default the value to `None`/0.

This has two concrete implementation consequences not present in earlier
drafts of this checklist:

1. **Validation on assignment.** The assign-representative use case
   (`representative_service.assign(...)` or equivalent) must require
   `mad_order_roll`/`chosen_stat` as input when the Representative being
   assigned has the corresponding personality, and reject the call otherwise.
2. **Clearing on reassignment.** The same use case must reset any existing
   `mad_order_roll`/`chosen_stat` on the `PersonalityAssignment` when the
   Representative is being moved from one Colony to another (or unassigned),
   so the next assignment starts from a clean state.

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
        chosen_stat: ModifierStat | None = None  # for Scholarly or Ties With...
    ```

  - Purpose: Wrapper that holds personality + GM-provided inputs
  - **Both fields are set at assignment time, not creation time — see lifecycle
    rule above. Do not populate these at Representative-creation.**

- [ ] **Update `Representative.personalities`** type
  - Change from: `list[Personality]`
  - Change to: `list[PersonalityAssignment]`
  - Location: `src/colony_manager/domain/models/representative.py`

- [ ] **Add `special_trait_description: str | None`** to `Representative` model
  - Location: `src/colony_manager/domain/models/representative.py`

### 5.2: Rule Engine Updates

- [ ] **Update `representative_rules.py`** to handle special personalities
  - **Mad:** Apply -`mad_order_roll` to Order (if roll provided, else 0)
  - **Scholarly:** Apply +1 to `chosen_stat` (if provided, else 0) — GM choice,
    not a lowest-stat lookup; see Scholarly decision note above
  - **Ties With...:** Apply +1 to `chosen_stat` (if provided, else 0)
  - Location: `src/colony_manager/domain/rules/representative_rules.py`

- [ ] **Add assignment-time validation** for `mad_order_roll`/`chosen_stat`
  - Reject assignment if Representative has Mad/Scholarly/Ties With… and the
    corresponding input is missing
  - Location: `application/services/representative_service.py`
    (`assign(...)` method)

- [ ] **Clear `mad_order_roll`/`chosen_stat` on reassignment or unassignment**
  - When a Representative already carrying these values is reassigned to a
    different Colony (or unassigned), reset them so the next assignment
    requires fresh input
  - Location: `application/services/representative_service.py`

- [ ] **Wire `pending_infrastructure_growth` flag**
  - Find Size increase trigger in `application/services/colony_service.py`
  - Set flag when Size increases
  - Document that GM must apply -1d5 Complacency penalty manually

- [ ] **Verify Hard Infrastructure bonuses apply correctly**
  - Check `infrastructure_rules.py` applies bonuses/penalties per instance
  - Verify working vs. disrupted states handled correctly
  - Confirm stacking rules (unlimited instances, net all modifiers)

### 5.3: API Updates

- [ ] **Update Representative schemas**
  - Add `mad_order_roll` and `chosen_stat` to personality assignment schema
  - Add `special_trait_description` field
  - Location: `src/colony_manager/adapters/api/schemas/representative.py`

- [ ] **Update assign-representative endpoint**
  - Must accept `mad_order_roll`/`chosen_stat` as request input when required
    by the Representative's personalities (see 5.2 validation)
  - Location: `src/colony_manager/adapters/api/routers/representatives.py`

- [ ] **Update Colony schemas**
  - Add `pending_infrastructure_growth` to response schema
  - Location: `src/colony_manager/adapters/api/schemas/colony.py`

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
  - Assignment fails if Mad/Scholarly/Ties With… missing required input
  - `chosen_stat`/`mad_order_roll` cleared on reassignment

- [ ] **Integration tests** for infrastructure growth flag
  - Increase Size → flag set
  - Verify flag persists through save/load

- [ ] **UI tests** for 3-panel layout
  - Panels render correctly
  - Calculated values update on modifier change
  - Editable fields save correctly

---

## Reference Data

### Hard Infrastructure (5 types)

Verified consistent across `business_analysis.md` and `UI_QUICK_REFERENCE.md`.

| Type | Working Bonus | Disrupted Penalty |
|------|---------------|-------------------|
| Transportation | +1 Productivity, +1 Complacency | −2 Productivity, −2 Order |
| Power Network | +2 Productivity | −3 Productivity, −1 Complacency |
| Water Management | +1 Order, +1 Complacency | −2 Order, −2 Complacency |
| Food Production | +1 Productivity, +1 Complacency | −2 Productivity, −2 Complacency |
| Communications | +1 Productivity, +1 Order | −2 Productivity, −2 Order |

**States:**

- `planned` — no mechanical effect (not yet installed)
- `working` — bonuses apply
- `disrupted` — penalties apply

**Key Rules:**

- Starting infrastructure is folded into `ColonyType` base stats — NOT modeled as instances
- Unlimited instances per type during play (colonies accumulate via Endeavours)
- No build-order validation (rulebook's "1 of each before 2nd" is GM guidance only)
- Growth-triggered Complacency penalty: `pending_infrastructure_growth` flag set on Size increase,
  GM applies penalty manually via `gm_custom` modifier, clears flag when resolved

### Where to Find Colony Size Increase Trigger

Check these locations in order:

1. `application/services/colony_service.py` — look for methods that modify `age_days` or `base_size`
2. `application/services/development_plan_service.py` — development rolls may trigger Size increases
3. CLI commands in `adapters/cli/` — may have direct Size modification commands
4. Search for `base_size` assignments in `application/` layer

**Expected pattern:**

```python
colony.base_size += 1
colony.pending_infrastructure_growth = True  # ← Add this line
colony_service.save(colony)
```

---

## Files to Modify for Phase 5

| File | Change | Priority |
|------|--------|----------|
| `domain/models/colony.py` | Add `pending_infrastructure_growth` | Critical |
| `domain/models/representative.py` | Add `special_trait_description`, change `personalities` type | Critical |
| `domain/models/personality.py` | Create new file with `PersonalityAssignment` | Critical |
| `domain/rules/representative_rules.py` | Handle Mad roll, Scholarly/Ties chosen_stat | Critical |
| `application/services/representative_service.py` | Validate + clear `mad_order_roll`/`chosen_stat` on assign/reassign | Critical |
| `application/services/colony_service.py` | Wire growth flag on Size increase | High |
| `adapters/api/schemas/representative.py` | Update schemas | High |
| `adapters/api/routers/representatives.py` | Accept assignment-time inputs | High |
| `adapters/api/schemas/colony.py` | Add growth flag to schema | High |
| `adapters/persistence/orm_models.py` | Add columns | High |
| `adapters/persistence/mappers.py` | Update mapping logic | High |
| `tests/domain/test_representative_rules.py` | Add personality + lifecycle tests | High |
| `tests/domain/test_colony.py` | Add growth flag tests | Medium |

---

## Acceptance Criteria

Phase 5 is complete when:

1. ✅ All 18 personality traits apply correct modifiers (per corrected table above)
2. ✅ Mad's Order penalty uses saved roll value, required at assignment
3. ✅ Scholarly/Ties With... use saved `chosen_stat` value, required at assignment,
   cleared on reassignment
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
- Infrastructure "shortage" mechanic (no confirmed rulebook source — see
  `Colony_Sheet_Analysis.md` §15 for the original Excel-derived mechanic that
  was deliberately dropped)
- "Dynasty Member" Representative type (mentioned in a since-retired addendum
  with an undefined "Consequences table" mechanic — needs its own design pass
  before it can be scoped)

These will be addressed in `implementation_plan_phases_6-12.md`.
