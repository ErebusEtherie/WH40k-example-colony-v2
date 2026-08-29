# Security Configuration Guide

**Purpose:** Secure production deployment of WH40k Colony Manager  
**Version:** 1.0  
**Date:** 2026-08-29

---

## Critical Security Settings

### 1. JWT Secret Key

**File:** `.env.production`  
**Variable:** `JWT_SECRET_KEY`

```bash
# Generate a secure random key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Unique per deployment
- Stored securely (password manager, secrets manager)

**Never:**
- ❌ Use the development default
- ❌ Commit to version control
- ❌ Share in chat/email
- ❌ Reuse across environments

---

### 2. Cookie Security

**File:** `.env.production`

```bash
COOKIE_SECURE=True          # Required for HTTPS
COOKIE_SAME_SITE=lax        # CSRF protection
COOKIE_HTTPONLY=True        # Prevents XSS token theft
```

**Why it matters:**
- `COOKIE_SECURE=True`: Ensures cookies only sent over HTTPS
- `COOKIE_SAME_SITE=lax`: Prevents CSRF attacks
- `COOKIE_HTTPONLY=True`: Prevents JavaScript access (XSS protection)

**Verification:**
```javascript
// In browser DevTools → Application → Cookies
// Check that cookies have:
// - Secure flag ✓
// - HttpOnly flag ✓
// - SameSite attribute ✓
```

---

### 3. CORS Configuration

**File:** `.env.production`

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=True
```

**Security Rules:**
- ✅ Only list specific, trusted domains
- ✅ Use HTTPS URLs only
- ❌ Never use wildcard (`*`) with credentials
- ❌ Never allow `null` origin in production

**Testing:**
```bash
# Test CORS from browser console
fetch('https://api.yourdomain.com/api/v1/health', {
  credentials: 'include'
}).then(r => console.log('CORS OK:', r.ok))
```

---

### 4. Rate Limiting

**File:** `.env.production`

```bash
RATE_LIMIT_ENABLED=True
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

**Purpose:** Prevents brute-force attacks on authentication

**Recommended Values:**
- `MAX_LOGIN_ATTEMPTS`: 5 (lock after 5 failed attempts)
- `LOCKOUT_DURATION_MINUTES`: 15 (15-minute lockout)

**Monitoring:**
- Track authentication failures in logs
- Alert on unusual patterns (many IPs, many usernames)

---

### 5. Password Policy

**File:** `.env.production`

```bash
MIN_PASSWORD_LENGTH=8
REQUIRE_PASSWORD_COMPLEXITY=True
```

**Complexity Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

### 6. HTTPS/TLS Configuration

**Required for Production:**

1. **Obtain SSL Certificate**
   - Let's Encrypt (free, auto-renewal)
   - Commercial CA (paid, extended validation)

2. **Configure Web Server**
   ```nginx
   server {
       listen 80;
       server_name colony.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       ssl_protocols TLSv1.2 TLSv1.3;
       add_header Strict-Transport-Security "max-age=31536000" always;
   }
   ```

3. **Verify Configuration**
   - Use: https://www.ssllabs.com/ssltest/

---

### 7. Database Security

**SQLite:**
- Store outside web root
- Restrict file permissions (600)
- Regular backups

**PostgreSQL:**
- Use strong, unique passwords
- Enable SSL for connections
- Network isolation

---

### 8. Logging & Audit

**File:** `.env.production`

```bash
LOG_LEVEL=INFO
```

**Log:**
- ✅ Authentication attempts
- ✅ Authorization failures
- ✅ Token refresh events
- ✅ Password changes

**Don't Log:**
- ❌ Passwords
- ❌ Full JWT tokens
- ❌ PII

---

## Security Checklist

### Before Deployment

- [ ] JWT_SECRET_KEY generated and secured
- [ ] COOKIE_SECURE=True
- [ ] HTTPS certificate installed
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Password complexity enabled
- [ ] Database secured and backed up
- [ ] Logging configured

### After Deployment

- [ ] Verify HTTPS redirect works
- [ ] Test cookie security flags
- [ ] Verify CORS headers
- [ ] Test rate limiting (5 failed logins)
- [ ] Review logs for security events

### Ongoing Maintenance

- [ ] Monitor authentication failures
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Renew SSL certificate before expiry
- [ ] Test backup restoration quarterly

---

## Security Incident Response

### If JWT Secret Compromised

1. Generate new JWT_SECRET_KEY
2. Deploy updated configuration
3. All existing sessions invalidated
4. Notify users of forced logout
5. Investigate breach source

### If Database Compromised

1. Take application offline
2. Preserve evidence
3. Reset all user passwords
4. Determine scope of breach
5. Notify affected users

---

**Last Updated:** 2026-08-29  
**Next Review:** 2027-02-29 (6 months)