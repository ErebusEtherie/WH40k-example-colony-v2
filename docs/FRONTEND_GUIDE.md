# Frontend Developer Guide - WH40k Colony Manager API

A comprehensive guide for frontend developers integrating with the Warhammer 40k
Rogue Trader Colony Manager API.

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Environment](#base-url--environment)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [CORS Configuration](#cors-configuration)
8. [Example Requests](#example-requests)
9. [Interactive Documentation](#interactive-documentation)
10. [UI Design Specifications](#ui-design-specifications)
11. [Frontend Requirements (Answered)](#frontend-requirements-answered)
12. [Design Decisions & Business Rules (Confirmed)](#design-decisions--business-rules-confirmed)
13. [User Story Template](#user-story-template)
14. [Next Steps](#next-steps)

---

## Overview

The WH40k Colony Manager API is a RESTful API built with FastAPI that manages
Warhammer 40k Rogue Trader colonies. It provides endpoints for:

- **User Authentication** - Registration, login, token management
- **Colony Management** - Create, read, update colonies with stats
- **Representatives** - Manage colony governors with RPG stats
- **Infrastructure** - Hard infrastructure buildings (5 types)
- **Support Upgrades** - Soft upgrades and services
- **Modifiers** - Custom stat modifiers
- **Resources** - Planetary resource management

**API Version:** 0.1.0  
**Base Path:** `/api/v1`

---

## Base URL & Environment

### Development

```text
http://localhost:8000/api/v1
```

### Production

```text
https://your-production-domain.com/api/v1
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `dev-secret-key-change-in-production` |

---

## Authentication

The API uses **JWT Bearer Token** authentication. Most endpoints require a valid
access token.

### Authentication Flow

1. **Register** a new user (public endpoint)
2. **Login** to obtain access and refresh tokens
3. **Include** the access token in the `Authorization` header for protected requests
4. **Refresh** the token before it expires (30 minutes)

### Token Format

```http
Authorization: Bearer <your_jwt_token>
```

### Auth Endpoints

#### Register New User

```http
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "rogue_trader",
  "email": "trader@voidship.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "username": "rogue_trader",
  "email": "trader@voidship.com",
  "role": "viewer",
  "is_active": true,
  "managed_colony_id": null
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "rogue_trader",
  "password": "securePassword123"
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

#### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 1,
  "username": "rogue_trader",
  "email": "trader@voidship.com",
  "role": "viewer",
  "is_active": true,
  "managed_colony_id": null
}
```

### User Roles

| Role | Level | Description |
|------|-------|-------------|
| `viewer` | 0 | Read-only access |
| `colony_manager` | 1 | Can manage colonies |

---

## API Endpoints

### Colonies

| Method | Endpoint | Description | Auth |
| -------- | ---------- | ------------- | ------ |
| GET | `/colonies` | List all colonies | ✓ |
| POST | `/colonies` | Create new colony | ✓ |
| GET | `/colonies/{id}` | Get colony details | ✓ |
| PUT | `/colonies/{id}` | Update colony | ✓ |
| DELETE | `/colonies/{id}` | Delete colony | ✓ |
| GET | `/colonies/{id}/state` | Get computed colony state | ✓ |
| POST | `/colonies/{id}/advance-age` | Advance colony age | ✓ |
| GET | `/colonies/{id}/modifiers` | List colony modifiers | ✓ |
| POST | `/colonies/{id}/modifiers` | Add modifier | ✓ |
| DELETE | `/colonies/{id}/modifiers/{modifierId}` | Remove modifier | ✓ |

#### Create Colony

```http
POST /api/v1/colonies
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Footfall",
  "owner": "Rogue Trader Dynasty",
  "colony_type": "mining_and_industry"
}
```

### Representatives

| Method | Endpoint | Description | Auth |
| -------- | ---------- | ------------- | ------ |
| GET | `/representatives` | List all representatives | ✓ |
| POST | `/representatives` | Create representative | ✓ |
| GET | `/representatives/{id}` | Get representative details | ✓ |
| PUT | `/representatives/{id}` | Update representative | ✓ |
| DELETE | `/representatives/{id}` | Delete representative | ✓ |

#### Representative Stats

```json
{
  "ws": 35, "bs": 40, "s": 30, "t": 35, "ag": 35,
  "int": 45, "per": 40, "wp": 40, "fel": 50
}
```

**Stat Abbreviations:** ws=Weapon Skill, bs=Ballistic Skill, s=Strength,
t=Toughness, ag=Agility, int=Intelligence, per=Perception, wp=Willpower,
fel=Fellowship

### Infrastructure

---

## Data Models

### Colony States (Lore States)

The API computes "lore states" based on stat values relative to colony Size:

| Stat | Condition | Lore State |
| ------ | ----------- | ------------ |
| **Complacency** | > Size | `placated` |
| | = 0 | `riots_and_unrest` |
| | otherwise | `stable` |
| **Order** | > Size | `orderly` |
| | = 0 | `anarchy` |
| | otherwise | `stable` |
| **Productivity** | > Size | `productive` |
| | = 0 | `halted` |
| | otherwise | `stable` |
| **Piety** | > Size | `pious` |
| | = 0 | `heretical` |
| | otherwise | `stable` |

### Profit Factor by Size

| Size | PF | Description |
| ------ | ------ | ------------- |
| 0 | 0 | Ghost Town |
| 1 | 1 | Settlement |
| 2 | 2 | Outpost |
| 3 | 3 | Freehold |
| 4 | 4 | Demesne |
| 5 | 6 | Holding |
| 6 | 8 | Dominion |
| 7 | 10 | Territory |
| 8 | 12 | City |
| 9 | 14 | Metropolis |
| 10 | 18 | Hive |

### Colony Types

| Type | Base Stats | Special Effect |
| ------ | ------------ | ---------------- |
| `research_mission` | C:2, P:1, O:1, Pi:1 | +2 Prod, +1 PF on Organic/Archeotech/Xenos |
| `mining_and_industry` | C:1, P:2, O:1, Pi:1 | +2 Prod, +2 PF on Minerals |
| `ecclesiastical` | C:1, P:1, O:2, Pi:2 | Can swap Piety for Order loss |
| `agricultural` | C:1, P:1, O:2, Pi:1 | Resilient to famine |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
| ------ | ------------- |
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

---

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) for browser-based frontends.

### Default Origins (Development)

- `http://localhost:3000`
- `http://127.0.0.1:3000`

### Production Configuration

Set the `ALLOWED_ORIGINS` environment variable:

```bash
ALLOWED_ORIGINS="https://colony.example.com,https://admin.colony.example.com"
```

### CORS Headers

All responses include:

- `Access-Control-Allow-Origin` - Allowed origin
- `Access-Control-Allow-Credentials: true` - Cookies/auth headers allowed
- `Access-Control-Allow-Methods` - GET, POST, PUT, PATCH, DELETE
- `Access-Control-Allow-Headers` - Authorization, Content-Type
- `Vary: Origin` - For caching

---

## Example Requests

### JavaScript/TypeScript (Fetch API)

```typescript
// Login and get token
async function login(username: string, password: string) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

// Create a colony
async function createColony(token: string, data: { name: string; owner: string; colony_type: string }) {
  const response = await fetch('http://localhost:8000/api/v1/colonies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create colony');
  return response.json();
}

// Get colony with state
async function getColony(token: string, colonyId: number) {
  const response = await fetch(`http://localhost:8000/api/v1/colonies/${colonyId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Colony not found');
  return response.json();
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useColony(colonyId: number, token: string) {
  const [colony, setColony] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchColony() {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/colonies/${colonyId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setColony(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetchColony();
  }, [colonyId, token]);

  return { colony, loading, error };
}
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rogue_trader","password":"securePassword123"}'

# List colonies
curl -X GET http://localhost:8000/api/v1/colonies \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create infrastructure
curl -X POST http://localhost:8000/api/v1/colonies/1/infrastructure \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"infrastructure_type":"power_network","state":"working"}'
```

---

## Interactive Documentation

The API provides auto-generated interactive documentation:

| Documentation | URL |
| --------------- | ----- |
| **Swagger UI** | `http://localhost:8000/docs` |
| **ReDoc** | `http://localhost:8000/redoc` |
| **OpenAPI Schema (Live)** | `http://localhost:8000/openapi.json` |
| **OpenAPI Schema (Static)** | [`docs/api/openapi.json`](docs/api/openapi.json) |

### Static OpenAPI Specification

A versioned OpenAPI specification file is maintained at [`docs/api/openapi.json`](docs/api/openapi.json). This file is:

- **Auto-generated** from the FastAPI application using `scripts/export_openapi.py`
- **Version-controlled** for tracking API contract changes over time
- **CI-managed** via GitHub Actions (auto-updated on API changes to `main`)
- **Tool-friendly** for importing into Postman, Insomnia, or OpenAPI code generators

To manually regenerate the spec:

```bash
python scripts/export_openapi.py
```

### Mock API Server

For parallel frontend development without running the full backend, use the **Prism mock server**:

```bash
# Generate latest OpenAPI spec
python scripts/export_openapi.py

# Start mock server (runs on http://localhost:4010)
npx prism mock docs/api/openapi.json
```

**Benefits:**

- Zero backend setup required
- Mock responses conform to API schema
- Validates requests against OpenAPI spec
- Supports all endpoints defined in the spec

For detailed setup instructions, see [Mock Server Setup Guide](MOCK_SERVER_SETUP.md).

### Swagger UI Features

- Live API testing
- Request/response schemas
- Authentication support (click "Authorize" button)
- Downloadable OpenAPI schema

---

## Game Cycles

The colony operates on two time cycles:

| Cycle | Interval | Description |
|-------|----------|-------------|
| **Event Roll** | 60 days | Calamitous events may occur |
| **Development Roll** | 90 days | Colony growth/decay roll |

The API tracks elapsed days and provides cycle information. Actual rolling is done manually by the GM/players.

---

## Quick Start Checklist

1. ☐ Start the API server
2. ☐ Register a user account
3. ☐ Login and save the access token
4. ☐ Create a colony
5. ☐ Assign a representative (optional)
6. ☐ Add infrastructure upgrades
7. ☐ Add support upgrades
8. ☐ Monitor colony state and modifiers
9. ☐ Implement token refresh logic (30-minute expiry)

---

## Support

For issues or questions:

- Check the interactive docs at `/docs`
- Review error messages in the response body
- Verify CORS configuration for browser issues
- Ensure JWT token is valid and not expired

---

## Frontend Requirements (Answered)

### User Personas & Roles

**Primary Users:** Both players and Game Masters use the app with similar permissions. GMs typically manage more colonies.

**All Users Can:**

- Increase colony time
- Add/remove modifiers
- Apply growth
- Build or change status of upgrades
- Add talents to representative
- Increase representative stats
- Full colony management access

**GM Additional Permissions:**

- Remove colony
- Change colony status to read-only

**Devices:** Desktop web browsers only (Chrome/Firefox)

**Session Length:** Dual-mode support:

- **During gameplay:** Quick reference during 4-hour sessions
- **Between games:** Extended planning sessions

### Core Use Cases

**Top Tasks:**

1. **View colony current state** — age, pending events, profit factor, development plan
2. **Apply event modifiers** — add lore event name, description, stat modifiers
3. **Develop Representative** — add/upgrade skills, talents, increase stats
4. **Manage infrastructure** — install upgrades, toggle working/disrupted status
5. **Track development plans** — notes on progress, acquisition requirements, priorities

### UX/UI Preferences

**Visual Theme:** Cult Mechanicus aesthetic

- Deep crimson, burnished copper, bronze, plasma blue accents
- Dark backgrounds with industrial panel-like cards
- Binary code decorative elements

**Typography:**

- **Headers:** Cinzel (all caps, letter-spaced)
- **Body/Data:** Rajdhani, Share Tech Mono for numbers

**Layout:**

- High-density dashboards with collapsible sections
- Dark mode required
- Auto-save with manual save option
- Real-time visibility of changes for collaboration

### Data Flow & State Management

**Persistence:** Auto-save on every change with manual save option

**Export/Import:** JSON export for backup and sharing

**Collaboration:** Single-user editing with occasional sharing (no real-time sync required)

### Authentication & Permissions

**Model:** Email/password authentication with 4 permission levels (Owner, GM, Party Member, Viewer)

**Colony Sharing:** Private by default, shareable with specific users

### Performance & Scale

**Expected Load:**

- Multiple colonies per user (typically 1-5 for players, 10+ for GMs)
- Load times under 2 seconds for colony dashboard

**Calculation Visibility:** Show breakdown of stat calculations on request (tooltips, detail views)

### Internationalization

**Languages:** English primary, Polish secondary (WH40k terminology varies by translation)

---

## UI Design Specifications

For detailed UI design specifications including color palette, typography, component patterns, and layout guidelines, see [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) and [`UI_QUICK_REFERENCE.md`](UI_QUICK_REFERENCE.md).

### Key Visual Themes

- **Cult Mechanicus Aesthetic:** Deep crimson, burnished copper, bronze, and plasma blue accents on dark backgrounds
- **Typography:** Cinzel for headers (all caps, letter-spaced), Rajdhani for body text and data values
- **Component Style:** Industrial panel-like cards with copper borders, subtle glow effects, and binary code decorative elements
- **Status Indicators:** Color-coded progress bars and labels (green/blue for stable, amber for warning, red for critical/degraded)
- **Interactive Elements:** Checkbox toggles for infrastructure status, command buttons with WH40k icons, collapsible sections

### Reference Mockups Analyzed

The specifications are based on analysis of the following UI examples:

1. **Adeptus Mechanicus Dashboard** - System status panels, progress bars, command interface
2. **Colony Administration** - Profit Factor display, colony metrics grid, representative stats
3. **Infrastructure & Support** - Checkbox toggles, territory cards, resource tracking
4. **Dark Heresy Character Sheet** - Characteristic tables, skill advancement tracking

---

## In-Depth Frontend Requirements

For comprehensive frontend requirements including detailed user flows, permission matrix, screen layouts, and component library specifications, see [`FRONTEND_REQUIREMENTS_INDEPTH.md`](FRONTEND_REQUIREMENTS_INDEPTH.md).

**Key Backend Implications Identified:**

- 13 new API endpoints needed (export, import, events, development plans, version history, etc.)
- 4 new database models (Event, DevelopmentPlan, AuditLog, Colony-User junction)
- 4 existing models need extension (Colony, Infrastructure, SupportUpgrade, Modifier)
- Permission system overhaul required (colony-specific roles)
- Real-time collaboration infrastructure (WebSocket or SSE)

---boration support (WebSocket or polling)

---

---

## Design Decisions & Business Rules (Confirmed)

The following decisions have been confirmed and should guide frontend implementation:

### Hard Infrastructure Implementation

**Implementation Timing:** Hard Infrastructure rules should be implemented **before Phase 4b**.

**Infrastructure Types (5 total):**

| Type | Working Bonus | Disrupted Penalty |
| ------ | --------------- | ------------------- |
| **Transportation** | +1 Productivity, +1 Complacency | -2 Productivity, -2 Order |
| **Power Network** | +2 Productivity | -3 Productivity, -1 Complacency |
| **Water Management** | +1 Order, +1 Complacency | -2 Order, -2 Complacency |
| **Food Production & Distribution** | +1 Productivity, +1 Complacency | -2 Productivity, -2 Complacency |
| **Communications** | +1 Productivity, +1 Order | -2 Productivity, -2 Order |

**Infrastructure Data Model Fields:**

- `custom_name` (string) — e.g., "Drogi"
- `type` (enum) — one of the 5 types above
- `installation_date` (integer) — colony age in days when installed
- `is_working` (boolean) — FALSE if disrupted/damaged
- `player_notes` (string) — GM/player notes about the infrastructure state

**Modifier Duration:** Infrastructure modifiers do **not** have automatic duration. They are toggled on/off manually (working ↔ disrupted state).

### Configuration & Roll Intervals

**Roll Interval Configuration:** Default values come from **global config**, but can be overridden per-colony by the GM or Colony Owner.

### Representative Mechanics

**Representative Type Bonus:** Representative Type is **descriptive only**. It does not provide mechanical bonuses to colony stats or Profit Factor. Any occasional bonuses are situational and applied manually by the GM.

**Personality Mechanical Effects:** Personalities **do** have mechanical effects on colony stats. The following personalities are supported:

| Personality | Effect |
| ------------- | -------- |
| **Beloved** | +1 Complacency |
| **Military-Minded** | +1 Order |
| **Corrupt** | +2 Productivity, -1 Order |
| **Idle** | +2 Complacency, -1 Productivity |
| **Ambitious** | +2 Productivity, -1 Complacency |
| **Zealous** | +1 Piety |
| **Patron of the Arts** | +2 Complacency, -1 Piety |
| **Unlucky** | +2 Piety |
| **Ties With…** | +1 to one stat (Complacency, Order, Productivity, or Piety — chosen by GM and saved) |
| **Administrative Expert** | +2 Productivity (only when Order > Size) |
| **Cruel** | +2 Productivity, -1 Complacency |
| **Spymaster** | +2 Order, -1 Complacency |
| **Generalissimo** | +2 Order, -1 Piety |
| **Paranoid** | +2 Order, -1 Productivity |
| **Mad** | +1 Complacency, +1 Piety, +1 Productivity, -1d5 Order (roll saved with personality) |
| **Charitable** | +1 Complacency, +1 Piety, -1 Productivity |
| **Vainglorious** | +2 Productivity, -1 Piety |
| **Scholarly** | +1 to lowest stat at time of installation (stat choice saved with personality) |
| **Avaricious** | +1 Productivity |

**Skills & Talents:** Skills and Talents are **reference only**. They do not affect calculations.

### Colony Age Display

**API Field:** Colony age is stored as a single `age_days` integer field (source of truth for calculations and event timing).

**Display Format:** Frontend should display age in a climatic format: **X years, Y months, Z days** (computed from `age_days` for display purposes only).

### Event System

**Event Tracking:** The system tracks events but does **not** auto-roll or enforce outcomes. Event table structure:

| Field | Type | Description |
| ------- | ------ | ------------- |
| `name` | string | Event name |
| `when` | integer | Colony age in days when event occurred |
| `state` | enum | `Past` or `Active` |
| `description` | string | Lore-wise description |

**GM Responsibility:** The GM manually applies any custom modifiers from events via the modifiers system. The app does not auto-calculate event outcomes.

### Colony Type

**Changeability:** Colony Type is **not changeable** after creation (outside of testing/admin tools). Too many downstream calculations depend on it.

---

## User Story Template

User stories should follow this format:

```text

As a [user role],
I want to [action],
So that [benefit/value].

Acceptance Criteria:

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

```

### Example User Stories

#### Example 1: Quick Stat Check

```text

As a player during a game session,
I want to see my colony's current stats at a glance,
So that I can quickly reference them when the GM asks.

Acceptance Criteria:

- All 5 base stats visible without scrolling
- Current values highlighted if changed from base
- Lore states (Anarchy, Placated, etc.) clearly indicated
- Loads in under 2 seconds

```

#### Example 2: Infrastructure Toggle

```text

As a player managing colony disruptions,
I want to quickly toggle infrastructure between working/disrupted,
So that I can track temporary damage during events.

Acceptance Criteria:

- One-click toggle from working <-> disrupted
- Visual indicator of state change
- Affected stats update immediately
- Change is auto-saved

```

#### Example 3: Profit Factor Calculator

```text

As a player planning colony development,
I want to see how adding infrastructure affects Profit Factor,
So that I can make informed build decisions.

Acceptance Criteria:

- "What-if" mode to preview changes before committing
- PF calculation updates in real-time
- Breakdown of PF contributors shown
- Reset to actual state option

```

---

## Next Steps

1. **Stakeholder Review** - Answer the questions above
2. **User Story Workshop** - Convert answers into prioritized user stories
3. **Wireframes** - Create low-fidelity mockups for key screens
4. **Technical Spike** - Validate frontend framework choice (React, Vue, Svelte, etc.)
5. **Architecture Decision** - State management, routing, component library
6. **Sprint Planning** - Break stories into tasks for first development sprint

---
