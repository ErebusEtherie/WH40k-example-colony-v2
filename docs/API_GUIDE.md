# API Guide — Phase 3

**Version:** 1.0.0  
**Last Updated:** 2026-08-26  
**Base URL:** `http://localhost:8000/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Colonies](#colonies)
4. [Representatives](#representatives)
5. [Infrastructure](#infrastructure)
6. [Support Upgrades](#support-upgrades)
7. [Resources](#resources)
8. [Events](#events)
9. [Development Plans](#development-plans)
10. [Modifiers](#modifiers)
11. [Colony Users](#colony-users)
12. [Users](#users)
13. [Export/Import](#exportimport)
14. [Configuration](#configuration)
15. [Audit Logs](#audit-logs)
16. [Notifications](#notifications)

---

## Overview

### Base URL

All API endpoints are prefixed with `/api/v1`. Adjust accordingly if your server runs on a different port or path.

```
http://localhost:8000/api/v1
```

### Authentication

Most endpoints require authentication via JWT Bearer token. Include the token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### Response Format

Successful responses return JSON with appropriate HTTP status codes:

- `200 OK` — Successful GET, PUT, PATCH
- `201 Created` — Successful POST (resource creation)
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing or invalid authentication
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `500 Internal Server Error` — Server error

### Pagination

List endpoints support pagination with `offset` and `limit` query parameters:

```http
GET /api/v1/colonies?offset=0&limit=20
```

Response includes metadata:

```json
{
  "items": [...],
  "meta": {
    "total": 150,
    "offset": 0,
    "limit": 20,
    "has_more": true
  }
}
```

---

## Authentication

### Register New User

**POST** `/auth/register`

Register a new user account. No authentication required.

**Request Body:**

```json
{
  "username": "commander",
  "email": "commander@voidfarers.com",
  "password": "SecureP@ssw0rd!",
  "role": "viewer"
}
```

**Password Requirements:**

- Minimum 8 characters (configurable)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (201 Created):**

```json
{
  "id": 1,
  "username": "commander",
  "email": "commander@voidfarers.com",
  "role": "viewer",
  "is_active": true
}
```

---

### Login

**POST** `/auth/login`

Authenticate and receive access/refresh tokens.

**Request Body:**

```json
{
  "username": "commander",
  "password": "SecureP@ssw0rd!"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### Refresh Token

**POST** `/auth/refresh`

Get a new access token using a refresh token.

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Change Password

**POST** `/auth/change-password`

Change the current user's password. Requires authentication.

**Request Body:**

```json
{
  "current_password": "OldP@ssw0rd!",
  "new_password": "NewSecureP@ssw0rd!"
}
```

**Response (200 OK):**

```json
{
  "message": "Password changed successfully"
}
```

---

### Revoke Token (Logout)

**POST** `/auth/revoke`

Revoke the current access token (logout).

**Request Body:**

```json
{
  "reason": "logout"
}
```

**Response (200 OK):**

```json
{
  "message": "Token revoked successfully",
  "tokens_revoked": 1
}
```

---

### Revoke All Tokens

**POST** `/auth/revoke-all`

Revoke all tokens for a user. Admins can revoke for other users.

**Request Body:**

```json
{
  "user_id": 5,
  "reason": "password_change"
}
```

**Response (200 OK):**

```json
{
  "message": "Revoked 3 token(s) for user 5",
  "tokens_revoked": 3
}
```

---

## Colonies

### List Colonies

**GET** `/colonies`

List all colonies the current user has access to.

**Query Parameters:**

- `offset` (int, default: 0) — Number of items to skip
- `limit` (int, default: 20, max: 100) — Maximum items to return

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "name": "New Terra",
      "colony_type": "forge_world",
      "base_size": 5,
      "current_size": 7,
      "founder_name": "commander",
      "created_at": "2026-08-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "offset": 0,
    "limit": 20,
    "has_more": false
  }
}
```

---

### Get Colony

**GET** `/colonies/{colony_id}`

Get detailed information about a specific colony.

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "New Terra",
  "colony_type": "forge_world",
  "base_size": 5,
  "current_size": 7,
  "complacency": 4,
  "order": 8,
  "productivity": 6,
  "piety": 3,
  "profit_factor": 4,
  "founder_name": "commander",
  "representative_id": 2,
  "created_at": "2026-08-20T10:00:00Z",
  "last_updated": "2026-08-26T14:30:00Z",
  "state": {
    "size": {
      "base": 5,
      "current": 7,
      "lore_state": "stable"
    },
    "complacency": {
      "base": 4,
      "current": 4,
      "lore_state": "stable"
    },
    "order": {
      "base": 8,
      "current": 8,
      "lore_state": "stable"
    },
    "productivity": {
      "base": 6,
      "current": 6,
      "lore_state": "productive"
    },
    "piety": {
      "base": 3,
      "current": 3,
      "lore_state": "stable"
    },
    "leadership_modifier": 2,
    "profit_factor": 4,
    "lore_state": {
      "size": "stable",
      "complacency": "stable",
      "order": "stable",
      "productivity": "productive",
      "piety": "stable"
    }
  }
}
```

