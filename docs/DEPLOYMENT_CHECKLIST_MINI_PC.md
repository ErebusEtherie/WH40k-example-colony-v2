# Deployment Checklist - Mini-PC Testing Environment

**Purpose:** Step-by-step checklist for deploying WH40k Colony Manager to mini-PC with Portainer  
**Environment:** Testing/Development  
**Last Updated:** 2026-08-30

---

## Pre-Deployment

### Hardware & Software Verification

- [ ] Mini-PC powered on and accessible
- [ ] Docker installed (`docker --version` → 24.0+)
- [ ] Docker Compose installed (`docker compose version` → 2.20+)
- [ ] Portainer installed (optional, for web UI management)
- [ ] SSH access configured (for GitHub Actions deployment)
- [ ] Sufficient disk space (minimum 20 GB free)
- [ ] Network connectivity verified

### Repository Preparation

- [ ] Clone repository to mini-PC (if using local deployment)
  ```bash
  git clone https://github.com/your-org/WH40k_Colony_Manager.git
  cd WH40k_Colony_Manager
  ```
- [ ] Verify all Docker files present:
  - [ ] `Dockerfile` (backend)
  - [ ] `frontend/Dockerfile`
  - [ ] `frontend/nginx.conf`
  - [ ] `docker-compose.test.yml`
  - [ ] `.env.example`

---

## Configuration

### Environment Variables

- [ ] Copy environment template
  ```bash
  cp .env.example .env
  ```

- [ ] Generate secure JWT secret key
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

- [ ] Update `.env` file with:
  - [ ] `JWT_SECRET_KEY=<generated-key>`
  - [ ] `VITE_API_BASE_URL=http://<mini-pc-ip>:8000`
  - [ ] `ALLOWED_ORIGINS=http://<mini-pc-ip>,http://localhost`
  - [ ] `DATABASE_PATH=/data/colony_manager.sqlite`

### Port Configuration

- [ ] Verify ports are available:
  ```bash
  # Check if ports 80, 8000, 9000 are in use
  netstat -an | findstr ":80 "
  netstat -an | findstr ":8000 "
  netstat -an | findstr ":9000 "
  ```
- [ ] Update `docker-compose.test.yml` if ports conflict

---

## Portainer Installation (Optional but Recommended)

- [ ] Create Portainer volume
  ```bash
  docker volume create portainer_data
  ```

- [ ] Deploy Portainer
  ```bash
  docker run -d \
    --name portainer \
    --restart=unless-stopped \
    -p 9000:9000 \
    -p 8000:8000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
  ```

- [ ] Access Portainer UI: http://<mini-pc-ip>:9000
- [ ] Create admin user (first-time setup)
- [ ] Connect to local Docker environment

---

## Application Deployment

### Option A: Portainer Stack Deployment

- [ ] Navigate to **Stacks** in Portainer
- [ ] Click **"Add stack"**
- [ ] Name: `wh40k-colony-manager`
- [ ] Build method: **Web Editor**
- [ ] Paste contents of `docker-compose.test.yml`
- [ ] Add environment variables in editor:
  - [ ] `JWT_SECRET_KEY`
  - [ ] `VITE_API_BASE_URL`
- [ ] Click **"Deploy the stack"**
- [ ] Wait for deployment (2-3 minutes)
- [ ] Verify all containers show **"Running"** status
---

## Post-Deployment Verification

### Container Health

- [ ] All containers running
  ```bash
  docker ps --filter "name=colony"
  ```

- [ ] Backend health check passes
  ```bash
  curl http://localhost:8000/api/v1/health
  # Expected: {"status": "healthy", ...}
  ```

- [ ] Frontend responds
  ```bash
  curl -I http://localhost:80
  # Expected: HTTP/1.1 200 OK
  ```

### Application Testing

- [ ] Access frontend: http://<mini-pc-ip>
- [ ] Login page loads correctly
- [ ] Access API docs: http://<mini-pc-ip>:8000/docs
- [ ] Swagger UI loads
- [ ] Create test user account
- [ ] Create test colony
- [ ] Verify data persists after page refresh

### Log Verification

- [ ] Check backend logs for errors
  ```bash
  docker logs colony-backend --tail 50
  ```

- [ ] Check frontend logs for errors
  ```bash
  docker logs colony-frontend --tail 50
  ```

- [ ] No ERROR or CRITICAL messages in logs

---

## Security Hardening (Testing Environment)

- [ ] Verify non-root user in containers
  ```bash
  docker exec colony-backend whoami
  # Expected: colony (not root)
  ```

