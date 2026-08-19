# Frontend Developer Guide - WH40k Colony Manager API

A comprehensive guide for frontend developers integrating with the Warhammer 40k Rogue Trader Colony Manager API.

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
10. [Questions for Frontend Planning](#questions-for-frontend-planning)
11. [User Story Template](#user-story-template)
12. [Next Steps](#next-steps)

---

## Overview

The WH40k Colony Manager API is a RESTful API built with FastAPI that manages Warhammer 40k Rogue Trader colonies. It provides endpoints for:

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
```
http://localhost:8000/api/v1
```

### Production
```
https://your-production-domain.com/api/v1
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `dev-secret-key-change-in-production` |

---

## Authentication

The API uses **JWT Bearer Token** authentication. Most endpoints require a valid access token.

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
|--------|----------|-------------|------|
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
|--------|----------|-------------|------|
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
**Stat Abbreviations:** ws=Weapon Skill, bs=Ballistic Skill, s=Strength, t=Toughness, ag=Agility, int=Intelligence, per=Perception, wp=Willpower, fel=Fellowship

### Infrastructure

---

## Data Models

### Colony States (Lore States)

The API computes "lore states" based on stat values relative to colony Size:

| Stat | Condition | Lore State |
|------|-----------|------------|
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
|------|-----|-------------|
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
|------|------------|----------------|
| `research_mission` | C:2, P:1, O:1, Pi:1 | +2 Prod, +1 PF on Organic/Archeotech/Xenos |
| `mining_and_industry` | C:1, P:2, O:1, Pi:1 | +2 Prod, +2 PF on Minerals |
| `ecclesiastical` | C:1, P:1, O:2, Pi:2 | Can swap Piety for Order loss |
| `agricultural` | C:1, P:1, O:2, Pi:1 | Resilient to famine |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
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
|---------------|-----|
| **Swagger UI** | `http://localhost:8000/docs` |
| **ReDoc** | `http://localhost:8000/redoc` |
| **OpenAPI Schema** | `http://localhost:8000/openapi.json` |

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
|------|-------------|
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
---

## Questions for Frontend Planning

Before starting frontend development, the following questions need to be answered to create comprehensive user stories and define the UX/UI requirements.

### User Personas & Roles

1. **Who are the primary users?**
   - Solo players managing their own colony?
   - Game Masters managing multiple colonies for different players?
   - Both (with different permission levels)?

2. **What devices will users access the app on?**
   - Desktop only?
   - Tablet support needed (for tabletop play)?
   - Mobile responsive required?

3. **What is the typical session length?**
   - Quick reference during gameplay (5-10 min sessions)?
   - Long planning sessions between games (1-2 hours)?
   - Both use cases need to be supported?

### Core Use Cases

4. **What are the top 3-5 tasks users perform most often?**
   - View colony stats at a glance?
   - Add/remove infrastructure during gameplay?
   - Calculate Profit Factor after changes?
   - Track colony age and cycle events?
   - Compare different colony configurations?

5. **During gameplay, what information needs to be visible at all times?**
   - Current stat values (Size, Complacency, Order, Productivity, Piety)?
   - Profit Factor?
   - Active modifiers?
   - Colony lore states (Anarchy, Placated, etc.)?

6. **What actions need to be quick/one-click during active play?**
   - Toggle infrastructure state (working/disrupted)?
   - Add temporary modifiers?
   - Advance colony age?
   - Mark events as resolved?

### UX/UI Preferences

7. **What visual theme is expected?**
   - Grimdark/Warhammer 40k aesthetic?
   - Clean/minimalist functional design?
   - Customizable themes?
### Data Flow & State Management

11. **Real-time updates needed?**
    - Multiple users viewing/editing the same colony simultaneously?
    - Or single-user with occasional sharing?

12. **Offline capability required?**
    - Should the app work without internet (local-first)?
    - Sync when connection restored?
    - Or always-online is acceptable?

13. **Data persistence preferences?**
    - Auto-save on every change?
    - Manual save with confirmation?
    - Version history/undo capability?

14. **Export/Import needs?**
    - Export colony to PDF for printing?
    - Export to image for sharing?
    - Import from existing Excel sheets (one-time migration)?
    - Share colony JSON with other players?

### Authentication & Multi-User

15. **Authentication flow preferences?**
    - Email/password only?
    - Social login (Google, Discord)?
    - Guest mode without account?

16. **Colony sharing model?**
    - Private colonies (owner only)?
    - Shareable view-only links?
    - Collaborative editing (multiple editors)?
    - Public gallery of example colonies?

### Performance & Scale

17. **Expected scale?**
    - How many colonies per user typically?
    - How many infrastructure/upgrades per colony?
    - Performance expectations for load times?

18. **Calculation visibility?**
    - Show the math behind stat calculations?
    - Tooltip explanations for each modifier?
    - Audit trail of what changed and why?

8. **Are there existing UI references or inspiration?**
   - Specific apps or websites that have the right feel?
   - Official WH40k apps or tools to match/avoid?
### Accessibility & Internationalization

19. **Accessibility requirements?**
    - WCAG 2.1 compliance level (A, AA, AAA)?
    - Screen reader support?
    - Keyboard navigation?
    - Color blindness considerations?

20. **Internationalization needed?**
    - English only initially?
    - Plan for other languages (Polish, German, French)?
    - WH40k terminology varies by translation - which to use?

### Integration & Extensions

21. **Future integration plans?**
    - Foundry VTT integration?
    - Other virtual tabletops?
    - Discord bot for dice rolls?
    - Character sheet integration?

22. **Print-friendly views needed?**
    - One-page colony summary for printing?
    - Printer-friendly CSS?
    - PDF generation server-side?

### Analytics & Feedback

23. **Usage analytics?**
    - Track feature usage?
    - Error reporting (Sentry, etc.)?
    - User feedback mechanism in-app?

24. **Onboarding needs?**
    - Tutorial for first-time users?
    - Tooltips for WH40k-specific terms?
    - Example colonies to explore?

9. **What level of data density is preferred?**
   - High-density dashboards (all info on one screen)?
   - Guided workflows with focused screens?
   - Collapsible/expandable sections?

10. **Dark mode required?**
    - Many gamers prefer dark themes
    - Accessibility considerations?
  "detail": "Error message description",
  "path": "/api/v1/colonies/1"
---

## User Story Template

Once the above questions are answered, user stories should follow this format:

```
As a [user role],
I want to [action],
So that [benefit/value].

Acceptance Criteria:
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]
```

### Example User Stories (Pending Answers)

**Example 1: Quick Stat Check**
```
As a player during a game session,
I want to see my colony's current stats at a glance,
So that I can quickly reference them when the GM asks.

Acceptance Criteria:
- All 5 base stats visible without scrolling
- Current values highlighted if changed from base
- Lore states (Anarchy, Placated, etc.) clearly indicated
- Loads in under 2 seconds
```

**Example 2: Infrastructure Toggle**
```
As a player managing colony disruptions,
I want to quickly toggle infrastructure between working/disrupted,
So that I can track temporary damage during events.

Acceptance Criteria:
- One-click toggle from working <-> disrupted
- Visual indicator of state change
- Affected stats update immediately
- Change is auto-saved
```

**Example 3: Profit Factor Calculator**
```
As a player planning colony development,
I want to see how adding infrastructure affects Profit Factor,
So that I can make informed build decisions.

Acceptance Criteria:
- "What-if" mode to preview changes before committing
- PF calculation updates in real-time
- Breakdown of PF contributors shown
- Reset to actual state option
```

## Next Steps

1. **Stakeholder Review** - Answer the questions above
2. **User Story Workshop** - Convert answers into prioritized user stories
3. **Wireframes** - Create low-fidelity mockups for key screens
4. **Technical Spike** - Validate frontend framework choice (React, Vue, Svelte, etc.)
5. **Architecture Decision** - State management, routing, component library
6. **Sprint Planning** - Break stories into tasks for first development sprint

--- 
