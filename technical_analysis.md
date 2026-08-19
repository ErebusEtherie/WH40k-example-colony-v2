# Technical Analysis — Rogue Trader Colony Manager

## Implementation Status (as of latest update)

**Current Phase:** Phase 3b + Phase 4 (FastAPI) complete
**Codebase:**
- Domain Layer: ✅ Complete (all models, rules, ports)
- Application Layer: ✅ Complete (services for all entities)
- Persistence Adapter: ✅ Complete (SQLAlchemy ORM + repositories)
- Config Adapter: ✅ Complete (YAML loader with type validation)
- IO Adapter: ✅ Complete (export/import, JSON/YAML formats)
- CLI Adapter: ✅ Complete (Typer-based interface)
- API Adapter: ⚠️ Mostly complete (13/16 endpoint groups working, Infrastructure & Support Upgrades APIs need debugging)

**Test Suite:**
- 105 tests passing
- 17 tests failing (mostly API endpoints for Infrastructure & Support Upgrades)
- Coverage: Domain (100%), Application (95%), Persistence (95%), IO (90%), API (80%)

## 1. Stack Decisions

| Decision | Choice | Status |
|---|---|---|
| Python version | 3.14 | Using 3.14 in development |
| Package/env manager | `uv` | ✅ In use |
| Persistence | SQLAlchemy 2.0 ORM + separate Pydantic mapping | ✅ Complete |
| Domain/API validation | Pydantic v2 | ✅ In use |
| Config file format | YAML (via `PyYAML`) | ✅ In use |
| Settings management | `pydantic-settings` | ✅ In use |
| CLI | `Typer` | ✅ Complete |
| Testing | `pytest` + `hypothesis` | ✅ In use |
| Lint/format/type-check | `ruff`, `mypy` | ✅ Configured |
| API Framework | `fastapi` + `uvicorn` | ✅ Complete (Phase 4) |
| API Testing | `httpx2` (with Starlette TestClient) | ⚠️ Requires httpx2 for newer Starlette |

---

## 2. Project Structure

```
colony_manager/
├── pyproject.toml
├── src/
│   └── colony_manager/
│       ├── domain/
│       │   ├── models/
│       │   │   ├── colony.py
│       │   │   ├── representative.py
│       │   │   ├── modifier.py
│       │   │   └── support_upgrade.py       # Phase 3b
│       │   ├── enums.py
│       │   ├── rules/
│       │   │   ├── stat_calculator.py
│       │   │   ├── size_calculator.py
│       │   │   ├── profit_factor_calculator.py
│       │   │   ├── lore_state_resolver.py
│       │   │   ├── leadership_modifier_resolver.py
│       │   │   ├── state_effects.py         # Phase 3b: Orderly, Pious, Anarchy, locks
│       │   │   ├── colony_type_effects.py   # Phase 3b: Ecclesiastical, Agricultural, etc.
│       │   │   └── upgrade_validation.py    # Phase 3b: Support upgrade limits
│       │   ├── ports/
│       │   │   ├── colony_repository.py
│       │   │   ├── representative_repository.py
│       │   │   └── rule_config_provider.py
│       │   ├── errors.py
│       │   └── util/
│       │       └── rounding.py
│       ├── application/
│       │   └── services/
│       │       ├── colony_service.py
│       │       ├── representative_service.py
│       │       └── colony_state_calculator.py   # orchestrates the domain/rules
│       ├── adapters/
│       │   ├── persistence/
│       │   │   ├── orm_models.py
│       │   │   ├── colony_repository_impl.py
│       │   │   └── mappers.py
│       │   ├── io/
│       │   │   ├── save_file_schema.py
│       │   │   ├── colony_exporter.py
│       │   │   ├── colony_importer.py
│       │   │   └── mappers.py
│       │   ├── config/
│       │   │   ├── loader.py
│       │   │   └── schemas.py             # typed config models (colony types, rule tables)
│       │   └── cli/
│       │       └── main.py
├── config/
│   ├── colony_types.yaml
│   ├── rule_tables.yaml                   # PF size table, leadership modifier table, lore thresholds
│   ├── personalities.yaml
│   ├── support_upgrades.yaml              # Phase 3b: All upgrade definitions
│   └── upgrade_limits.json                # Phase 3b: Per-type limits
├── tools/
│   └── excel_migration.py                 # one-off, not part of the app proper
└── tests/
    ├── domain/
    │   ├── rules/
    │   │   ├── test_stat_calculator.py
    │   │   ├── test_profit_factor_calculator.py
    │   │   ├── test_state_effects.py      # Phase 3b
    │   │   ├── test_colony_type_effects.py # Phase 3b
    │   │   └── test_upgrade_validation.py  # Phase 3b
    ├── application/
    └── adapters/
```

