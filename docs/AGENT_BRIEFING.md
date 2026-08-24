# Agent Briefing — WH40k Colony Manager

---

## Reading Order

1. **`.clinerules/00-overview.md`** — Project engineering rules (binding)
2. **`docs/business_analysis.md`** — **Single source of truth** for all business rules, calculations, and data structures
3. **`docs/colony-manager-rules-reference.md`** — Reference rules from rulebook/Excel
4. **`docs/architecture_phase_1.md`** — Technical architecture & layering
5. **`docs/implementation_plan_phase_5.md`** — Current work (Phase 5 in progress)
6. **`docs/api_guide_phase_3.md`** — Current API (implemented)
7. **`docs/api_future_phase_4.md`** — Future roadmap (not implemented)

---

## Project Stage

**Phase 5 In Progress:** Representative Personalities & Hard Infrastructure

### What's Done (Phases 1-4)

- ✅ Domain layer with all models and calculation rules
- ✅ Application services orchestrating business logic
- ✅ SQLite persistence with repositories
- ✅ JSON/YAML import/export
- ✅ FastAPI REST API with JWT authentication
- ✅ CLI interface (Typer)
- ✅ 188+ tests passing

### What's In Progress (Phase 5)

- ⏳ Colony Dashboard UI (3-panel layout)

### What's Complete (Recently Finished)

- ✅ `special_trait_description` field in Representative model
- ✅ Personality duplicate validation (no duplicate personalities on same Representative)
- ✅ Personality variable effects (Mad/Scholarly/Ties With...) handled via Custom Modifiers

### What's Future (Phase 6+)

- 📋 Development Planning Panel — planned for future, no calculation impact
- 📋 Audit logs
- 📋 Real-time collaboration

---

## Core Principles (Binding)

1. **No Dice Rolls**: The app **never** rolls dice. All random results (1d5, 1d10, 1d100) are provided by Player/GM as input values.
2. **No Event System**: Colony Manager tracks state only; events are handled externally by the GM.
3. **No Automated Tests**: Acquisition Tests, skill checks, etc. are not performed by the app.
4. **GM Control**: Custom modifiers allow GM to apply situational bonuses/penalties from events, narrative consequences, or roll results.
5. **Representative Uniqueness**: Personalities cannot be duplicated on the same Representative.
6. **1:1 Relationship**: One Representative per Colony only. A Representative cannot be assigned to multiple Colonies simultaneously.
7. **Colony Starts at Day 0**: We assume the colony is already founded with basic stats determined by the players' chosen colony type.

---

## Key Constraints

1. **Domain logic has zero I/O** — No FastAPI, SQLAlchemy, or file access in `domain/`
2. **Game rules are data** — Rule tables in `config/*.yaml`, not code
3. **Don't abstract preemptively** — Only when used in ≥2 places with real harm
4. **When unsure, ask** — Don't assume game rules or architectural decisions

---

## Critical Design Decisions

### Representative Types

**6 confirmed types** (from `docs/colony-manager-rules-reference.md`):

1. **Satrap** — No protected stat; +5 to Acquisition Tests (tracked separately)
2. **Judge** — Protects Order (reduce losses by 1)
3. **Cardinal** — Protects Piety (reduce losses by 1)
4. **Colonist Representative** — Protects Complacency (reduce losses by 1)
5. **Military Commander** — Protects Productivity (reduce losses by 1)
6. **Dynasty Member** — No protected stat; triggers Dynasty Member Results table (d100 roll)

### Dynasty Member Results (Table 3-5)

When Representative is Dynasty Member, player/GM provides d100 (1-100):

| d100 | Statistic | Value | Source |
|------|-----------|-------|--------|
| 01-20 | Player Choice | +1 | "Dynasty Potential" |
| 21-40 | Productivity | +1 | "One To Keep an Eye On" |
| 41-60 | Piety | +1 | "Thrilling Heroics" |
| 61-80 | Order | +1 | "Come On, It's Just a Grox!" |
| 81-100 | Complacency | +1 | "Volcano Palace" |

### Representative Personalities

**Key Rules:**

- Multiple personalities allowed per Representative
- **No duplicates** — each personality type can be selected only once
- "Quite a Character" is a meta-personality: when selected, GM/player chooses **two additional personalities** (resulting in 3 total: "Quite a Character" + 2 others). **The 2 chosen personalities must be unique** (cannot duplicate existing personalities or each other).
- "Compatibility" between personalities is a **GM/Player decision**, not enforced by the app
- Personalities with multiple effects (e.g., "Corrupt": +2 Productivity, -1 Order) apply **all listed effects**
- Conditional personalities (e.g., "Administrative Expert": +2 Productivity **only if** Order > Size) check conditions at calculation time

**Special Personalities Requiring GM Input:**

The following personalities require GM input (dice roll or stat choice). These are **not tracked automatically** by the app — the GM applies them via **Custom Modifiers** on the Colony:

