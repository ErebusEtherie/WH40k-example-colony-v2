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

### Step 3: Login to Get Your JWT Token

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
5. You'll receive a response like:

   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "bearer",
     "expires_in": 3600
   }
   ```

6. **Copy the `access_token` value**

---

### Step 4: Authorize All Endpoints

1. Click the **"Authorize"** button at the top-right of the page
2. In the **Value** field, paste your access token (just the token, no "Bearer" prefix)

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Click **"Authorize"**
4. Click **"Close"**

✅ **Done!** All protected endpoints are now accessible with your token.

**Verification:** After authorizing, you can verify the token is being sent correctly:

1. Click on **GET /api/v1/auth/me**
2. Click **"Try it out"** then **"Execute"**
3. You should see your user info (not a 401 error)
4. Check the request headers in the curl command shown - it should include `Authorization: Bearer eyJ...`

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

## Token Management

### Token Expiration

- **Access Token:** Expires in 60 minutes (3600 seconds)
- **Refresh Token:** Expires in 7 days

### Refresh Your Token

Before your access token expires:

1. Go to **POST /api/v1/auth/refresh**
2. Click **"Try it out"**
3. Enter your refresh token:

   ```json
   {
     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

4. Click **"Execute"**
5. Copy the new access token
6. Re-authorize with the new token

### Logout (Revoke Token)

To logout and revoke your current token:

1. Go to **POST /api/v1/auth/revoke**
2. Click **"Try it out"**
3. (Optional) Add a reason:

   ```json
   {
     "reason": "logging out for the day"
   }
   ```

4. Click **"Execute"**
5. Your token is now blacklisted

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

**Cause:** Token is missing, expired, or invalid

**Solution:**

1. Check if you're logged in (click "Authorize" button - should show "Logout")
2. If token expired, use refresh endpoint to get a new one
3. Re-authorize with the new token
4. **Verify Authorization header:** After executing a request, expand the curl command shown and verify it includes `Authorization: Bearer <token>`. If missing, refresh the page and re-authorize.

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
