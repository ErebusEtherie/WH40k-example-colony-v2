# Implementation Plan — Rogue Trader Colony Manager (V1 Prototype)

**Audience:** an LLM coding agent, working alongside `business_analysis.md`,
`architecture_phase_1.md`, and the `.clinerules/` rule set. This plan is the
sequencing layer — it tells the agent *what order* to build things in and
*what "done" looks like* at each step. It does not repeat rules already
stated elsewhere; it references them.

**Before starting any phase, read (in this order):** `.clinerules/*.md`
(all files), `business_analysis.md`, `architecture_phase_1.md`. If a step
below conflicts with any of those, stop and ask — do not silently resolve
the conflict (per `06-collaboration-and-uncertainty.md`).

**Configuration status:**
All game rule data (colony types, personalities, leadership modifiers, lore-state labels, infrastructure rules) has been confirmed and implemented in YAML config files. No placeholders remain\

---

## Current Status (Updated: 2026-08-20)

**Completed Phases:**

- ✅ **Phase 0** — Environment Setup
- ✅ **Phase 1** — Folder Structure  
- ✅ **Phase 2** — Domain Layer (all models, rules, ports)
- ✅ **Phase 3** — Config Schemas & Loader
- ✅ **Phase 3b** — State Effects & Special Rules
- ✅ **Phase 4** — Application Layer (all services)
- ✅ **Phase 4a** — Hard Infrastructure Module (Infrastructure, SupportUpgrade, Resource models + services)
- ✅ **Phase 5** — Persistence Adapter (SQLite repositories)
- ✅ **Phase 6** — Import/Export Adapter (JSON/YAML)
- ✅ **Phase 7** — API Adapter (FastAPI with JWT auth)
- ✅ **Phase 8** — CLI Adapter (Typer-based CLI)
- ✅ **Phase 9** — Tooling & Final Checks (ruff, mypy, full test suite)

**Test Coverage:**

- Domain tests: 40 passed (includes hypothesis property tests for stat/profit/size calculators)
- Application tests: 34 passed
- Adapter tests: 114+ passed (config/persistence/io + 80 API tests + 3 CLI tests)
- **Total: 188+ tests passing**

**Code Quality:**

- ✅ Ruff: All checks passed
- ✅ Mypy: All checks passed (import-untyped suppressed for PyYAML)

**Code Review Fixes Applied:**

1. ✅ Added hypothesis property-based tests for stat calculator, profit factor calculator, and size calculator invariants
2. ✅ Refactored `ColonyService` to add `get_colony()` method, updated router to use it
3. ✅ Standardized exception handling across all routers (NotFoundError→404, ValidationError→400, with `from e` chaining)
4. ✅ Moved CLI hardcoded base stats to config loading via `rule_config_provider`
5. ✅ Added infrastructure integration tests showing working/disrupted state effects

**Remaining Work:**

- **Phase 5 Gaps:** Representative Personality mechanics (Mad roll, Scholarly/Ties chosen_stat) and `pending_infrastructure_growth` flag — tracked in `implementation_plan_phase_5.md`
- **Phases 6-12:** Excel migration, skills/talents effects, frontend dashboard, event automation, audit logging, real-time collaboration, DevOps — tracked in `implementation_plan_phases_6-12.md`

---

---

## Phase 0 — Environment Setup

- [ ] Confirm `uv` is available (`uv --version`); if not, stop and ask —
      don't silently fall back to `pip`/`venv`, since the technical
      analysis specifically chose `uv`.
- [ ] `uv init --python 3.12 colony_manager` (or equivalent inside an
      already-created repo — adjust if a git repo already exists at the
      target location).
- [ ] `git init` if not already a repository. Add a `.gitignore` covering:
      `__pycache__/`, `*.pyc`, `.venv/`, `.mypy_cache/`, `.ruff_cache/`,
      `.pytest_cache/`, `*.db`, `.env`.
- [ ] Create `pyproject.toml` with the dependency list from
      `architecture_phase_1.md` §6 (main deps: pydantic, pydantic-settings,
      sqlalchemy, pyyaml, typer; dev deps: pytest, hypothesis, ruff, mypy).
