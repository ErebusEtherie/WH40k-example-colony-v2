# API Guide — Phase 3 REST API

**Created:** 2026-08-23  
**Based on:** `FRONTEND_GUIDE.md` + `FRONTEND_REQUIREMENTS_ANSWERED.md`  
**Status:** Implemented

---

## Quick Start

**Base URL (Development):** `http://localhost:8000/api/v1`  
**Authentication:** JWT Bearer Token  
**Interactive Docs:** `http://localhost:8000/docs`

---

## Authentication

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "rogue_trader",
  "email": "trader@voidship.com",
  "password": "securePassword123"
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "rogue_trader",
  "password": "securePassword123"
}

Response:
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

### Use Token

```http
Authorization: Bearer <your_jwt_token>
```

---

## Core Endpoints

### Colonies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/colonies` | List all colonies (paginated) |
| POST | `/colonies` | Create new colony |
| GET | `/colonies/{id}` | Get colony with calculated state |
| PUT | `/colonies/{id}` | Full update |
| PATCH | `/colonies/{id}` | Partial update |
| DELETE | `/colonies/{id}` | Delete colony |

### Representatives

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/representatives` | List all representatives |
| POST | `/representatives` | Create new representative |
| GET | `/representatives/{id}` | Get representative details |
| PUT | `/representatives/{id}` | Full update |
| PATCH | `/representatives/{id}` | Partial update |
| DELETE | `/representatives/{id}` | Delete representative |

### Infrastructure

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/colonies/{id}/infrastructure` | List infrastructure |
| POST | `/colonies/{id}/infrastructure` | Add infrastructure |
| PATCH | `/infrastructure/{id}` | Toggle working/disrupted |
| DELETE | `/infrastructure/{id}` | Remove infrastructure |

### Support Upgrades

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/colonies/{id}/upgrades` | List upgrades |
| POST | `/colonies/{id}/upgrades` | Add upgrade |
| DELETE | `/upgrades/{id}` | Remove upgrade |

### Modifiers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/colonies/{id}/modifiers` | List custom modifiers |
| POST | `/colonies/{id}/modifiers` | Add GM custom modifier |
| DELETE | `/modifiers/{id}` | Remove modifier |

---

## Data Models

### Colony Response

```json
{
  "id": 1,
  "name": "Footfall",
  "colony_type": "shrine_world",
  "base_size": 5,
  "age_days": 365,
  "representative_id": 1,
  "pending_infrastructure_growth": false,
  "calculated_state": {
    "current_complacency": 7,
    "current_order": 5,
    "current_productivity": 6,
    "current_piety": 8,
    "actual_size": 5,
    "current_profit_factor": 12,
    "lore_states": ["pious", "orderly"]
  }
}
```

### Representative Response

```json
{
  "id": 1,
  "name": "Governor Marcone",
  "representative_type": "satrap",
  "special_trait_description": "Former voidship captain",
  "characteristics": {
    "intelligence": 45,
    "perception": 38,
    "fellowship": 52
  },
  "skills": ["Command", "Commerce"],
  "talents": ["Leader", "Negotiator"],
  "personalities": [
    {
      "personality_type": "beloved",
      "mad_order_roll": null,
      "chosen_stat": null
    },
    {
      "personality_type": "scholarly",
      "mad_order_roll": null,
      "chosen_stat": "productivity"
    }
  ]
}
```

---

## Frontend Requirements (Summary)

### Colony Dashboard — 3 Panel Layout

### Panel 1: Basic Info (Editable)

- Colony Name, Type (read-only), Representative
- Age display (computed: X years, Y months, Z days)
- Inline edit for age_days

### Panel 2: Current Status (Calculated)

- 5 stats with current values
- Highlight if changed from base
- Lore state badges
- Profit Factor with breakdown

### Panel 3: Infrastructure Summary (Read-only)

- Hard Infrastructure list (count by type)
- Support Upgrades list (count, limit check)
- Total modifier summary

### Key Business Rules

1. **Stats clamped at 0** — Never negative
2. **Order == 0 → PF = 0** — Zero-forcing rule
3. **Productivity == 0 → PF halved** — Round-half-up
4. **Colony Type immutable** — Cannot change after creation
5. **Representative independent** — Not owned by Colony

---

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message here"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate name) |
| 500 | Internal Server Error |

---

## CORS Configuration

**Allowed Origins (Development):**

- `http://localhost:3000`
- `http://127.0.0.1:3000`

**Production:** Configure via `ALLOWED_ORIGINS` environment variable
