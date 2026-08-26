# Deployment Guide - WH40k Colony Manager

This guide covers deploying the WH40k Colony Manager API to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Running in Production](#running-in-production)
5. [Security Hardening](#security-hardening)
6. [Backup & Recovery](#backup--recovery)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Python 3.12+
- uv package manager
- SQLite (built-in) or PostgreSQL for production
- Reverse proxy (nginx, Caddy, or cloud load balancer)
- SSL/TLS certificate

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` with production values:

```bash
# SECURITY - CRITICAL
JWT_SECRET_KEY=<generate-secure-random-string>
ENVIRONMENT=production

# CORS - Set to your frontend domain
ALLOWED_ORIGINS=https://your-domain.com

# DATABASE
DATABASE_PATH=/var/lib/colony-manager/colony_manager.sqlite

# LOGGING
LOG_LEVEL=WARNING

# SECURITY HARDENING
RATE_LIMIT_ENABLED=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
MIN_PASSWORD_LENGTH=12
REQUIRE_PASSWORD_COMPLEXITY=true
```

### 3. Generate JWT Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Database Setup

### SQLite (Development/Small Deployments)

```bash
mkdir -p /var/lib/colony-manager
chown www-data:www-data /var/lib/colony-manager
```

---

## Security Hardening

### 1. Reverse Proxy (nginx)

```nginx
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

### 2. Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. File Permissions

```bash
chown -R www-data:www-data /path/to/WH40k_Colony_Manager
chmod 600 /path/to/WH40k_Colony_Manager/.env
```

---

## Backup & Recovery

### SQLite Backup

```bash
# /usr/local/bin/backup-colony-db.sh
BACKUP_DIR="/var/backups/colony-manager"
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/lib/colony-manager/colony_manager.sqlite "$BACKUP_DIR/colony_manager_$DATE.sqlite"
find "$BACKUP_DIR" -name "*.sqlite" -mtime +7 -delete
```

```bash
# Crontab (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-colony-db.sh
```

---

## Troubleshooting

### Application Won't Start

```bash
journalctl -u colony-manager -n 50
```

Common issues:

- JWT_SECRET_KEY not set
- Database path not writable
- Port already in use

### Database Locked (SQLite)

```bash
sqlite3 /var/lib/colony-manager/colony_manager.sqlite "PRAGMA journal_mode=WAL;"
```

### Token Authentication Failing

- Verify JWT_SECRET_KEY is set correctly
- Ensure server clocks are synchronized (NTP)

---

## Update Procedure

1. Backup database
2. `git pull origin main`
3. `uv pip install --upgrade -r requirements.txt`
4. `sudo systemctl restart colony-manager`
5. Verify: `curl http://localhost:8000/api/v1/health`

---

**Last Updated**: 2026-08-19

### PostgreSQL (Production)

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

## Running in Production

### Option 1: Uvicorn with Gunicorn

```bash
uv pip install gunicorn
gunicorn colony_manager.adapters.api.app:create_app \
  -w 4 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Option 2: Systemd Service

Create `/etc/systemd/system/colony-manager.service`:

```ini
[Unit]
Description=WH40k Colony Manager API
After=network.target

[Service]
Type=exec
User=www-data
WorkingDirectory=/path/to/WH40k_Colony_Manager
Environment="PATH=/path/to/.venv/bin"
Environment="ENVIRONMENT=production"
ExecStart=/path/to/.venv/bin/uvicorn colony_manager.adapters.api.app:create_app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable colony-manager
sudo systemctl start colony-manager
```
