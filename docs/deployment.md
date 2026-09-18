# Deployment

Consolidated deployment guide for the WH40k Colony Manager. The superseded
per-target checklists live in `archive/`.

## Quick start (Docker, full stack)

```bash
docker compose up -d --build
```

| What | Where |
|---|---|
| Frontend | `http://localhost:3000` — container `colony-frontend` (nginx, container port 80 → host 3000) |
| Backend API | `http://localhost:8001` — container `colony-backend` (container port 8000 → host 8001) |
| Swagger / ReDoc | `http://localhost:8001/docs` · `/redoc` |
| Health | `curl http://localhost:8001/api/v1/health` |

Compose files: `docker-compose.yml` (standard), `docker-compose.prod.yml`
(production; `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`),
`docker-compose.test.yml` (mini-PC / Portainer / Traefik labels).

## Images & reverse proxy

- `Dockerfile` — backend (FastAPI/uvicorn, non-root `colony` user, `config/` mounted read-only, DB at `/data` volume).
- `Dockerfile.frontend` — multi-stage: Vite build (`node:20-alpine`) → `nginx:1.27-alpine` serving `dist/`.
- `nginx/frontend.conf` — proxies `/api/` to `backend:8000`, SPA fallback `try_files $uri $uri/ /index.html`, gzip, security headers, `/health`.

Frontends normally call the API through this same-origin nginx proxy, so CORS is not involved in production.

## Backend (bare)

```bash
uv sync                              # install deps
python -m alembic upgrade head       # run migrations
uvicorn colony_manager.adapters.api.app:create_app --factory --host 0.0.0.0 --port 8000
```

- DB is **SQLite** at `DATABASE_PATH` (default `colony_manager.sqlite`). Back it up by copying the file (`docker cp colony-backend:/data/colony_manager.sqlite ./backup.sqlite` for containers).
- Set `ENVIRONMENT`, `JWT_SECRET_KEY`, `ALLOWED_ORIGINS`, `COOKIE_SECURE` etc. from `.env.production` (see below and `SECURITY_CONFIGURATION.md`).

## Frontend (bare)

```bash
cd frontend   # or repo root (Vite project is at the root)
npm run build                              # vite build + express server bundle → dist/
node dist/server.cjs                       # serve (or serve dist/ via nginx)
```

- `VITE_API_BASE_URL` may be injected at build time: `--build-arg VITE_API_BASE_URL=https://api.example.com`.
- Local dev: real backend (`npm run dev:app`, Vite on :3000, base `http://localhost:8000/api/v1`) or mock backend (`npm run dev:mock`, Express on :8001).

## Portainer / mini-PC

Use **pre-built images** for Git-based Portainer stacks (build-context/volume issues; see archived `PORTAINER_DEPLOYMENT.md`). Create volumes before deploy, supply `JWT_SECRET_KEY`, verify health after deploy.

## Security settings

Details in [`SECURITY_CONFIGURATION.md`](SECURITY_CONFIGURATION.md). Key knobs:

- `JWT_SECRET_KEY` — random, ≥ 32 chars, unique per deployment (the app refuses to start with the dev default in production).
- `ENVIRONMENT=production` · `COOKIE_SECURE=True` · `COOKIE_HTTPONLY=True` · `COOKIE_SAME_SITE=lax`
- `ALLOWED_ORIGINS` — explicit HTTPS origins only (never `*`), CORS credentials on.
- `RATE_LIMIT_ENABLED=True` · `MAX_LOGIN_ATTEMPTS` · `LOCKOUT_DURATION_MINUTES`
- `MIN_PASSWORD_LENGTH` · `REQUIRE_PASSWORD_COMPLEXITY`
- HTTPS + HSTS via the reverse proxy.

## Update & rollback

1. Back up the DB.
2. `git pull` → `uv pip install --upgrade -r requirements.txt` → `python -m alembic upgrade head` → restart → check `/api/v1/health`.
3. Rolling back: restore the DB backup, `git checkout <previous>`, restart. Alembic `downgrade` only for schema rollback after confirming migration history.

## Environment knobs (`.env.example`)

`JWT_SECRET_KEY` · `ALLOWED_ORIGINS` · `DATABASE_PATH` · `ENVIRONMENT` · `LOG_LEVEL` · `ACCESS_TOKEN_EXPIRE_MINUTES` · `REFRESH_TOKEN_EXPIRE_DAYS` · `RATE_LIMIT_ENABLED` · `MAX_LOGIN_ATTEMPTS` · `LOCKOUT_DURATION_MINUTES` · `MIN_PASSWORD_LENGTH` · `REQUIRE_PASSWORD_COMPLEXITY` · `VITE_API_BASE_URL` · `VITE_DEV_MODE`