- [ ] Add `[tool.ruff]` and `[tool.mypy]` sections to `pyproject.toml`
      with reasonable defaults (line length 100, `strict = true` for
      mypy on `src/`, exclude `tests/` from strict mode if it creates
      excessive friction — flag this choice rather than deciding silently
      if it comes up).
- [ ] `uv sync` — confirm the environment installs cleanly before
      proceeding.
- [ ] **Checkpoint:** `uv run python -c "import pydantic, sqlalchemy,
      typer; print('ok')"` succeeds.

---

## Phase 1 — Folder Structure

Create the full directory tree from `architecture_phase_1.md` §2, empty
except for `__init__.py` files where needed for Python packages:

- [ ] `src/colony_manager/{domain,application,adapters}/` and their
      subpackages exactly as listed in §2.
- [ ] `config/` with three empty placeholder files: `colony_types.yaml`,
      `rule_tables.yaml`, `personalities.yaml` (content comes in Phase 3).
- [ ] `tools/` with an empty `excel_migration.py` (stub — implementation
      is a later, separate task, not part of this plan).
- [ ] `tests/{domain,application,adapters}/` mirroring `src/`.
- [ ] `README.md` — brief project description, link to the three
      analysis/plan documents, and setup instructions (`uv sync`,
      `uv run pytest`).
- [ ] **Checkpoint:** `uv run python -c "import colony_manager"` succeeds
      (empty package, but importable).

---

## Phase 2 — Domain Layer

Build in this order — each item only depends on the ones before it:

- [ ] `domain/errors.py` — exception hierarchy from `architecture_phase_1.md`
      §3.5.
- [ ] `domain/util/rounding.py` — `round_half_up`, fully implemented (it's
      simple and fully specified, no placeholders needed).
- [ ] `domain/enums.py` — all enums from §3.1, exactly as specified. Note
      the `LoreState` enum has a comment flagging incomplete labels —
      leave that comment in place.
- [ ] `domain/models/modifier.py` — `Modifier` model, §3.2.
- [ ] `domain/models/representative.py` — `RepresentativeStats`,
      `Personality`, `Skill`, `Talent`, `Representative`, §3.2.
- [ ] `domain/models/colony.py` — `Colony` model, §3.2 **as revised in
      §3.6** (`representative_id: int | None`, no embedded
      `Representative`).
- [ ] `domain/ports/colony_repository.py` — `ColonyRepository` Protocol,
      §3.4.
- [ ] `domain/ports/representative_repository.py` —
      `RepresentativeRepository` Protocol, §3.6.
- [ ] `domain/ports/rule_config_provider.py` — `RuleConfigProvider`
      Protocol, §3.4. Add whatever additional methods the rule functions
      below turn out to need (e.g. a lore-state threshold lookup) — the
      version in the technical analysis may not be complete; extend it
      as required rather than working around a missing method.
- [ ] `domain/rules/stat_calculator.py` — `calculate_stat`, §3.3, exactly
      as specified.
- [ ] `domain/rules/size_calculator.py` — same shape as `stat_calculator`,
      restricted to `ModifierStat.SIZE`, per `business_analysis.md` §4.3.
- [ ] `domain/rules/leadership_modifier_resolver.py` — implements
      `business_analysis.md` §4.5's leadership modifier lookup
      (`max(int_bonus, per_bonus, fel_bonus)` → table lookup via
      `RuleConfigProvider`).
- [ ] `domain/rules/profit_factor_calculator.py` — `calculate_profit_factor`,
      §3.3, exactly as specified (zero-forcing priority, then halving,
      round-half-up).
- [ ] `domain/rules/lore_state_resolver.py` — implements
      `business_analysis.md` §4.4's threshold table. **The two unconfirmed
      labels are a hard blocker for this specific file** — write the
      function with the confirmed labels (Placated, Stable, Productive,
      Halted, Pious, Heretical, Anarchy) and raise
      `NotImplementedError` with a clear message for the two unconfirmed
      cases rather than guessing a label. Flag this prominently when the
      phase completes.

**Tests, written alongside each rule file (not deferred to a later
phase)** — per `04-testing-strategy.md`'s risk-based prioritization:

- [ ] `tests/domain/rules/test_stat_calculator.py` — example-based +
      hypothesis property tests (stats never negative regardless of
      stacked penalties; sum of active modifiers matches expectation;
      inactive modifiers ignored).
