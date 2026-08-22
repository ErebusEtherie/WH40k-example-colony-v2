# Decisions & Questions — Rogue Trader Colony Manager

This document consolidates all major architectural decisions, design choices,
and remaining open questions. **Last updated:** 2026-08-23

---

## Part 1: Confirmed Architectural Decisions

### A. Domain & Persistence Architecture

| Decision | Rationale | Status |
| --- | --- | --- |
| **Representative is independent entity** (not owned by Colony) | Mechanically possible for one Representative to serve multiple Colonies; modeled as `colony.representative_id` (FK reference), not embedding | ✅ Confirmed & Implemented |
| **Representative deletion doesn't cascade** | Deleting a Representative clears the FK reference in affected Colonies, but doesn't delete the Colonies | ✅ Confirmed & Implemented |
| **Modifier has cascade delete** | Deleting a Colony cascades to its Modifiers (orphaned modifiers have no meaning) | ✅ Confirmed & Implemented |
| **Computed stats not stored** | `current_*`, `actual_size`, `lore_state_*`, `current_profit_factor` are always derived, not stored (prevents stale data). Returned via `CalculatedColonyState` value object | ✅ Confirmed & Implemented |
| **Modifiers typed by source** | `ModifierSourceType` enum (gm_custom, growth_decay, representative_leadership, infrastructure, resource, support_upgrade) — reserved values forward-compatible with future phases | ✅ Confirmed & Implemented |

### B. Business Rule Calculations

| Decision | Rationale | Status |
| --- | --- | --- |
| **Zero-forcing priority** | `Order == 0` forces `PF = 0` regardless of any other modifiers — highest priority | ✅ Confirmed & Implemented |
| **Halving after all bonuses** | `Productivity == 0` triggers `PF = round_half_up(PF_raw / 2)` after all numeric adjustments | ✅ Confirmed & Implemented |
| **Round-half-up globally** | All division/rounding in system uses round-half-up (1.5 → 2), not banker's rounding | ✅ Confirmed & Implemented |
| **Stats clamped at 0** | No stat (size, complacency, order, productivity, piety, PF) can go below 0 | ✅ Confirmed & Implemented |
| **Colony Type immutable post-creation** | Once created, `colony_type` cannot change outside explicit admin/testing paths | ✅ Confirmed & Implemented |
| **age_last_updated auto-set** | When `age_days` changes, `age_last_updated` automatically set to current date (audit trail) | ✅ Confirmed & Implemented |

### C. Phase 3b: State Effects & Special Rules

| Decision | Rationale | Status |
| --- | --- | --- |
| **Orderly State (+2 Productivity)** | `Order > Size` continuously applies +2 Productivity bonus | ✅ Confirmed & Implemented |
| **Pious State (+1 Order, +1 Complacency)** | `Piety > Size` continuously applies +1 bonus to each | ✅ Confirmed & Implemented |
| **Crisis Locks (prevent increases only)** | `Complacency == 0` or `Piety == 0` locks Order and Productivity (or Order and Complacency) from increasing, but penalties still apply | ✅ Confirmed & Implemented |
| **Ecclesiastical Protection** | Order decrease → optional Order→Piety transfer (player choice each time) | ✅ Confirmed & Implemented |
| **Agricultural Resilience** | Size decrease → 1d10 roll, 8+ prevents the decrease | ✅ Confirmed & Implemented |
| **Mining/Industry Resource Bonus** | Exploiting Mineral resources → +2 Productivity, +2 PF | ✅ Confirmed & Implemented |
| **Research Mission Bonus** | Exploiting Organic Compound, Archeotech Cache, or Xenos Ruins → +2 Productivity, +1 PF | ✅ Confirmed & Implemented |

### D. Support Upgrades Validation

