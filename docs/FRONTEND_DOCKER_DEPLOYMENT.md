# WH40k Colony Manager — Frontend Docker Deployment Guide

This guide provides instructions, architectural details, and configuration references for containerizing and deploying the **WH40k Rogue Trader Colony Manager** frontend using Docker and Docker Compose.

---

## 1. High-Level Architecture

The frontend is deployed as a high-performance **Single Page Application (SPA)** served by an optimized **NGINX Alpine** container.

```
                    +-------------------------------------------------------+
                    |                   HOST / CLIENT                       |
                    |              Browser (http://localhost:3000)          |
                    +---------------------------+---------------------------+
                                                |
                                      Port 3000 | (HTTP)
                                                v
+-----------------------------------------------------------------------------------------------+
| DOCKER BRIDGE NETWORK (colony-network)                                                        |
|                                                                                               |
|  +---------------------------------------+         +---------------------------------------+  |
|  |           FRONTEND CONTAINER          |         |           BACKEND CONTAINER           |  |
|  |              (colony-frontend)        |         |              (colony-backend)         |  |
|  |                                       |         |                                       |  |
|  |  +---------------------------------+  |         |  +---------------------------------+  |  |
|  |  | NGINX 1.27 Alpine               |  |  /api/* |  | FastAPI (Uvicorn)               |  |  |
|  |  | - Port 80 (Internal)            |  +-------->+  | - Port 8000 (Internal)          |  |  |
|  |  | - Static Assets (HTML/JS/CSS)   |  | (Proxy) |  | - SQLite Database (/data)       |  |  |
|  |  | - SPA Fallback (try_files)      |  |         |  | - Koronus Rule Engine           |  |  |
|  |  | - Gzip Compression              |  |         +------------------------------------+  |  |
|  |  | - Healthcheck (/health)         |  |                                                 |  |
|  |  +---------------------------------+  |                         ^                       |  |
|  +---------------------------------------+                         |                       |  |
|                                                                    | Port 8001             |  |
+--------------------------------------------------------------------|--------------------------+
                                                                     | (Optional Direct API)
                                                                     v
                                                            Host / Postman / Tools
```

### Key Architectural Benefits

1. **Zero CORS Friction**: In production, the browser talks solely to `http://localhost:3000`. All calls to `/api/*` are reverse-proxied internally over Docker's network to `http://backend:8000/api/`. This completely bypasses Cross-Origin Resource Sharing (CORS) complications.
2. **Minimal Footprint**: Multi-stage build isolates Node.js tooling to the build phase. The final runtime image is based on `nginx:1.27-alpine` (~25–30MB total).
3. **Aggressive Static Caching & Gzip**: Fingerprinted assets (`.js`, `.css`, fonts) are cached for 1 year with `immutable` headers. Text payloads are gzipped on the fly.
4. **Resilient SPA Routing**: Deep route reloads (e.g. `/details`, `/infrastructure`) are transparently routed to `index.html` via NGINX's `try_files` directive.

---

## 2. Quick Start (One Command)

To build and start both frontend and backend in detached mode:

```bash
# Clone repository and enter root directory
git clone https://github.com/your-org/WH40k_Colony_Manager.git
cd WH40k_Colony_Manager

# Start the full stack with Docker Compose
docker compose up -d --build
```

