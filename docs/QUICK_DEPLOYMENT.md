# Quick Deployment Reference Card

**WH40k Colony Manager — Mini-PC Testing Environment**  
**Version:** 1.0 | **Date:** 2026-08-30

---

## 🚀 One-Command Deployment

### Prerequisites Check

```bash
docker --version          # Should be 24.0+
docker compose version    # Should be 2.20+
```

### Deploy with Docker Compose

```bash
# Clone and setup
git clone https://github.com/your-org/WH40k_Colony_Manager.git
cd WH40k_Colony_Manager

# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))" > jwt_secret.txt

# Create .env file
cat > .env << EOF
JWT_SECRET_KEY=$(cat jwt_secret.txt)
VITE_API_BASE_URL=http://localhost:8000
DATABASE_PATH=/data/colony_manager.sqlite
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:80,http://localhost:3000
COOKIE_SECURE=false
EOF

# Deploy
docker-compose -f docker-compose.test.yml up -d --build
```

### Verify Deployment

```bash
# Check containers
docker-compose -f docker-compose.test.yml ps

# Check health
curl http://localhost:8000/api/v1/health

# Access application
# Frontend: http://localhost:80
# API Docs: http://localhost:8000/docs
```

---

## 🐳 Portainer Deployment (Web UI)

### 1. Install Portainer

```bash
docker volume create portainer_data
docker run -d --name portainer --restart=unless-stopped \
  -p 9000:9000 -p 8000:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### 2. Deploy Stack

1. Open http://your-mini-pc-ip:9000
2. Create admin account
3. Go to **Stacks** → **Add stack**
4. Name: `wh40k-colony-manager`
5. Paste `docker-compose.test.yml`
6. Add environment variables
7. Click **Deploy**

---

## ⚙️ Environment Variables

### Minimum Required

```bash
JWT_SECRET_KEY=your-secret-key-min-32-chars
VITE_API_BASE_URL=http://your-ip:8000
DATABASE_PATH=/data/colony_manager.sqlite
```

### Recommended for Testing

```bash
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:80,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
RATE_LIMIT_ENABLED=true
MAX_LOGIN_ATTEMPTS=10
LOG_LEVEL=INFO
```

---

## 🔧 Common Commands

```bash
# Start
docker-compose -f docker-compose.test.yml up -d

# Stop
docker-compose -f docker-compose.test.yml down

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Restart
docker-compose -f docker-compose.test.yml restart

# Update
docker-compose -f docker-compose.test.yml pull
docker-compose -f docker-compose.test.yml up -d --build

# Backup database
docker cp colony-backend:/data/colony_manager.sqlite ./backup-$(date +%Y%m%d).sqlite

# Clean up
docker system prune -a
```

---

## 🏥 Health Checks

```bash
# Backend health
curl http://localhost:8000/api/v1/health

# Frontend health
curl -I http://localhost:80

# Container status
docker ps --filter "name=colony"

# Resource usage
docker stats colony-backend colony-frontend --no-stream
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 80
netstat -ano | findstr ":80 "

# Change port in docker-compose.test.yml
ports:
  - "8080:80"  # Use 8080 instead
```

### Container Won't Start

```bash
# View logs
docker logs colony-backend

# Check environment
docker exec colony-backend env | grep JWT

# Restart
docker-compose -f docker-compose.test.yml restart backend
```

### Database Issues

```bash
# Backup current database
docker cp colony-backend:/data/colony_manager.sqlite ./backup.sqlite

# Remove and recreate
docker exec colony-backend rm /data/colony_manager.sqlite
docker-compose -f docker-compose.test.yml restart backend
```

---

## 📊 URLs After Deployment

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost | 80 |
| Backend API | http://localhost:8000 | 8000 |
| API Docs | http://localhost:8000/docs | 8000 |
| Portainer | http://localhost:9000 | 9000 |

---

## 🔐 GitHub Actions Deployment

### Setup SSH Key

```bash
# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f github-actions-key

# Add to authorized_keys
cat github-actions-key.pub >> ~/.ssh/authorized_keys

# Add to GitHub Secrets (base64)
cat github-actions-key | base64 -w 0
```

### GitHub Secrets

| Name | Value |
|------|-------|
| `MINI_PC_HOST` | Your mini-PC IP |
| `MINI_PC_USERNAME` | SSH username |
| `MINI_PC_SSH_KEY` | Base64 private key |

### Trigger Deployment

1. GitHub → Actions → CI/CD Pipeline
2. **Run workflow**
3. Select **testing** environment
4. **Run workflow**

---

## 📚 Full Documentation

- [CICD_INFRASTRUCTURE.md](CICD_INFRASTRUCTURE.md) — Complete CI/CD guide
- [DEPLOYMENT_CHECKLIST_MINI_PC.md](DEPLOYMENT_CHECKLIST_MINI_PC.md) — Detailed checklist
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) — Deployment status
- [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md) — Security hardening

---

**Quick Support:** Check container logs first for most issues  
**Last Updated:** 2026-08-30