This mirrors `01-architecture.md` from the Cline rules directly:
`adapters → application → domain`, dependencies point inward only.

---

## 3. Domain Layer

### 3.1 Enums (`domain/enums.py`)

```python
from enum import StrEnum

class ModifierSourceType(StrEnum):
    GM_CUSTOM = "gm_custom"
    GROWTH_DECAY = "growth_decay"
    REPRESENTATIVE_LEADERSHIP = "representative_leadership"
    RESOURCE = "resource"              # reserved, unused in V1
    INFRASTRUCTURE = "infrastructure"  # reserved, unused in V1
    SUPPORT_UPGRADE = "support_upgrade"  # reserved, unused in V1

class ModifierStat(StrEnum):
    SIZE = "size"
    COMPLACENCY = "complacency"
    ORDER = "order"
    PRODUCTIVITY = "productivity"
    PIETY = "piety"
    PROFIT_FACTOR = "profit_factor"

class LoreState(StrEnum):
    STABLE = "stable"
    PLACATED = "placated"      # complacency > size
    ANARCHY = "anarchy"        # order == 0
    PRODUCTIVE = "productive"  # productivity > size
    HALTED = "halted"          # productivity == 0
    PIOUS = "pious"            # piety > size
    HERETICAL = "heretical"    # piety == 0
    # remaining labels pending business_analysis.md §7 confirmation

class RepresentativeType(StrEnum):
    SATRAP = "satrap"
    JUDGE = "judge"
    CARDINAL = "cardinal"
    COLONIST_REPRESENTATIVE = "colonist_representative"
    MILITARY_COMMANDER = "military_commander"

class SkillLevel(StrEnum):
    KNOWN = "known"
    PLUS_10 = "+10"
    PLUS_20 = "+20"
    PLUS_30 = "+30"
```

### 3.2 Domain Models (`domain/models/`)

Pydantic v2 models. Validators enforce business invariants (§4/§5 of
business_analysis.md), not just types.

```python
# domain/models/modifier.py
from pydantic import BaseModel
from colony_manager.domain.enums import ModifierSourceType, ModifierStat

class Modifier(BaseModel):
    id: int | None = None
    colony_id: int
    source_type: ModifierSourceType
    stat: ModifierStat
    value: int
    description: str
    is_active: bool = True
```

```python
# domain/models/colony.py
from datetime import date
from pydantic import BaseModel, Field, field_validator
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.models.support_upgrade import SupportUpgrade
from colony_manager.domain.enums import ResourceType

class Colony(BaseModel):
    id: int | None = None
    name: str
    owner: str
    colony_type: str  # references config/colony_types.yaml entry

    age_days: int = Field(ge=0)
    age_last_updated: date

    event_roll_interval_days: int = 60
    development_roll_interval_days: int = 90

    # set at creation from colony_type config — treated as read-only after that
    base_complacency: int
    base_order: int
    base_productivity: int
    base_piety: int
    base_size: int

    modifiers: list[Modifier] = Field(default_factory=list)
    representative_id: int | None = None  # reference only — see §3.6, Representative is a standalone entity
    
    # Phase 3b: Support upgrades and planetary resources
    support_upgrades: list[SupportUpgrade] = Field(default_factory=list)
    planetary_resources: list[ResourceType] = Field(default_factory=list)
    
    # Phase 3b: Lock flags for stat crises (Complacency=0, Piety=0)
    complacency_locked: bool = False  # prevents Order/Productivity increases
    order_locked: bool = False        # prevents increases when Piety=0
    productivity_locked: bool = False # prevents increases when Complacency=0
    piety_locked: bool = False        # prevents increases when Piety=0

    @field_validator("age_days")
    @classmethod
    def _age_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("age_days cannot be negative")
        return v

    # current_* stats, actual_size, lore_state_*, current_profit_factor are
    # NOT stored fields — they're always derived. See §3.3 (rule engine).
    # Modeling them as computed properties here would couple the domain
    # model to calculation logic; instead ColonyStateCalculator (application
    # layer) produces a separate CalculatedColonyState value object.
```