**Lore States:**

- `stable` — Normal operation
- `placated` — Complacency > Size
- `anarchy` — Order = 0
- `productive` — Productivity > Size
- `halted` — Productivity = 0
- `pious` — Piety > Size
- `heretical` — Piety = 0

---

### Create Colony

**POST** `/colonies`

Create a new colony.

**Request Body:**

```json
{
  "name": "New Terra",
  "colony_type": "forge_world",
  "base_size": 5
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "New Terra",
  "colony_type": "forge_world",
  "base_size": 5,
  "current_size": 5,
  "complacency": 0,
  "order": 0,
  "productivity": 0,
  "piety": 0,
  "profit_factor": 0,
  "founder_name": "commander",
  "representative_id": null,
  "created_at": "2026-08-26T15:00:00Z",
  "last_updated": "2026-08-26T15:00:00Z"
}
```

---

### Update Colony

**PATCH** `/colonies/{colony_id}`

Update colony name or base size.

**Request Body:**

```json
{
  "name": "New Terra Prime",
  "base_size": 6
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "New Terra Prime",
  "colony_type": "forge_world",
  "base_size": 6,
  "current_size": 7
}
```

---

### Delete Colony

**DELETE** `/colonies/{colony_id}`

Delete a colony (soft delete). Requires owner or admin permission.

**Response (204 No Content)**

---

### Get Colony Roll Status

**GET** `/colonies/{colony_id}/roll-status`

Get information about when the next event and development rolls are due.

**Response (200 OK):**

```json
{
  "colony_id": 1,
  "days_since_creation": 120,
  "next_event_roll_in": 30,
  "next_development_roll_in": 60,
  "event_roll_interval_days": 60,
  "development_roll_interval_days": 90
}
```

---

## Representatives

### List Representatives

**GET** `/representatives`

List all representatives.

**Query Parameters:**
- `available_only` (bool, default: false) — Only show unassigned representatives
- `type` (string, optional) — Filter by type: `judge`, `cardinal`, `satrap`, etc.
- `name_search` (string, optional) — Search by name
- `offset` (int, default: 0)
- `limit` (int, default: 20, max: 100)

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Inquisitor Malachus",
      "type": "judge",
      "leadership_modifier": 3,
      "assigned_to_colony_id": null
    }
  ],
  "meta": {
    "total": 10,
    "offset": 0,
    "limit": 20,
    "has_more": false
  }
}
```

---

### Get Representative

**GET** `/representatives/{rep_id}`

Get detailed information about a representative.

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Inquisitor Malachus",
  "type": "judge",
  "personalities": [],
  "stats": {
    "ws": 40,
    "bs": 45,
    "str": 35,
    "tough": 40,
    "agil": 35,
    "int": 55,
    "per": 50,
    "will": 60,
    "fel": 40,
    "wounds": 12,
    "fate": 3
  },
  "skills": ["Awareness", "Command", "Logic", "Scrutiny"],
  "talents": ["Lightning Reflexes", "Quick Draw"],
  "leadership_modifier": 3,
  "assigned_to_colony_id": null
}
```

---

### Create Representative

**POST** `/representatives`

Create a new representative.

**Request Body:**