- [ ] `tests/domain/rules/test_size_calculator.py` — same shape.
- [ ] `tests/domain/rules/test_profit_factor_calculator.py` — example
      tests for the documented boundary cases from
      `business_analysis.md` (Order == 0 → PF forced to 0 regardless of
      other inputs; Productivity == 0 → halved with round-half-up;
      neither condition → raw sum), plus hypothesis properties (PF never
      negative; Order == 0 always wins even when Productivity == 0 too).
- [ ] `tests/domain/rules/test_leadership_modifier_resolver.py`.
- [ ] `tests/domain/util/test_rounding.py` — confirms `round_half_up`
      against the documented example (1.5 → 2) and a few more cases
      (2.5 → 3, 0.5 → 1, negative inputs if relevant).
- [ ] `tests/domain/models/` — validator tests for `Colony` (age
      non-negative) and `Representative` (stats > 0, at least one
      personality required).

- [ ] **Checkpoint:** `uv run pytest tests/domain/ -v` passes, with the
      one expected `NotImplementedError`-related test for lore state
      clearly marked `xfail` or skipped with a reason, not silently
      passing.

---

## Phase 3 — Config Schemas & Loader

- [ ] `adapters/config/schemas.py` — Pydantic models for the three config
      files: colony type entries (name, base stats, base size, resource
      exploit bonus per `business_analysis.md` §6), the PF-by-size table,
      the leadership modifier table, and the lore-state threshold labels.
- [ ] Populate `config/colony_types.yaml`, `config/rule_tables.yaml`,
      `config/personalities.yaml` with complete game data (all 9 colony
      types, full lookup tables, all personalities with effects).
      **Status:** ✅ Complete — all config files populated with confirmed data.
- [ ] `adapters/config/loader.py` — loads and validates the YAML files
      against the schemas, raises `ConfigurationError` (not a raw
      exception) on invalid/missing config, and implements
      `RuleConfigProvider`.
- [ ] `tests/adapters/config/test_loader.py` — valid config loads
      correctly; missing file raises `ConfigurationError`; malformed
      entry raises `ConfigurationError` with a useful message.
- [ ] **Checkpoint:** `uv run pytest tests/adapters/config/ -v` passes.

---

## Phase 4 — Application Layer

- [ ] `application/services/colony_state_calculator.py` —
      `ColonyStateCalculator` class, §4, calling the Phase 2 rule
      functions in the correct order (size → four stats → leadership
      modifier → profit factor → lore states) and assembling
      `CalculatedColonyState`.
- [ ] `application/services/colony_service.py` — `ColonyService`, §4:
      `create_colony`, `update_age` (must set `age_last_updated`
      automatically per `business_analysis.md` §4.1), `add_modifier`,
      `get_state`.
- [ ] `application/services/representative_service.py` — mirrors
      `ColonyService` for Representative CRUD, stat/skill/talent/
      personality management, and assigning/clearing a Representative on
      a Colony (`colony.representative_id`).