| Personality | GM Action | Custom Modifier Example |
|-------------|-----------|------------------------|
| **Mad** | Roll 1d5 physically | `Order: -3`, Source: "Mad personality" |
| **Scholarly** | Identify lowest stat; choose if tied | `Productivity: +1`, Source: "Scholarly personality" |
| **Ties With...** | Choose stat based on organization | `Complacency: +1`, Source: "Ties With [Organization]" |

**Timing:** These modifiers must be created no later than completing the Representative's assignment to the Colony. See §3.2a in `business_analysis.md` for full workflow.

### Infrastructure Status

Use **"Not Working"** (not "disrupted") for the non-functional status:

- `Working` — Apply positive modifiers
- `Not Working` — Apply penalty modifiers
- `In Progress` — No modifiers apply

### Leadership Modifier Table

**Valid range: 2-6 only.** Values outside this range are invalid per game rules:

- 0-1: Character would be dead/incapacitated
- 6: Nearly impossible in-game
- 7+: Completely impossible

| Leader Int/Per/Fel Bonus | PF Modifier |
|-------------------------|-------------|
| 2 | -2 |
| 3 | -1 |
| 4 | 0 |
| 5 | +1 |
| 6 | +2 |

---

## Modifier System

### Modifier Categories

All modifiers use the Rules Reference category system:

| Category | Description | Examples |
|----------|-------------|----------|
| **Permanent** | Applied continuously while source exists | Infrastructure, upgrades, personalities, leader quality |
| **Conditional** | Threshold-based, auto-calculated | Placated, Orderly, Productive, Pious states |
| **Custom** | GM/player input | Event outcomes, roll results, narrative consequences |

### Custom Modifiers

**Purpose:** GM control over colony stats for events, penalties, and narrative consequences.

**Examples:**

1. **Riots and Unrest** (Complacency = 0):
   - GM rolls 1d5 externally (e.g., result = 3)
   - GM creates Custom Modifier: Order -3, source "Riots and Unrest: GM Roll"
   - GM rolls 1d5 externally (e.g., result = 2)
   - GM creates Custom Modifier: Productivity -2, source "Riots and Unrest: GM Roll"

2. **Ties With... Personality**:
   - GM decides Representative has ties with Military
   - GM creates Custom Modifier: Order +1, source "Ties With Military (GM Decision)"

3. **Event Consequences**:
   - Plague Event: Size -1, source "GM Event: Plague"
   - Ork Raid: Order -2, source "GM Event: Ork Raid"

### Modifier Structure

All modifiers (standard and custom) have:

- **stat** — Which statistic is affected (size, complacency, order, productivity, piety, profit_factor)
- **value** — Signed integer (+/-)
- **source** — Description of origin (e.g., "Ambitious Representative", "Transport Infrastructure", "GM Event: Ork Raid")
- **category** — Permanent, Conditional, or Custom
- **is_active** — Allows disabling without deleting
- **date_applied** — Optional timestamp for audit trail

### Representative Damage Reduction

When applying **negative** modifiers, Representative type reduces the magnitude:

| Representative Type | Protected Stat | Reduction | Example |
|---------------------|----------------|-----------|---------|
| Judge | Order | −1 (min loss: 1) | Order −3 → Order −2 |
| Cardinal | Piety | −1 (min loss: 1) | Piety −3 → Piety −2 |
| Colonist Representative | Complacency | −1 (min loss: 1) | Complacency −3 → −2 |
| Military Commander | Productivity | −1 (min loss: 1) | Productivity −3 → −2 |
| Satrap | None | — | No reduction |
| Dynasty Member | None | — | No reduction |

**Important:**

- Applies to **each negative modifier individually**, not the total loss
- Minimum loss is always 1 — cannot reduce penalty to 0
- Only applies to negative modifiers
- Applied **after** all modifiers (Permanent → Conditional → Custom) but **before** final clamping

---

## Calculation Pipeline Order

From `docs/business_analysis.md` §4.2:

1. **Phase 1: Base Stats** — Set according to Colony Type
2. **Phase 2: Permanent Modifiers** — Infrastructure, upgrades, personalities, leader quality
3. **Phase 3: Conditional Modifiers** — Threshold-based (Placated, Orderly, Productive, Pious)
4. **Phase 4: Custom Modifiers** — GM/player input for events, roll results, narrative consequences
5. **Phase 5: Representative Damage Reduction** — Apply to negative modifiers from Phase 4
6. **Phase 6: Final Calculation** — Sum all, clamp at 0 (Size capped at 10), apply PF rules

### State Transitions

Computed from final stat values:

| State | Trigger | Effect |
|-------|---------|--------|
| Placated | Complacency > Size | PF +1 |
| Orderly | Order > Size | Productivity +2 |
| Productive | Productivity > Size | PF +2 |
| Pious | Piety > Size | Order +1, Complacency +1 |
| Riots and Unrest | Complacency = 0 | GM inputs -1d5 Order, -1d5 Productivity (Custom Modifiers) |
| Anarchy | Order = 0 | PF = 0; all stats decay (GM applies via Custom Modifiers) |
| Production Halted | Productivity = 0 | PF ÷ 2 (round down) |
| Heretical | Piety = 0 | GM inputs -1d5 Order, -1d5 Complacency (Custom Modifiers) |

