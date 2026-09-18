# Troubleshooting

## Server won't start

- Port 8000 in use → `netstat -ano | findstr :8000`, free the port.
- `JWT_SECRET_KEY` validation error in production → generate a real key and
  set it: `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
- Config (YAML) parse error → `python -c "import yaml; yaml.safe_load(open('config/<file>.yaml'))"`.
  Tabs instead of spaces are the usual culprit; whitespace matters.

## Database

- "no such table" → run migrations: `python -m alembic upgrade head`.
- "unable to open database file" → check `DATABASE_PATH` and file permissions.
- DB locked on Windows → close the running server/process that holds the
  file, back up `colony_manager.sqlite`, then restart.

## Authentication (401 / 403 / 423 / 429)

- `401` → not logged in or the session expired. `POST /api/v1/auth/login`
  then retry; the frontend refreshes automatically via `/auth/refresh`.
- `403` → insufficient permission. Check the **system role**
  (`viewer`/`colony_manager`/`admin`) and the **colony membership role**
  (`viewer`/`editor`/`owner`) — they are distinct.
- `423` / `429` → account locked or rate limited. Wait out the lockout
  (`MAX_LOGIN_ATTEMPTS` / `LOCKOUT_DURATION_MINUTES`), then retry.

## CORS

- DevTools CORS error → the frontend origin must be listed in
  `ALLOWED_ORIGINS` (e.g. `http://localhost:3000`). No wildcard with
  credentials; check `CORS_ALLOW_CREDENTIALS`.

## Tests / tooling

- `ModuleNotFoundError` → install dev deps; `pyproject.toml` already sets
  `pythonpath = ["src"]` for pytest.
- Frontend: `npm install`, then `npm test` / `npm run lint` / `npm run typecheck`.

## Error messages that are actually correct behavior

- "Order == 0 forces PF to 0" (Anarchy) and "Productivity == 0 halves PF"
  (Halted) are intended game rules — see `business_analysis.md`.
- Stats are clamped at 0 (never negative); Size is capped at 10.
- Age cannot be set below 0 — the API returns `400`.