```json
{
  "name": "Cardinal Valeria",
  "type": "cardinal",
  "personalities": [],
  "stats": {},
  "skills": ["Charm", "Command", "Piety", "Rhetoric"],
  "talents": ["Inspiring", "Lightning Reflexes"]
}
```

**Response (201 Created):**

```json
{
  "id": 2,
  "name": "Cardinal Valeria",
  "type": "cardinal",
  "personalities": [],
  "stats": {},
  "skills": ["Charm", "Command", "Piety", "Rhetoric"],
  "talents": ["Inspiring", "Lightning Reflexes"],
  "leadership_modifier": 6,
  "assigned_to_colony_id": null
}
```

---

### Update Representative

**PATCH** `/representatives/{rep_id}`

Update a representative's details.

**Request Body:**

```json
{
  "name": "Cardinal Valeria the Pious",
  "skills": ["Charm", "Command", "Piety", "Rhetoric", "Forbidden Lore"]
}
```

**Response (200 OK):**

```json
{
  "id": 2,
  "name": "Cardinal Valeria the Pious"
}
```

---

### Delete Representative

**DELETE** `/representatives/{rep_id}`

Delete a representative. Must not be assigned to a colony.

**Response (204 No Content)**

---

### Assign Representative to Colony

**POST** `/representatives/{rep_id}/assign`

Assign a representative to a colony.

**Request Body:**

```json
{
  "colony_id": 1
}
```

**Response (200 OK):**

```json
{
  "id": 2,
  "name": "Cardinal Valeria",
  "type": "cardinal",
  "assigned_to_colony_id": 1
}
```

---

### Unassign Representative

**POST** `/representatives/{rep_id}/unassign`

Unassign a representative from their colony.

**Response (200 OK):**

```json
{
  "id": 2,
  "name": "Cardinal Valeria",
  "type": "cardinal",
  "assigned_to_colony_id": null
}
```

---

## Infrastructure

### List Infrastructure

**GET** `/colonies/{colony_id}/infrastructure`

List all infrastructure for a colony.

**Query Parameters:**

- `offset` (int, default: 0)
- `limit` (int, default: 20, max: 100)

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "infrastructure_type": "manufactorum",
      "state": "working",
      "has_effect": true,
      "is_working": true,
      "is_not_working": false
    }
  ],
  "meta": {
    "total": 5,
    "offset": 0,
    "limit": 20,
    "has_more": false
  }
}
```

---

### Create Infrastructure

**POST** `/colonies/{colony_id}/infrastructure`

Add infrastructure to a colony.

**Request Body:**

```json
{
  "infrastructure_type": "manufactorum",
  "state": "working"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "colony_id": 1,
  "infrastructure_type": "manufactorum",
  "state": "working",
  "has_effect": true,
  "is_working": true,
  "is_not_working": false
}
```

---

### Get Infrastructure

**GET** `/colonies/{colony_id}/infrastructure/{infrastructure_id}`

Get details of a specific infrastructure.

**Response (200 OK):**

```json
{
  "id": 1,
  "colony_id": 1,
  "infrastructure_type": "manufactorum",
  "state": "working",
  "has_effect": true,
  "is_working": true,
  "is_not_working": false
}
```

---

### Update Infrastructure

**PATCH** `/colonies/{colony_id}/infrastructure/{infrastructure_id}`

Update infrastructure state.

**Request Body:**

```json
{
  "state": "disrupted"
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "colony_id": 1,
  "infrastructure_type": "manufactorum",
  "state": "disrupted",
  "has_effect": false,
  "is_working": false
}
```

---

### Delete Infrastructure

**DELETE** `/colonies/{colony_id}/infrastructure/{infrastructure_id}`

Remove infrastructure from a colony. Requires admin permission.

**Response (204 No Content)**

---

## Support Upgrades

### List Support Upgrades

**GET** `/colonies/{colony_id}/upgrades`

List all support upgrades for a colony.

**Query Parameters:**
- `offset` (int, default: 0)
- `limit` (int, default: 20, max: 100)

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "upgrade_type": "voidshield_generator",
      "custom_stat_choice": null,
      "custom_product": null,
      "affiliated_group": "military",
      "has_stat_effect": true
    }
  ],
  "meta": {
    "total": 3,
    "offset": 0,
    "limit": 20,
    "has_more": false
  }
}
```

