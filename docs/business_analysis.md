# Business Analysis — Rogue Trader Colony Manager

**Version:** 2.0 (Consolidated)  
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
- ⚠️ **Phase 5 Gaps:** Representative Personality mechanics (Mad roll, Scholarly/Ties chosen_stat) pending

**Test Coverage:** 188+ tests passing across all layers

## 1. Purpose & Scope

This document captures the business requirements for the Colony Manager.

**Source of Truth:** The reference Excel workbook (`[WH40k_RT] [Team RT6] Colony Sheet.xlsx`) is treated as validated domain knowledge — it was used and tested by the players/GM against the core rulebook.

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
| `lore_state_complacency` / `..._order` / `..._productivity` / `..._piety` | string (enum) | no (calculated) | See §4.3 |
| `current_profit_factor` | integer ≥ 0 | no (calculated) | See §4.4 |
| `representative_id` | reference (nullable) | yes (assignment) | Representative is an independent entity, not owned by Colony — see §3.2. Nothing prevents the same Representative being referenced by more than one Colony (mechanically possible, though not meaningful lore-wise) |
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
| `type` | enum | yes | Exactly one. Fixed list (from reference sheet): Satrap, Judge, Cardinal, Colonist Representative, Military Commander — each with **descriptive text only, no mechanical bonus** |
| `personalities` | list of Personality | yes | **At least 1, multiple allowed.** Each has name, description, effect. Full fixed list with mechanical effects confirmed (see Design Decisions section) |
| `stats` | 9 × integer > 0 | yes | WS, BS, S, T, Ag, Int, Per, WP, Fel |
| `stat_bonus` (per stat) | integer | no (calculated) | `floor(stat_value / 10)` |
| `skills` | list of Skill | yes | `{name, level: known\|+10\|+20\|+30, description}` — **reference only, no mechanical effect** |
| `talents` | list of Talent | yes | `{name, description}` — **reference only, no mechanical effect** |
| `leadership_modifier` | integer | no (calculated) | Looked up from `max(Int_bonus, Per_bonus, Fel_bonus)` via a modifier table (see §4.4). This is the **only** confirmed mechanical link from Representative to Colony stats in V1 — Personality effects are applied separately to colony stats, Type is descriptive only, Skills and Talents are reference-only |

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

In V1, the only modifier source affecting these four stats is `gm_custom`
(Infrastructure/Support Upgrades/Resources are deferred, and
Representative's mechanical effect is confirmed to target `profit_factor`
only, not these four directly).

### 4.3 Size Calculation

```python
actual_size = clamp( base_size
                      + sum(active modifiers where modifier_stat == 'size'),
                      min = 0 )
```

Active source types affecting size in V1: `growth_decay`, `gm_custom`.
Integer only.

### 4.4 Lore State (per stat)

Derived from thresholds relative to `actual_size`. **[Derived from
reference spreadsheet — confirm before implementing]**:

| Stat | Condition: `stat > size` | Condition: `stat == 0` | Otherwise |
|---|---|---|---|
| Complacency | Placated | *(sheet shows "Riots and unrests" — confirm)* | Stable |
| Order | *(sheet shows a label here — confirm, likely "Orderly")* | Anarchy | Stable |
| Productivity | Productive | Halted | Stable |
| Piety | Pious | Heretical | Stable |

### 4.5 Profit Factor

**[Derived from reference spreadsheet — confirm before implementing]**

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

**Rounding rule (global):** round-half-up for every halving/rounding
calculation in the system (e.g. `1.5 → 2`), not just Profit Factor. Applies
system-wide unless a specific future rule explicitly states otherwise.

**Leadership Modifier lookup:** `max(Int_bonus, Per_bonus, Fel_bonus) →
modifier`. Partial table visible in the reference sheet (value 2 → −2,
3 → −1, 4 → 0, 5 → +1, 6 → +2). **[Needs full table from user — the visible
range doesn't cover all possible stat-bonus values (0–9+)]**.

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

---

## 6. Explicitly Out of Scope for V1

- Event system beyond raw config values (no pending/upcoming/current-event
  UI or logic)
- Colony Type change after creation (outside testing)
- Skills/Talents mechanical effects (reference-only for now)
- Representative Type mechanical effects (descriptive only, no stat bonuses)
- Modifier expiry/duration (temporary modifiers are manual via `is_active`)

**Note:** Hard Infrastructure module has been moved to Phase 4a (before 4b).
Support Upgrades and Planetary Resources modules have been implemented in
Phase 3b with core rulebook rules. See §4.7, §4.8, and §4.9 for details.

---

## 7. Configuration Reference (Complete)

All configuration data has been implemented and validated.

| Item | Status | Location |
|---|---|---|
| Colony Type config (types, base stats, base size, resource exploit bonuses) | ✅ Complete | `config/colony_types.yaml` |
| Representative Type list + mechanical bonuses | ✅ Complete (descriptive only) | `config/colony_types.yaml` |
| Personality list (name, description, effect) | ✅ Complete with mechanical effects | `config/personalities.yaml` |
| Lore state threshold labels | ✅ Complete | `config/rule_tables.yaml` |
| Size → base PF lookup table | ✅ Complete | `config/rule_tables.yaml` |
| Leadership Modifier full lookup table (all stat-bonus values) | ✅ Complete | `config/rule_tables.yaml` |
| Support Upgrades full definition & limits | ✅ Complete | `config/rule_tables.yaml` |
| Planetary Resources types & effects | ✅ Complete (8 resource types) | `config/rule_tables.yaml` |
| Infrastructure types & mechanics | ✅ Complete (5 types) | `config/rule_tables.yaml` |
| Roll interval configuration | ✅ Complete (global default, per-colony override) | `config/rule_tables.yaml` |
| Event system scope | ✅ Complete (track past/active, GM applies modifiers) | Application logic |

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
- **Phase 5 Gaps (Pending Implementation):**
  1. `pending_infrastructure_growth: bool` flag in Colony model
  2. `PersonalityAssignment` model with `mad_order_roll` and `chosen_stat` fields
  3. `special_trait_description: str | None` field in Representative model
