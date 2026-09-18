# Portainer Deployment Guide

**Purpose:** Deploy WH40k Colony Manager using Portainer  
**Last Updated:** 2026-08-30

---

## ⚠️ Common Build Error & Solution

### Error Message

```
Failed to deploy a stack: compose build operation failed: failed to solve: 
failed to compute cache key: "/colony_manager": not found
```

### Cause

Docker cannot find the `colony_manager` directory during Git-based builds because:

1. Volume mounts with `./config` don't work with Git (no local filesystem)
2. Build context doesn't match repository structure
3. Linux filesystems are case-sensitive

### ✅ Solution: Use Pre-built Images (Method 1 Below)

---

## Method 1: Pre-built Images (Recommended)

### Step 1: Create Volume

```bash
docker volume create colony-backend-data
```

### Step 2: Generate JWT Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Create Stack in Portainer

1. **Portainer** → Stacks → "+ Add stack"
2. **Build method:** Web Editor
3. **Name:** `wh40k-colony-manager`
4. **Paste this stack:**

```yaml
services:
  backend:
    image: ghcr.io/yourusername/wh40k-colony-manager-backend:latest
    container_name: colony-backend
    restart: unless-stopped
    environment:
      - JWT_SECRET_KEY=YOUR_SECRET_KEY_HERE
      - DATABASE_PATH=/data/colony_manager.sqlite
    volumes:
      - colony-backend-data:/data
    ports:
      - "8001:8000"

  frontend:
    image: ghcr.io/yourusername/wh40k-colony-manager-frontend:latest
    container_name: colony-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "8880:80"

networks:
  colony-network:
    driver: bridge

volumes:
  colony-backend-data:
    external: true
```

1. **Replace** `YOUR_SECRET_KEY_HERE` with your generated secret
2. **Deploy the stack**

### Access

- **Frontend:** <http://your-ip:8880>
- **Backend API:** <http://your-ip:8001/docs>

---

## Method 2: Build from Git (Advanced)

### Repository Structure Required

```
WH40k_Colony_Manager/
├── Dockerfile              # Backend (in root)
├── colony_manager/         # Python package (exact name!)
├── config/                 # Config files
└── frontend/
    └── Dockerfile
```

### Portainer Configuration

1. **Repository URL:** `https://github.com/yourusername/WH40k_Colony_Manager.git`
2. **Compose path:** `portainer-stack.yml`
3. **Working directory:** (leave empty)
4. **Enable BuildKit** in Portainer settings

### Stack File for Git (portainer-stack.yml)

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: colony-backend
    volumes:
      - colony-backend-data:/data
    ports:
      - "8001:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: colony-frontend
    ports:
      - "8880:80"

networks:
  colony-network:
    driver: bridge

volumes:
  colony-backend-data:
    external: true
```

---

## Troubleshooting

### Build Still Fails

1. Verify directory: `colony_manager` (lowercase, underscore)
2. Check `.dockerignore` doesn't exclude needed files
3. **Use pre-built images** instead

### Container Won't Start

```bash
# Check logs
docker logs colony-backend --tail 100

# Verify volume
docker volume ls | grep colony-backend-data
```

### Port Conflicts

Change external port in stack:

```yaml
ports:
  - "8002:8000"  # Different external port
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Create volume | `docker volume create colony-backend-data` |
| View logs | `docker logs colony-backend --tail 50` |
| Backup DB | `docker cp colony-backend:/data/colony_manager.sqlite ./backup.sqlite` |
| Restart | `docker restart colony-backend colony-frontend` |

**Ports:** Frontend 8880, Backend 8001

**The Emperor Protects** 🦅
