# 10 — Administration Screens

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 10.1 Overview

Admin screens are restricted to users with Admin permission. These screens manage users, colony access, and data export/import.

**Permission Required:** Admin only

---

## 10.2 User Management

**Purpose:** Manage system users and their roles.

**Features:**

- View all users with role badges
- Edit user roles (Viewer/Editor/Admin)
- Reset passwords
- Deactivate/delete users

**API:** `GET/POST/PATCH/DELETE /api/v1/users`

---

## 10.3 Colony Access Management

**Purpose:** Control which users can access a colony and at what permission level.

**Features:**

- View current access list
- Add user with role selection
- Remove user access
- Transfer ownership

**API:** `GET /api/v1/colonies/:id/members`, `POST /api/v1/colonies/:id/members`, `DELETE /api/v1/colonies/:id/members/:user_id`, `POST /api/v1/colonies/:id/members/transfer-ownership`

---

## 10.4 Export/Import

**Export:**

- Format: JSON or YAML
- Options: Include infrastructure, upgrades, modifiers, representatives, events
- Downloads file to user's device

**Import:**

- Upload JSON/YAML file
- Warning about overwriting data
- Validation before import

**API:** `GET /api/v1/colonies/:id/export`, `POST /api/v1/colonies/:id/import`

---

## 10.5 Audit Log

**Purpose:** View history of all changes to a colony.

**Features:**

- Filter by action type
- Filter by date range
- Filter by user
- Shows: timestamp, user, action, changes

**API:** `GET /api/v1/colonies/:id/audit-log`

---

## 10.6 Permission Summary

| Screen | Viewer | Editor | Admin (Colony Owner) |
|--------|--------|--------|----------------------|
| User Management | ❌ | ❌ | ✅ (System Admin only) |
| Colony Access | ❌ | ❌ | ✅ (Colony Owner) |
| Export/Import | ❌ | ❌ | ✅ (Colony Owner) |
| Audit Log | ❌ | ❌ | ✅ (Colony Owner) |

**Notes:**
- "Admin" in colony context means the colony OWNER role, not system admin
- System admin role can access all colonies regardless of membership
- Colony Access, Export/Import, and Audit Log require colony OWNER role

---

**Related Documents:**

- [Application Structure](./02-application-structure.md)
- [API Integration](./14-api-integration.md)
