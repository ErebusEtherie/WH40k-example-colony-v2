# 03 — Authentication Screens

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 3.1 Login Screen

### Purpose

Allow existing users to authenticate and access the application.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ╔═══════════════════════════════════════════════╗       │
│     ║                                               ║       │
│     ║    ⚙═══ COLONY MANAGER ═══⚙                   ║       │
│     ║         Rogue Trader Edition                  ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │ Email Address                   │        ║       │
│     ║    │ ┌─────────────────────────────┐ │        ║       │
│     ║    │ │                               │ │        ║       │
│     ║    │ └─────────────────────────────┘ │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │ Password                        │        ║       │
│     ║    │ ┌─────────────────────────────┐ │        ║       │
│     ║    │ │                               │ │        ║       │
│     ║    │ └─────────────────────────────┘ │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    ☐ Remember me (30 days)                    ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │   [      SIGN IN      ]         │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    Forgot password? | Create account          ║       │
│     ║                                               ║       │
│     ╚═══════════════════════════════════════════════╝       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Type | Required | Validation |
|-----------|------|----------|------------|
| Email | Input (email) | Yes | Valid email format |
| Password | Input (password) | Yes | Min 1 character |
| Remember Me | Checkbox | No | - |
| Sign In Button | Button | Yes | Disabled until both fields filled |
| Forgot Password | Link | No | Navigates to password reset (future) |
| Create Account | Link | No | Navigates to registration |

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Email | Valid format | "Please enter a valid email address" |
| Email | Required | "Email is required" |
| Password | Required | "Password is required" |

### API Integration

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `401 Unauthorized` → "Invalid email or password"
- `422 Validation Error` → Inline field errors

---
### API Integration
---

## 3.2 Registration Screen

### Purpose

Allow new users to create an account.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ╔═══════════════════════════════════════════════╗       │
│     ║                                               ║       │
│     ║    ⚙═══ CREATE ACCOUNT ═══⚙                   ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │ Full Name                       │        ║       │
│     ║    │ ┌─────────────────────────────┐ │        ║       │
│     ║    │ │                               │ │        ║       │
│     ║    │ └─────────────────────────────┘ │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │ Email Address                   │        ║       │
│     ║    │ ┌─────────────────────────────┐ │        ║       │
│     ║    │ │                               │ │        ║       │
│     ║    │ └─────────────────────────────┘ │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │ Password                        │        ║       │
│     ║    │ ┌─────────────────────────────┐ │        ║       │
│     ║    │ │                               │ │        ║       │
│     ║    │ └─────────────────────────────┘ │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │ Confirm Password                │        ║       │
│     ║    │ ┌─────────────────────────────┐ │        ║       │
│     ║    │ │                               │ │        ║       │
│     ║    │ └─────────────────────────────┘ │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    ┌─────────────────────────────────┐        ║       │
│     ║    │   [  CREATE ACCOUNT  ]          │        ║       │
│     ║    └─────────────────────────────────┘        ║       │
│     ║                                               ║       │
│     ║    Already have an account? Sign In           ║       │
│     ║                                               ║       │
│     ╚═══════════════════════════════════════════════╝       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Type | Required | Validation |
|-----------|------|----------|------------|
| Full Name | Input (text) | Yes | Min 2 characters |
| Email | Input (email) | Yes | Valid email; unique |
| Password | Input (password) | Yes | Min 8 chars, 1 uppercase, 1 number |
| Confirm Password | Input (password) | Yes | Must match password |
| Create Account Button | Button | Yes | Disabled until valid |
| Sign In Link | Link | No | Navigates to login |

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Full Name | Min 2 characters | "Name must be at least 2 characters" |
| Email | Valid format | "Please enter a valid email address" |
| Email | Unique | "This email is already registered" |
| Password | Min 8 characters | "Password must be at least 8 characters" |
| Password | 1 uppercase | "Password must contain at least one uppercase letter" |
| Password | 1 number | "Password must contain at least one number" |
| Confirm Password | Matches password | "Passwords do not match" |

### API Integration

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response (201):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400 Bad Request` → "Email already registered"
- `422 Validation Error` → Inline field errors

---

## 3.3 Password Reset (Future)

**Status:** Not implemented in Phase 1. Will be added in a future release.

### Flow

```
Login Screen → Request Reset → Confirmation Email
     ↓
Reset Password → Success Message
```

---

## 3.4 Session Management

### Token Refresh

| Trigger | Action |
|---------|--------|
| Access token expires | Automatic refresh using refresh token |
| Refresh token expires | Redirect to login |
| User inactive 7 days | Session expires; require login |

### Logout

**User Initiated:**
- Click "Logout" in user menu
- Clear tokens from memory
- Clear httpOnly cookie via API call
- Redirect to login screen

**Session Expired:**
- Detect 401 on API call
- Attempt refresh
- If refresh fails → clear state → redirect to login
- Show toast: "Session expired. Please log in again."

---

**Related Documents:**
- [Application Structure](./02-application-structure.md)
- [API Integration](./14-api-integration.md)
- [States & Errors](./13-states-and-errors.md)