| Decision | Rationale | Status |
| --- | --- | --- |
| **Global Limit: upgrades ≤ base_size** | A Colony cannot have more upgrades than its base size | ✅ Confirmed & Implemented |
| **Mechanicum Station: limit 1** | Unique facility, maximum one per colony | ✅ Confirmed & Implemented |
| **Infantry Garrison: limit 1** | One permanent garrison | ✅ Confirmed & Implemented |
| **Imperial Navy Station: limit 1** | One naval presence | ✅ Confirmed & Implemented |
| **Personal Lodgings: limit 1** | No benefit after first | ✅ Confirmed & Implemented |
| **Cultural Improvement: limit 5** | Maximum 5 (one per stat bonused + 1) | ✅ Confirmed & Implemented |
| **Arbites Precinct: unlimited** | Can purchase multiple | ✅ Confirmed & Implemented |
| **Ecclesiarchy Mission: unlimited** | Can purchase multiple | ✅ Confirmed & Implemented |
| **Industrial Facility: unlimited** | Can purchase multiple | ✅ Confirmed & Implemented |
| **Contacts: unlimited** | Each adds 1d5 NPCs | ✅ Confirmed & Implemented |
| **Trappings: unlimited** | Can purchase multiple | ✅ Confirmed & Implemented |

### E. Planetary Resources

| Decision | Rationale | Status |
| --- | --- | --- |
| **8 Resource Types defined** | `Mineral`, `Organic_Compound`, `Promethium`, `Archeotech_Cache`, `Xenos_Ruins`, `Ancient_Weapons_Cache`, `Sacred_Relics`, `Forbidden_Lore` | ✅ Confirmed & Implemented |
| **Resources are colony attributes** | Colonies have a list of active resources (many-to-one relationship) | ✅ Confirmed & Implemented |
| **Resource-based bonuses automatic** | Mining/Research bonuses apply when corresponding resources are exploited | ✅ Confirmed & Implemented |

### F. Representative Mechanics — Personality & Type (Phase 5)

| Decision | Rationale | Status |
| --- | --- | --- |
| **Representative contributes modifiers from Leadership + Personality only** | Type contributes no stat modifiers (see below) | ✅ Confirmed |
| **Personality assignment: 1..N per Representative, no duplicates** | A Representative must have at least one Personality; the same `PersonalityType` cannot be assigned twice to the same Representative | ✅ Confirmed |
| **18 of 19 rulebook Personalities are unconditional and in scope for V1** | Simple fixed stat deltas, computed directly from `config/personalities.yaml`; full table in Part 10 | ✅ Confirmed |
| **Administrative Expert excluded from V1** | Continuously-evaluated condition (`+2 Productivity if Order > Size`) — same category as other deferred conditional mechanics (e.g. Infrastructure shortage) | ⏳ DEFERRED — no target phase set |
| **Mad's roll component uses manual GM input, not engine-rolled dice** | `-1d5 Order`; GM enters the rolled value on the assignment; unset value = 0 contribution. Consistent with the existing "dice injected from outside, not generated internally" principle (`DiceRoller`) | ✅ Confirmed |
| **"Ties With…" and "Scholarly" use a GM-chosen target stat, not an app-computed one** | Both take a `chosen_stat` field (Complacency/Order/Productivity/Piety) set by the GM; unset = 0 contribution. **Scholarly's rulebook text** ("bonus applies to whichever stat is lowest at time of install") **is deliberately simplified** — the app does not auto-detect the lowest stat; GM picks manually, same mechanism as Ties With | ✅ Confirmed — deliberate simplification, not a bug |
| **Representative Type is descriptive only, never a modifier source** | Satrap/Judge/Cardinal/Colonist Representative/Military Commander special traits (rulebook text) are displayed as `special_trait_description` text; GM applies their effects manually during play. Excel's Leadership Modifier (Int/Per/Fel-derived) remains the only Type-adjacent thing that's mechanically wired, and it isn't Type-specific — it applies to every Representative | ✅ Confirmed |

### G. Hard Infrastructure (Phase 5)