**Important:** All dice roll results (1d5, 1d10) are **provided by GM as input**. The app does not roll dice.

---

## Current Tasks (Phase 5)

**Note:** Phase 5 is mostly complete. Remaining work:

1. Build Colony Dashboard UI per `UI_PANEL_REQUIREMENTS.md`

**Recently Completed:**

- ✅ `special_trait_description` field added to Representative model
- ✅ Duplicate personality validation added (no duplicates on same Representative)
- ✅ Personality variable effects (Mad/Scholarly/Ties With...) documented as GM workflow via Custom Modifiers

**Removed tasks:**

- `PersonalityAssignment` model removed — variable personality effects handled via Custom Modifiers instead
- `pending_infrastructure_growth` flag removed per requirements alignment with Rules Reference

---

## Implementation Notes

### Personality Effects Processing

Each personality maps to one or more modifiers. Process as follows:

1. **Parse personality table** from `config/personalities.yaml` where each entry has:
   - `name`: Personality name (e.g., "Corrupt", "Mad")
   - `effects`: List of `{stat, value, condition?}` objects
   - `calamitous_modifier`: Integer for event roll penalties
   - `special_rule`: Optional text (e.g., "roll twice for calamitous events")

2. **For each personality assigned to Representative:**
   - Check if personality has conditional effects (e.g., "Administrative Expert")
   - If conditional, evaluate condition against current colony state
   - Apply all active effects as Permanent Modifiers

3. **Variable-effect personalities (Mad, Scholarly, Ties With...):**
   - These require GM input (dice roll or stat choice) that is **not tracked automatically**
   - GM applies these via Custom Modifiers on the Colony (see §3.2a in `business_analysis.md`)
   - The app does not store `mad_order_roll` or `chosen_stat` — GM provides the final modifier values

4. **"Quite a Character" special handling:**
   - Does not provide direct stat modifiers
   - Signals that GM rolled this result and selected 2 additional personalities
   - Store as a personality entry alongside the 2 chosen ones
   - **Validate all 3 personalities** (Quite a Character + 2 choices) against uniqueness rule — the 2 chosen personalities cannot duplicate existing personalities or each other

---

## Tool Usage

- Use `read_files` to read existing code
- Use `search_codebase` to find patterns/definitions
- Use `editor` for file modifications (small chunks < 6000 chars)
- Use `run_commands` for shell commands (PowerShell on Windows)
- Use `skills` tool when a skill matches the request
- **Never invent tool names** — only use the 6 tools listed above

---

## Files Requiring Updates (Phase 5)

**Note:** Phase 5 is mostly complete. The following was the original plan, now superseded by the Custom Modifier approach:

| File | Original Planned Change | Current Status |
|------|------------------------|----------------|
| `domain/models/representative.py` | Add `special_trait_description`, change `personalities` type | ✅ `special_trait_description` added; `personalities` remains `list[Personality]` |
| `domain/models/personality.py` | Create `PersonalityAssignment` model | ❌ Removed — Custom Modifier approach adopted instead |
| `domain/rules/representative_rules.py` | Handle Mad roll, Scholarly lowest-stat logic | ❌ Not needed — GM applies via Custom Modifiers |
| `application/services/representative_service.py` | Validate/clear `mad_order_roll`/`chosen_stat` | ❌ Not needed — Custom Modifier approach |
| `adapters/api/schemas/representative.py` | Update schemas | ✅ No changes needed beyond `special_trait_description` |
| `adapters/api/routers/representatives.py` | Accept assignment-time inputs | ❌ Not needed — Custom Modifier approach |

**Removed:** `pending_infrastructure_growth` flag removed from all files per requirements alignment.

---

## Acceptance Criteria for Phase 5

**Note:** Phase 5 is mostly complete. Updated criteria:

1. ✅ All personality traits apply correct modifiers (per `docs/colony-manager-rules-reference.md` table, including Administrative Expert)
2. ✅ Mad's Order penalty applied via Custom Modifier (GM rolls 1d5 physically, creates modifier with source "Mad personality")
3. ✅ Scholarly applies +1 to lowest stat via Custom Modifier (GM identifies lowest, creates modifier with source "Scholarly personality")
4. ✅ Ties With... applies +1 to chosen stat via Custom Modifier (GM chooses based on organization, creates modifier)
5. ✅ "Quite a Character" can be assigned with 2 additional personalities (**with duplicate validation** — the 2 chosen cannot duplicate existing personalities or each other)
6. ✅ Hard Infrastructure bonuses/penalties stack correctly (Working vs Not Working status)
7. ✅ `special_trait_description` field available on Representative for GM notes
8. ⏳ Colony Dashboard UI shows 3 panels with correct data (pending)
9. ✅ All domain tests passing (644 tests, 3 skipped)
9. ✅ Ruff ✅, Mypy ✅ on all modified files

**Removed:** `pending_infrastructure_growth` flag criteria removed per requirements alignment.

---

## Testing

Run tests with:

```bash
pytest
```

Code quality:

```bash
ruff check src/
mypy src/
```

---
