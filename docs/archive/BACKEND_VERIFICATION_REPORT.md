# Backend Authentication Verification Report

## Executive Summary

The backend has **PARTIAL** support for cookie-based authentication but is **MISSING CSRF protection**.

| Feature | Status | Details |
|---------|--------|---------|
| HttpOnly Cookies | ✅ **IMPLEMENTED** | Tokens stored in HttpOnly cookies |
| Cookie Configuration | ✅ **IMPLEMENTED** | Settings for secure/httponly/samesite |
| Token Refresh via Cookie | ✅ **IMPLEMENTED** | Refresh endpoint reads cookies |
| Logout Cookie Clearing | ✅ **IMPLEMENTED** | Cookies deleted on logout |
| CSRF Token Endpoint | ❌ **MISSING** | No `/auth/csrf-token` endpoint |
| CSRF Validation | ❌ **MISSING** | No X-CSRF-Token validation |
| Cookie-based Auth Middleware | ❌ **MISSING** | Still uses Bearer token header |

---

## Current Backend Implementation

### ✅ 1. HttpOnly Cookie Support (IMPLEMENTED)

**File:** `src/colony_manager/adapters/api/routers/auth_router.py`

The backend **already sets HttpOnly cookies** on login, register, and refresh:

```python
# Set httpOnly cookies for secure token storage
response.set_cookie(
    key=settings.cookie_access_token_name,
    value=access_token,
    max_age=settings.access_token_expire_minutes * 60,
    httponly=settings.cookie_httponly,
    secure=settings.cookie_secure,
    samesite=settings.cookie_samesite,
    path="/",
)
response.set_cookie(
    key=settings.cookie_refresh_token_name,
    value=refresh_token,
    max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    httponly=settings.cookie_httponly,
    secure=settings.cookie_secure,
    samesite=settings.cookie_samesite,
    path="/",
)
```

**Status:** ✅ Ready for frontend cookie-based auth

---

### ✅ 2. Cookie Configuration (IMPLEMENTED)

**File:** `src/colony_manager/config/settings.py`

```python
class SecuritySettings(BaseSettings):
    # Cookie Configuration (httpOnly for security)
    cookie_secure: bool = Field(
        default=False,  # Enable in production
        description="Use secure cookies (HTTPS only)"
    )
    cookie_samesite: str = Field(
        default="lax",
        description="Cookie SameSite attribute (lax, strict, none)"
    )
    cookie_httponly: bool = Field(
        default=True,
        description="Use httpOnly cookies (prevents XSS theft)"
    )
    cookie_access_token_name: str = Field(
        default="rt_access_token",
        description="Cookie name for access token"
    )
    cookie_refresh_token_name: str = Field(
        default="rt_refresh_token",
        description="Cookie name for refresh token"
    )
```

**Status:** ✅ All necessary cookie settings exist

---

### ✅ 3. Logout Cookie Clearing (IMPLEMENTED)

**File:** `src/colony_manager/adapters/api/routers/auth_router.py`

```python
# Clear httpOnly cookies on logout
settings = get_security_settings()
response.delete_cookie(
    key=settings.cookie_access_token_name,
    path="/",
)
response.delete_cookie(
    key=settings.cookie_refresh_token_name,
    path="/",
)
```

**Status:** ✅ Cookies properly cleared on logout

---

### ❌ 4. CSRF Token Endpoint (MISSING)

**Required:** `/auth/csrf-token` endpoint

The frontend expects this endpoint to exist and return a CSRF token after login:

```typescript
// Frontend expects (api.ts.secure line 301):
const csrfResponse = await fetchApi<{ csrf_token: string }>('/auth/csrf-token');
setCsrfToken(csrfResponse.csrf_token);
```

**Status:** ❌ **NOT IMPLEMENTED** - This endpoint does not exist

---

### ❌ 5. CSRF Token Validation (MISSING)

**Required:** Middleware or dependency to validate X-CSRF-Token header

The frontend will send CSRF tokens on state-changing requests:

```typescript
// Frontend sends (api.ts.secure line 208-210):
if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
  (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
}
```

**Status:** ❌ **NOT IMPLEMENTED** - No CSRF validation exists

---

### ❌ 6. Cookie-based Authentication Middleware (MISSING)

**Current Implementation:** Uses Bearer token from Authorization header

**File:** `src/colony_manager/adapters/api/middleware/auth.py`

```python
# Current: Reads from Authorization header
def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    # ...
) -> User:
    token = credentials.credentials  # Expects "Bearer <token>"
    # ...
```

**Required:** Support reading tokens from cookies

```python
# Needed: Read from cookies if Authorization header not present
def get_current_user_from_cookie(
    request: Request,
    # ...
) -> User:
    access_token = request.cookies.get(settings.cookie_access_token_name)
    # ...
```

**Status:** ❌ **NOT IMPLEMENTED** - Still requires Bearer token header

---

## Required Backend Changes

### Priority 1: CSRF Token Endpoint

