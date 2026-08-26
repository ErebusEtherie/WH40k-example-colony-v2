# Configuration Files

This document describes all YAML configuration files used by the WH40k Colony Manager. These files contain game rule data that is loaded at startup and used throughout the application.

## Overview

All configuration files are located in the `config/` directory at the project root. They are loaded by the `RuleConfigProvider` class in `src/colony_manager/adapters/config/rule_config_provider.py`.

### Configuration Files

| File | Purpose |
|------|---------|
| `colony_types.yaml` | Defines colony types with base stats and special effects |
| `rule_tables.yaml` | Core calculation tables (PF, leadership, thresholds) |
| `infrastructure_types.yaml` | Infrastructure types and their bonuses |
| `support_upgrades.yaml` | Support upgrade types and effects |
| `representative_types.yaml` | Representative types (Judge, Cardinal, Satrap) |
| `personalities.yaml` | Representative personality traits |

---

## colony_types.yaml

Defines the available colony types, their base stats, and special effects.

### Structure

```yaml
- name: "research_mission"
  display_name: "Research Mission"
  description: "Founded to study notable flora, fauna, or ancient ruins..."
  initial_investment_pf: "1d5+2"
  base_stats:
    size: 1
    complacency: 2
    productivity: 1
    order: 1
    piety: 1
  special_effects:
    - name: "resource_experts"
      description: "When exploiting Organic Compounds..."
      resource_types: ["organic_compounds", "archeotech", "xenos_ruins"]
      productivity_bonus: 2
      additional_pf: 1
```

### Fields

- **name** (string): Internal identifier for the colony type
- **display_name** (string): Human-readable name
- **description** (string): Full description of the colony type
- **initial_investment_pf** (string): Dice notation for starting Profit Factor (e.g., "1d5+2")
- **base_stats** (object): Starting values for colony stats
  - `size`: Colony size (always 1 at start)
  - `complacency`: Base complacency level
  - `productivity`: Base productivity level
  - `order`: Base order level
  - `piety`: Base piety level
- **special_effects** (array): List of special rules for this colony type
  - `name`: Internal identifier for the effect
---

## rule_tables.yaml

Core calculation tables used throughout the game engine.

### Size to Profit Factor Lookup

Maps colony size to base Profit Factor value.

```yaml
size_to_profit_factor:
  - size: 0
    profit_factor: 0
    description: "Ghost Town"
  - size: 1
    profit_factor: 1
    description: "Settlement"
  # ... up to size 10
```

### Leadership Modifier

Maps representative stat bonus (Int/Per/Fel) to colony modifier.

```yaml
leadership_modifier:
  - stat_bonus: 2
    modifier: -2
  - stat_bonus: 3
    modifier: -1
  - stat_bonus: 4
    modifier: 0
  - stat_bonus: 5
    modifier: 1
  - stat_bonus: 6
    modifier: 2
```

**Valid Range**: 2-6 (0-1 = dead/incapacitated, 7+ = impossible)

### Lore Thresholds

Defines threshold conditions for colony state transitions.

```yaml
lore_thresholds:
  complacency:
    placated_threshold: "> size"
    zero_state: "riots_and_unrest"
    default: "stable"
  order:
    orderly_threshold: "> size"
    zero_state: "anarchy"
    default: "stable"
  productivity:
    productive_threshold: "> size"
    zero_state: "halted"
    default: "stable"
  piety:
    pious_threshold: "> size"
    zero_state: "heretical"
    default: "stable"
```

### Game Cycles

Defines interval timings for game events.

```yaml
game_cycles:
  event_roll_interval_days: 60
  development_roll_interval_days: 90
```

### Profit Factor State Bonuses

Bonus Profit Factor for positive colony states.

```yaml
pf_state_bonuses:
  placated: 1
  productive: 2
  orderly: 2
```

---

## infrastructure_types.yaml

Defines available Hard Infrastructure types and their effects.

### Structure

```yaml
- name: "manufactorum"
  display_name: "Manufactorum"
  description: "Industrial production facility"
  cost: 5
  states:
    working:
      modifiers:
        - stat: "productivity"
          value: 2
    faulty:
      modifiers:
        - stat: "productivity"
          value: -1
        - stat: "complacency"
          value: -1
```

### Fields

- **name** (string): Internal identifier
- **display_name** (string): Human-readable name
- **description** (string): Description of the infrastructure
- **cost** (integer): Cost in Profit Factor to acquire
- **states** (object): Different operational states
  - `working`: Bonuses when fully operational
  - `faulty`: Penalties when broken/disrupted
  - Each state contains a list of `modifiers` with `stat` and `value`