| Decision | Rationale | Status |
| --- | --- | --- |
| **Starting infrastructure is not modeled as `Infrastructure` instances** | The rulebook's "every settlement begins with basic infrastructure" is already folded into `ColonyType` base stats. No `Infrastructure` row is created for the baseline set | ✅ Confirmed |
| **Infrastructure built during play: unlimited instances per type** | Multiple instances of the same type allowed (colonies accumulate these over time via Endeavours); no upper limit enforced | ✅ Confirmed |
| **No build-order validation** | Rulebook's "usually build 1 of each before a 2nd of each" is narrative/GM guidance only — the app does not enforce or warn on build order or ratio between types | ✅ Confirmed |
| **Growth → Complacency penalty is not auto-calculated** | On Colony Size increase, `Colony.pending_infrastructure_growth` is set `True` and surfaced to the GM. The app does **not** auto-apply the Complacency penalty — GM applies their own `gm_custom` modifier and manually clears the flag once resolved | ✅ Confirmed |
| **Infrastructure "shortage" mechanic excluded from V1** | Corresponds to `Colony_Sheet_Analysis.md` §15. Not discussed with GM group; no confirmed rulebook source found; the Excel formula's own correctness is already flagged as unverified in that analysis | ⏳ TO BE DISCUSSED WITH GM |

**⚠️ Contradiction requiring verification before Phase 5 dev starts:** this document
currently contains conflicting signals about Hard Infrastructure's implementation
status — Part 4 says "❌ not implemented," Part 5 lists it as a Phase 4b to-do, and
Part 9's Communication Log says "✅ Phase 4b complete." **Someone needs to check the
actual codebase** (`domain/models/`, `domain/rules/`) before treating the above as
new work vs. a reconciliation/gap-check task. See Part 3 for the tracked question.

---

## Part 2: Implementation Decisions (Made During Development)

### API Design

| Decision | Rationale | Status |
| --- | --- | --- |
| **Separate API schema layer** | FastAPI schemas (Pydantic) separate from domain models → easier API evolution without domain changes | ✅ Implemented |
| **Repositories implement Ports** | Dependency injection via abstract ports → easier testing and swapping implementations | ✅ Implemented |
| **Single-responsibility mappers** | `orm_to_domain`, `domain_to_orm`, `domain_to_api`, etc. — explicit one-way conversions | ✅ Implemented |
| **Error handling at adapter boundaries** | Domain errors (`DomainError` subclasses) caught at CLI/API layers and converted to user messages | ✅ Implemented |

### Testing Strategy

| Decision | Rationale | Status |
| --- | --- | --- |
| **Unit tests per rule function** | Each calculation rule (profit factor, lore state, etc.) has isolated unit tests | ✅ Implemented |
| **Property-based tests with Hypothesis** | Statistic tests verify invariants (e.g., PF always ≥ 0) across random inputs | ✅ Implemented |
| **Integration tests with in-memory DB** | Repositories tested against SQLite `:memory:` database | ✅ Implemented |
| **API tests with Starlette TestClient** | FastAPI routes tested via `TestClient` (requires `httpx2` dependency) | ✅ Implemented & Passing |

### Database & Persistence

| Decision | Rationale | Status |
| --- | --- | --- |
| **SQLAlchemy 2.0 ORM** | Modern, type-safe, supports declarative models | ✅ Implemented |
| **Separate ORM models** | Not mixing SQLAlchemy columns directly with Pydantic — explicit mapping layer | ✅ Implemented |
| **Foreign key constraints enforced** | `ON DELETE CASCADE` for Modifier→Colony, nullable FK for Colony→Representative | ✅ Implemented |
| **Database migrations (manual)** | No Alembic in V1; schema created from ORM models on startup | ✅ Implemented |

---

## Part 3: Open Questions & Decisions Needed

### High Priority (Blocking features or tests)

| Question | Context | Impact | Status |
| --- | --- | --- | --- |
| **Hard Infrastructure — is it actually implemented in the codebase, or is Part 9's "Phase 4b complete" note stale?** | This document contradicts itself (see Part 1, Section G note). Must be checked against `domain/models/` and `domain/rules/` before Phase 5 dev starts, so the work is scoped correctly (build vs. reconcile) | High — determines whether Phase 5 Hard Infrastructure work is new or a gap-fix | 🟡 NEEDS VERIFICATION |
| **Where does Colony Size increase get triggered in the app today?** | Needed to hook `pending_infrastructure_growth = True` at the right point (CLI command? application service?) | Medium — blocks US-9 implementation until located | 🟡 NEEDS ANSWER |

### Medium Priority (Nice-to-have, affects UX)

