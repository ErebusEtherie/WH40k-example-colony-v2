# Security Policy - WH40k Colony Manager

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization

- **JWT Token-Based Authentication**: All protected endpoints require a valid JWT access token
- **Refresh Token Rotation**: Refresh tokens are rotated on each use to prevent replay attacks
- **Password Hashing**: Passwords are hashed using bcrypt with 12 rounds
- **Password Policy**: Configurable minimum length and complexity requirements
- **Role-Based Access Control**: Users assigned roles (viewer, colony_manager, admin)

### Token Security

- Access tokens expire after 30 minutes (configurable)
- Refresh tokens expire after 7 days (configurable)
- Tokens are signed using HS256 algorithm
- Token validation includes expiration and type checking

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

1. **Rate Limiting**: Basic rate limiting is configurable but not enforced at the application level. Consider adding a reverse proxy (nginx, Cloudflare) for production.

2. **Account Lockout**: Login attempt tracking is not yet implemented. Brute force protection should be added at the infrastructure level.

3. **Audit Logging**: User actions are not currently logged. Consider adding audit trails for security-sensitive operations.

4. **Session Management**: No mechanism to revoke tokens before expiration. Implement token blacklist if early revocation is needed.

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

## Security Headers (Recommended)

When deploying behind a reverse proxy, add these headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Last Updated

2026-08-19