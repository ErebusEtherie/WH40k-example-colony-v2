# Production Deployment Checklist

**Document Version:** 2.0  
**Last Updated:** 2026-08-30  
**Related:** [ROADMAP.md](ROADMAP.md), [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md)

---

## Overview

This checklist covers the complete deployment process for the WH40k Colony Manager, including environment configuration, security hardening, infrastructure setup, and operational procedures.

**Prerequisites:**

- Python 3.12+
- uv package manager
- SQLite (built-in) or PostgreSQL for production
- Reverse proxy (nginx, Caddy, or cloud load balancer)
- SSL/TLS certificate

---

---

## Pre-Deployment Preparation

### 1. Environment Configuration

#### Backend (.env.production)

- [ ] **Generate JWT Secret Key**

  ```powershell
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

  - [ ] Copy generated key to `.env.production`
  - [ ] Verify key is at least 32 characters
  - [ ] Store backup of key in secure location (password manager)

- [ ] **Configure Security Settings**
  - [ ] `COOKIE_SECURE=True` (required for HTTPS)
  - [ ] `COOKIE_SAME_SITE=lax`
  - [ ] `ENVIRONMENT=production`
  - [ ] `REQUIRE_PASSWORD_COMPLEXITY=True`
  - [ ] `RATE_LIMIT_ENABLED=True`

- [ ] **Configure CORS**
  - [ ] Set `ALLOWED_ORIGINS` to production domain(s)
  - [ ] Example: `https://colony.yourdomain.com,https://admin.yourdomain.com`
  - [ ] Verify `CORS_ALLOW_CREDENTIALS=True`

- [ ] **Configure Database**
  - [ ] Set `DATABASE_PATH` to production location
  - [ ] For SQLite: Use absolute path (e.g., `/var/lib/colony_manager/colony_manager.sqlite`)
  - [ ] For PostgreSQL: Set `DATABASE_URL` connection string
  - [ ] Verify database directory exists and is writable

- [ ] **Configure Logging**
  - [ ] Set `LOG_LEVEL=INFO` (or `WARNING` for production)
  - [ ] Verify log directory exists
  - [ ] Configure log rotation (if using external logging)

#### Frontend (frontend/.env.production)

- [ ] **Configure API URL**
  - [ ] Set `VITE_API_BASE_URL` to production backend URL
  - [ ] Example: `https://api.yourdomain.com`
  - [ ] Verify URL uses HTTPS

- [ ] **Configure Application Settings**
  - [ ] Set `VITE_APP_TITLE` (optional)
  - [ ] Remove any debug flags (`VITE_DEBUG_MODE=false`)
  - [ ] Verify `VITE_USE_MOCK_API=false`

---

### 2. Security Verification

