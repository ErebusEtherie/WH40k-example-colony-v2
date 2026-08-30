# CI/CD Infrastructure Guide

**Purpose:** Complete CI/CD setup for WH40k Colony Manager with Docker, Portainer, and GitHub Actions  
**Target Environment:** Mini-PC testing environment with optional production deployment  
**Version:** 1.0  
**Date:** 2026-08-30

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Docker Configuration](#docker-configuration)
4. [Portainer Setup](#portainer-setup)
5. [GitHub Actions CI/CD](#github-actions-cicd)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Procedures](#deployment-procedures)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides complete infrastructure setup for:

- **Testing Environment**: Mini-PC with Docker and Portainer for local testing
- **CI/CD Pipeline**: GitHub Actions for automated testing, building, and deployment
- **Production Ready**: Optional production deployment with proper security

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Backend    │  │   Frontend   │  │   CI/CD      │      │
│  │   Dockerfile │  │   Dockerfile │  │   Workflow   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    GitHub Container                         │
│                       Registry                              │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mini-PC (Testing)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Portainer  │  │   Traefik   │  │   Docker    │         │
│  │   (Web UI)  │  │  (Proxy)    │  │  Compose    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Backend   │  │  Frontend   │  │  Database   │         │
│  │   :8000     │  │    :80      │  │   (SQLite)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Hardware Requirements (Mini-PC)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB | 50+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.20+
- **Portainer**: Version 2.19+ (optional but recommended)
- **Git**: For repository management
- **SSH Access**: For GitHub Actions deployment
---

## Portainer Setup

### Step 1: Install Portainer on Mini-PC

```bash
# Create Portainer volume
docker volume create portainer_data

# Deploy Portainer (using port 9090 to avoid conflict)
docker run -d \
  --name portainer \
  --restart=unless-stopped \
  -p 9090:9000 \
  -p 8000:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

**Access:** http://your-mini-pc-ip:9090

### Step 2: Configure Portainer Stack

1. **Navigate to Stacks** in Portainer UI
2. **Click "Add stack"**
3. **Name:** `wh40k-colony-manager`
4. **Build method:** Web Editor
5. **Paste** contents of `docker-compose.test.yml`

### Step 3: Configure Environment Variables

In Portainer Stack editor, add these environment variables:

```yaml
JWT_SECRET_KEY: your-secure-random-key-min-32-chars
VITE_API_BASE_URL: http://your-mini-pc-ip:8000
```

### Step 4: Deploy Stack

1. Click **"Deploy the stack"**
2. Wait for containers to start (check logs)
3. Verify health checks pass

### Step 5: Access Application

- **Frontend:** http://your-mini-pc-ip:8880
- **Backend API:** http://your-mini-pc-ip:8001
- **API Docs:** http://your-mini-pc-ip:8001/docs

---

## GitHub Actions CI/CD

### Workflow Overview

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

| Job | Purpose | Trigger |
|-----|---------|---------|
| `test-backend` | Run Python tests, linting, type checking | Push, PR |
| `test-frontend` | Run React tests, linting, build | Push, PR |
| `build-backend` | Build and push Docker image | Push to main |
| `build-frontend` | Build and push Docker image | Push to main |
| `deploy-testing` | Deploy to mini-PC | Manual trigger |
| `deploy-production` | Deploy to production | Tag (v*) |

### Step 1: Configure GitHub Secrets

Navigate to **Repository Settings → Secrets and variables → Actions**

**Required Secrets:**

| Secret | Description | Example |
|--------|-------------|---------|
| `MINI_PC_HOST` | Mini-PC IP or domain | 192.168.1.100 |
| `MINI_PC_USERNAME` | SSH username | pi |
| `MINI_PC_SSH_KEY` | SSH private key | -----BEGIN OPENSSH PRIVATE KEY----- |

**Optional (Production):**

| Secret | Description |
|--------|-------------|
| `PRODUCTION_HOST` | Production server IP |
| `PRODUCTION_USERNAME` | Production SSH user |
| `PRODUCTION_SSH_KEY` | Production SSH key |
| `PRODUCTION_DOMAIN` | Production domain |

### Step 2: Generate SSH Key for GitHub Actions

```bash
# On mini-PC
ssh-keygen -t ed25519 -C "github-actions" -f github-actions-key
---

## Environment Configuration

### Testing Environment (.env)

```bash
# JWT Configuration
JWT_SECRET_KEY=test-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security (relaxed for testing)
ENVIRONMENT=development
REQUIRE_PASSWORD_COMPLEXITY=false
RATE_LIMIT_ENABLED=true
MAX_LOGIN_ATTEMPTS=10
LOCKOUT_DURATION_MINUTES=5

# CORS
ALLOWED_ORIGINS=http://localhost:8880,http://localhost:3080,http://127.0.0.1:8880
CORS_ALLOW_CREDENTIALS=true

# Cookies
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_HTTPONLY=true

# Database
DATABASE_PATH=/data/colony_manager.sqlite

# Logging
LOG_LEVEL=INFO
```

### Production Environment (.env.production)

```bash
# JWT Configuration (GENERATE NEW KEY!)
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security (strict for production)
ENVIRONMENT=production
REQUIRE_PASSWORD_COMPLEXITY=true
RATE_LIMIT_ENABLED=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# CORS (update with your domain)
ALLOWED_ORIGINS=https://colony.yourdomain.com:8880
CORS_ALLOW_CREDENTIALS=true

# Cookies (requires HTTPS)
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
COOKIE_HTTPONLY=true

# Database
DATABASE_PATH=/var/lib/colony_manager/colony_manager.sqlite

# Logging
LOG_LEVEL=WARNING
```

---

## Deployment Procedures

### Local Testing (Docker Compose)

```bash
# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Create .env file
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose -f docker-compose.test.yml up -d

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Stop services
docker-compose -f docker-compose.test.yml down
```

### Portainer Deployment

1. **Open Portainer UI** (http://mini-pc-ip:9000)
2. **Navigate to Stacks**
3. **Click "Add stack"**
4. **Name:** `wh40k-colony-manager`
5. **Paste** `docker-compose.test.yml` content
6. **Add environment variables** in Web editor
7. **Click "Deploy the stack"**
8. **Verify** containers are running
---

## Monitoring & Maintenance

### Health Checks

| Service | Endpoint | Interval |
|---------|----------|----------|
| Backend | `/api/v1/health` | 30s |
| Frontend | `/` (HTTP 200) | 30s |

### Log Management

```bash
# View backend logs
docker logs colony-backend --tail 100

# View frontend logs
docker logs colony-frontend --tail 100

# Follow logs in real-time
docker-compose -f docker-compose.test.yml logs -f
```

### Resource Monitoring

```bash
# Check container resource usage
docker stats colony-backend colony-frontend

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

### Update Procedure

```bash
# Pull latest images
docker-compose -f docker-compose.test.yml pull

# Recreate containers
docker-compose -f docker-compose.test.yml up -d --build

# Remove old images
docker image prune -f
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose -f docker-compose.test.yml logs backend
```

**Common issues:**
- Port already in use → Change port in docker-compose.yml
- Permission denied → Check volume permissions
- Out of memory → Increase Docker memory limit

### Database Connection Issues

```bash
# Check database file exists
docker exec colony-backend ls -la /data/

# Backup and recreate
docker cp colony-backend:/data/colony_manager.sqlite ./backup.sqlite
docker exec colony-backend rm /data/colony_manager.sqlite
docker-compose -f docker-compose.test.yml restart backend
```

### CORS Errors

**Symptoms:** Frontend shows CORS errors in browser console

**Solution:**
1. Verify `ALLOWED_ORIGINS` includes frontend URL
2. Check `CORS_ALLOW_CREDENTIALS=true`
3. Ensure backend is accessible from frontend

### Authentication Issues

**Symptoms:** Login fails or tokens not accepted

**Solution:**
1. Verify `JWT_SECRET_KEY` is set correctly
2. Check system time synchronization
3. Clear browser cookies and retry

### Portainer Stack Deployment Fails

**Check:**
1. Docker socket mounted correctly
2. Stack YAML syntax valid
3. Environment variables configured
4. No port conflicts

---

## Security Considerations

### For Testing Environment

- ✅ Non-root user in containers
- ✅ Rate limiting enabled
- ✅ Password complexity optional (for convenience)
- ⚠️ `COOKIE_SECURE=false` (no HTTPS)
- ⚠️ Default JWT key (change before production)

### For Production Environment

- ✅ Non-root user in containers
- ✅ Rate limiting enabled
- ✅ Password complexity required
- ✅ `COOKIE_SECURE=true` (HTTPS required)
- ✅ Unique JWT secret key
- ✅ CORS restricted to specific domains
- ✅ Resource limits configured

---

## Quick Reference

### Commands

```bash
# Start testing environment
docker-compose -f docker-compose.test.yml up -d

# Stop testing environment
docker-compose -f docker-compose.test.yml down

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Restart services
docker-compose -f docker-compose.test.yml restart

# Backup database
docker cp colony-backend:/data/colony_manager.sqlite ./backup.sqlite

# Clean up
docker system prune -a
```

### URLs (Testing)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Portainer | http://mini-pc-ip:9000 |

### Ports

| Service | Port | Protocol |
|---------|------|----------|
| Frontend | 80 | HTTP |
| Backend | 8000 | HTTP |
| Portainer | 9000 | HTTP |

---

## Related Documents

- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) — Production deployment checklist
- [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md) — Security hardening guide
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) — Current deployment status
- [README.md](../README.md) — Main project documentation

---

**Last Updated:** 2026-08-30  
**Maintained By:** DevOps Team

### GitHub Actions Deployment

```bash
# Tag for production release
git tag v1.0.0
git push origin v1.0.0

# Or trigger manual deployment
# Actions → CI/CD Pipeline → Run workflow → Select environment
```

### Backup Procedure

```bash
# Manual backup
docker cp colony-backend:/data/colony_manager.sqlite ./backup-$(date +%Y%m%d).sqlite

# Automated backup (included in docker-compose.test.yml)
# Runs daily, keeps 7 days of backups
docker-compose -f docker-compose.test.yml --profile backup up -d
```

# Copy public key to authorized_keys
cat github-actions-key.pub >> ~/.ssh/authorized_keys

# Copy private key to GitHub Secrets
cat github-actions-key | base64 -w 0
```

### Step 3: Configure GitHub Environments

1. **Settings → Environments → Add environment**
2. **Create:** `testing` and `production`
3. **Configure** required secrets per environment

### Step 4: Trigger Deployment

**Manual Deployment:**

1. Go to **Actions → CI/CD Pipeline**
2. Click **"Run workflow"**
3. Select **testing** environment
4. Click **"Run workflow"**

**Automatic Deployment:**

- Push to `main` → Builds images
- Create tag `v1.0.0` → Deploys to production

---

## Docker Configuration

### File Structure

```
WH40k_Colony_Manager/
├── Dockerfile                      # Backend container
├── docker-compose.test.yml         # Testing environment
├── docker-compose.prod.yml         # Production environment
├── .env.example                    # Environment template
├── .env.production                 # Production secrets (gitignored)
└── frontend/
    ├── Dockerfile                  # Frontend container
    └── nginx.conf                  # Nginx configuration
```

### Backend Dockerfile

**Location:** `Dockerfile`

Features:
- Multi-stage build for minimal image size
- Python 3.12 slim base
- Non-root user for security
- Health checks included
- Optimized for ARM64 and AMD64

### Frontend Dockerfile

**Location:** `frontend/Dockerfile`

Features:
- Multi-stage build (Node.js build → Nginx runtime)
- Gzip compression enabled
- Security headers configured
- SPA routing support