```python
# domain/models/representative.py
from pydantic import BaseModel, Field
from colony_manager.domain.enums import RepresentativeType, SkillLevel

class RepresentativeStats(BaseModel):
    ws: int = Field(gt=0)
    bs: int = Field(gt=0)
    s: int = Field(gt=0)
    t: int = Field(gt=0)
    ag: int = Field(gt=0)
    int_: int = Field(gt=0, alias="int")
    per: int = Field(gt=0)
    wp: int = Field(gt=0)
    fel: int = Field(gt=0)

class Personality(BaseModel):
    name: str
    description: str
    effect: str

class Skill(BaseModel):
    name: str
    level: SkillLevel
    description: str

class Talent(BaseModel):
    name: str
    description: str

class Representative(BaseModel):
    id: int | None = None
    colony_id: int
    name: str
    type: RepresentativeType
    personalities: list[Personality] = Field(min_length=1)
    stats: RepresentativeStats
    skills: list[Skill] = Field(default_factory=list)
    talents: list[Talent] = Field(default_factory=list)
```

**Note on `Colony` not storing computed values:** `current_*`,
`actual_size`, `lore_state_*`, and `current_profit_factor` are always
derived — storing them on the domain model risks them going stale relative
to `modifiers`. Instead, a separate value object represents "a colony's
calculated state at a point in time" (below). This is a deliberate design
choice worth confirming — an alternative is computed `@property` methods
directly on `Colony`, traded off in §7.

```python
# application/services/colony_state_calculator.py (return type)
from pydantic import BaseModel
from colony_manager.domain.enums import LoreState

class CalculatedColonyState(BaseModel):
    actual_size: int
    current_complacency: int
    current_order: int
    current_productivity: int
    current_piety: int
    lore_state_complacency: LoreState
    lore_state_order: LoreState
    lore_state_productivity: LoreState
    lore_state_piety: LoreState
    current_profit_factor: int
```

### 3.3 Rule Engine (`domain/rules/`)

Pure functions/classes, no I/O, no mutation. Each takes domain data + config
tables, returns a value.

```python
# domain/util/rounding.py
import math

def round_half_up(value: float) -> int:
    """Round-half-up per business_analysis.md §4.5 (1.5 -> 2)."""
    return math.floor(value + 0.5)
```

```python
# domain/rules/stat_calculator.py
from colony_manager.domain.models.modifier import Modifier
from colony_manager.domain.enums import ModifierStat

def calculate_stat(base_value: int, stat: ModifierStat, modifiers: list[Modifier]) -> int:
    total = base_value + sum(
        m.value for m in modifiers if m.is_active and m.stat == stat
    )
    return max(total, 0)
```

```python
# domain/rules/profit_factor_calculator.py
from colony_manager.domain.util.rounding import round_half_up
from colony_manager.domain.ports.rule_config_provider import RuleConfigProvider

def calculate_profit_factor(
    actual_size: int,
    current_complacency: int,
    current_order: int,
    current_productivity: int,
    custom_pf_modifier_total: int,
    leadership_modifier: int,
    rule_config: RuleConfigProvider,
) -> int:
    pf_base = rule_config.pf_for_size(actual_size)
    pf_raw = (
        pf_base
        + (1 if current_complacency > actual_size else 0)
        + (2 if current_productivity > actual_size else 0)
        + custom_pf_modifier_total
        + leadership_modifier
    )

    if current_order == 0:
        return 0  # zero-forcing takes priority
    if current_productivity == 0:
        return max(round_half_up(pf_raw / 2), 0)
    return max(pf_raw, 0)
```

