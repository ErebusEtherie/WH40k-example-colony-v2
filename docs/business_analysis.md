# Business Analysis — Rogue Trader Colony Manager

**Version:** 4.0 (Aligned with Rules Reference, all P0-P2 conflicts resolved)
**Last Updated:** 2026-08-24
**Status:** Authoritative source of truth for all business rules

---

## Document Purpose

This is the **single source of truth** for all business rules, domain models, and calculation logic for the WH40k Rogue Trader Colony Manager.

**Core Principles:**

1. **No Dice Rolls**: All random results (1d5, 1d10, 1d100) are provided by Player/GM as input values. The app never rolls dice.
2. **No Event System**: Colony Manager tracks state only; events are handled externally by the GM.
3. **No Automated Tests**: Acquisition Tests, skill checks, etc. are not performed by the app.
4. **GM Control**: Custom modifiers allow GM to apply situational bonuses/penalties from events, narrative consequences, or roll results.
5. **Representative Uniqueness**: Personalities cannot be duplicated on the same Representative.
6. **1:1 Relationship**: One Representative per Colony only. A Representative cannot be assigned to multiple Colonies simultaneously.

**Implementation Status:**

- ✅ **Phase 1-4:** Core domain models, rule engine, application services, persistence complete
- ✅ **Phase 4a:** Hard Infrastructure module complete
- ✅ **Phase 5:** Support Upgrades, Planetary Resources, State Effects complete
- ✅ **Phase 6-9:** API, CLI, Import/Export, tooling complete
- ✅ **Leadership Modifier table** — Complete for valid range 2-6 per Reference. Values outside this range are invalid per game rules.
- 📋 **Future Phase:** Development Planning Panel — planned for future implementation, no impact on calculations

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
| Modifier Category | Classification of modifier source: **Permanent** (infrastructure, upgrades, personalities), **Conditional** (threshold-based, auto-calculated), or **Custom** (GM/player input) |
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
| `gm_notes` | string (nullable, max 2000 chars) | yes | Free-form GM notes for tracking ongoing situations, narrative context, reminders, or custom event descriptions. The app does not auto-roll or enforce event outcomes — GM applies custom modifiers manually via the modifiers system |
| `base_complacency` / `base_order` / `base_productivity` / `base_piety` | integer | no | Derived from `colony_type`, fixed |
| `base_size` | integer | no | Derived from `colony_type` at creation |
| `actual_size` | integer ≥ 0 | no (calculated) | `base_size` + applicable modifiers, clamped at 0 and **capped at 10** |
| `current_complacency` / `current_order` / `current_productivity` / `current_piety` | integer ≥ 0 | no (calculated) | Base + applicable modifiers, clamped at 0 |
| `lore_state_complacency` / `..._order` / `..._productivity` / `..._piety` | string (enum) | no (calculated) | See §4.4 |
| `current_profit_factor` | integer ≥ 0 | no (calculated) | See §4.5 |
| `representative_id` | reference (nullable) | yes (assignment) | **One Representative per Colony only (1:1 relationship)**. Representative is an independent entity, not owned by Colony — see §3.2 |
| `modifiers` | list of Modifier | — | See §3.3 |

**V1 explicitly excludes:** pending/upcoming event indicators. The app tracks
elapsed days and can display "next roll in X days" but does not surface
"event pending" notifications.

**Important:** This app is a **living character sheet**, not a game simulator.
All dice rolls (growth rolls, event rolls, calamitous events) are performed
manually by players/GM outside the app. The app tracks colony state and
displays cycle information, but does not auto-roll or enforce outcomes.

**Missing Infrastructure Penalty:** Until each required infrastructure type is built (moved from In Progress to Working), the colony suffers **Complacency -1** per missing type. This is applied as a permanent modifier with source "Missing Infrastructure".

### 3.2 Representative