| Question | Context | Impact | Status |
| --- | --- | --- | --- |
| **Event system: pending roll indicators?** | Roll intervals are global config (60/90 days). App can display "next roll in X days" but no automatic notifications | Low — display-only, no enforcement | ✅ IMPLEMENTED in Phase 4 |
| **Modifier expiry/duration?** | GM custom modifiers are toggled via `is_active`, but no automatic time-based expiry. User mentioned "temporary" bonuses. | Low — manual toggle sufficient for now | ⏳ DEFERRED to Phase 5 |
| **Representative Type mechanical bonus wiring?** | ~~Type field exists per reference sheet but its mechanical link to PF isn't wired.~~ | Low | ✅ RESOLVED: Type is descriptive-only by design, see Part 1 Section F |
| **Personality mechanical effects?** | ~~Personality list exists but mechanics not yet wired to any calculations~~ | Low | ✅ RESOLVED: 18/19 wired, see Part 1 Section F and Part 10 |
| **Skills/Talents mechanical effects?** | Modeled as reference-only (not affecting calculations) per spec. Intentional or future scope? | Low — intentional for V1 | ✅ CONFIRMED |
| **Infrastructure shortage mechanic (`Colony_Sheet_Analysis.md` §15)?** | No confirmed rulebook source; Excel's own correctness already in question | Low — excluded from V1 | ⏳ TO BE DISCUSSED WITH GM |

### Low Priority (Refinement, doesn't block shipping)

| Question | Context | Impact | Status |
| --- | --- | --- | --- |
| **Should mypy strict mode be relaxed for tests?** | Currently strict=true for all src/ (and implicitly tests/). May create friction during rapid development | Very Low — code quality tradeoff | ⏳ DECISION PENDING |
| **CLI command naming convention?** | Currently `colony create`, `colony show`, `colony add-modifier`. Alternative patterns (e.g., `create-colony`)? | Very Low — cosmetic | ✅ IMPLEMENTED |
| **Should Age display breakdown (years/months/days_remainder) be API fields?** | Currently computed but only available via calculation, not stored or returned | Very Low — minor UX | ⏳ DECISION PENDING |
| **Config file locations: where should YAML files live in production?** | Currently relative to project root; should be configurable via environment variable? | Very Low — deployment concern | ⏳ DECISION PENDING |

---

## Part 4: Known Limitations & Caveats

### V1 Limitations (by design)

- ❌ Hard Infrastructure not implemented (build/operational states, partial capacity, stat bonuses)
- ❌ Event system logic beyond config (no pending/upcoming roll indicators, no auto-triggers)
- ❌ Colony Type not changeable post-creation (outside testing)
- ❌ Skills/Talents mechanics not wired (reference-only, intentional)
- ✅ Personality mechanics wired (18/19 traits; Administrative Expert excluded as conditional) — see Part 1 Section F
- ❌ Modifier duration/expiry (manual via `is_active`)

### Phase 3b Limitations (by design)

- ⚠️ Infrastructure type defined but calculation rules not implemented
- ❌ Hard Infrastructure build states not implemented
- ✅ Support Upgrades: fully implemented
- ✅ Planetary Resources: fully implemented
- ✅ State effects: fully implemented

### Current Implementation Issues

- ✅ **All API tests passing** — Infrastructure and Support Upgrades endpoints working
- ✅ **All IO round-trip tests passing** — export/import working correctly
- ✅ **Domain layer complete** — all core logic working
- ✅ **Persistence layer complete** — database round-trip works
- ✅ **CLI complete** — all commands working
- ✅ **All tests passing** — 100% pass rate

---

## Part 5: Next Steps (Recommended Priority)

### Immediate (all blockers resolved)

✅ All critical test failures resolved — system ready for Phase 4b development

### Short-term (improvements)

1. **Run type checker** — `uv run mypy src/` to catch any type violations
2. **Run linter** — `uv run ruff check src/` for style issues
3. **Run formatter** — `uv run ruff format src/` for consistency

### Medium-term (Phase 4b)

1. **Implement Hard Infrastructure calculation rules** — state transitions, operational costs
2. **Add event system queries** — "is a roll due?", "upcoming rolls" endpoints
3. **Implement modifier expiry logic** — automatic time-based removal

