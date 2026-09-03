# Docker Deployment Guide

This guide explains how to build and run the WH40k Colony Manager using Docker.

## Quick Start

### Build and Run (Development)

```bash
# Build and start both frontend and backend
docker compose up -d --build

# View running containers
docker compose ps

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

### Access Points

Once running, access the application at:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation (Swagger)**: http://localhost:8001/docs
- **Alternative API Docs**: http://localhost:3000/docs (via proxy)

## Architecture

The Docker setup consists of two services:

### Backend Service (`colony-backend`)

- **Image**: `wh40k_colony_manager-backend`
- **Based on**: Python 3.12-slim-bookworm
- **Framework**: FastAPI
- **Database**: SQLite (persisted in Docker volume)
- **Port**: 8000 (exposed as 8001 on host)
- **Features**:
  - Multi-stage build for minimal image size
  - Non-root user for security
  - Health checks
  - Resource limits (1 CPU, 512MB RAM)

### Frontend Service (`colony-frontend`)

- **Image**: `wh40k_colony_manager-frontend`
- **Based on**: NGINX 1.27-alpine
- **Framework**: React + Vite
- **Port**: 80 (exposed as 3000 on host)
- **Features**:
  - Multi-stage build (Node.js build → NGINX runtime)
  - Gzip compression
  - API reverse proxy to backend
  - SPA fallback routing
  - Health checks
  - Resource limits (0.5 CPU, 256MB RAM)

## Configuration

### Environment Variables

The backend accepts these environment variables (see `.env.example`):

```bash
# Required
JWT_SECRET_KEY=your-secret-key-here
DATABASE_PATH=/data/colony_manager.sqlite
CONFIG_DIR=/app/config

# Optional
ENVIRONMENT=production
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:3000
CORS_ALLOW_CREDENTIALS=true
```

### Volumes

- `backend-data`: Persistent storage for SQLite database
- `./config:/app/config:ro`: Config files mounted as read-only

### Networks

Both services run on the `colony-network` bridge network for internal communication.

## Production Deployment

For production use, use the production compose file:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Production Considerations

1. **Set a strong JWT_SECRET_KEY** in `.env.production`
2. **Enable HTTPS** - place a reverse proxy (e.g., Traefik, NGINX) in front
3. **Set COOKIE_SECURE=true** for HTTPS-only cookies
4. **Backup the database volume** regularly
5. **Review resource limits** based on expected load

## Development Workflow

### Rebuild After Code Changes

```bash
# Backend changes
docker compose up -d --build backend

# Frontend changes
docker compose up -d --build frontend

# Both
docker compose up -d --build
```

### View Logs

```bash
# All logs
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

### Access Container Shell

```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh
```

### Database Location

The SQLite database is stored in the `backend-data` volume:

```bash
# Access database file
docker volume ls | grep colony-backend-data
docker run --rm -v colony-backend-data:/data alpine ls -la /data
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs backend

# Verify ports aren't in use
netstat -an | findstr "3000 8001"
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d --build
```

### Build Failures

```bash
# Clean build cache
docker compose build --no-cache

# Remove old images
docker rmi wh40k_colony_manager-backend wh40k_colony_manager-frontend
```

## File Structure

```
.
├── Dockerfile              # Backend multi-stage build
├── Dockerfile.frontend     # Frontend multi-stage build
├── docker-compose.yml      # Development configuration
├── docker-compose.prod.yml # Production configuration
├── .dockerignore          # Files excluded from build context
├── nginx/
│   └── frontend.conf      # NGINX configuration for frontend
├── config/                 # Application config files
└── src/
    ├── colony_manager/    # Backend Python code
    └── (frontend code)    # Frontend React code
```

## Security Notes

- Backend runs as non-root user `colony`
- Frontend runs as non-root user `nginx`
- Database volume is isolated from host
- CORS is configured to only allow specified origins
- Health checks ensure service availability

## Performance

Default resource limits:

| Service   | CPU Limit | Memory Limit |
|-----------|-----------|--------------|
| Backend   | 1.0       | 512 MB       |
| Frontend  | 0.5       | 256 MB       |

Adjust in `docker-compose.yml` under `deploy.resources` as needed.

## Next Steps

1. Access http://localhost:3000 to use the application
2. Visit http://localhost:8001/docs to explore the API
3. Configure your colony settings via the UI or API
4. Set up regular backups of the database volume

For more information, see:
- `README.md` - Project overview
- `docs/` - Detailed documentation
- `CONTRIBUTING.md` - Development guidelines