- [ ] Rate limiting enabled (check `.env`)
  - [ ] `RATE_LIMIT_ENABLED=true`
  - [ ] `MAX_LOGIN_ATTEMPTS=10`

- [ ] Password requirements configured
  - [ ] `MIN_PASSWORD_LENGTH=8`

- [ ] CORS configured correctly
  - [ ] `ALLOWED_ORIGINS` matches frontend URL

---

## Backup Configuration

- [ ] Create backup directory
  ```bash
  mkdir -p /opt/wh40k-colony-manager/backups
  ```

- [ ] Enable backup service (optional)
  ```bash
  docker-compose -f docker-compose.test.yml --profile backup up -d
  ```

- [ ] Verify backup runs daily
- [ ] Test manual backup
  ```bash
  docker cp colony-backend:/data/colony_manager.sqlite ./backup-test.sqlite
  ```

---

## GitHub Actions Integration (Optional)

### SSH Key Setup

- [ ] Generate SSH key on mini-PC
  ```bash
  ssh-keygen -t ed25519 -C "github-actions" -f github-actions-key
  ```

- [ ] Copy public key to authorized_keys
  ```bash
  cat github-actions-key.pub >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  ```

- [ ] Test SSH connection (from another machine)
  ```bash
  ssh -i github-actions-key user@mini-pc-ip
  ```

- [ ] Add private key to GitHub Secrets
  ```bash
  cat github-actions-key | base64 -w 0
  # Copy output to GitHub → Settings → Secrets → MINI_PC_SSH_KEY
  ```

### GitHub Secrets Configuration

- [ ] `MINI_PC_HOST` - Mini-PC IP address
- [ ] `MINI_PC_USERNAME` - SSH username
- [ ] `MINI_PC_SSH_KEY` - Base64-encoded private key

### Test Deployment Workflow

- [ ] Navigate to **Actions** tab in GitHub
- [ ] Select **CI/CD Pipeline**
- [ ] Click **"Run workflow"**
- [ ] Select **testing** environment
- [ ] Monitor workflow execution
- [ ] Verify deployment on mini-PC

---

## Monitoring Setup

### Resource Monitoring

- [ ] Check container resource usage
  ```bash
  docker stats colony-backend colony-frontend --no-stream
  ```

- [ ] Document baseline resource usage:
  - [ ] Backend CPU: _____%
  - [ ] Backend Memory: _____ MB
  - [ ] Frontend CPU: _____%
  - [ ] Frontend Memory: _____ MB

### Log Rotation

- [ ] Configure Docker log rotation (if not already)
  ```bash
  # /etc/docker/daemon.json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    }
  }
  ```

- [ ] Restart Docker daemon if changed
  ```bash
  systemctl restart docker
  ```

---

## Documentation Updates

- [ ] Record deployment date in `DEPLOYMENT_STATUS.md`
- [ ] Document mini-PC IP address
- [ ] Document any custom configurations
- [ ] Update network diagram if topology changed

---

## Rollback Procedure

If deployment fails:

1. [ ] Stop current deployment
   ```bash
   docker-compose -f docker-compose.test.yml down
   ```

2. [ ] Restore previous database backup
   ```bash
   docker cp backup-YYYYMMDD.sqlite colony-backend:/data/colony_manager.sqlite
   ```

3. [ ] Checkout previous version
   ```bash
   git checkout <previous-tag>
   ```

4. [ ] Redeploy
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

---

## Success Criteria

Deployment is successful when:

- [ ] All containers running and healthy
- [ ] Frontend accessible at http://<mini-pc-ip>
- [ ] Backend API accessible at http://<mini-pc-ip>:8000
- [ ] User can create account and login
- [ ] Colony data persists correctly
- [ ] No errors in container logs
- [ ] Backup system operational

---

## Next Steps

After successful deployment:

1. [ ] Configure automatic updates (optional)
2. [ ] Set up monitoring/alerting (optional)
3. [ ] Configure SSL certificate (if exposing externally)
4. [ ] Document access credentials securely
5. [ ] Schedule regular backup verification

---

**Checklist Version:** 1.0  
**Compatible With:** Docker 24.0+, Portainer 2.19+  
**Support:** See `docs/CICD_INFRASTRUCTURE.md` for detailed instructions

### Option B: Docker Compose CLI Deployment

- [ ] Navigate to project directory
  ```bash
  cd /path/to/WH40k_Colony_Manager
  ```

- [ ] Start services
  ```bash
  docker-compose -f docker-compose.test.yml up -d
  ```

- [ ] Wait for build and startup (5-10 minutes first time)
- [ ] Check container status
  ```bash
  docker-compose -f docker-compose.test.yml ps
  ```