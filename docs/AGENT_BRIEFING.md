# Agent Briefing — WH40k Colony Manager

---

## Reading Order

1. **`.clinerules/00-overview.md`** — Project engineering rules (binding)
2. **`docs/business_analysis.md`** — Business rules & domain models (source of truth)
3. **`docs/architecture_phase_1.md`** — Technical architecture & layering
4. **`docs/implementation_plan_phase_5.md`** — Current work (Phase 5 in progress)
5. **`docs/api_guide_phase_3.md`** — Current API (implemented)
6. **`docs/api_future_phase_4.md`** — Future roadmap (not implemented)

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

- 🟡 `pending_infrastructure_growth` flag in Colony model
- 🟡 `PersonalityAssignment` model with `mad_order_roll` and `chosen_stat`
- 🟡 `special_trait_description` field in Representative model
- 🟡 Representative rules for Mad, Scholarly, Ties With... personalities
- 🟡 Colony Dashboard UI (3-panel layout)

### What's Future (Phase 6+)

- ⏳ Event system
- ⏳ Audit logs
- ⏳ Real-time collaboration
- ⏳ Development plans

---

## Key Constraints

1. **Domain logic has zero I/O** — No FastAPI, SQLAlchemy, or file access in `domain/`
2. **Game rules are data** — Rule tables in `config/*.yaml`, not code
3. **Don't abstract preemptively** — Only when used in ≥2 places with real harm
4. **When unsure, ask** — Don't assume game rules or architectural decisions

---

## Current Tasks (Phase 5)

See `implementation_plan_phase_5.md` for detailed checklist:

1. Add `pending_infrastructure_growth: bool = False` to Colony model
2. Create `PersonalityAssignment` model
3. Update `Representative.personalities` to `list[PersonalityAssignment]`
4. Add `special_trait_description` to Representative
5. Update representative_rules.py for Mad/Scholarly/Ties
6. Wire growth flag in colony_service.py
7. Build Colony Dashboard UI per `UI_PANEL_REQUIREMENTS.md`

---

## Tool Usage

- Use `read_files` to read existing code
- Use `search_codebase` to find patterns/definitions
- Use `editor` for file modifications (small chunks < 6000 chars)
- Use `run_commands` for shell commands (PowerShell on Windows)
- Use `skills` tool when a skill matches the request
- **Never invent tool names** — only use the 6 tools listed above

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
