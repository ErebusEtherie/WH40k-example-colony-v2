# Business Analysis — Rogue Trader Colony Manager

**Version:** 2.1 (Consolidated, contradictions resolved)
**Last Updated:** 2026-08-23
**Status:** Authoritative source of truth for all business rules

---

## Document Purpose

This is the **single source of truth** for all business rules, domain models, and calculation logic for the WH40k Rogue Trader Colony Manager.

**Implementation Status:**

- ✅ **Phase 1-4:** Core domain models, rule engine, application services, persistence complete
- ✅ **Phase 4a:** Hard Infrastructure module complete
- ✅ **Phase 5:** Support Upgrades, Planetary Resources, State Effects complete
- ✅ **Phase 6-9:** API, CLI, Import/Export, tooling complete
- ⚠️ **Phase 5 Gaps:** Representative Personality mechanics (`PersonalityAssignment`
  model, Mad roll, Scholarly/Ties `chosen_stat` — see §3.2 and §4.7a) and
  `pending_infrastructure_growth` flag pending. See `implementation_plan_phase_5.md`.
- ⚠️ **Leadership Modifier table incomplete** — see §4.5. This is still open
  despite an earlier, incorrect "complete" marking in §7 of a prior revision
  of this document; that marking has been corrected below.

**Test Coverage:** 188+ tests passing across all layers

## 1. Purpose & Scope

This document captures the business requirements for the Colony Manager.

**Source of Truth:** The reference Excel workbook (`[WH40k_RT] [Team RT6] Colony Sheet.xlsx`) is treated as validated domain knowledge — it was used and tested by the players/GM against the core rulebook. For Representative Personality mechanics specifically, the actual Rogue Trader rulebook personality text (supplied directly, not derived from the Excel) is the source of truth — see §4.7a.

**V1 goal:** ✅ COMPLETE — working Colony + Representative model with real stat calculations (Base → Current), Profit Factor, and persistence (save/load).

**Phase 3b goal:** ✅ COMPLETE — Support Upgrades and Resources implemented with all core rulebook rules. Hard Infrastructure module implemented in Phase 4a.

**Phase 6-9:** ✅ COMPLETE — REST API, CLI, Import/Export, and tooling complete.

---

## 2. Glossary

| Term | Meaning |
|---|---|
| Base stat | Starting value, fixed by Colony Type, never edited directly |
| Current / Actual stat | Base + applicable modifiers, clamped ≥ 0, always calculated |
| Lore state | Short textual label for a stat's current condition (e.g. "Anarchy", "Placated"), derived from thresholds |
| Modifier | A discrete, typed adjustment to a stat, with a source, value, and description |
| Profit Factor (PF) | Colony's economic output value; integer ≥ 0 |
| Leadership Modifier | PF adjustment derived from the Representative's highest of Int/Per/Fel bonus |

---

## 3. Entities

### 3.1 Colony