---

## support_upgrades.yaml

Defines available Support Upgrades and their effects.

### Structure

```yaml
- name: "voidshield_generator"
  display_name: "Voidshield Generator"
---

## Loading Configuration

Configuration is loaded automatically at application startup:

```python
from colony_manager.adapters.config.rule_config_provider import RuleConfigProvider

# Get the singleton instance
config = RuleConfigProvider.get_instance()

# Access configuration data
pf_table = config.get_profit_factor_table()
thresholds = config.get_lore_thresholds()
infrastructure = config.get_infrastructure_types()
```

## Modifying Configuration

### Adding a New Colony Type

1. Add entry to `colony_types.yaml`
2. Ensure all required fields are present
3. Update `ColonyType` enum in `domain/models/colony.py` if needed
4. Add tests for the new type

### Changing Game Balance

1. Modify values in the appropriate YAML file
2. Run tests to ensure calculations still work
3. Update documentation if behavior changes

### Best Practices

- **Keep data, not logic**: Configuration should contain values, not complex rules
- **Document changes**: Add comments for non-obvious values or GM rulings
- **Test thoroughly**: Run full test suite after any config changes
- **Version control**: Track configuration changes in git

---

## Environment Variables

Some configuration is loaded from environment variables via `src/colony_manager/config/settings.py`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | SQLite database file path | `./colony_manager.db` |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | (auto-generated) |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `CORS_ORIGINS` | Allowed CORS origins | `["*"]` |

See `settings.py` for complete list and validation rules.
  description: "Planetary defense system"
  cost: 8
  stat_effects:
    - stat: "order"
      value: 1
  affiliated_group: "military"
  limit_per_colony: null
```

### Fields

- **name** (string): Internal identifier
- **display_name** (string): Human-readable name
- **description** (string): Description of the upgrade
- **cost** (integer): Cost in Profit Factor to acquire
- **stat_effects** (array): List of stat modifications
  - `stat`: Which stat to modify
  - `value`: Amount to add/subtract
- **affiliated_group** (string, optional): Associated group (e.g., "military", "civic")
- **limit_per_colony** (integer, optional): Maximum number allowed per colony

---

## representative_types.yaml

Defines the three types of Representatives.

### Structure

```yaml
- name: "judge"
  display_name: "Judge"
  description: "Legal expert and enforcer of imperial law"
  focus_stats: ["ws", "bs", "tough", "will"]
  specializations: ["enforcer", "assassin", "soldier"]
```

### Fields

- **name** (string): Internal identifier
- **display_name** (string): Human-readable name
- **description** (string): Role description
- **focus_stats** (array): Stats that typically receive bonuses
- **specializations** (array): Available specialization options

### Available Types

1. **Judge** - Legal expert and enforcer
2. **Cardinal** - Religious leader
3. **Satrap** - Noble governor focused on trade

---

## personalities.yaml

Defines Representative personality traits that provide stat bonuses.

### Structure

```yaml
- name: "ruthless_efficiency"
  display_name: "Ruthless Efficiency"
  description: "Gains +1 to either Intelligence or Perception"
  stat_effects:
    - stat: "int"
      value: 1
    - stat: "per"
      value: 1
  calamitous_modifier: false
  special_rule: null
```

### Fields

- **name** (string): Internal identifier
- **display_name** (string): Human-readable name
- **description** (string): Effect description
- **stat_effects** (array): Stat modifications (may have choices)
  - `stat`: Stat to modify (ws, bs, str, tough, agil, int, per, will, fel)
  - `value`: Amount to add
- **calamitous_modifier** (boolean): Whether this is a negative trait
- **special_rule** (string, optional): Special rules text
  - `description`: Human-readable description
  - `resource_types`: (optional) List of resource types this effect applies to
  - `productivity_bonus`: (optional) Productivity bonus when effect triggers
  - `additional_pf`: (optional) Additional Profit Factor when effect triggers
  - `starts_with_upgrade`: (optional) Whether colony starts with a free upgrade
  - `upgrade_type`: (optional) Type of free starting upgrade
  - `order_piety_swap`: (optional) Allow swapping Order decrease for Piety decrease
  - `famine_resilience_roll`: (optional) Target number for resilience roll

### Available Colony Types

1. **Research Mission** - Studies flora, fauna, or ancient ruins
2. **Mining and Industry** - Economic backbone, extracts ores or manufactures goods
3. **Ecclesiastical** - Spreads the word of the God-Emperor
4. **Agricultural** - Provides food for export with automated systems