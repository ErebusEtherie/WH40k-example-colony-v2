# Agent Briefing Addendum — Phase 5 Reference Tables

**Purpose:** Quick-reference tables for Phase 5 implementation. All data sourced
from `DECISIONS_AND_QUESTIONS.md` Part 10 and `config/` YAML files.

## Representative Personalities (18 in scope)

| Personality | Effect | Calamity | Special Rule |
|-------------|--------|----------|--------------|
| Adventurous | +1 Productivity | +1 | — |
| Ambitious | +1 Productivity | +1 | — |
| Believer | +1 Piety | +1 | — |
| Curious | +1 Productivity | +1 | — |
| Disciplined | +1 Order | +1 | — |
| Dogmatic | +1 Piety | +1 | — |
| Dutiful | +1 Order | +1 | — |
| Fanatical | +2 Piety, -1 Order | +2 | — |
| Fearless | +1 Order | +1 | — |
| Gregarious | +1 Complacency | +1 | — |
| Honorable | +1 Order | +1 | — |
| Idealistic | +1 Complacency | +1 | — |
| Loyal | +1 Order | +1 | — |
| Mad | -1d5 Order (roll on assignment) | +2 | Roll 1d5, subtract from Order |
| Methodical | +1 Productivity | +1 | — |
| Patriotic | +1 Complacency | +1 | — |
| Pious | +1 Piety | +1 | — |
| Pragmatic | +1 Productivity | +1 | — |
| Scholarly | +1 Productivity, choose 1: +1 Order/Complacency/Piety | +1 | Choose stat on assignment |
| Ties With… | +1 Complacency, +1 Piety | +1 | — |
| Zealous | +2 Piety, -1 Complacency | +2 | — |

**Excluded from V1:**

- **Administrative Expert** (+2 Productivity if Order > Size) — continuous condition evaluation deferred

**Notes:**

- Mad: `mad_order_roll` field stores the 1d5 result; unset = 0 (no penalty)
- Scholarly: `chosen_stat` field stores GM's choice; unset = 0 (no bonus)
- Ties With…: No special input needed — flat +1/+1

## Representative Types (descriptive only — no mechanical bonuses)

| Type | Loss Mitigation | Special Trait Description |
|------|-----------------|---------------------------|
| Satrap | Complacency | Trade network bonuses (narrative only in V1) |
| Judge | Order | Legal authority, dispute resolution (narrative only) |
| Cardinal | Piety | Ecclesiarchical influence (narrative only) |
| Colonist Representative | Productivity | Voice of the people (narrative only) |
| Military Commander | Order | Security forces, defense coordination (narrative only) |
| Dynasty Member | None | Nepotism appointment — triggers Consequences table |

**Important:** Type is display/reference only. Do NOT wire into calculations.
Leadership Modifier comes from Representative's stats (highest of Int/Per/Fel bonus).

## Hard Infrastructure Types

| Type | Working Bonus | Disrupted Penalty |
|------|---------------|-------------------|
| Transport | +1 Productivity, +1 Complacency | -2 Productivity, -2 Order |
| Power Network | +2 Productivity | -3 Productivity, -1 Complacency |
| Water Management | +1 Order, +1 Complacency | -2 Order, -2 Complacency |
| Food Production | +1 Productivity, +1 Complacency | -2 Productivity, -2 Complacency |
| Communications | +1 Productivity, +1 Order | -2 Productivity, -2 Order |

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

## Colony Size → Profit Factor Lookup

| Size Range | Profit Factor |
|------------|---------------|
| 1-5 | 1 |
| 6-10 | 2 |
| 11-20 | 3 |
| 21-40 | 4 |
| 41-80 | 5 |
| 81-160 | 6 |
| 161-320 | 7 |
| 321-640 | 8 |
| 641+ | 9 |

**Note:** This table is in `config/profit_factor_table.yaml` — use the config, not hardcoded values.

## State Thresholds

| State | Condition | Effect |
|-------|-----------|--------|
| Anarchy | Order = 0 | Profit Factor = 0 |
| Placated | Complacency > Size | Colony is stable, no unrest |
| Productive | Productivity > 0 | Normal PF calculation |
| Halted | Productivity = 0 | PF halved (unless Order = 0, then PF = 0) |
| Heretical | Piety = 0 | Order and Complacency cannot increase |
| Pious | Piety > 0 | Normal operation |

**Lock Flags on Colony:**

- `complacency_locked` — when Complacency = 0, Order/Productivity cannot increase
- `order_locked` — reserved for future use
- `productivity_locked` — reserved for future use
- `pending_infrastructure_growth` — set True on Size increase, GM clears after applying penalty

## Files to Modify for Phase 5

1. `domain/models/colony.py` — add `pending_infrastructure_growth: bool = False`
2. `domain/models/representative.py` — create `PersonalityAssignment`, update `personalities` field
3. `domain/rules/representative_rules.py` — handle Mad roll and Scholarly choice in modifier calculation
4. `application/services/colony_service.py` — find Size increase trigger, wire `pending_infrastructure_growth`
5. `adapters/api/schemas/` — update request/response schemas for above changes
6. `adapters/api/routers/` — add/ update endpoints if needed
7. `tests/` — add tests for personality mechanics and infrastructure growth flag

## Where to Find Colony Size Increase Trigger

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