### Long-term (Phase 5+)

1. **Wire Representative Type bonuses** — mechanical link to PF or other stats
2. **Wire Personality effects** — calculate bonuses based on assigned personalities
3. **Add user authentication** — API security if deployed publicly
4. **Add data export formats** — CSV, PDF reports for GMs

---

## Part 6: Assumptions & Rationale

| Assumption | Reason | Revisit if... |
| --- | --- | --- |
| Representative can be referenced by multiple Colonies | Mechanically possible (not meaningful lore-wise, but allowed) | Game rules explicitly forbid sharing Representatives |
| Deleting a Representative clears FK, not Colonies | Reasonable default (alternative: block deletion if referenced) | Preference is to block deletion instead |
| All round-half-up, not banker's rounding | Matches Excel/standard game rules | Game uses different rounding for specific cases |
| `event_roll_interval_days` and `development_roll_interval_days` are per-colony, not global | You described as "configurable" without specifying scope | Should be global config instead |
| Support Upgrades checked against `base_size`, not `actual_size` | Cleaner rule (immutable), but validate if game uses `actual_size` | Game actually uses calculated size |
| Infrastructure rules deferred to Phase 4b | Out of scope for Phase 3b | Needed sooner (would require reordering) |

---

## Part 7: Config Data Checklist

All config data **marked as complete** below has placeholder entries in YAML files.
For production, these need to be validated against the reference Excel workbook.

### ✅ Completed Config

- [x] Colony Types (Ecclesiastical, Agricultural, Mining, Industrial, Research Mission, Mining & Industrial, Shrine World, Fortress World, Paradise World)
- [x] Base stats per type (Complacency, Order, Productivity, Piety, Size)
- [x] Size → base Profit Factor lookup table
- [x] Leadership Modifier lookup (stat bonus 0-9+ → modifier -3 to +3)
- [x] Lore state threshold labels (Stable, Placated, Anarchy, Productive, Halted, Pious, Heretical)
- [x] Representative Types (Satrap, Judge, Cardinal, Colonist Representative, Military Commander)
- [x] Personality types (with descriptions and effects) — full effect table now defined, see Part 10
- [ ] Representative Type special trait descriptions (display-only text, Phase 5)
- [x] Support Upgrade types (13 types with per-type limits)
- [x] Planetary Resource types (8 resources with bonus rules)
- [x] Upgrade limit validation rules\n- [x] Infrastructure types and rules (5 types with working/disrupted modifiers) — ⚠️ verify against actual codebase, see High Priority open question in Part 3
- [x] Event/Development roll interval configuration (60/90 days)
- [x] Modifier expiry support (optional expires_at date with auto-filtering)

### ⏳ Deferred (Phase 5+)

- [ ] Colony special ability descriptions and mechanical triggers
- [ ] Event roll table (outcomes of 60/90-day rolls) — GM-defined events only

---

## Part 8: Code Quality & Testing Metrics

| Metric | Target | Current | Status |
| --- | --- | --- | --- |
| Test coverage (domain) | 95%+ | ~100% | ✅ Excellent |
| Test coverage (application) | 90%+ | ~95% | ✅ Excellent |
| Test coverage (adapters) | 85%+ | ~85% | ✅ Good |
| Tests passing | 100% | 100% | ✅ All tests passing |
| Type checking | strict | Configured | ✅ Complete |
| Linting rules | ruff default | Configured | ✅ Complete |
| Code formatting | ruff format | Configured | ✅ Complete |

---

## Part 9: Communication Log

**Last clarifications from user:**

- ✅ Representative independence confirmed
- ✅ Modifier type-by-source architecture confirmed
- ✅ Phase 3b scope (Support Upgrades, Resources) confirmed
- ✅ State effects rules confirmed
- ✅ Ecclesiastical/Agricultural/Mining/Research bonuses confirmed
- ✅ Pydantic field alias usage (`description` vs `modifier_description`) confirmed
- ✅ Enum type usage in tests confirmed (use `ModifierSourceType.GM_CUSTOM` not string literals)

**Outstanding clarifications needed:**

