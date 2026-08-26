# 12 — User Flows

**Version:** 1.0
**Date:** 2026-08-24
**Status:** Complete

---

## 12.1 Overview

This document describes end-to-end user flows through the application. Each flow includes steps, decision points, and expected outcomes.

---

## 12.2 Authentication Flow

### New User Registration

```
1. User navigates to application
2. Sees landing page with "Create Account" link
3. Clicks "Create Account" → Registration screen
4. Enters: Name, Email, Password, Confirm Password
5. Clicks "Create Account"
6. System validates input
   - If invalid → Show inline errors
   - If valid → Create account, log in, redirect to Dashboard
7. User sees empty colony list with "Create Colony" button
```

### Existing User Login

```
1. User navigates to application
2. Sees login screen (or landing → Login)
3. Enters: Email, Password
4. Clicks "Sign In"
5. System validates credentials
   - If invalid → Show "Invalid email or password"
   - If valid → Store tokens, redirect to Dashboard
6. User sees colony list
```

---

## 12.3 Colony Creation Flow (GM)

```
1. Admin navigates to Dashboard
2. Clicks "Create Colony"
3. Modal opens with form:
   - Colony Name (required)
   - Colony Owner (required)
   - Colony Type (dropdown: Industrial, Agri, Forge, etc.)
4. Clicks "Create"
5. Colony created with base stats from type
6. Redirects to Colony Dashboard
7. Optional: Assign Representative
8. Optional: Add Infrastructure
```

---

## 12.4 Infrastructure Management Flow

### Add Infrastructure

```
1. User navigates to Colony Dashboard
2. Clicks "View All" in Infrastructure section
   OR clicks Infrastructure in sidebar
3. Sees Infrastructure list
4. Clicks "Add New"
5. Modal opens:
   - Select Infrastructure Type
   - Enter Custom Name (optional)
   - Select Starting State (Working/Not Working)
6. Clicks "Add Infrastructure"
7. Infrastructure added, colony stats recalculated
8. Modal closes, list refreshes
9. Toast: "Infrastructure added successfully"
```

### Toggle Infrastructure State

```
1. User sees infrastructure item in list
2. Clicks Purity Seal checkbox
3. State toggles (Working ↔ Not Working)
4. API updates immediately
5. Colony stats recalculate
6. Toast: "Infrastructure state updated"
```

### Delete Infrastructure

```
1. Admin clicks Delete button on infrastructure item
2. Confirmation modal appears
3. Shows affected bonuses that will be removed
4. Admin confirms
5. Infrastructure deleted
6. Colony stats recalculated
7. Toast: "Infrastructure removed"
```

---

## 12.5 Event Application Flow (GM)

```
1. GM navigates to Colony Dashboard
2. Reviews current stats
3. Decides to apply event outcome
4. Navigates to Modifiers page
5. Clicks "Add New"
6. Enters:
   - Description: "Plague Outbreak"
   - Stat: Size
   - Value: -1
   - Duration: Permanent
7. Clicks "Add Modifier"
8. Modifier applied, stats recalculate
9. (Optional) Log event in Events page
```

---

## 12.6 Representative Assignment Flow

```
1. User navigates to Colony Dashboard
2. Sees "No representative assigned" or current rep name
3. Clicks "Assign Representative"
4. Modal opens with dropdown of available representatives
5. Selects representative
6. Clicks "Assign"
7. Representative assigned to colony
8. Leadership modifier applied to Profit Factor
9. Modal closes, dashboard refreshes
```

---

## 12.7 Colony Export/Import Flow (Admin)

### Export

```
1. Admin navigates to Colony Dashboard
2. Clicks "Export" in header
3. Modal opens with options:
   - Format: JSON/YAML
   - Include: Infrastructure, Upgrades, Modifiers, etc.
4. Clicks "Export"
5. File downloads to user's device
```

### Import

```
1. Admin navigates to Colony Dashboard
2. Clicks "Import" in header
3. Modal opens with file upload
4. Selects JSON/YAML file
5. System validates file structure
6. Shows warning: "This will overwrite existing data"
7. Admin confirms
8. Colony data replaced
9. Dashboard refreshes with new data
```

---

## 12.8 Error Recovery Flow

### API Error

```
1. User performs action (e.g., add infrastructure)
2. API returns error (400, 422, 500)
3. Toast shows error message
4. If validation error → Show inline field errors
5. If server error → Show "Something went wrong. Please try again."
6. User can retry action
```

### Session Expired

```
1. User performs action
2. API returns 401 Unauthorized
3. System attempts token refresh
4. If refresh fails → Clear tokens
5. Redirect to login screen
6. Toast: "Session expired. Please log in again."
7. After login → Return to intended page (if possible)
```

---

**Related Documents:**

- [Authentication](./03-authentication.md)
- [States & Errors](./13-states-and-errors.md)
- [API Integration](./14-api-integration.md)