- [ ] **HTTPS/SSL Certificate**
  - [ ] SSL certificate installed and valid
  - [ ] Certificate covers all domains (www, api, admin, etc.)
  - [ ] Auto-renewal configured (Let's Encrypt or similar)
  - [ ] HTTP → HTTPS redirect configured

- [ ] **Cookie Security**
  - [ ] `COOKIE_SECURE=True` verified in production environment
  - [ ] Cookies only transmitted over HTTPS
  - [ ] httpOnly flag set (prevents JavaScript access)
  - [ ] SameSite attribute configured

---

### 3. Infrastructure Setup

#### Backend Server

- [ ] **Server Requirements**
  - [ ] Python 3.11+ installed
  - [ ] Virtual environment created
  - [ ] All dependencies installed (`pip install -r requirements.txt`)
  - [ ] Server has adequate resources (CPU, RAM, disk)

- [ ] **Process Management**
  - [ ] uvicorn/gunicorn configured for production
  - [ ] Multiple workers configured (recommended: 4)
  - [ ] Process manager configured (systemd, supervisor, PM2, etc.)
  - [ ] Auto-restart on failure configured

- [ ] **Database Migrations**
  - [ ] Alembic migrations run: `python -m alembic upgrade head`
  - [ ] Database schema verified
  - [ ] Initial admin user created (if needed)

#### Frontend Server

- [ ] **Build Process**
  - [ ] Node.js 18+ installed
  - [ ] Dependencies installed (`npm install`)
  - [ ] Production build created (`npm run build`)
  - [ ] Build successful (dist/ directory created)

- [ ] **Web Server Configuration**
  - [ ] Static files served from `dist/` directory
  - [ ] SPA routing configured (fallback to index.html)
  - [ ] Gzip/brotli compression enabled
  - [ ] Cache headers configured for static assets

- [ ] **CDN (Optional)**
  - [ ] Static assets uploaded to CDN
  - [ ] CDN configured with correct cache headers
  - [ ] Cache invalidation strategy defined

---

## Deployment Execution

### Backend Deployment

#### Reverse Proxy Configuration

- [ ] **nginx Configuration** (example)

  ```nginx
  server {
      listen 80;
      server_name your-domain.com;
      return 301 https://$server_name$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name your-domain.com;

      ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
      ssl_protocols TLSv1.2 TLSv1.3;

      location / {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-Proto $scheme;

          # Security headers
          add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
          add_header X-Content-Type-Options "nosniff" always;
          add_header X-Frame-Options "DENY" always;
      }
  }
  ```

- [ ] **Firewall Configuration**

  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```

- [ ] **File Permissions**

  ```bash
  chown -R www-data:www-data /path/to/WH40k_Colony_Manager
  chmod 600 /path/to/WH40k_Colony_Manager/.env
  ```

---

#### Database Setup

- [ ] **SQLite** (Development/Small Deployments)

  ```bash
  mkdir -p /var/lib/colony-manager
  chown www-data:www-data /var/lib/colony-manager
  ```

- [ ] **PostgreSQL** (Production)

  ```bash
  # Install and create database
  sudo -u postgres psql
  CREATE DATABASE colony_manager;
  CREATE USER colony_user WITH PASSWORD 'secure-password';
  GRANT ALL PRIVILEGES ON DATABASE colony_manager TO colony_user;

  # Install adapter
  uv pip install psycopg2-binary
  ```

---

#### Backup & Recovery

- [ ] **Backup Script** (`/usr/local/bin/backup-colony-db.sh`)

  ```bash
  BACKUP_DIR="/var/backups/colony-manager"
  DATE=$(date +%Y%m%d_%H%M%S)
  cp /var/lib/colony-manager/colony_manager.sqlite "$BACKUP_DIR/colony_manager_$DATE.sqlite"
  find "$BACKUP_DIR" -name "*.sqlite" -mtime +7 -delete
  ```

- [ ] **Cron Job** (daily at 2 AM)

  ```bash
  0 2 * * * /usr/local/bin/backup-colony-db.sh
  ```

- [ ] **Backup Verification**
  - [ ] Backup directory exists and is writable
  - [ ] Test backup restoration procedure
  - [ ] Verify backup retention policy (7 days default)

---

#### Update Procedure

- [ ] **Standard Update**

  1. Backup database
  2. `git pull origin main`
  3. `uv pip install --upgrade -r requirements.txt`
  4. `sudo systemctl restart colony-manager`
  5. Verify: `curl http://localhost:8000/api/v1/health`

- [ ] **Rollback Procedure**

  ```powershell
  # 1. Stop application
  sudo systemctl stop colony-manager

  # 2. Restore database from backup
  cp /var/backups/colony-manager/colony_manager_YYYYMMDD_HHMMSS.sqlite /var/lib/colony-manager/colony_manager.sqlite

  # 3. Restore previous code version
  git checkout <previous-commit>

  # 4. Restart application
  sudo systemctl start colony-manager
  ```

---

```powershell
# Navigate to project root
cd d:\Projekty\WH40k_Colony_Manager

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run database migrations
python -m alembic upgrade head

# Start production server (example with uvicorn)
uvicorn src.colony_manager.adapters.api.app:app `
  --host 0.0.0.0 `
  --port 8000 `
  --workers 4 `
  --env-file .env.production
```

- [ ] Virtual environment activated
- [ ] Dependencies verified
- [ ] Database migrations completed successfully
- [ ] Server started without errors
- [ ] Health check endpoint responds (`/api/v1/health`)

### Frontend Deployment

```powershell
# Navigate to frontend directory
cd d:\Projekty\WH40k_Colony_Manager\frontend

# Build for production
npm run build

# Deploy dist/ folder to web server
# (Copy to nginx, Vercel, Netlify, etc.)
```

- [ ] Build completed without errors
- [ ] dist/ folder created
- [ ] Files uploaded to web server
- [ ] Frontend accessible via browser

---

## Post-Deployment Verification

### 1. Basic Functionality Tests

- [ ] **Homepage Loads**
  - [ ] Frontend loads without errors
  - [ ] No console errors in browser DevTools
  - [ ] Static assets (CSS, JS, fonts) load correctly

- [ ] **API Connectivity**
  - [ ] Frontend successfully connects to backend API
  - [ ] No CORS errors in browser console
  - [ ] API responses return expected data

### 2. Authentication Flow Tests

- [ ] **User Registration**
  - [ ] Registration form displays correctly
  - [ ] New user can register
  - [ ] Validation errors display correctly
  - [ ] Auto-login after registration works

- [ ] **Login**
  - [ ] Login form displays correctly
  - [ ] Valid credentials authenticate successfully
  - [ ] Invalid credentials show error message
  - [ ] httpOnly cookies set (check DevTools → Application → Cookies)
  - [ ] User redirected to dashboard after login

### 3. Authorization Tests

- [ ] **Role-Based Access**
  - [ ] Admin users can access admin endpoints
  - [ ] Regular users cannot access admin endpoints
  - [ ] Viewer users have read-only access
  - [ ] 403 errors returned for unauthorized access

- [ ] **Protected Routes**
  - [ ] Unauthenticated users redirected to login
  - [ ] Protected API endpoints return 401 without auth
  - [ ] Authenticated users can access protected pages

### 4. Colony Management Tests

- [ ] **Colony Operations**
  - [ ] Create new colony
  - [ ] Edit colony details
  - [ ] View colony stats
  - [ ] Add infrastructure/upgrades
  - [ ] Add modifiers
  - [ ] View audit logs

### 5. Security Tests

- [ ] **Cookie Security**
  - [ ] Cookies have `Secure` flag (HTTPS only)
  - [ ] Cookies have `httpOnly` flag
  - [ ] Cookies have `SameSite` attribute
  - [ ] Cookies not accessible via JavaScript

- [ ] **Rate Limiting**
  - [ ] Multiple failed logins trigger lockout
  - [ ] Lockout message displays correctly
  - [ ] Lockout expires after configured duration

- [ ] **Input Validation**
  - [ ] XSS attempts sanitized
  - [ ] SQL injection attempts blocked
  - [ ] Invalid data rejected with appropriate errors

---

## Monitoring & Maintenance

### Logging Configuration

- [ ] **Application Logs**
  - [ ] Logs written to configured location
  - [ ] Log level set to INFO or WARNING
  - [ ] Log rotation configured (if applicable)
  - [ ] Logs include timestamps and severity levels

- [ ] **Error Tracking**
  - [ ] Critical errors logged
  - [ ] Authentication failures logged
  - [ ] Database errors logged
  - [ ] Alert mechanism configured (email, Slack, etc.)

### Backup Strategy

- [ ] **Database Backups**
  - [ ] Automated backup schedule configured (daily recommended)
  - [ ] Backups stored in secure, off-site location
  - [ ] Backup retention policy defined (30 days recommended)
  - [ ] Backup restoration procedure documented and tested

- [ ] **Configuration Backups**
  - [ ] Environment files backed up securely
  - [ ] SSL certificates backed up with renewal reminders
  - [ ] Deployment scripts version controlled

### Health Monitoring

- [ ] **Uptime Monitoring**
  - [ ] External monitoring service configured (UptimeRobot, Pingdom, etc.)
  - [ ] Health check endpoint monitored (`/api/v1/health`)
  - [ ] Alert thresholds configured (response time, error rate)

- [ ] **Performance Monitoring**
  - [ ] Response times tracked
  - [ ] Error rates monitored
  - [ ] Resource usage tracked (CPU, memory, disk)
  - [ ] Database query performance monitored

---

## Rollback Procedure

If deployment fails or issues are discovered:

### Backend Rollback

```powershell
# 1. Stop the application
# (Depends on process manager - systemd, supervisor, etc.)

# 2. Restore database from backup
python -m alembic downgrade -1

# 3. Restore previous code version
git checkout <previous-commit>

# 4. Restart application
# (Depends on process manager)
```

### Frontend Rollback

```powershell
# 1. Restore previous build from backup
# 2. Deploy to web server
# 3. Verify functionality
```

---

## Troubleshooting

### Common Issues

#### CORS Errors

**Symptom:** Frontend shows CORS errors in console

**Solution:**

1. Verify `ALLOWED_ORIGINS` includes frontend URL
2. Ensure `CORS_ALLOW_CREDENTIALS=True`
3. Check backend is running and accessible
4. Verify no proxy/load balancer stripping headers

#### Cookie Not Set

**Symptom:** Login succeeds but cookies not set

**Solution:**

1. Verify HTTPS is enabled (required for `COOKIE_SECURE=True`)
2. Check `COOKIE_SAME_SITE` setting
3. Verify domain matches cookie domain
4. Check browser DevTools for cookie warnings

#### Token Refresh Fails

**Symptom:** Session expires unexpectedly

**Solution:**

1. Verify refresh token expiry setting
2. Check token refresh endpoint is accessible
3. Verify clock synchronization between client/server
4. Check for token blacklisting issues

#### Database Migration Fails

**Symptom:** Alembic migration errors

**Solution:**

1. Backup database before retrying
2. Check migration script for errors
3. Verify database user has correct permissions
4. Run `alembic history` to check migration state

---

## Success Criteria

Deployment is considered successful when:

- [ ] All pre-deployment checklist items complete
- [ ] All post-deployment verification tests pass
- [ ] No critical errors in logs after 24 hours
- [ ] Monitoring/alerting configured and tested
- [ ] Backup procedure verified
- [ ] Rollback procedure documented and tested
- [ ] User documentation updated
- [ ] Team notified of deployment

---

## Related Documents

- [ROADMAP.md](ROADMAP.md) — Project roadmap and future phases
- [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md) — Security hardening guide
- [.env.example](../.env.example) — Environment variable template
- [api_reference.md](api_reference.md) — API documentation

---

**Last Updated:** 2026-08-30  
**Next Review:** After first production deployment