### Access Endpoints

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Direct API**: [http://localhost:8001](http://localhost:8001)
- **Interactive Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs) (or [http://localhost:3000/docs](http://localhost:3000/docs))
- **Healthchecks**:
  - Frontend: `curl http://localhost:3000/health` (Returns `healthy`)
  - Backend: `curl http://localhost:8001/api/v1/health`

---

## 3. Configuration Files Breakdown

### A. Multi-Stage Dockerfile (`Dockerfile.frontend`)

```dockerfile
# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm install --include=dev --ignore-scripts
COPY tsconfig.json vite.config.ts index.html metadata.json* ./
COPY src/ ./src/
COPY public/ ./public/
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npx vite build

# Stage 2: Runtime Environment (NGINX)
FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### B. NGINX Reverse Proxy (`nginx/frontend.conf`)

Highlights of the production NGINX configuration:

- **Reverse Proxy**:
  ```nginx
  location /api/ {
      proxy_pass http://backend:8000/api/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```
- **SPA Fallback**:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
- **Security Headers**:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: no-referrer-when-downgrade`

---

## 4. Docker Compose Configurations

### 1. `docker-compose.yml` (Standard Full-Stack)

Used for local development, review environments, and standard single-host setups:

```yaml
version: '3.8'

services:
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

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: colony-backend
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-omnissiah-blessed-secret-key-change-in-prod}
      - DATABASE_PATH=/data/colony_manager.sqlite
      - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000
    volumes:
      - backend-data:/data
      - ./config:/app/config:ro
    networks:
      - colony-network
    ports:
      - "8001:8000"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  colony-network:
    driver: bridge

volumes:
  backend-data:
```

### 2. `docker-compose.prod.yml` (Production Deployment)

Run with dedicated `.env.production` file and strict resource constraints:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 3. `docker-compose.test.yml` (Mini-PC / Portainer / Traefik)

Includes reverse-proxy Traefik routing labels:
- `traefik.http.routers.colony-frontend.rule=Host('colony.localhost')`
- `traefik.http.routers.colony-backend.rule=Host('colony-api.localhost')`

---

## 5. Portainer Stack Deployment (Mini-PC / Homelab)

When hosting the Colony Manager on a Mini-PC or homelab server managed via Portainer:

### Step 1: Open Portainer
1. Navigate to your Portainer dashboard (typically `http://<mini-pc-ip>:9000` or `9090`).
2. Select your environment (e.g. **local**).
3. Navigate to **Stacks** $\rightarrow$ Click **+ Add stack**.

### Step 2: Configure Stack
1. **Name**: `colony-manager`
2. **Build method**: 
   - **Option A (Web editor)**: Copy and paste the contents of `docker-compose.yml` (or `docker-compose.test.yml`).
   - **Option B (Repository)**: Connect your Git repository URL, specify repository reference (e.g. `refs/heads/main`), and set the Compose path to `docker-compose.yml`.

### Step 3: Set Environment Variables
In the **Environment variables** section, define:

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `JWT_SECRET_KEY` | *(Generate a 64-char random string)* | HMAC secret for Imperial user session tokens. |
| `ENVIRONMENT` | `production` | Enables production mode. |
| `ALLOWED_ORIGINS` | `http://<mini-pc-ip>:3000,http://localhost:3000` | Whitelisted browser origins. |

### Step 4: Deploy & Verify
1. Click **Deploy the stack**.
2. Portainer will pull images, execute the multi-stage build, and start both containers.
3. Verify both `colony-frontend` and `colony-backend` show a green **healthy** status badge.
4. Access the web dashboard at `http://<mini-pc-ip>:3000`.

---

## 6. Standalone Frontend Docker Commands

If you wish to build or run the frontend container independently:

### Build Standalone Image
```bash
docker build -t wh40k-colony-frontend -f Dockerfile.frontend .
```

### Run Standalone Container
```bash
# If running alongside an existing backend container on colony-network:
docker run -d \
  --name colony-frontend \
  --restart unless-stopped \
  --network colony-network \
  -p 3000:80 \
  wh40k-colony-frontend
```

### Custom API Host at Build Time
If you host the backend on a different domain or CDN without NGINX proxying:
```bash
docker build \
  --build-arg VITE_API_BASE_URL="https://api.colony.example.com" \
  -t wh40k-colony-frontend \
  -f Dockerfile.frontend .
```

---

## 7. Operational & Maintenance Commands

| Task | Command |
| :--- | :--- |
| **Check Container Status** | `docker compose ps` |
| **View Live Frontend Logs** | `docker compose logs -f frontend` |
| **View Live Backend Logs** | `docker compose logs -f backend` |
| **Restart Frontend Only** | `docker compose restart frontend` |
| **Rebuild After Code Changes** | `docker compose up -d --build frontend` |
| **Stop All Containers** | `docker compose stop` |
| **Tear Down Containers & Networks** | `docker compose down` |
| **Tear Down & Purge Database Volume** | `docker compose down -v` *(Caution: irreversible!)* |
| **Inspect NGINX Config in Container** | `docker exec -it colony-frontend nginx -T` |

---

## 8. Troubleshooting Matrix

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **502 Bad Gateway** when calling `/api/*` | The backend container is either starting up, crashed, or not on `colony-network`. | Run `docker compose ps` and `docker compose logs backend` to ensure the FastAPI server is healthy. Verify `http://backend:8000` resolves within Docker. |
| **404 Not Found** on browser page refresh | NGINX missing SPA fallback configuration. | Ensure `try_files $uri $uri/ /index.html;` exists in `nginx/frontend.conf`. |
| **Port 3000 is already in use** | Another service (e.g. Node.js or Grafana) occupies host port 3000. | Change port mapping in `docker-compose.yml`: `- "8080:80"`. Access at `http://localhost:8080`. |
| **CORS errors in DevTools** | Frontend attempting to query port 8001 directly without origin whitelist. | Ensure requests use relative path `/api/v1/...` (which routes through NGINX proxy), or add your origin to `ALLOWED_ORIGINS` in backend environment variables. |
| **Static files unchanged after rebuild** | Docker cached builder layers. | Run `docker compose build --no-cache frontend && docker compose up -d frontend`. |
