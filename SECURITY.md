# Security Policy - WH40k Colony Manager

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization

- **JWT Token-Based Authentication**: All protected endpoints require a valid JWT access token
- **Refresh Token Rotation**: Refresh tokens are rotated on each use to prevent replay attacks
- **Token Revocation**: Tokens can be revoked via `/auth/revoke` (single token) or `/auth/revoke-all` (all user tokens)
- **Token Blacklist**: Revoked tokens are stored in a SQLite blacklist and rejected even if cryptographically valid
- **Password Hashing**: Passwords are hashed using bcrypt with 12 rounds
- **Password Policy**: Configurable minimum length and complexity requirements
- **Role-Based Access Control**: Users assigned roles (viewer, colony_manager, admin)
- **Admin Token Revocation**: Administrators can revoke tokens for any user (useful for compromised accounts)

### Token Security

- Access tokens expire after 30 minutes (configurable)
- Refresh tokens expire after 7 days (configurable)
- Tokens are signed using HS256 algorithm
- Token validation includes expiration, type checking, and blacklist verification
- Each token includes a unique `jti` (JWT ID) claim for revocation support

### Security Headers

The following security headers are automatically added to all API responses:

| Header | Value | Notes |
|--------|-------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Production only (disabled in dev) |
| `X-Content-Type-Options` | `nosniff` | Always enabled |
| `X-Frame-Options` | `DENY` | Always enabled |
| `X-XSS-Protection` | `1; mode=block` | Always enabled |
| `Content-Security-Policy` | `default-src 'self'` | Always enabled |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Always enabled |

### Audit Logging

The following operations are logged to the `audit_logs` table:

- Colony creation, updates (each field change logged separately), and age updates
- Infrastructure creation, state updates, and deletion
- Support upgrade creation, updates, and deletion
- Representative creation, colony assignment, and unassignment
- Resource creation, updates (abundance/notes), and deletion
- Modifier additions

Audit logs include:

- Entity type and ID
- Action performed (create/update/delete/assign/unassign)
- Field changed (for updates)
- Old and new values
- User ID who made the change (if provided)
- Timestamp

Note: Audit logging is currently implemented for ColonyService. Other services should follow the same pattern.

### Input Validation

- All API inputs validated using Pydantic schemas
- SQL injection prevented via SQLAlchemy ORM (parameterized queries)
- XSS prevention via FastAPI's automatic response encoding

### Configuration Security

- Secrets loaded from environment variables
- `.env` files excluded from version control
- Development defaults clearly marked as insecure

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue
2. Email: [security-contact@example.com](mailto:security-contact@example.com)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and release patches for critical vulnerabilities within 7 days.

## Security Checklist for Deployment

### Before Production Deployment

- [ ] Set `JWT_SECRET_KEY` to a cryptographically secure random value (min 32 characters)
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure `ALLOWED_ORIGINS` to your frontend domain(s) only
- [ ] Enable HTTPS/TLS termination
- [ ] Set `LOG_LEVEL=WARNING` or higher
- [ ] Review and adjust rate limiting settings
- [ ] Ensure database file is in a secure, backed-up location
- [ ] Remove or secure any debug endpoints
- [ ] Verify CORS is not allowing wildcard origins

### Generate Secure JWT Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Environment Variables for Production

```bash
# Required
JWT_SECRET_KEY=<generated-secret>
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Recommended
LOG_LEVEL=WARNING
RATE_LIMIT_ENABLED=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
MIN_PASSWORD_LENGTH=12
REQUIRE_PASSWORD_COMPLEXITY=true
```

## Known Limitations

1. **Rate Limiting**: Basic rate limiting is implemented using SlowAPI but consider adding a reverse proxy (nginx, Cloudflare) for production-grade protection.

2. **Account Lockout**: Login attempt tracking is not yet implemented. Brute force protection should be added at the infrastructure level.

3. **Audit Logging Coverage**: Audit logging is currently implemented for ColonyService only. The following services still need audit logging:
   - InfrastructureService
   - SupportUpgradeService
   - DevelopmentPlanService
   - RepresentativeService

   These services should follow the same pattern as ColonyService (inject `AuditLogRepository` and log mutations).

4. **Token Blacklist Bulk Revocation**: The `revoke-all` endpoint currently returns 0 tokens revoked. A full implementation would require a token issuance log to track all tokens issued per user. For now, only explicitly revoked tokens (via `/auth/revoke`) are blacklisted.

5. **Token Blacklist Cleanup**: Expired blacklist entries are not automatically cleaned up. Consider adding a periodic cleanup job (e.g., weekly cron) to remove entries older than their expiration date.

## Dependencies

Security vulnerabilities in dependencies are monitored. Update dependencies regularly:

```bash
# Check for outdated packages
uv pip list --outdated

# Update all dependencies
uv pip install --upgrade -r requirements.txt

# Check for known vulnerabilities
pip-audit
```

## Last Updated

2026-08-21 - Added security headers middleware, token blacklist/revocation, and audit logging for ColonyService