---

### Create Support Upgrade

**POST** `/colonies/{colony_id}/upgrades`

Add a support upgrade to a colony.

**Request Body:**

```json
{
  "upgrade_type": "voidshield_generator",
  "custom_stat_choice": null,
  "custom_product": null
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "colony_id": 1,
  "upgrade_type": "voidshield_generator",
  "custom_stat_choice": null,
  "custom_product": null,
  "affiliated_group": "military",
  "has_stat_effect": true
}
```

---

### Delete Support Upgrade

**DELETE** `/colonies/{colony_id}/upgrades/{upgrade_id}`

Remove a support upgrade from a colony.

**Response (204 No Content)**

---

## Resources

### List Resources

**GET** `/colonies/{colony_id}/resources`

List all planetary resources for a colony.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Adamantium Veins",
    "resource_type": "metallic",
    "abundance": 75,
    "abundance_level": "rich"
  }
]
```

---

### Create Resource

**POST** `/colonies/{colony_id}/resources`

Add a planetary resource to a colony.

**Request Body:**

```json
{
  "resource_type": "metallic",
  "name": "Adamantium Veins",
  "abundance": 75,
  "notes": "High-quality deposits in northern continent"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "colony_id": 1,
  "resource_type": "metallic",
  "name": "Adamantium Veins",
  "abundance": 75,
  "notes": "High-quality deposits in northern continent",
  "discovered_date": "2026-08-26",
  "abundance_level": "rich"
}
```

---

### Delete Resource

**DELETE** `/colonies/{colony_id}/resources/{resource_id}`

Remove a planetary resource from a colony.

**Response (204 No Content)**

---

## Events

### List Events by Colony

**GET** `/events/colonies/{colony_id}`

List all events for a colony.

**Query Parameters:**
- `active_only` (bool, default: true) — Only show active events

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "colony_id": 1,
    "name": "Xenos Raid",
    "description": "Ork pirates raid the outer settlements",
    "created_by": 1,
    "created_at": "2026-08-25T10:00:00Z",
    "is_active": true,
    "modifiers": [
      {"stat": "order", "value": -2, "description": "Civilian panic"},
      {"stat": "productivity", "value": -1, "description": "Workforce diverted to defense"}
    ]
  }
]
```

---

### Create Event

**POST** `/events/colonies/{colony_id}`

Create a new event.

**Request Body:**

```json
{
  "name": "Xenos Raid",
  "description": "Ork pirates raid the outer settlements",
  "modifiers": [
    {"stat": "order", "value": -2, "description": "Civilian panic"},
    {"stat": "productivity", "value": -1, "description": "Workforce diverted to defense"}
  ]
}
```

**Response (201 Created):** Returns created event.

---

## Development Plans

### List Development Plans by Colony

**GET** `/development-plans/colonies/{colony_id}`

List all development plans for a colony.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "colony_id": 1,
    "upgrade_type": "manufactorum",
    "target_type": "infrastructure",
    "target_name": "Advanced Manufactorum",
    "priority": "high",
    "description": "Build a second manufactorum to boost production",
    "notes": "Requires additional power infrastructure",
    "order": 1,
    "status": "planned",
    "created_by": 1,
    "created_at": "2026-08-20T10:00:00Z"
  }
]
```

---

### Create Development Plan

**POST** `/development-plans/colonies/{colony_id}`

Create a new development plan.

**Request Body:**

```json
{
  "upgrade_type": "manufactorum",
  "target_type": "infrastructure",
  "target_name": "Advanced Manufactorum",
  "priority": "high",
  "description": "Build a second manufactorum to boost production",
  "notes": "Requires additional power infrastructure",
  "order": 1
}
```

**Response (201 Created):** Returns created plan.

---

### Install Development Plan

**POST** `/development-plans/{plan_id}/install`

Install a development plan as Infrastructure or Support Upgrade.

**Response (200 OK):**

```json
{
  "plan_id": 1,
  "plan_name": "Advanced Manufactorum",
  "plan_target_type": "infrastructure",
  "installed_type": "infrastructure",
  "installed_id": 5,
  "installed_data": {}
}
```

---

## Modifiers

### List Colony Modifiers

**GET** `/colonies/{colony_id}/modifiers`

List all active modifiers for a colony.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "colony_id": 1,
    "modifier_source_type": "infrastructure",
    "modifier_category": "hard_infrastructure",
    "modifier_stat": "productivity",
    "modifier_value": 2,
    "modifier_description": "Manufactorum (Working)",
    "is_active": true,
    "expires_at": null
  }
]
```

