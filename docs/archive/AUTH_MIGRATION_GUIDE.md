# Authentication Migration Guide: localStorage → HttpOnly Cookies + CSRF

## Overview

This migration replaces vulnerable localStorage-based token storage with secure HttpOnly cookies and CSRF token protection.

## Files Created

- **`src/lib/api.ts.secure`** - Complete secure version ready to deploy
- **`src/lib/api.ts.original`** - Backup of original file
- **`src/lib/api.ts`** - Current file (unchanged, review before deploying)

## What Changed

### 1. Removed `authStorage` Object
**Before:** Tokens and user data stored in localStorage (vulnerable to XSS)
```typescript
export const authStorage = {
  getAccessToken: () => localStorage.getItem('rt_auth_access_token'),
  // ... more localStorage operations
};
```

**After:** CSRF token management only (tokens in HttpOnly cookies)
```typescript
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}
```

### 2. Updated `fetchApi` Function
**Changes:**
- Removed `Authorization: Bearer ${token}` header
- Added `credentials: 'include'` to send cookies automatically
- Added CSRF token to state-changing requests (POST/PUT/PATCH/DELETE)

```typescript
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  };

  // Add CSRF token to state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies automatically
  });
  // ... rest of implementation
}
```

### 3. Updated `refreshAccessToken`
**Before:** Sent refresh_token in request body, returned full session
```typescript
async function refreshAccessToken(): Promise<AuthSession | null> {
  const refreshToken = authStorage.getRefreshToken();
  // ... send refresh_token in body
  authStorage.saveSession(session);
  return session;
}
```

**After:** Uses cookie-based refresh, returns boolean
```typescript
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send refresh token cookie
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### 4. Updated `loginApi`
**Changes:**
- No longer saves tokens to localStorage
- Fetches CSRF token after successful login
- Returns session with empty token strings (tokens in cookies)

```typescript
export async function loginApi(username: string, password: string): Promise<AuthSession> {
  // Login sets HttpOnly cookies
  await fetchApi('/auth/login', { /* ... */ });
  
  // Fetch user info
  const user = await fetchApi<User>('/auth/me');
  
  // Fetch CSRF token
  const csrfResponse = await fetchApi<{ csrf_token: string }>('/auth/csrf-token');
  setCsrfToken(csrfResponse.csrf_token);
  
  return {
    access_token: '', // Not stored client-side
    refresh_token: '', // Not stored client-side
    user,
    // ...
  };
}
```

### 5. Updated `registerApi`
Same changes as `loginApi` - fetches CSRF token after registration.

### 6. Updated `logoutApi`
**Changes:** Calls `clearCsrfToken()` instead of `authStorage.clearSession()`

```typescript
export async function logoutApi(): Promise<void> {
  try {
    await fetchApi('/auth/revoke', { /* ... */ });
  } catch {
    // Ignore errors
  }
  clearCsrfToken(); // Clear CSRF token
}
```

### 7. Updated `useLogout` Hook
**Changes:** Calls `clearCsrfToken()` in `onSuccess`

```typescript
export function useLogout() {
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      clearCsrfToken(); // Clear CSRF token
    },
  });
}
```

### 8. Updated Query Hook `enabled` Flags
**Before:**
```typescript
enabled: !!authStorage.getAccessToken()
```

**After:**
```typescript
enabled: true // Auth handled by cookies automatically
```

All TanStack Query hooks now use `enabled: true` (or their existing conditions) since authentication is handled automatically via cookies.

### 9. Updated Legacy `apiFetch` Function
Same changes as `fetchApi` - uses cookies and CSRF tokens.

## Backend Requirements

For this to work, your backend must:

1. **Set HttpOnly cookies on login/register:**
   - `Set-Cookie: access_token=<token>; HttpOnly; Secure; SameSite=Strict`
   - `Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict`

2. **Provide `/auth/csrf-token` endpoint:**
   - Returns: `{ "csrf_token": "<csrf-token>" }`
   - Must be called after login/register

3. **Validate CSRF token on state-changing requests:**
   - Check `X-CSRF-Token` header on POST/PUT/PATCH/DELETE
   - Return 403 if missing/invalid

4. **Read tokens from cookies:**
   - Authentication middleware should read from cookies, not headers
   - Refresh endpoint should read refresh_token from cookie

## Deployment Steps

1. **Review the secure version:**
   ```bash
   # Compare with original
   diff src/lib/api.ts src/lib/api.ts.secure
   ```

2. **Ensure backend is ready:**
   - Verify backend supports cookie-based auth
   - Verify `/auth/csrf-token` endpoint exists
   - Test login flow manually

3. **Deploy:**
   ```bash
   # Backup current file
   cp src/lib/api.ts src/lib/api.ts.backup
   
   # Replace with secure version
   cp src/lib/api.ts.secure src/lib/api.ts
   ```

4. **Test thoroughly:**
   - Login flow
   - Protected API requests
   - Token refresh
   - Logout
   - Session persistence across page reloads

5. **Update App.tsx (if needed):**
   Remove any remaining `authStorage.getUser()` calls from `useCurrentUser` hook

## Security Benefits

✅ **XSS Protection:** Tokens not accessible to JavaScript
✅ **CSRF Protection:** State-changing requests require CSRF token
✅ **Automatic Token Management:** Browser handles cookie sending
✅ **No Manual Token Storage:** No localStorage vulnerabilities

## Files to Review

- `src/lib/api.ts.secure` - The new secure implementation
- `src/App.tsx` - May need updates to remove `authStorage` references
- `src/components/LoginScreen.tsx` - Should work without changes
- Backend auth endpoints - Must support cookie-based auth

## Rollback

If issues occur, restore the original:
```bash
cp src/lib/api.ts.original src/lib/api.ts
```

## Questions or Issues?

Refer to:
- `docs/07-frontend-architecture.md` - Frontend architecture guidelines
- `docs/02-domain-modeling.md` - Domain modeling principles
- Backend authentication documentation