| Field | Type | Editable? | Notes |
|---|---|---|---|
| `id` | identifier | no | |
| `name` | string | yes | Set at creation, changeable later |
| `owner` | string | yes | Rogue Trader Dynasty or member name; changeable later |
| `colony_type` | reference | **no**, after creation | Set at creation from config (see §6). Changing it post-creation is disallowed outside of an explicit testing/admin path — too many downstream calculations depend on it |
| `age_days` | integer ≥ 0 | yes | Source of truth for colony age. Advances with in-game time (e.g. "5 days spent traveling" → +5). Manually updated by players |
| `age_years` / `age_months` / `age_days_remainder` | integer | no | Computed display breakdown of `age_days` |
| `age_last_updated` | date (`yyyy-mm-dd`) | **no** (system-set) | Audit field — auto-set whenever `age_days` changes. Exists so the GM can detect "a session happened but age wasn't updated" |
| `current_event` | string (nullable) | yes | GM-defined text describing the current active calamitous event (if any). The app does not auto-roll or enforce event outcomes — GM applies custom modifiers manually via the modifiers system |
| `base_complacency` / `base_order` / `base_productivity` / `base_piety` | integer | no | Derived from `colony_type`, fixed |
| `base_size` | integer | no | Derived from `colony_type` at creation |
| `actual_size` | integer ≥ 0 | no (calculated) | `base_size` + applicable modifiers, clamped at 0 |
| `current_complacency` / `current_order` / `current_productivity` / `current_piety` | integer ≥ 0 | no (calculated) | Base + applicable modifiers, clamped at 0 |
| `lore_state_complacency` / `..._order` / `..._productivity` / `..._piety` | string (enum) | no (calculated) | See §4.4 |
| `current_profit_factor` | integer ≥ 0 | no (calculated) | See §4.5 |
| `representative_id` | reference (nullable) | yes (assignment) | Representative is an independent entity, not owned by Colony — see §3.2. Nothing prevents the same Representative being referenced by more than one Colony (mechanically possible, though not meaningful lore-wise) |
| `pending_infrastructure_growth` | boolean | no (system-set) | **Phase 5 gap, not yet implemented.** Set `True` automatically when `base_size` increases; GM applies the resulting Complacency penalty manually via a `gm_custom` modifier and clears the flag. See `implementation_plan_phase_5.md` |
| `modifiers` | list of Modifier | — | See §3.3 |

**V1 explicitly excludes:** pending/upcoming event indicators. The app tracks
elapsed days and can display "next roll in X days" but does not surface
"event pending" notifications.

**Important:** This app is a **living character sheet**, not a game simulator.
All dice rolls (growth rolls, event rolls, calamitous events) are performed
manually by players/GM outside the app. The app tracks colony state and
displays cycle information, but does not auto-roll or enforce outcomes.

### 3.2 Representative