---

### Add Colony Modifier

**POST** `/colonies/{colony_id}/modifiers`

Add a custom modifier to a colony.

**Request Body:**

```json
{
  "modifier_source_type": "custom",
  "modifier_category": "special",
  "modifier_stat": "order",
  "modifier_value": 2,
  "modifier_description": "Governor's Inspiring Speech",
  "is_active": true,
  "expires_at": "2026-09-26T00:00:00Z"
}
```

**Response (201 Created):** Returns created modifier.

---

### Remove Colony Modifier

**DELETE** `/colonies/{colony_id}/modifiers/{modifier_id}`

Remove a modifier from a colony.

**Response (204 No Content)**

---

## Colony Users

### List Colony Members

**GET** `/colonies/{colony_id}/members`

Get all members of a colony.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "colony_id": 1,
    "user_id": 1,
    "role": "owner",
    "joined_at": "2026-08-20T10:00:00Z",
    "invited_by": 1
  }
]
```

---

### Add Colony Member

**POST** `/colonies/{colony_id}/members`

Add a user to a colony.

**Request Body:**

```json
{
  "user_id": 5,
  "role": "editor"
}
```

**Response (201 Created):** Returns created membership.

---

### Remove Colony Member

**DELETE** `/colonies/{colony_id}/members/{user_id}`

Remove a user from a colony.

**Response (204 No Content)**

---

### Transfer Colony Ownership

**POST** `/colonies/{colony_id}/members/transfer-ownership`

Transfer colony ownership.

**Request Body:**

```json
{
  "new_owner_id": 5,
  "demote_current": true
}
```

**Response (200 OK):**

```json
{
  "message": "Ownership transferred successfully",
  "colony_id": 1,
  "new_owner_id": 5,
  "previous_owner_id": 1,
  "previous_owner_demoted": true
}
```

---

## Users (Admin Only)

### List Users

**GET** `/users`

List all users with pagination. Requires admin role.

**Response (200 OK):**

```json
{
  "users": [{"id": 1, "username": "commander", "email": "...", "role": "admin", "is_active": true}],
  "total": 50,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

---

### Create User

**POST** `/users`

Create a new user. Requires admin role.

---

## Export/Import

### Export Colony

**GET** `/colonies/{colony_id}/export`

Export a colony and all its related data to a JSON file.

**Response (200 OK):** Returns JSON file with Content-Type `application/json`.

---

### Import Colony

**POST** `/colonies/import`

Import a colony from a JSON file.

**Request Body:** JSON payload or multipart file.

**Response (200 OK):**

```json
{
  "id": 2,
  "name": "New Terra",
  "message": "Colony imported successfully"
}
```

---

## Configuration

### Configuration Endpoints

- `GET /config/colony-types`
- `GET /config/representative-types`
- `GET /config/infrastructure-types`
- `GET /config/support-upgrades`
- `GET /config/profit-factor-table`
- `GET /config/thresholds`
- `GET /config/growth-decay`

---

## Audit Logs

### Get Colony Audit Logs

**GET** `/colonies/{colony_id}/audit-logs`

Get audit logs for a colony.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "entity_type": "colony",
    "entity_id": 1,
    "action": "update",
    "field": "base_size",
    "old_value": "5",
    "new_value": "6",
    "changed_by": 1,
    "changed_at": "2026-08-26T14:30:00Z",
    "colony_id": 1
  }
]
```

---

## Notifications

### Notification Stream (SSE)

**GET** `/notifications/stream`

Stream real-time notifications via Server-Sent Events (`text/event-stream`).
