# Quick Deployment Reference Card

**WH40k Colony Manager — Mini-PC Testing Environment**  
**Version:** 1.0 | **Date:** 2026-08-30  
**PORTS:** Frontend: 8880 | Backend: 8001 | Portainer: 9090

---

## 🚀 One-Command Deployment

```bash
# Clone and setup
git clone https://github.com/your-org/WH40k_Colony_Manager.git
cd WH40k_Colony_Manager

# Generate JWT secret and create .env
python -c "import secrets; print(secrets.token_urlsafe(32))" > .env
echo "VITE_API_BASE_URL=http://localhost:8001" >> .env
echo "DATABASE_PATH=/data/colony_manager.sqlite" >> .env
echo "ENVIRONMENT=development" >> .env
echo "ALLOWED_ORIGINS=http://localhost:8880,http://localhost:3080" >> .env

# Deploy
docker-compose -f docker-compose.test.yml up -d --build

# Verify
curl http://localhost:8001/api/v1/health

# Access:
# Frontend: http://localhost:8880
# API Docs: http://localhost:8001/docs
```

---

## 🐳 Portainer (Port 9090)

```bash
docker volume create portainer_data
docker run -d --name portainer --restart=unless-stopped \
  -p 9090:9000 -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer-ce:latest
```

**Access:** <http://localhost:9090>

---

## ⚙️ Environment Variables

```bash
JWT_SECRET_KEY=your-secret-key-min-32-chars
VITE_API_BASE_URL=http://localhost:8001
DATABASE_PATH=/data/colony_manager.sqlite
ALLOWED_ORIGINS=http://localhost:8880,http://localhost:3080
```

---

## 🔧 Common Commands

```bash
# Start/Stop
docker-compose -f docker-compose.test.yml up -d
docker-compose -f docker-compose.test.yml down

# Logs
docker-compose -f docker-compose.test.yml logs -f

# Backup
docker cp colony-backend:/data/colony_manager.sqlite ./backup.sqlite
```

---

## 📊 URLs

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:8880> |
| Backend API | <http://localhost:8001> |
| API Docs | <http://localhost:8001/docs> |
| Portainer | <http://localhost:9090> |

---

## 🐛 Troubleshooting

```bash
# Check what's using a port
netstat -ano | findstr ":8880 "

# View logs
docker logs colony-backend

# Restart
docker-compose -f docker-compose.test.yml restart
```

---

**Full Guide:** [CICD_INFRASTRUCTURE.md](CICD_INFRASTRUCTURE.md)  
**Checklist:** [DEPLOYMENT_CHECKLIST_MINI_PC.md](DEPLOYMENT_CHECKLIST_MINI_PC.md)
