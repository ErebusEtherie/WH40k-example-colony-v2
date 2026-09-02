# 06 — Frontend Docker & Docker Compose Deployment

This guide covers building, running, and managing the frontend container within the Docker ecosystem.

---

## 1. Quick Start

Run the complete full-stack environment (Frontend + Backend) with a single command:

```bash
docker compose up -d --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:8001`
- **Swagger Documentation**: `http://localhost:8001/docs` (or `http://localhost:3000/docs`)
- **Healthcheck**: `http://localhost:3000/health`

To stop and remove containers:
```bash
docker compose down
```

---

## 2. Docker Architecture

The frontend uses a **multi-stage build** defined in `Dockerfile.frontend`:

1. **Build Stage (`node:20-alpine`)**:
   - Installs build tools and npm packages (`npm install`).
   - Compiles TypeScript and packages static assets via `npx vite build`.
   - Produces optimized static bundle in `/dist`.

2. **Runtime Stage (`nginx:1.27-alpine`)**:
   - Strips Node.js, leaving an ultra-light (~25MB) production web server.
   - Copies custom configuration `nginx/frontend.conf`.
   - Serves static assets on internal port 80.
   - **Internal Reverse Proxy**: Routes all `/api/*` requests directly to `http://backend:8000/api/` over the Docker bridge network `colony-network`.
   - **SPA Routing**: Catches all client-side navigation via `try_files $uri $uri/ /index.html;`.

---

## 3. Docker Compose Services Overview

### `frontend` Service Definition
```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile.frontend
  container_name: colony-frontend
  restart: unless-stopped
  ports:
    - "3000:80"
  depends_on:
    backend:
      condition: service_healthy
  networks:
    - colony-network
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 5s
```

### Available Compose Profiles

| Compose File | Purpose | Execution Command |
| :--- | :--- | :--- |
| **`docker-compose.yml`** | Default full-stack setup (Dev/Staging) | `docker compose up -d --build` |
| **`docker-compose.prod.yml`** | Hardened production with resource limits | `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build` |
| **`docker-compose.test.yml`** | Mini-PC / Portainer / Traefik routing | `docker compose -f docker-compose.test.yml up -d --build` |

---

## 4. Portainer & Homelab Setup

1. Open **Portainer** $\rightarrow$ Navigate to **Stacks** $\rightarrow$ Click **Add stack**.
2. Name the stack: `colony-manager`.
3. In the **Web Editor**, paste the contents of `docker-compose.yml`.
4. Configure required environment variables:
   - `JWT_SECRET_KEY`: Secure random string
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: `http://<your-server-ip>:3000`
5. Click **Deploy the stack**.
6. Access the Cogitator console at `http://<your-server-ip>:3000`.

---

## 5. Standalone Frontend Commands

### Build Image
```bash
docker build -t wh40k-colony-frontend -f Dockerfile.frontend .
```

### Run Standalone
```bash
docker run -d \
  --name colony-frontend \
  -p 3000:80 \
  --network colony-network \
  wh40k-colony-frontend
```

For full reference documentation, see [docs/FRONTEND_DOCKER_DEPLOYMENT.md](../docs/FRONTEND_DOCKER_DEPLOYMENT.md).