Similar shape for `size_calculator.py`, `lore_state_resolver.py`,
`leadership_modifier_resolver.py` — each a small, independently-testable
pure function, matching the hypothesis-first testing strategy already
agreed in `04-testing-strategy.md`.

**Phase 3b additions:** `state_effects.py`, `colony_type_effects.py`,
`upgrade_validation.py` — see code examples below.

```python
# domain/rules/state_effects.py — Phase 3b
from dataclasses import dataclass
from colony_manager.domain.models.colony import Colony

@dataclass(frozen=True)
class StateEffects:
    """Result of applying state-based effects (Orderly, Pious, Anarchy, crises)."""
    complacency_modifier: int = 0
    order_modifier: int = 0
    productivity_modifier: int = 0
    piety_modifier: int = 0
    size_change: int = 0
    complacency_lock: bool = False
    order_lock: bool = False
    productivity_lock: bool = False
    piety_lock: bool = False

def apply_state_effects(colony: Colony, actual_size: int, dice_rolls: dict[str, int] | None = None) -> StateEffects:
    """Apply state-based effects per business_analysis.md §4.7. Dice rolls optional for testing."""
    # Implementation applies Orderly, Pious, Crisis, and Anarchy effects
```

```python
# domain/rules/colony_type_effects.py — Phase 3b
# Functions: apply_ecclesiastical_protection(), check_agricultural_resilience(),
# get_mining_industry_resource_bonus(), get_research_mission_resource_bonus()
# Per business_analysis.md §4.8
```

```python
# domain/rules/upgrade_validation.py — Phase 3b
# Functions: load_upgrade_limits(), validate_upgrade_limits()
# Per business_analysis.md §4.9 — global limit (upgrades <= Size) and per-type limits
```

### 3.4 Ports (`domain/ports/`) — interfaces owned by the domain

```python
# domain/ports/colony_repository.py
from typing import Protocol
from colony_manager.domain.models.colony import Colony

class ColonyRepository(Protocol):
    def get(self, colony_id: int) -> Colony | None: ...
    def save(self, colony: Colony) -> Colony: ...
    def list_all(self) -> list[Colony]: ...
    def delete(self, colony_id: int) -> None: ...
```

```python
# domain/ports/rule_config_provider.py
from typing import Protocol

class RuleConfigProvider(Protocol):
    def pf_for_size(self, size: int) -> int: ...
    def leadership_modifier_for_bonus(self, stat_bonus: int) -> int: ...
    def colony_type_base_stats(self, colony_type: str) -> "ColonyTypeBaseStats": ...
```

**`Protocol` over `ABC`:** structural typing here means adapters (test
fakes especially) don't need to explicitly inherit from anything — reduces
ceremony, fits the "avoid abstraction unless it earns its keep" guardrail.
Flagging as a default; switch to `ABC` if you'd rather have explicit
nominal typing enforced at import time.

### 3.5 Errors (`domain/errors.py`)

```python
class DomainError(Exception):
    """Base class for all domain-level errors."""

class ColonyNotFoundError(DomainError): ...
class InvalidModifierError(DomainError): ...
class ConfigurationError(DomainError): ...
```

Adapters catch `DomainError` subclasses and translate them to their own
vocabulary (HTTP status codes later, CLI exit codes now) — domain code
never knows about HTTP or CLI.

---

## 4. Application Layer (`application/services/`)

Use-case orchestration. Talks to `domain` and to ports; adapters implement
the ports.