| Field | Type | Editable? | Notes |
|---|---|---|---|
| `id` | identifier | no | |
| `name` | string | yes | Representative is a standalone entity — it can exist unassigned. **One Representative per Colony only (1:1 relationship)**. When assigned, the Colony holds the reference |
| `type` | enum | yes | Exactly one. Fixed list (from reference sheet): **Satrap**, **Judge**, **Cardinal**, **Colonist Representative**, **Military Commander**, **Dynasty Member**. Each type has **descriptive text only, no mechanical bonus**, except for damage reduction protection (see §4.10). Satrap has special +5 to Acquisition Tests (tracked separately, not a stat modifier) |
| `personalities` | list of `Personality` | yes | **Multiple allowed, no duplicates.** See §3.2a and §4.7a for the confirmed 18-trait table with mechanical effects. Variable effects (Mad, Scholarly, Ties With...) are handled via Custom Modifiers applied by the GM |
| `special_trait_description` | string (nullable) | yes | Free-text GM note tied to `type` (e.g. narrative flavor for a Satrap's trade contacts). Reference-only, no mechanical effect |
| `stats` | 9 × integer > 0 | yes | WS, BS, S, T, Ag, Int, Per, WP, Fel |
| `stat_bonus` (per stat) | integer | no (calculated) | `floor(stat_value / 10)` |
| `skills` | list of Skill | yes | `{name, level: known\|+10\|+20\|+30, description}` — **reference only, no mechanical effect** |
| `talents` | list of Talent | yes | `{name, description}` — **reference only, no mechanical effect** |
| `leadership_modifier` | integer | no (calculated) | Looked up from `max(Int_bonus, Per_bonus, Fel_bonus)` via a modifier table (see §4.5). This is the **only** confirmed mechanical link from Representative to Colony stats that targets `profit_factor` directly in V1 — Personality effects (§4.7a) apply separately to the four core colony stats, Type is descriptive only, Skills and Talents are reference-only |

### 3.2a Personality Mechanics — GM Workflow

Personalities with variable effects (Mad, Scholarly, Ties With...) require GM input. Rather than tracking this data in the domain model, the GM applies these effects via **Custom Modifiers** on the Colony:

| Personality | GM Action | How to Track |
|-------------|-----------|--------------|
| **Mad** | Roll 1d5 physically | Add Custom Modifier to Colony: `Order: -[roll value]`, Source: "Mad personality" |
| **Scholarly** | Identify lowest stat (Complacency/Order/Productivity/Piety); choose if tied | Add Custom Modifier: `[stat]: +1`, Source: "Scholarly personality" |
| **Ties With...** | Choose stat based on organization | Add Custom Modifier: `[stat]: +1`, Source: "Ties With [Organization]" |

**Timing:** These modifiers must be created no later than completing the Representative's assignment to the Colony.

**Design Rationale:** This approach aligns with Core Principle #4 (GM Control) and avoids the complexity of tracking assignment-scoped state. The app provides the structure; the GM provides the narrative judgment and dice rolls.

### 3.3 Modifier (generic)

A single, reusable structure representing any discrete adjustment to a
Colony stat.

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | |
| `colony_id` | reference | |
| `category` | enum | **Permanent** (infrastructure, upgrades, personalities), **Conditional** (threshold-based, auto-calculated), or **Custom** (GM/player input) — see Rules Reference |
| `stat` | enum | `size`, `complacency`, `order`, `productivity`, `piety`, `profit_factor` |
| `value` | integer | Signed (+/-) |
| `source` | string | Description of origin (e.g. "Ambitious Representative", "Transport Infrastructure", "GM Event: Ork Raid") |
| `is_active` | boolean | Allows disabling without deleting (e.g. GM toggles a temporary penalty off) |
| `date_applied` | date (optional) | Timestamp for audit trail |

**Modifier Categories (from Rules Reference):**

| Category | Active in V1? | Notes |
|---|---|---|
| `Permanent` | **Yes** | Infrastructure, upgrades, personalities — applied continuously while source exists |
| `Conditional` | **Yes** | Threshold-based effects (e.g. Placated, Orderly, Pious, Productive states) — auto-calculated |
| `Custom` | **Yes** | GM/player input for events, narrative consequences, roll results (1d5, 1d10, 1d100) |

**Note:** The app uses the Rules Reference's category system (Permanent/Conditional/Custom) rather than a source_type enumeration. This aligns with the modifier application order: Permanent → Conditional → Custom.

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

### 4.2 Calculation Pipeline Order

Modifiers are applied in the following order:

1. **Base Stats** — Set according to Colony Type (see §6)
2. **Permanent Modifiers** — Infrastructure, upgrades, personalities, leader quality
3. **Conditional Modifiers** — Threshold-based effects (Placated, Orderly, etc.)
4. **Custom Modifiers** — GM/player input for events, roll results, narrative consequences
5. **Damage Reduction** — Representative type reduces negative modifier magnitude (see §4.10)

### 4.3 Stat Calculation (Complacency / Order / Productivity / Piety)

```python
current_stat = clamp( base_stat (from colony_type)
                       + sum(active modifiers where stat == this stat),
                       min = 0 )
```

In V1, modifier sources affecting these four stats include Permanent (infrastructure, upgrades, personalities), Conditional (threshold-based), and Custom (GM input).

### 4.4 Size Calculation

```python
actual_size = clamp( base_size
                      + sum(active modifiers where stat == 'size'),
                      min = 0, max = 10 )
```

Active modifier categories affecting size: Permanent (growth investments), Conditional (none in V1), Custom (GM events, growth/decay results). Integer only, capped at 10.

### 4.5 Lore State (per stat) — CONFIRMED, all four thresholds resolved

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

### 4.6 Profit Factor

```python
pf_base = lookup(actual_size)            # Size → PF table, from reference "Data" sheet
pf_raw  = pf_base
        + (1 if current_complacency > actual_size else 0)   # Placated bonus
        + (2 if current_productivity > actual_size else 0)  # Productive bonus
        + sum(active permanent modifiers where stat == 'profit_factor')  # e.g. colony type specials
        + sum(active custom modifiers where stat == 'profit_factor')     # GM input
        + leadership_modifier            # from Representative, see below

if current_order == 0:
    profit_factor = 0                    # zero-forcing takes priority over everything
elif current_productivity == 0:
    profit_factor = floor(pf_raw / 2)   # halving applies after all numeric bonuses/penalties (round down)
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

**Rounding rule:** Use `floor()` (round down) for Profit Factor halving. Example: PF 3 → 1.

**Leadership Modifier lookup — COMPLETE per Reference:**
`max(Int_bonus, Per_bonus, Fel_bonus) → modifier`. The Reference explicitly
defines the valid range as 2-6; values outside this range are invalid per game
rules (0-1: character dead/incapacitated; 7+: impossible in-game):

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

### 4.7 Representative Stat Bonus

```python
stat_bonus = floor(stat_value / 10)
```

E.g. stat value 42 → bonus 4; value 29 → bonus 2.

### 4.8 State-Based Effects (Phase 3b)

These effects apply automatically based on colony stat thresholds. They are
**pure functions** — no I/O, no mutation, deterministic given inputs.

**Important:** All dice roll results (1d5, 1d10) mentioned below are **provided by the GM/player as input values**. The app does not roll dice.

**Orderly State** (Order > Size):

- Effect: +2 Productivity bonus
- Applied: Continuously while condition holds
- Source: Rogue Trader Colony Rules

**Pious State** (Piety > Size):

- Effect: +1 Order, +1 Complacency bonus
- Applied: Continuously while condition holds
- Source: Rogue Trader Colony Rules

**Complacency = 0 Crisis (Riots and Unrest)**:

- Immediate effect: Order and Productivity each decrease by 1d5 (**GM provides roll result as input via Custom Modifiers**)
- Source: Rogue Trader Colony Rules

**Piety = 0 Crisis (Heretical)**:

- Immediate effect: Order and Complacency each decrease by 1d5 (**GM provides roll result as input via Custom Modifiers**)
- Source: Rogue Trader Colony Rules

**Anarchy State** (Order = 0):

- Effect: PF = 0; all stats decay (**GM applies decay via Custom Modifiers**)
- Source: Rogue Trader Colony Rules

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
| Scholarly | +1 to lowest stat (Complacency/Order/Productivity/Piety); GM chooses if tied |
| Administrative Expert | +2 Productivity (only if Order > Size) |

**Confirmed design decision — Scholarly:** The rulebook ties Scholarly's bonus
to whichever stat is lowest *at the moment the Representative is installed*.
V1 implements this by calculating the lowest of (Complacency, Order,
Productivity, Piety) at assignment time **after** old Representative modifiers
are removed but **before** new Representative modifiers are applied. If multiple
stats are tied for lowest, GM chooses which tied stat receives it. This preserves
the rulebook's "lowest stat" trigger while handling ties gracefully. Both
`chosen_stat` (Scholarly, Ties With…) and `mad_order_roll` (Mad) are set at
assignment time and cleared on reassignment — see §3.2a.

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

### 4.10 Representative Damage Reduction

When applying **negative** modifiers to colony stats, the Representative's type reduces the magnitude of the loss. This is applied **after** all modifiers (Permanent, Conditional, Custom) have been calculated but **before** the final value is clamped.

| Representative Type | Protected Stat | Reduction | Example |
|---|---|---|---|
| **Judge** | Order | −1 (minimum loss: 1) | Order −3 → Order −2 |
| **Cardinal** | Piety | −1 (minimum loss: 1) | Piety −3 → Piety −2 |
| **Colonist Representative** | Complacency | −1 (minimum loss: 1) | Complacency −3 → Complacency −2 |
| **Military Commander** | Productivity | −1 (minimum loss: 1) | Productivity −3 → Productivity −2 |
| **Satrap** | None | — | No reduction |
| **Dynasty Member** | None | — | No reduction |

**Implementation Notes:**

- Damage reduction applies to **each negative modifier individually**, not to the total loss
- Minimum loss is always 1 — damage reduction cannot reduce a penalty to 0
- Only applies to negative modifiers; positive modifiers are unaffected
- GM applies this reduction when creating Custom modifiers from event/roll results

**Example Workflow:**

1. GM rolls 1d5=3 for Riots and Unrest penalty to Order
2. GM creates Custom Modifier: Order −3, source "Riots and Unrest: GM Roll"
3. System detects Representative is Judge
4. System reduces modifier: Order −3 → Order −2
5. Final modifier applied: Order −2, source "Riots and Unrest: GM Roll (reduced by Judge)"

---

## 5. Business Rules Summary (priority order, applies generally)

1. **Zero-forcing conditions always take priority** over any numeric
   bonus/penalty (e.g. Order == 0 forces PF to 0 regardless of other
   modifiers).
2. **Halving conditions apply after all numeric bonuses/penalties**, using
   round-half-up.
3. **Stats can never go below 0.** Where relevant (Size, the four core
   stats, PF), clamp at 0 after all modifiers are applied. Size is also **capped at 10**.
4. **Colony Type is immutable** post-creation outside of an explicit
   testing/admin path.
5. **`chosen_stat` / `mad_order_roll` are assignment-scoped, not
   Representative-scoped** — set when a Representative is assigned to a
   Colony, required if the personality demands it, cleared on reassignment.
6. **Damage Reduction applies after all modifiers** — Representative type reduces negative modifier magnitude individually per modifier, not on the total.
7. **Custom modifiers are GM/player input** — All dice roll results (1d5, 1d10, 1d100) are provided by GM/player; the app never rolls dice. Custom modifiers are the mechanism for applying event outcomes, roll results, and narrative consequences.
8. **Modifier application order is fixed**: Base Stats → Permanent Modifiers → Conditional Modifiers → Custom Modifiers → Damage Reduction.

---

## 6. Explicitly Out of Scope for V1

- Event system beyond raw config values (no pending/upcoming/current-event
  UI or logic)
- Colony Type change after creation (outside testing)
- Skills/Talents mechanical effects (reference-only for now)
- Representative Type mechanical effects (descriptive only, no stat bonuses, except damage reduction)
- Modifier expiry/duration (temporary modifiers are manual via `is_active`)
- **Development Planning Panel** — planned for future implementation; will have no impact on colony calculations when implemented

**Note:** Hard Infrastructure module has been moved to Phase 4a (before 4b).
Support Upgrades and Planetary Resources modules have been implemented in
Phase 3b with core rulebook rules. See §4.7, §4.8, and §4.9 for details.

---

## 7. Configuration Reference

| Item | Status | Location |
|---|---|---|
| Colony Type config (types, base stats, base size, resource exploit bonuses) | ✅ Complete | `config/colony_types.yaml` |
| Representative Type list + damage reduction table | ✅ Complete (descriptive + damage reduction mechanic) | `config/colony_types.yaml` + §4.10 |
| Personality list (name, description, effect) | ✅ Complete with mechanical effects — see §4.7a | `config/personalities.yaml` |
| Lore state threshold labels | ✅ Complete — both previously-unconfirmed labels resolved, see §4.4 | `config/rule_tables.yaml` |
| Size → base PF lookup table | ✅ Complete (per-size, not range-based) | `config/rule_tables.yaml` |
| Leadership Modifier full lookup table (all stat-bonus values) | ✅ Complete — valid range 2-6 per Reference; values outside this range are invalid | `config/rule_tables.yaml` |
| Support Upgrades full definition & limits | ✅ Complete | `config/rule_tables.yaml` |
| Planetary Resources types & effects | ✅ Complete (8 resource types) | `config/rule_tables.yaml` |
| Infrastructure types & mechanics | ✅ Complete (5 types) | `config/rule_tables.yaml` |
| Roll interval configuration | ✅ Complete (global default, per-colony override) | `config/rule_tables.yaml` |
| GM notes field (`gm_notes`) | ✅ Complete (free-form text, max 2000 chars) | §3.1 Colony entity |
| Personality variable effects (Mad/Scholarly/Ties With...) | ✅ Complete via Custom Modifiers — GM applies manually per §3.2a | §3.2a, §3.3 |
| Modifier category system (Permanent/Conditional/Custom) | ✅ Complete | §3.3 |
| Damage Reduction mechanic | ✅ Complete | §4.10 |
| Missing Infrastructure penalty | ✅ Complete | §3.1 |

**Implementation Notes:**

- Ecclesiastical, Agricultural, Mining, Research colony type bonuses/rules: ✅ Implemented
- Support Upgrade type-specific rules: ✅ Implemented
- Planetary Resource effects: ✅ Implemented
- Representative Damage Reduction: ✅ Implemented
- Hard Infrastructure module: ✅ Implemented (Phase 4a)
- Support Upgrades and Planetary Resources modules: ✅ Implemented (Phase 3b)

---

## 8. Assumptions Log

- Representative's `type` bonus text exists in the reference sheet but its
  precise mechanical trigger isn't specified — treated as descriptive-only
  **except for damage reduction** (see §4.10), which is the confirmed mechanical effect.
- **Roll intervals are global config** — `event_roll_interval_days` (60) and
  `development_roll_interval_days` (90) are defined in `config/rule_tables.yaml`
  under the `game_cycles` section. The app displays "next roll in X days" based
  on colony age and these global intervals.
- Representative is independent of Colony but **1:1 relationship only** — a Representative cannot be assigned to multiple Colonies simultaneously.
- If a Representative assigned to a Colony is deleted, the Colony's
  reference is cleared rather than blocking the delete or deleting the
  Colony. Flagged as a default in `architecture_phase_1.md` §3.6.
- **Scholarly's trigger is "lowest stat" per rulebook**, with GM choice only
  when multiple stats are tied for lowest. The GM applies this via a Custom
  Modifier rather than automatic tracking — see §3.2a.
- **Personality mechanics use Custom Modifiers** — Mad, Scholarly, and Ties With...
  personalities require GM input (dice roll or stat choice). Rather than implementing
  a `PersonalityAssignment` wrapper with `mad_order_roll`/`chosen_stat` fields, the GM
  applies these effects via Custom Modifiers on the Colony. This keeps the domain model
  simpler and aligns with the "GM Control" principle — see §3.2a.
- **All dice rolls are external** — The app never rolls dice. All 1d5, 1d10, 1d100 results are provided by GM/player as input values via Custom modifiers.
- **Damage Reduction applies per-modifier** — Representative type reduces each negative modifier individually, not the total loss.
- **Colony starts at Day 0** — We assume the colony is already founded with basic stats determined by the players' chosen colony type.
- **Leadership Modifier table is complete for valid range 2-6** — values outside this range are invalid per game rules (0-1: character dead/incapacitated; 7+: impossible in-game).
- **Support Upgrade limit uses `base_size`** — design decision to prevent upgrade limit from fluctuating with temporary Size changes (Reference wording says "current Size", but `base_size` is more stable).
- **Administrative Expert personality included** — +2 Productivity when Order > Size (conditional personality).
- **Crisis states (Riots/Heretical/Anarchy) have no persistent locks** — GM applies all decay/penalties via Custom Modifiers manually.
