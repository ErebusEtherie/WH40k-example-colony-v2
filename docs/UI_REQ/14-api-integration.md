# 14 — API Integration

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 14.1 Overview

This document defines how the frontend integrates with the backend API, including authentication, error handling, and data synchronization patterns.

**API Base URL:** Configurable via environment variable (`VITE_API_BASE_URL`)

---

## 14.2 Authentication

### Token Storage

| Token | Storage | Security |
|-------|---------|----------|
| Access Token | Memory (JavaScript variable) | Lost on refresh |
| Refresh Token | httpOnly cookie | Secure, HttpOnly |

### Auth Header

```
Authorization: Bearer <access_token>
```

### Token Refresh Flow

1. API call fails with 401
2. Intercept 401 in HTTP client
3. Call POST /api/auth/refresh (with cookie)
4. If successful: Update token, retry original request
5. If failed: Clear auth state, redirect to /login

---

## 14.3 HTTP Client Configuration

```javascript
{
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
}
```

### Interceptors

- **Request:** Add Authorization header with access token
- **Response:** Handle 401 (refresh), 403 (permission denied), 500 (server error)

---

## 14.4 Key Endpoints

### Authentication
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/logout` — Logout

### Colonies
- `GET /api/v1/colonies` — List colonies
- `POST /api/v1/colonies` — Create colony
- `GET /api/v1/colonies/:id` — Get colony detail
- `PATCH /api/v1/colonies/:id` — Update colony

### Infrastructure
- `GET /api/v1/colonies/:id/infrastructure` — List
- `POST /api/v1/colonies/:id/infrastructure` — Add
- `PATCH /api/v1/colonies/:id/infrastructure/:id` — Update
- `DELETE /api/v1/colonies/:id/infrastructure/:id` — Delete
- `GET /api/v1/infrastructure-types` — List types

### Support Upgrades
- `GET /api/v1/colonies/:id/support-upgrades` — List
- `POST /api/v1/colonies/:id/support-upgrades` — Add
- `PATCH /api/v1/colonies/:id/support-upgrades/:id` — Update
- `DELETE /api/v1/colonies/:id/support-upgrades/:id` — Delete

### Representatives
- `GET /api/v1/representatives` — List
- `POST /api/v1/representatives` — Create
- `PATCH /api/v1/representatives/:id` — Update
- `DELETE /api/v1/representatives/:id` — Delete
- `POST /api/v1/colonies/:id/representative` — Assign

### Modifiers
- `GET /api/v1/colonies/:id/modifiers` — List
- `POST /api/v1/colonies/:id/modifiers` — Add
- `PATCH /api/v1/colonies/:id/modifiers/:id` — Update
- `DELETE /api/v1/colonies/:id/modifiers/:id` — Delete

### Admin
- `GET /api/v1/users` — List users
- `GET /api/v1/colonies/:id/access` — Get access
- `POST /api/v1/colonies/:id/access` — Grant access
- `GET /api/v1/colonies/:id/audit-log` — Audit log
- `GET /api/v1/colonies/:id/export` — Export
- `POST /api/v1/colonies/:id/import` — Import

---

## 14.5 Error Handling

### Error Response Structure

```json
{
  "detail": "Error message",
  "errors": [{"field": "email", "message": "Invalid email"}]
}
```

### Frontend Handling

- **422 Validation:** Show inline field errors
- **401 Unauthorized:** Redirect to login
- **403 Forbidden:** Show permission denied toast
- **500 Server Error:** Show "Something went wrong" toast

---

## 14.6 Rate Limiting

- **Limit:** 60 requests per minute
- **Response:** 429 Too Many Requests
- **Handling:** Show toast, disable buttons temporarily

---

## 14.7 Data Synchronization

### Optimistic Updates

Update UI immediately, then sync with server. Rollback on error.

### Cache Invalidation

Refetch colony stats after:
- Adding/removing infrastructure
- Adding/removing modifiers
- Assigning representative

---

**Related Documents:**
- [Authentication](./03-authentication.md)
- [States & Errors](./13-states-and-errors.md)