- ~~🟡 Whether Hard Infrastructure rules should be implemented before Phase 4b~~ ✅ RESOLVED: Implemented in Phase 4b
- ~~🟡 Preference for per-colony vs. global config for roll intervals~~ ✅ RESOLVED: Global config with per-colony override

**Recently Resolved:**

- ✅ **All Pylance errors fixed** — tests now use proper enum types and field aliases
- ✅ **All SonarQube warnings fixed** — constants defined for duplicated literals, monkeypatch used for env vars
- ✅ **All test failures resolved** — 100% pass rate achieved
- ✅ **CORSSettings edge case fixed** — empty string now returns default localhost origins
- ✅ **Phase 4b complete** — Hard Infrastructure rules, modifier expiry, and roll status endpoints implemented
  (⚠️ **unverified against codebase** — flagged 2026-08-23, see Part 1 Section G and Part 3 High Priority)

---

## Part 10: Reference Tables — Personality & Hard Infrastructure (Phase 5)

Source: rulebook text provided directly by the user (2026-08-23), not derived from the
Excel workbook. Intended for `config/personalities.yaml` and `config/infrastructure.yaml`.

### 10.1 Personality Effects

| Personality | Effect(s) | Input required |
| --- | --- | --- |
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
| Mad | +1 Complacency, +1 Piety, +1 Productivity, −[roll] Order | roll (1d5), unset = 0 |
| Ties With… | +1 to [chosen stat] | GM choice (Complacency/Order/Productivity/Piety), unset = 0 |
| Scholarly | +1 to [chosen stat] | GM choice — **simplified from rulebook's auto-pick-lowest-at-install rule**, unset = 0 |
| Administrative Expert | +2 Productivity **if** Order > Size | ⛔ Excluded from V1 — conditional, see Part 1 Section F |

### 10.2 Hard Infrastructure Effects

| Type | Working | Disrupted |
| --- | --- | --- |
| Transportation | +1 Productivity, +1 Complacency | −2 Productivity, −2 Order |
| Power Network | +2 Productivity | −3 Productivity, −1 Complacency |
| Water Management | +1 Order, +1 Complacency | −2 Order, −2 Complacency |
| Food Production and Distribution | +1 Productivity, +1 Complacency | −2 Productivity, −2 Complacency |
| Communications | +1 Productivity, +1 Order | −2 Productivity, −2 Order |

All values unconditional per-instance modifiers, netted across however many instances of
each type a Colony has (working vs. disrupted counted separately), same aggregation
pattern as Support Upgrades.

**2026-08-23 session — Representative Mechanics & Hard Infrastructure (Phase 5) requirements defined:**

- ✅ Representative Type mechanical bonuses resolved: descriptive-only, never a modifier source (rulebook text for Satrap/Judge/Cardinal/Colonist Representative/Military Commander provided by user, sourced from actual game material, not Excel)
- ✅ Personality mechanics resolved: full 19-trait rulebook text provided by user; 18 in scope for V1 (see Part 10), Administrative Expert deferred as conditional
- ✅ Personality assignment rules confirmed: 1..N per Representative, no duplicate trait assignment, minimum 1 required
- ✅ Scholarly's auto-pick-lowest-stat rule deliberately simplified to GM manual choice (same mechanism as Ties With…)
- ✅ Mad's `-1d5 Order` roll handled via manual GM input, unset = 0 — consistent with existing dice-injection principle
- ✅ Hard Infrastructure requirements defined: starting infrastructure folded into `ColonyType` base stats (not modeled as instances); unlimited instances per type during play; no build-order validation; growth-triggered Complacency penalty surfaced via `pending_infrastructure_growth` flag but not auto-calculated (GM applies `gm_custom` modifier manually)
- ⏳ Infrastructure "shortage" mechanic (`Colony_Sheet_Analysis.md` §15) marked To Be Discussed With GM — no rulebook source, not yet raised with the group
- 🟡 **Flagged, not resolved:** contradictory documentation about whether Hard Infrastructure is already implemented (Part 4 vs. Part 5 vs. Part 9) — needs a codebase check before Phase 5 work is scoped
- 🟡 **Flagged, not resolved:** exact location in the app where Colony Size increase is currently triggered — needed to wire the new growth flag