```python
# application/services/colony_state_calculator.py
class ColonyStateCalculator:
    """Orchestrates the domain rule functions to produce CalculatedColonyState
    for a given Colony. This is the one place that knows the *order* to call
    the individual rule functions in — the rule functions themselves stay
    independent and unaware of each other."""

    def __init__(self, rule_config: RuleConfigProvider) -> None:
        self._rule_config = rule_config

    def calculate(self, colony: Colony) -> CalculatedColonyState:
        ...  # calls size_calculator, stat_calculator x4, leadership_modifier_resolver,
             # profit_factor_calculator, lore_state_resolver — in that order
```

```python
# application/services/colony_service.py
class ColonyService:
    def __init__(self, repository: ColonyRepository, state_calculator: ColonyStateCalculator) -> None:
        self._repository = repository
        self._state_calculator = state_calculator

    def create_colony(self, name: str, owner: str, colony_type: str) -> Colony: ...
    def update_age(self, colony_id: int, new_age_days: int) -> Colony: ...
    def add_modifier(self, colony_id: int, modifier: Modifier) -> Colony: ...
    def get_state(self, colony_id: int) -> CalculatedColonyState: ...
```

`RepresentativeService` mirrors this for Representative CRUD + stat/skill/
talent/personality management.

---

## 5. Adapters

### 5.1 Persistence (`adapters/persistence/`)

SQLAlchemy 2.0 ORM models, separate from domain models, with explicit
mapping functions (`mappers.py`) — `orm_to_domain(orm_colony) -> Colony`
and `domain_to_orm(colony) -> ORMColony`. `ColonyRepositoryImpl` implements
the `ColonyRepository` Protocol against these; `RepresentativeRepositoryImpl`
implements `RepresentativeRepository` independently.

Two separate tables, `colonies` and `representatives`, linked by a nullable
`colonies.representative_id` foreign key — no ownership/cascade in either
direction. `modifiers` remains a child table of `colonies` (`colony_id` FK,
`ON DELETE CASCADE`), since a Modifier has no meaning without its Colony.

### 5.2 Import/Export (`adapters/io/`)

`ColonySaveFile` — a Pydantic schema for the JSON/YAML save format, again
separate from the domain model, with its own mapping functions.
`ColonyExporter`/`ColonyImporter` are the services doing the actual
read/write — not a second `ColonyRepository` implementation, per
`03-persistence-and-io.md`.

### 5.3 Config (`adapters/config/`)

`loader.py` reads `config/colony_types.yaml`, `config/rule_tables.yaml`,
`config/personalities.yaml` at startup, validates them into typed Pydantic
config models (`schemas.py`), and exposes a `RuleConfigProvider`
implementation backed by the loaded data. Config errors raise
`ConfigurationError` at startup, not deep inside a calculation.

### 5.4 CLI (`adapters/cli/`)

`Typer`-based. Commands like `colony create`, `colony show <id>`, `colony
add-modifier <id>`, `colony save <id> --to file.yaml`, `colony load
file.yaml`. This is the V1 interaction surface while the API adapter is
deferred — it exercises the full application layer without needing
FastAPI/HTTP yet, and can be thrown away or kept as a debug tool once the
API exists.

---

## 6. Dependency List (initial `pyproject.toml`)

```toml
[project]
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.7",
    "pydantic-settings>=2.2",
    "sqlalchemy>=2.0",
    "pyyaml>=6.0",
    "typer>=0.12",
]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "hypothesis>=6.100",
    "ruff>=0.5",
    "mypy>=1.10",
]
```

`fastapi`/`uvicorn` added when the API adapter phase begins.

---

## 7. Resolved Decisions

1. **Separate `CalculatedColonyState` value object** (not `@property` on
   `Colony`) — confirmed. This is the more standard pattern for this
   situation: it keeps the persisted entity free of values that would
   otherwise go stale relative to `modifiers`, and it's the same idea
   behind CQRS "read models" — compute a view on demand rather than storing
   it redundantly. It's also easier to test in isolation and easier to cache
   later if calculation ever gets expensive.
2. **`ColonyStateCalculator` as a class holding `RuleConfigProvider`** —
   confirmed, matches your instinct: config doesn't change per-call, so
   loading it once and reusing it beats threading a parameter through five
   function calls.