| Field | Type | Editable? | Notes |
|---|---|---|---|
| `id` | identifier | no | |
| `name` | string | yes | Representative is a standalone entity — it can exist unassigned to any Colony, and can in principle be referenced by more than one Colony (Colony holds the reference, not the other way round; see §3.1) |
| `type` | enum | yes | Exactly one. Fixed list (from reference sheet): Satrap, Judge, Cardinal, Colonist Representative, Military Commander — each with **descriptive text only, no mechanical bonus**. (A sixth value, "Dynasty Member," has appeared in one now-retired planning document with an undefined "Consequences table" mechanic; it is **not** part of the confirmed enum until that mechanic has its own source.) |
| `personalities` | list of `PersonalityAssignment` | yes | **At least 1, multiple allowed.** See §3.2a and §4.7a for the `PersonalityAssignment` wrapper and the confirmed 18-trait table with mechanical effects |
| `special_trait_description` | string (nullable) | yes | **Phase 5 gap, not yet implemented.** Free-text GM note tied to `type` (e.g. narrative flavor for a Satrap's trade contacts). Reference-only, no mechanical effect |
| `stats` | 9 × integer > 0 | yes | WS, BS, S, T, Ag, Int, Per, WP, Fel |
| `stat_bonus` (per stat) | integer | no (calculated) | `floor(stat_value / 10)` |
| `skills` | list of Skill | yes | `{name, level: known\|+10\|+20\|+30, description}` — **reference only, no mechanical effect** |
| `talents` | list of Talent | yes | `{name, description}` — **reference only, no mechanical effect** |
| `leadership_modifier` | integer | no (calculated) | Looked up from `max(Int_bonus, Per_bonus, Fel_bonus)` via a modifier table (see §4.5). This is the **only** confirmed mechanical link from Representative to Colony stats that targets `profit_factor` directly in V1 — Personality effects (§4.7a) apply separately to the four core colony stats, Type is descriptive only, Skills and Talents are reference-only |

### 3.2a PersonalityAssignment (Phase 5 gap — not yet implemented)

Wraps a personality with any GM-provided input it requires. Replaces the bare
`list[Personality]` originally planned for `Representative.personalities`.

```python
class PersonalityAssignment(BaseModel):
    personality_type: PersonalityType  # enum, see §4.7a
    mad_order_roll: int | None = None       # 1-5, only for "Mad"
    chosen_stat: ModifierStat | None = None # for "Scholarly" or "Ties With…"
```

**Confirmed lifecycle rule for `mad_order_roll` / `chosen_stat`:**

- Both values are set at **Representative-to-Colony assignment time**, not at
  Representative creation. A Representative can exist unassigned or be
  reassigned between Colonies (§3.2), so a value fixed at creation would carry
  stale, Colony-A-specific context into a later Colony-B assignment.
- On **reassignment** to a different Colony (or on unassignment), any existing
  value **must be cleared**, forcing fresh input on the next assignment.
- The assign-representative operation must **reject** assigning a
  Representative whose personalities include Mad, Scholarly, or Ties With…
  if the corresponding input is not supplied — it must not silently default
  to `None`/0.

This directly resolves a lore/consistency concern with Scholarly specifically:
see §4.7a for why its rulebook-literal "lowest stat" trigger was deliberately
replaced with GM choice.

### 3.3 Modifier (generic)

A single, reusable structure representing any discrete adjustment to a
Colony stat.

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | |
| `colony_id` | reference | |
| `modifier_source_type` | enum | See table below |
| `modifier_stat` | enum | `size`, `complacency`, `order`, `productivity`, `piety`, `profit_factor` |
| `modifier_value` | integer | Signed (+/-) |
| `modifier_description` | string | Free text |
| `is_active` | boolean | Allows disabling without deleting (e.g. GM toggles a temporary penalty off) |

**`modifier_source_type` values (per your direction — typed by source):**

| Value | Active in V1? | Notes |
|---|---|---|
| `gm_custom` | **Yes** | Manually added by GM, any stat including `profit_factor` |
| `growth_decay` | **Yes** | System-generated from the 90-day development roll, targets `size` only |
| `representative_leadership` | **Yes** | System-generated from Representative's Leadership Modifier, targets `profit_factor` only |
| `resource` | No (reserved) | Future — Resources module |
| `infrastructure` | No (reserved) | Future — Hard Infrastructure module |
| `support_upgrade` | No (reserved) | Future — Support Upgrades module |

Reserved values exist in the enum now so the modifier list/history is
forward-compatible, but nothing writes them in V1.

**Explicitly deferred for V1:** modifier expiry/duration. GM custom
modifiers are toggled via `is_active` manually; there's no automatic
time-based expiry yet. Flagging since you mentioned "temporary" bonuses —
worth revisiting once Infrastructure/Events are in scope.

---

## 4. Calculation Rules

### 4.1 Age

- `age_days` is edited directly by players as in-game time passes.
- On any change to `age_days`, `age_last_updated` is set to the current
  real-world date automatically. Not directly editable by players.
- `age_years/months/days_remainder` are a pure display breakdown of
  `age_days` — no independent meaning.
- Event/development roll cadence is defined in global config
  (`config/rule_tables.yaml`, `game_cycles` section). The app computes
  "next roll in X days" from `age_days % interval` but does not
  auto-roll or enforce outcomes.

### 4.2 Stat Calculation (Complacency / Order / Productivity / Piety)

```python
current_stat = clamp( base_stat (from colony_type)
                       + sum(active modifiers where modifier_stat == this stat),
                       min = 0 )
```

In V1, modifier sources affecting these four stats are `gm_custom`, plus (once
Phase 5 lands) Personality effects applied via `representative_leadership`-style
modifiers and Hard Infrastructure / Support Upgrade sources per §4.7–§4.9.

### 4.3 Size Calculation

```python
actual_size = clamp( base_size
                      + sum(active modifiers where modifier_stat == 'size'),
                      min = 0 )
```

Active source types affecting size in V1: `growth_decay`, `gm_custom`.
Integer only.

### 4.4 Lore State (per stat) — CONFIRMED, all four thresholds resolved

Derived from thresholds relative to `actual_size`. Cross-confirmed against
`UI_PANEL_REQUIREMENTS.md`, `UI_ALIGNMENT_SUMMARY.md`, and the `LoreState`
enum described in `UI_DESIGN_ANALYSIS.md` — all agree on the following, so the
two labels previously marked "confirm" are now resolved:

| Stat | Condition: `stat > actual_size` | Condition: `stat == 0` | Otherwise |
|---|---|---|---|
| Complacency | Placated | Riots and Unrest | Stable |
| Order | Orderly | Anarchy | Stable |
| Productivity | Productive | Halted | Stable |
| Piety | Pious | Heretical | Stable |

**Note:** both threshold conditions use `stat > actual_size` / `stat == 0`
consistently across all four stats. A conflicting "State Thresholds" table
using `stat > 0` for Productive/Pious appeared in a now-retired planning
document (`AGENT_BRIEFING_ADDENDUM_PHASE5.md`) and should be disregarded —
it contradicts every other source in the project.

### 4.5 Profit Factor

```python
pf_base = lookup(actual_size)            # Size → PF table, from reference "Data" sheet
pf_raw  = pf_base
        + (1 if current_complacency > actual_size else 0)
        + (2 if current_productivity > actual_size else 0)
        + sum(active gm_custom modifiers where modifier_stat == 'profit_factor')
        + leadership_modifier            # from Representative, see below

if current_order == 0:
    profit_factor = 0                    # zero-forcing takes priority over everything
elif current_productivity == 0:
    profit_factor = round_half_up(pf_raw / 2)   # halving applies after all numeric bonuses/penalties
else:
    profit_factor = pf_raw

profit_factor = max(profit_factor, 0)    # integer, ≥ 0
```

**Size → PF lookup table (confirmed, per-size, not range-based):**

| Size | PF | Size | PF |
|---|---|---|---|
| 0 | 0 | 6 | 8 |
| 1 | 1 | 7 | 10 |
| 2 | 2 | 8 | 12 |
| 3 | 3 | 9 | 14 |
| 4 | 4 | 10 | 18 |
| 5 | 6 | | |

Implemented in `config/rule_tables.yaml`. A conflicting range-bucket version
(e.g. "Size 1–5 → PF 1") appeared in the same now-retired planning document
referenced in §4.4 and should be disregarded.

**Rounding rule (global):** round-half-up for every halving/rounding
calculation in the system (e.g. `1.5 → 2`), not just Profit Factor. Applies
system-wide unless a specific future rule explicitly states otherwise.

**Leadership Modifier lookup — STILL OPEN, not complete:**
`max(Int_bonus, Per_bonus, Fel_bonus) → modifier`. Partial table visible in
the reference sheet:

| Bonus | PF Effect |
|---|---|
| 2 | −2 |
| 3 | −1 |
| 4 | 0 |
| 5 | +1 |
| 6 | +2 |

**This table does not cover the full possible range of stat-bonus values
(0–9+).** A prior revision of this document's §7 incorrectly marked this table
"✅ Complete" — that was wrong and has been corrected (see §7 below). This
remains a genuine open gap requiring the missing values from the reference
sheet/rulebook before the leadership modifier resolver can be considered
finished.

### 4.6 Representative Stat Bonus

```python
stat_bonus = floor(stat_value / 10)
```

E.g. stat value 42 → bonus 4; value 29 → bonus 2.

---

### 4.7 State-Based Effects (Phase 3b)

These effects apply automatically based on colony stat thresholds. They are
**pure functions** — no I/O, no mutation, deterministic given inputs.

**Orderly State** (Order > Size):

- Effect: +2 Productivity bonus
- Applied: Continuously while condition holds
- Source: Rogue Trader Colony Rules

**Pious State** (Piety > Size):

- Effect: +1 Order, +1 Complacency bonus
- Applied: Continuously while condition holds
- Source: Rogue Trader Colony Rules

**Complacency = 0 Crisis**:

- Immediate effect: Order and Productivity each decrease by 1d5 (apply penalty modifier, user needs to input modifier value that is in roll 1d5 range -> <1;5> integer)
- Ongoing effect: Order and Productivity **cannot increase** (locked)
- Resolution: GM action/event required to clear locks
- Source: Rogue Trader Colony Rules

**Piety = 0 Crisis (Heretical)**:

- Immediate effect: Order and Complacency each decrease by 1d5 (apply penalty modifier, user needs to input modifier value that is in roll 1d5 range -> <1;5> integer)
- Ongoing effect: Order and Complacency **cannot increase** (locked)
- Resolution: GM action/event required to clear locks
- Source: Rogue Trader Colony Rules

**Anarchy State** (Order = 0):

- Trigger: End of every 90-day development cycle
- Effect: Complacency, Productivity, and Piety each decrease by 1d5 (apply penalty modifier, user needs to input modifier value that is in roll 1d5 range -> <1;5> integer); Size decreases by 1
- Agricultural resilience: Roll 1d10; on 8+, Size decrease is prevented (user should be informed that roll is needed, user should respond with test result -> True / False)
- Source: Rogue Trader Colony Rules

**Lock Flag Mechanics**:

- Locks prevent **increases only** — penalties can still reduce stats further
- Locks are cleared manually by GM command (not automatic)
- Stats remain clamped at minimum 0 regardless of penalties

---

### 4.7a Representative Personality Mechanics (18 traits, confirmed)

**Source of truth:** rulebook personality text, supplied directly and verified
trait-by-trait — this supersedes an earlier, fabricated personality table that
briefly existed in a planning document (`AGENT_BRIEFING_ADDENDUM_PHASE5.md`,
now retired). The full table, effects, and the `chosen_stat`/`mad_order_roll`
lifecycle rule live in `implementation_plan_phase_5.md` to avoid duplicating
data across documents; this section is the pointer + the design-decision
record.

| Personality | Effect |
|---|---|
| Beloved | +1 Complacency |
| Military-Minded | +1 Order |
| Corrupt | +2 Productivity, −1 Order |
| Idle | +2 Complacency, −1 Productivity |
| Ambitious | +2 Productivity, −1 Complacency |
| Zealous | +1 Piety |
| Patron of the Arts | +2 Complacency, −1 Piety |
| Unlucky | +2 Piety |
| Cruel | +2 Productivity, −1 Complacency |
| Spymaster | +2 Order, −1 Complacency |
| Generalissimo | +2 Order, −1 Piety |
| Paranoid | +2 Order, −1 Productivity |
| Charitable | +1 Complacency, +1 Piety, −1 Productivity |
| Vainglorious | +2 Productivity, −1 Piety |
| Avaricious | +1 Productivity |
| Mad | +1 Complacency, +1 Piety, +1 Productivity, −[1d5 roll] Order |
| Ties With… | +1 to GM-chosen stat (Complacency/Order/Productivity/Piety) |
| Scholarly | +1 to GM-chosen stat (Complacency/Order/Productivity/Piety) |

**Excluded from V1:** Administrative Expert (+2 Productivity if Order > Size)
— continuous condition evaluation deferred.

**Confirmed design decision — Scholarly:** The rulebook ties Scholarly's bonus
to whichever stat is lowest *at the moment the Representative is installed*.
V1 deliberately replaces this with GM choice at assignment time (same
mechanism as Ties With…), to avoid (a) a lore mismatch where an automatic pick
could hand, e.g., a Piety bonus to a Representative with no Ecclesiarchy
connection, and (b) an undefined tie-break when multiple stats are equally
lowest. Both `chosen_stat` (Scholarly, Ties With…) and `mad_order_roll` (Mad)
are set at assignment time and cleared on reassignment — see §3.2a.

---

### 4.8 Colony Type Special Rules (Phase 3b)

Certain colony types have unique abilities per Rogue Trader rules:

**Ecclesiastical Colony**:

- Ability: "If an Ecclesiastical Colony's Order would decrease by any amount,
  its owners can choose to have its Piety decrease by that amount instead."
- Implementation: `apply_ecclesiastical_protection(colony, order_decrease, use_protection)`
- Choice: Player/GM decides whether to use protection each time

**Agricultural Colony**:

- Ability: "Any time an Agricultural Colony's Size would decrease, roll 1d10;
  on a result of 8 or higher, it does not decrease."
- Implementation: `check_agricultural_resilience(dice_roll: int) -> bool`
- Applies to: Anarchy decay, events, or any other Size decrease

**Mining Colony / Industry Colony / Mining & Industry Colony**:

- Condition: Colony must be exploiting **Mineral** resources
- Effect: +2 Productivity, +2 Profit Factor
- Implementation: `get_mining_industry_resource_bonus(colony)`

**Research Mission Colony**:

- Condition: Colony must be exploiting **Organic Compound**, **Archeotech Cache**,
  or **Xenos Ruins** resources
- Effect: +2 Productivity, +1 Profit Factor
- Implementation: `get_research_mission_resource_bonus(colony)`

---

### 4.9 Upgrade Validation Rules (Phase 3b)

**Global Limit**:

- Rule: "A Colony cannot have more Support Upgrades than its Size."
- Validation: `len(support_upgrades) <= base_size`
- Error: Cannot add upgrade if it would exceed limit

**Per-Type Limits**:

| Upgrade Type | Limit | Notes |
|---|---|---|
| Mechanicum Station | 1 | Unique facility |
| Infantry Garrison | 1 | One permanent garrison |
| Imperial Navy Station | 1 | One naval presence |
| Personal Lodgings | 1 | No benefit after first |
| Cultural Improvement | 5 | One per stat (C, O, P, Piety, +1) |
| Arbites Precinct | Unlimited | Can purchase multiple |
| Ecclesiarchy Mission | Unlimited | Can purchase multiple |
| Industrial Facility | Unlimited | Can purchase multiple |
| Contacts | Unlimited | Each adds 1d5 NPCs |
| Trappings | Unlimited | Can purchase multiple |

**Validation Function**: `validate_upgrade_limits(colony, new_upgrade) -> list[str]`

- Returns empty list if valid
- Returns list of error messages if limits exceeded

---

## 5. Business Rules Summary (priority order, applies generally)

1. **Zero-forcing conditions always take priority** over any numeric
   bonus/penalty (e.g. Order == 0 forces PF to 0 regardless of other
   modifiers).
2. **Halving conditions apply after all numeric bonuses/penalties**, using
   round-half-up.
3. **Stats can never go below 0.** Where relevant (Size, the four core
   stats, PF), clamp at 0 after all modifiers are applied.
4. **Colony Type is immutable** post-creation outside of an explicit
   testing/admin path.
5. **`chosen_stat` / `mad_order_roll` are assignment-scoped, not
   Representative-scoped** — set when a Representative is assigned to a
   Colony, required if the personality demands it, cleared on reassignment.

---

## 6. Explicitly Out of Scope for V1

- Event system beyond raw config values (no pending/upcoming/current-event
  UI or logic)
- Colony Type change after creation (outside testing)
- Skills/Talents mechanical effects (reference-only for now)
- Representative Type mechanical effects (descriptive only, no stat bonuses)
- Modifier expiry/duration (temporary modifiers are manual via `is_active`)
- Administrative Expert personality (conditional, deferred)
- "Dynasty Member" Representative type (undefined mechanic, no confirmed source)

**Note:** Hard Infrastructure module has been moved to Phase 4a (before 4b).
Support Upgrades and Planetary Resources modules have been implemented in
Phase 3b with core rulebook rules. See §4.7, §4.8, and §4.9 for details.

---

## 7. Configuration Reference

| Item | Status | Location |
|---|---|---|
| Colony Type config (types, base stats, base size, resource exploit bonuses) | ✅ Complete | `config/colony_types.yaml` |
| Representative Type list + mechanical bonuses | ✅ Complete (descriptive only) | `config/colony_types.yaml` |
| Personality list (name, description, effect) | ✅ Complete with mechanical effects — see §4.7a | `config/personalities.yaml` |
| Lore state threshold labels | ✅ Complete — both previously-unconfirmed labels resolved, see §4.4 | `config/rule_tables.yaml` |
| Size → base PF lookup table | ✅ Complete (per-size, not range-based) | `config/rule_tables.yaml` |
| Leadership Modifier full lookup table (all stat-bonus values) | ⚠️ **Still incomplete** — only bonus values 2–6 confirmed; corrected from an earlier, incorrect "Complete" marking. See §4.5 | `config/rule_tables.yaml` (partial) |
| Support Upgrades full definition & limits | ✅ Complete | `config/rule_tables.yaml` |
| Planetary Resources types & effects | ✅ Complete (8 resource types) | `config/rule_tables.yaml` |
| Infrastructure types & mechanics | ✅ Complete (5 types) | `config/rule_tables.yaml` |
| Roll interval configuration | ✅ Complete (global default, per-colony override) | `config/rule_tables.yaml` |
| Event system scope | ✅ Complete (track past/active, GM applies modifiers) | Application logic |
| `PersonalityAssignment` model + `chosen_stat`/`mad_order_roll` lifecycle | ⚠️ Not yet implemented — see §3.2a and `implementation_plan_phase_5.md` | `domain/models/personality.py` (new) |

**Implementation Notes:**

- Ecclesiastical, Agricultural, Mining, Research colony type bonuses/rules: ✅ Implemented
- Support Upgrade type-specific rules: ✅ Implemented
- Planetary Resource effects: ✅ Implemented

---

## 8. Assumptions Log

- Representative's `type` bonus text exists in the reference sheet but its
  precise mechanical trigger isn't specified — treated as descriptive-only
  until confirmed otherwise.
- **Roll intervals are global config** — `event_roll_interval_days` (60) and
  `development_roll_interval_days` (90) are defined in `config/rule_tables.yaml`
  under the `game_cycles` section. The app displays "next roll in X days" based
  on colony age and these global intervals.
- Representative is independent of Colony (not 1:1 ownership) — confirmed
  during technical analysis, supersedes the earlier draft.
- If a Representative assigned to a Colony is deleted, the Colony's
  reference is cleared rather than blocking the delete or deleting the
  Colony. Flagged as a default in `architecture_phase_1.md` §3.6.
- **Scholarly's trigger is GM choice, not a rulebook-literal "lowest stat"
  lookup** — confirmed design decision, see §4.7a.
- **`chosen_stat`/`mad_order_roll` are set at assignment time and cleared on
  reassignment**, not fixed at Representative creation — confirmed design
  decision, see §3.2a.
- **Phase 5 Gaps (Pending Implementation):**
  1. `pending_infrastructure_growth: bool` flag in Colony model
  2. `PersonalityAssignment` model with `mad_order_roll` and `chosen_stat` fields,
     including assignment-time validation and reassignment-clearing behavior
  3. `special_trait_description: str | None` field in Representative model
  4. Leadership Modifier lookup table remains incomplete for stat-bonus values
     outside 2–6 (§4.5, §7) — needs the missing values from the reference
     sheet/rulebook before it can be closed out