- [ ] `tests/application/` — test orchestration and error handling (e.g.
      `update_age` on a nonexistent colony raises `ColonyNotFoundError`;
      `create_colony` correctly pulls base stats from the colony type
      config). Use fake in-memory implementations of `ColonyRepository`/
      `RepresentativeRepository`/`RuleConfigProvider` for these tests —
      not the real SQLite adapter (that's covered separately in Phase 5).
- [ ] **Checkpoint:** `uv run pytest tests/application/ -v` passes.

---

## Phase 5 — Persistence Adapter

- [ ] `adapters/persistence/orm_models.py` — SQLAlchemy 2.0 declarative
      models: `ColonyORM`, `RepresentativeORM`, `ModifierORM`. Schema per
      `architecture_phase_1.md` §5.1/§3.6: `modifiers.colony_id` FK with
      `ON DELETE CASCADE`; `colonies.representative_id` nullable FK, no
      cascade in either direction.
- [ ] `adapters/persistence/db.py` (or `session.py`) — engine/session
      setup, using `pydantic-settings` for the DB file path.
- [ ] `adapters/persistence/mappers.py` — explicit
      `orm_to_domain`/`domain_to_orm` functions for both Colony and
      Representative. No implicit `.model_dump()`/`.model_validate()`
      matching between unrelated models, per `03-persistence-and-io.md`.
- [ ] `adapters/persistence/colony_repository_impl.py` — implements
      `ColonyRepository`.
- [ ] `adapters/persistence/representative_repository_impl.py` —
      implements `RepresentativeRepository`.
- [ ] `tests/adapters/persistence/` — round-trip tests against an
      in-memory SQLite DB (`sqlite:///:memory:`): save then get returns
      an equivalent domain object; deleting a Colony cascades its
      Modifiers but leaves a referenced Representative untouched;
      deleting a Representative clears the referencing Colony's
      `representative_id` (per the default agreed in
      `architecture_phase_1.md` §3.6).
- [ ] **Checkpoint:** `uv run pytest tests/adapters/persistence/ -v`
      passes.

---

## Phase 6 — Import/Export Adapter

- [ ] `adapters/io/save_file_schema.py` — `ColonySaveFile` Pydantic
      schema for the portable JSON/YAML format, separate from both the
      domain model and the ORM model.
- [ ] `adapters/io/mappers.py` — explicit mapping functions, same
      principle as Phase 5.
- [ ] `adapters/io/colony_exporter.py` / `colony_importer.py` — read/write
      a save file given a `Colony` (+ its `Modifier`s and, if present, its
      `Representative`).
- [ ] `tests/adapters/io/` — round-trip tests (export then import returns
      an equivalent domain object); malformed file raises a clear error.
- [ ] **Checkpoint:** `uv run pytest tests/adapters/io/ -v` passes.

---

## Phase 8 — CLI Adapter ✅ COMPLETE

- [x] `adapters/cli/main.py` — Typer app wiring together the config
      loader, repositories, and application services. Minimum command
      set for V1: `colony create`, `colony show <id>`, `colony
      add-modifier <id>`, `colony set-age <id> <days>`, `colony save <id>
      --to <file>`, `colony load <file>`, `representative create`,
      `representative assign <colony_id> <representative_id>`.
- [x] Errors from `DomainError` subclasses are caught at the CLI boundary
      and printed as clean user-facing messages, not raw tracebacks.
- [x] **Tests:** 3 CLI tests passing in `tests/adapters/cli/test_cli.py`

---

## Phase 9 — Tooling & Final Checks ✅ COMPLETE

- [x] `ruff check src/ tests/` — clean (115 errors fixed, 4 rules ignored as appropriate for FastAPI pattern)
- [x] `mypy src/` — clean (import-untyped suppressed for PyYAML)
- [x] `pytest` (full suite) — 180 tests passing
- [x] Updated `implementation_plan.md` with completion status

---

## Definition of Done for V1

- ✅ Colony and Representative can be created, calculated, persisted to
  SQLite, and exported/imported as JSON/YAML, all via the CLI.
- ✅ All rule engine calculations (stats, size, PF, leadership modifier) are
  covered by the tests described in Phase 2, matching
  `business_analysis.md` §4 exactly.
- ✅ All configuration data (colony types, personalities, leadership modifiers,
  lore-state thresholds, infrastructure rules, support upgrades, resources,
  PF-by-size table) is implemented in YAML config files — no placeholders remain.
- ✅ Hard Infrastructure module (Phase 4a) complete: Infrastructure, SupportUpgrade,
  and Resource models with working/disrupted state tracking and stat modifiers.
- ✅ All lore-state labels implemented (Placated, Locked, Anarchy, Orderly,
  Pious, Heretical) per `business_analysis.md` §4.6.
- ✅ API layer complete with JWT authentication, full CRUD endpoints for all
  domain entities, and proper error handling.
- ✅ CLI layer complete with all V1 commands for colony management.
- ✅ 188+ tests passing across domain, application, and adapter layers.
- ✅ Code quality checks passing (Ruff, Mypy).
- ✅ Documentation consolidated and up-to-date (see `docs/README.md`).

**Out of Scope for V1** (tracked for Phase 4+ in `api_future_phase_4.md`):

- Event system (immutable event log, triggers, resolution)
- Audit log / version history
- Real-time collaboration (WebSocket/SSE notifications)
- Advanced export/import (PDF, image export, Excel migration tool)
- User feedback mechanism
- Analytics tracking