**File to create/modify:** `src/colony_manager/adapters/api/routers/auth_router.py`

```python
import secrets
from fastapi import Request

@router.get("/csrf-token", response_model={"csrf_token": str})
async def get_csrf_token(request: Request):
    """Generate and return a CSRF token for the current session.
    
    The CSRF token is stored in a non-HttpOnly cookie so JavaScript can read it
    and include it in the X-CSRF-Token header for state-changing requests.
    """
    csrf_token = secrets.token_urlsafe(32)
    
    # Store CSRF token in session or temporary storage (optional)
    # For stateless CSRF, you can use a signed token
    
    response = JSONResponse(content={"csrf_token": csrf_token})
    
    # Set CSRF token in a non-HttpOnly cookie (JavaScript needs to read it)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=60 * 60,  # 1 hour
        httponly=False,  # Must be readable by JavaScript
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )
    
    return response
```

---

### Priority 2: CSRF Validation Middleware

**File to create:** `src/colony_manager/adapters/api/middleware/csrf.py`

```python
"""CSRF protection middleware."""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Validate CSRF tokens on state-changing requests."""
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF check for safe methods
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)
        
        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")
        
        if not csrf_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing",
            )
        
        # Validate CSRF token (compare with cookie or session)
        cookie_token = request.cookies.get("csrf_token")
        
        if not cookie_token or csrf_token != cookie_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token invalid",
            )
        
        return await call_next(request)
```

**Register middleware in:** `src/colony_manager/main.py` or `src/colony_manager/adapters/api/app.py`

```python
from colony_manager.adapters.api.middleware.csrf import CSRFProtectionMiddleware

app.add_middleware(CSRFProtectionMiddleware)
```

---

### Priority 3: Cookie-based Auth Dependency

**File to modify:** `src/colony_manager/adapters/api/middleware/auth.py`

```python
from fastapi import Request

# Add new dependency for cookie-based authentication
async def get_current_user_from_cookie(
    request: Request,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_blacklist_repository: Annotated[
        TokenBlacklistRepository, Depends(get_token_blacklist_repository)
    ],
) -> User:
    """Get current user from cookie-based authentication."""
    settings = get_security_settings()
    
    # Try to get token from cookie
    access_token = request.cookies.get(settings.cookie_access_token_name)
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validate token (same as Bearer token validation)
    secret_key = get_jwt_secret_key()
    
    try:
        payload = verify_token(access_token, secret_key, token_type="access")
        user_id = int(payload["sub"])
        
        # Check blacklist
        token_jti = payload.get("jti")
        if token_jti and token_blacklist_repository.is_blacklisted(token_jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        ) from e
    
    user = user_repository.get_by_id(user_id)
    
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    return user
```

---

### Priority 4: Update Refresh Endpoint

**File to modify:** `src/colony_manager/adapters/api/routers/auth_router.py`

Currently the refresh endpoint expects a JSON body with refresh_token. It should read from cookies:

```python
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    # Remove: refresh_request: RefreshTokenRequest,
) -> TokenResponse:
    """Refresh access token using refresh token from cookie."""
    settings = get_security_settings()
    
    # Get refresh token from cookie
    refresh_token = request.cookies.get(settings.cookie_refresh_token_name)
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )
    
    # ... rest of token refresh logic
```

---

## Testing Checklist

After implementing backend changes:

- [ ] `/auth/csrf-token` endpoint returns CSRF token
- [ ] CSRF token is set in a readable cookie
- [ ] CSRF validation middleware blocks requests without X-CSRF-Token
- [ ] CSRF validation middleware blocks requests with invalid tokens
- [ ] Cookie-based authentication works (no Bearer header required)
- [ ] Token refresh reads from cookies
- [ ] Logout clears all cookies
- [ ] Full login → API call → logout flow works

---

## Recommendation

**⚠️ BACKEND NOT READY FOR DEPLOYMENT**

The backend has excellent cookie support but is missing critical CSRF protection. 

**Before deploying the frontend migration:**

1. **Implement CSRF token endpoint** (`/auth/csrf-token`)
2. **Implement CSRF validation middleware**
3. **Add cookie-based authentication dependency**
4. **Update refresh endpoint to read from cookies**
5. **Test full authentication flow**

**Alternative:** If CSRF implementation is complex, consider keeping the current Bearer token approach temporarily and prioritize the CSRF implementation separately.

---

## Files Referenced

- `src/colony_manager/adapters/api/routers/auth_router.py` - Auth endpoints
- `src/colony_manager/adapters/api/middleware/auth.py` - Auth middleware
- `src/colony_manager/config/settings.py` - Cookie configuration
- `src/colony_manager/adapters/api/middleware/security_headers.py` - Security headers

---

## Next Steps

1. Review this report with backend team
2. Implement CSRF token endpoint
3. Implement CSRF validation middleware
4. Add cookie-based auth dependency
5. Test integration with frontend secure version
6. Deploy to staging for end-to-end testing
