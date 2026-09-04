# Fix: Unnecessary /me and /refresh Calls on Fresh Session

**Date:** September 4, 2026  
**Issue:** When opening the app in a fresh browser session (private/incognito mode), the frontend was calling `/auth/me` and `/auth/refresh` before the user even tried to log in.

## Root Cause

The `fetchApi` function had an automatic token refresh mechanism that triggered on any 401 error:

```typescript
if (response.status === 401) {
  const refreshed = await refreshAccessToken(); // ← Always called
  if (refreshed) {
    return fetchApi<T>(endpoint, options); // Retry
  }
}
```

This caused the following flow on fresh sessions:

1. App loads → `useCurrentUser()` fires → calls `/auth/me`
2. No auth cookies exist → backend returns 401
3. `fetchApi` intercepts 401 → calls `refreshAccessToken()` → calls `/auth/refresh`
4. Refresh also fails (no cookies) → returns false
5. Original 401 error propagates

**Result:** Two failed API calls on every fresh session load, even though the user hasn't logged in yet.

## Solution

Added session state tracking to distinguish between:

- **"Never logged in"** - Don't attempt refresh (wasteful)
- **"Session expired"** - Attempt refresh (user had valid session)

### Implementation

1. **Session Flag** - Store a flag in `sessionStorage` (cleared when browser tab closes):

   ```typescript
   const SESSION_AUTH_FLAG = 'rt_session_auth';
   ```

2. **Check Before Refresh** - Only attempt refresh if flag is set:

   ```typescript
   async function refreshAccessToken(): Promise<boolean> {
     if (!hasAuthenticatedThisSession()) {
       return false; // Skip refresh for fresh sessions
     }
     // ... attempt refresh
   }
   ```

3. **Set Flag on Login** - Mark session after successful login:

   ```typescript
   export async function loginApi(...) {
     // ... login logic
     markAuthenticatedThisSession(); // ← Enable refresh for future requests
   }
   ```

4. **Clear Flag on Logout** - Reset state on logout:

   ```typescript
   export async function logoutApi() {
     // ... logout logic
     clearSessionAuthFlag(); // ← Prevent refresh after logout
   }
   ```

## Files Modified

- `src/lib/api.ts`
  - Added session state management functions (`hasAuthenticatedThisSession`, `markAuthenticatedThisSession`, `clearSessionAuthFlag`)
  - Updated `refreshAccessToken()` to check session flag before attempting refresh
  - Updated `loginApi()` to set session flag on success
  - Updated `logoutApi()` to clear session flag

## Behavior Changes

### Before Fix

| Scenario | `/auth/me` called | `/auth/refresh` called | Result |
|----------|------------------|----------------------|--------|
| Fresh session (never logged in) | ✅ Yes | ✅ Yes (fails) | 2 failed requests |
| Returning user (valid cookies) | ✅ Yes | ❌ No | 1 successful request |
| Expired session (invalid cookies) | ✅ Yes | ✅ Yes (may succeed) | 2 requests, 1 retry |
| After logout | ✅ Yes | ✅ Yes (fails) | 2 failed requests |

### After Fix

| Scenario | `/auth/me` called | `/auth/refresh` called | Result |
|----------|------------------|----------------------|--------|
| Fresh session (never logged in) | ✅ Yes | ❌ **No** | 1 failed request (expected) |
| Returning user (valid cookies) | ✅ Yes | ❌ No | 1 successful request |
| Expired session (invalid cookies) | ✅ Yes | ✅ Yes (may succeed) | 2 requests, 1 retry |
| After logout | ✅ Yes | ❌ **No** | 1 failed request (expected) |

## Benefits

1. **Reduced Network Traffic** - Eliminates unnecessary refresh call on fresh sessions
2. **Cleaner Dev Experience** - No spurious 401s in network tab when testing fresh sessions
3. **Correct Behavior** - Refresh only attempted when user had a valid session
4. **Session-Scoped** - Flag stored in `sessionStorage`, automatically cleared when tab closes

## Testing Recommendations

1. **Fresh Session Test:**
   - Open incognito/private browsing window
   - Navigate to app
   - Check network tab: only `/auth/me` should fire (401), no `/auth/refresh`

2. **Normal Login Flow:**
   - Login with valid credentials
   - Check network tab: `/auth/me` succeeds (200)
   - Session flag should be set in sessionStorage

3. **Token Refresh Test:**
   - Login, then wait for token to expire (or manually invalidate)
   - Make a protected request
   - Should see: 401 → `/auth/refresh` → retry with new cookies

4. **After Logout:**
   - Login, then logout
   - Refresh page
   - Should see: `/auth/me` (401), no `/auth/refresh`

## Notes

- `sessionStorage` is used intentionally (not `localStorage`) because:
  - It automatically clears when the tab closes
  - This matches the expected behavior: refresh should only work within the same browsing session
  - Prevents stale state from persisting across browser restarts

- This fix complements the cookie-based auth migration - it doesn't change the auth mechanism, just optimizes when refresh attempts occur.
