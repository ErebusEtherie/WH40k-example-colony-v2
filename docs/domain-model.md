# Domain Model

Business entities and the stat/rule system as implemented in
`src/colony_manager/domain/`. Game-rule values are data in `config/*.yaml`,
not code (rule tables: `docs/configuration.md`, `docs/business_analysis.md`).

## Entities

- **Colony** (`domain/models/colony.py`): `name`, `founder_name`,
  `patron_name`, `colony_type`, `age_days` (+ auto-set `age_last_updated`),
  `current_event`, base stats (`base_complacency` / `base_order` /
  `base_productivity` / `base_piety` / `base_size`), `representative_id`,
  `dynasty_outcome`, lock flags (`complacency_locked`, `order_locked`,
  `productivity_locked`), `planetary_resources`, plus owned
  `infrastructure[]`, `support_upgrades[]`, `modifiers[]`.
- **Modifier** (`domain/models/modifier.py`): `modifier_source_type`
  (`gm_custom`, `growth_decay`, `representative_leadership`, `resource`,
  `infrastructure`, `support_upgrade`), `modifier_category`
  (`permanent` / `conditional` / `custom`), `modifier_stat`
  (`size`, `complacency`, `order`, `productivity`, `piety`, `profit_factor`),
  `modifier_value`, `is_active`, `expires_at`, `source_entity_id`.
- **Representative** (`representative.py`): `type` (satrap, judge, cardinal,
  colonist_representative, military_commander, dynasty_member),
  `personalities`, characteristics (WS/BS/S/T/Ag/Int/Per/WP/Fel), `skills`,
  `talents`, `stat_bonus` (2–6 → leadership), `assigned_to_colony_id`.
- **Infrastructure** (`infrastructure.py`): `type` (transport,
  power_network, water_management, food_production, communications),
  `state` (planned, in_progress, working, needed, not_working), `name`, `notes`.
- **SupportUpgrade** (`support_upgrade.py`): `upgrade_type` (arbites_precinct,
  ecclesiarchy_mission, mechanicum_station, infantry_garrison,
  imperial_navy_station, cultural_improvement, industrial_facility,
  personal_lodgings, contacts, trappings), `chosen_stat`, `custom_product`, `state`.
- **Resource** (`resource.py`): `resource_type` (mineral,
  organic_compound, archeotech_cache, xenos_ruins), `name`, abundance,
  `productivity_bonus`, `pf_bonus`.
- Supporting aggregates: **Event**, **DevelopmentPlan**, **AuditLog**,
  **ColonyUser**, **User**, login-attempt and token bookkeeping
  (`audit_log.py`, `event.py`, `development_plan.py`, `colony_user.py`,
  `user.py`, `login_attempt.py`, `token_blacklist.py`, `token_issuance.py`).

## Stat system

- Stats: Size, Complacency, Order, Productivity, Piety (integers ≥ 0);
  Size is capped at 10.
- `current = base + Σ active modifiers`, clamped ≥ 0 — **computed on
  demand, never stored** (`stat_calculator.py`, `size_calculator.py`).
- **Lock flags** (Rogue Trader crisis rules): when a stat hits 0, some other
  stats cannot *increase* until the crisis resolves — e.g. Complacency 0
  locks Order and Productivity; Piety 0 locks Order and Complacency.

## Lore states

Thresholds are relative to **actual Size** (`> size`) or **0** (from
`rule_tables.yaml` + `domain/rules/lore_state_resolver.py`):

| Stat | `> size` | `== 0` | else |
|---|---|---|---|
| Complacency | placated | riots_and_unrest | stable |
| Order | orderly | anarchy | stable |
| Productivity | productive | halted | stable |
| Piety | pious | heretical | stable |

## Profit Factor

From `domain/rules/profit_factor_calculator.py` + `rule_tables.yaml`:

```text
base = size_to_profit_factor[size]           # per-size table (e.g. size 5 → 6, 10 → 18)
     + (placated   ? +1 : 0)   # Complacency > size
     + (productive ? +2 : 0)   # Productivity > size
     + (orderly    ? +2 : 0)   # Order > size
     + leadership_modifier     # stat_bonus table (2..6 → −2..+2) — `leadership_modifier_resolver.py`
     + Σ profit_factor modifiers

anarchy (Order == 0)            → 0
halted  (Productivity == 0)     → floor(pf / 2)
otherwise                       → max(pf, 0)
```

## Rule tables (`config/`)

- `colony_types.yaml` — 4 types (research_mission, mining_and_industry,
  ecclesiastical, agricultural), base stats, initial investment, special
  effects (resource experts / industrial powerhouse / shield of faith /
  resilient to famine) incl. recorded GM rulings.
- `rule_tables.yaml` — size→PF, leadership table, lore thresholds,
  game cycles (60/90 days), PF state bonuses.
- `infrastructure_types.yaml` · `support_upgrades.yaml` ·
  `representative_types.yaml` · `personalities.yaml`.

## Auth & authorization

System roles (`viewer`, `colony_manager`, `admin`) and colony membership
roles (`viewer`, `editor`, `owner`) are distinct concepts; effective
permissions are combined in `adapters/api/middleware/permissions.py`.
