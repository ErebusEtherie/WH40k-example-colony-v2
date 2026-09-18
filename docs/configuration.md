# Configuration

Game-rule data and environment configuration.

## YAML rule tables (`config/`)

Loaded at startup by `src/colony_manager/adapters/config/loader.py` into
typed structures (`adapters/config/schemas.py`) and exposed to the domain
through `domain/ports/rule_config_provider.py`.

| File | Contents |
|---|---|
| `colony_types.yaml` | 4 colony types: base stats, initial investment, special effects (incl. GM rulings) |
| `rule_tables.yaml` | size→PF, leadership table, lore thresholds, game cycles, PF state bonuses |
| `infrastructure_types.yaml` | Hard Infrastructure types, states, stat effects |
| `support_upgrades.yaml` | Support upgrade types, stat options, limits |
| `representative_types.yaml` | Representative types & descriptions |
| `personalities.yaml` | Personality traits & effects |

### `rule_tables.yaml` (key sections)

- `size_to_profit_factor` — per-size list (0→0 … 10→18).
- `leadership_modifier` — `stat_bonus` 2–6 → −2 … +2 (valid range only).
- `lore_thresholds` — `"> size"` / zero-state labels per stat.
- `game_cycles` — `event_roll_interval_days: 60`,
  `development_roll_interval_days: 90`.
- `pf_state_bonuses` — `placated: 1`, `productive: 2`, `orderly: 2`.

## Changing game rules

- Edit the YAML files — values are data, not code.
- Config is loaded (and cached) at startup: restart the server after edits.
- Run the test suite to confirm calculations still hold.
- The `/config/...` endpoints expose the tables to the frontend.

## Environment variables

Loaded via `src/colony_manager/config/settings.py` (pydantic-settings) from
`.env` / the environment. Commit `.env.example`, never real secrets.

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET_KEY` | dev-only placeholder | token signing; required in production |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | CORS origins (comma-separated) |
| `DATABASE_PATH` | `colony_manager.sqlite` | SQLite file path |
| `ENVIRONMENT` | `development` | development / staging / production |
| `LOG_LEVEL` | `INFO` | logging level |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | refresh-token lifetime |
| `RATE_LIMIT_ENABLED` | `true` | auth rate limiting |
| `MAX_LOGIN_ATTEMPTS` | `5` | lockout threshold |
| `LOCKOUT_DURATION_MINUTES` | `15` | lockout duration |
| `MIN_PASSWORD_LENGTH` | `8` | password policy |
| `REQUIRE_PASSWORD_COMPLEXITY` | `true` | password policy |
| `COOKIE_SECURE` | `false` | HTTPS-only cookies (true in prod) |
| `COOKIE_SAMESITE` / `COOKIE_HTTPONLY` | `lax` / `true` | cookie security |
| `VITE_API_BASE_URL` | `http://localhost:8001/api/v1` | frontend API base |
| `VITE_DEV_MODE` | `true` | enables dev/demo login buttons |

Production values: see [`deployment.md`](deployment.md) and
[`SECURITY_CONFIGURATION.md`](SECURITY_CONFIGURATION.md).
