# Swagger UI Authentication Guide

**Date:** 2026-09-01  
**API URL:** <http://localhost:8001/docs>  
**Status:** ✅ READY FOR USE

---

## Quick Start Guide

### Step 1: Access Swagger UI

Open your browser and navigate to: **<http://localhost:8001/docs>**

You'll see the Swagger UI interface with all available API endpoints.

---

### Step 2: Register a New User (First Time Only)

1. Scroll down to the **authentication** section
2. Click on **POST /api/v1/auth/register**
3. Click **"Try it out"**
4. Fill in the request body:

   ```json
   {
     "username": "your_username",
     "email": "your@email.com",
     "password": "SecureP@ss123",
     "role": "viewer"
   }
   ```

5. Click **"Execute"**
6. You should receive a `201 Created` response with your user details

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

### Step 3: Log In to Establish the Session

1. Click on **POST /api/v1/auth/login**
2. Click **"Try it out"**
3. Fill in your credentials:

   ```json
   {
     "username": "your_username",
     "password": "SecureP@ss123"
   }
   ```

4. Click **"Execute"**
5. The response sets an HttpOnly session cookie in your browser. Because auth is cookie-based, there is no token to copy — the browser sends the session cookie automatically on subsequent requests.

---

### Step 4: Using Protected Endpoints

Because authentication is cookie-based, there is **no "Authorize" button** to fill in — the session cookie from Step 3 is sent automatically by the browser. Protected endpoints are now accessible directly.

**Verification:**

1. Click on **GET /api/v1/auth/me**
2. Click **"Try it out"** then **"Execute"**
3. You should see your user info (not a 401 error)

---

## Using Protected Endpoints

Once authorized, you can use any protected endpoint:

### Example: Create a Colony

1. Scroll to **colonies** section
2. Click **POST /api/v1/colonies**
3. Click **"Try it out"**
4. Enter colony data:

   ```json
   {
     "name": "New Terra",
     "size": 50
   }
   ```

5. Click **"Execute"**
6. You'll see the created colony with all stats

---

## Test Account

A test admin account has been created for you:

| Field | Value |
|-------|-------|
| **Username** | `test_admin` |
| **Email** | `admin@test.com` |
| **Password** | `TestP@ss123` |
| **Role** | `admin` |

⚠️ **Warning:** This is a test account. Change the password or create your own account for production use.

---

## Session Management

### Session Expiration

Authentication is cookie-based, so there are no access/refresh tokens to manage manually. The backend sets session/refresh cookies on login.

### Refresh the Session

The frontend refreshes the session automatically via `POST /api/v1/auth/refresh` (using the existing session cookie). In Swagger UI, if a protected request returns 401, simply re-establish the session:

1. Re-run **POST /api/v1/auth/login** (Step 3)
2. Retry the protected request

### Logout (Revoke Token)

To log out and revoke the current session:

1. Go to **POST /api/v1/auth/revoke**
2. Click **"Try it out"**
3. (Optional) Add a reason:

   ```json
   {
     "reason": "logging out for the day"
   }
   ```

4. Click **"Execute"**
5. Your session cookie is now revoked on the server

### Revoke All Sessions

To logout from all devices/sessions:

1. Go to **POST /api/v1/auth/revoke-all**
2. Click **"Try it out"**
3. (Admin only) Optionally specify a user_id to revoke their tokens
4. Click **"Execute"**

---

## Available Endpoints

### Authentication (Public)

- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/revoke` - Logout (revoke current token)
- `POST /api/v1/auth/revoke-all` - Revoke all sessions

### Protected Endpoints (Require Authorization)

- **Colonies** - Manage colony stats and state
- **Infrastructure** - Add/remove colony infrastructure
- **Support Upgrades** - Manage support upgrades
- **Representatives** - Assign representatives to colonies
- **Resources** - Track colony resources
- **Modifiers** - Add custom modifiers
- **Events** - Manage game events
- **Development Plans** - Track colony development
- **Audit Logs** - View change history
- **Users** - User management (admin only)
- **Config** - System configuration

---

## Troubleshooting

### 401 Unauthorized

**Cause:** No valid session cookie (not logged in, or the session expired)

**Solution:**

1. Re-run **POST /api/v1/auth/login** (Step 3) to set a fresh session cookie
2. Try the protected request again

### 403 Forbidden

**Cause:** Insufficient permissions for the operation

**Solution:**

- Some endpoints require specific roles (e.g., `admin`, `colony_manager`)
- Check the endpoint documentation for required roles
- Contact an administrator to upgrade your role

### 423 Locked

**Cause:** Account locked due to too many failed login attempts

**Solution:**

- Wait 15 minutes before trying again
- Contact an administrator to unlock your account

---

## Security Notes

- **Always use HTTPS** in production
- **Never share your tokens** - they're like passwords
- **Logout** when you're done, especially on shared computers
- **Token storage** - Swagger UI stores tokens in your browser session only
- **Rate limiting** is enabled to prevent brute force attacks

---

## API Documentation

Full API documentation is available at:

- **Swagger UI:** <http://localhost:8001/docs>
- **ReDoc:** <http://localhost:8001/redoc>
- **OpenAPI JSON:** <http://localhost:8001/openapi.json>

---

**Last Updated:** 2026-09-01  
**Version:** 0.1.0