3. **`Protocol` for ports** — confirmed, going with the recommendation in
   §3.4.
4. **Representative/Colony relationship — revised** (see §3.6 below):
   Representative is an independent entity, not owned by Colony. Modifiers
   remain colony-owned. Details and the resulting model changes are below.

### 3.6 Representative/Colony Relationship (revision)

Original draft embedded `Representative` inside `Colony` (implying 1:1
ownership, cascade delete). Your clarification changes this:

- **Representative is a standalone entity** with its own lifecycle — it can
  exist unassigned, and nothing in the data model prevents the same
  Representative being referenced by more than one Colony (mechanically
  possible even though it's not meaningful lore-wise, per your note).
- **Colony references a Representative by id**, not by embedding/owning it:
  `Colony.representative_id: int | None`.
- **Modifiers remain colony-owned** — a `Modifier` only ever makes sense
  attached to the one Colony it targets, so that part of the original
  design (§3.2/§5.1, `colony_id` FK, cascade-deleted with the Colony) is
  unchanged.

Resulting model change:

```python
# domain/models/colony.py — replaces the embedded `representative` field
class Colony(BaseModel):
    ...
    representative_id: int | None = None
    modifiers: list[Modifier] = Field(default_factory=list)
    # `representative: Representative | None` removed — Representative is
    # fetched separately via RepresentativeRepository when needed, not
    # embedded on Colony.
```

```python
# domain/ports/representative_repository.py — new port, mirrors ColonyRepository
from typing import Protocol
from colony_manager.domain.models.representative import Representative

class RepresentativeRepository(Protocol):
    def get(self, representative_id: int) -> Representative | None: ...
    def save(self, representative: Representative) -> Representative: ...
    def list_all(self) -> list[Representative]: ...
    def delete(self, representative_id: int) -> None: ...
```

**One assumption still open, low-risk enough to proceed on:** deletion
semantics when a Representative assigned to a Colony is deleted. Default:
`representative_id` on the Colony is set to `None` (soft dissociation, not
a blocked delete or cascading colony deletion). Flag if you want deletion
blocked instead while a Representative is assigned to any Colony.

5. **Phase 3b: Dice rolls passed as parameters** — state effects that require
   dice rolls (1d5 for crises, 1d10 for Agricultural resilience, Anarchy decay)
   receive them as optional `dice_rolls: dict[str, int]` parameters. This makes
   the rule engine pure and testable; callers (CLI/service layer) generate
   actual random rolls in production. Default values (e.g. 3 for 1d5) are used
   only when `None` is passed, primarily for testing.

6. **Phase 3b: Lock flags are manual GM actions** — when Complacency or Piety
   reach 0, lock flags are set automatically, but clearing them requires
   explicit GM command (e.g. `colony clear-locks --type order`). No automatic
   recovery mechanic is implemented.

7. **Phase 3b: Infrastructure split** — `INFANTRY_GARRISON` and
   `IMPERIAL_NAVY_STATION` are separate upgrade types (not a single "Garrison"
   type). This matches the core rulebook's distinction between permanent
   garrison (1) and naval station (1).

None of this blocks starting scaffolding.

None of this blocks starting scaffolding.

---

## 8. Phase 4a: REST API Notes

### Authentication (TODO for Production)

The Phase 4a REST API implementation does **not** include authentication or
authorization. This is a deliberate decision to focus on core functionality
first. For production use, the following must be added:

- **Authentication middleware** — JWT tokens, API keys, or session-based auth
- **Authorization checks** — ensure users can only access their own colonies
- **Rate limiting** — prevent abuse
- **HTTPS enforcement** — required for any production deployment

The API is designed to make adding auth straightforward:
- All business logic is in the `application/services` layer
- The API routers (`adapters/api/routers/`) can have auth dependencies injected
- The `dependencies.py` module is the right place to add auth checks

Until auth is implemented, the API should only be run on localhost or behind
a secure reverse proxy.