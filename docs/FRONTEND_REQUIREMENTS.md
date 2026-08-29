# Frontend Development Requirements

**Document Version:** 1.0  
**Last Updated:** 2026-08-29  
**API Version:** v1  
**Base URL:** `/api/v1`

This document provides frontend developers with all necessary information to build UI applications that consume the WH40k Colony Manager API.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Base Configuration](#base-configuration)
3. [Response Formats](#response-formats)
4. [Pagination](#pagination)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Endpoint Reference](#endpoint-reference)
8. [Data Models](#data-models)
9. [Best Practices](#best-practices)

---

## Authentication

### JWT Token-Based Auth

All protected endpoints require a JWT token in the `Authorization` header.

**Login Endpoint:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Using the Token:**
```http
GET /api/v1/colonies
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

Tokens expire after 30 minutes. Use the refresh endpoint to get a new token:

```http
POST /api/v1/auth/refresh
Authorization: Bearer <current_token>
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| `viewer` | Read-only access to colonies they are members of |
| `colony_manager` | Full management of colonies they are members of |
| `admin` | Full system access including user management |

---

## Base Configuration

```typescript
// Configuration constants
const API_BASE_URL = "/api/v1";
const TOKEN_STORAGE_KEY = "auth_token";
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

// Default pagination
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
```

## Response Formats

### Standard Paginated Response

All list endpoints return data in this format:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;        // Total number of items across all pages
    offset: number;       // Current offset (items skipped)
    limit: number;        // Items per page
    has_more: boolean;    // True if more pages exist
    total_pages: number;  // Calculated total pages (read-only)
  };
}
```

**Example:**
```json
{
  "items": [
    { "id": 1, "name": "Colony A", ... },
    { "id": 2, "name": "Colony B", ... }
  ],
  "meta": {
    "total": 150,
    "offset": 0,
    "limit": 20,
    "has_more": true,
    "total_pages": 8
  }
}
```

### Single Item Response

```typescript
interface SuccessResponse<T> {
  // Direct object return (varies by endpoint)
}
```

### Error Response

```typescript
interface ErrorResponse {
  detail: string;      // Human-readable error message
  status_code: number; // HTTP status code
  path?: string;       // Request path (optional)
}
```

**Example:**
```json
{
  "detail": "Colony not found",
  "status_code": 404,
  "path": "/api/v1/colonies/999"
}
```

---

## Pagination

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `offset` | integer | 0 | - | Number of items to skip |
| `limit` | integer | 20 | 100 | Maximum items to return |

### Usage Examples

```typescript
// Fetch first page
GET /api/v1/colonies?offset=0&limit=20

// Fetch second page
GET /api/v1/colonies?offset=20&limit=20

// Fetch with custom page size
GET /api/v1/colonies?offset=0&limit=50
```

### Frontend Pagination Helper

```typescript
function calculatePageFromOffset(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

function calculateOffsetFromPage(page: number, limit: number): number {
  return (page - 1) * limit;
}

// Usage in React/Vue/Angular component
const loadPage = async (page: number) => {
  const offset = calculateOffsetFromPage(page, DEFAULT_PAGE_SIZE);
  const response = await api.get(`/colonies?offset=${offset}&limit=${DEFAULT_PAGE_SIZE}`);
  setState({
    items: response.items,
    currentPage: page,
    totalPages: response.meta.total_pages,
    hasMore: response.meta.has_more
  });
};
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Handling |
|------|---------|----------|
| 200 | Success | Process response data |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success, no response body (e.g., delete) |
| 400 | Bad Request | Display validation error from `detail` |
| 401 | Unauthorized | Redirect to login, clear stored token |
| 403 | Forbidden | Show "access denied" message |
| 404 | Not Found | Show "not found" message |
| 409 | Conflict | Display conflict error (duplicate, etc.) |
| 429 | Too Many Requests | Show rate limit message, retry after delay |
| 500 | Server Error | Show generic error, log for support |

### Error Handler Example

```typescript
async function handleApiError(error: AxiosError) {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Clear token and redirect to login
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.location.href = "/login";
        break;
      case 403:
        showToast("error", data.detail || "Access denied");
        break;
      case 404:
        showToast("error", "Resource not found");
        break;
      case 429:
        const retryAfter = error.response.headers["retry-after"] || 60;
        showToast("warning", `Too many requests. Retry in ${retryAfter}s`);
        break;
      default:
        showToast("error", data.detail || "An error occurred");
    }
  } else if (error.request) {
    showToast("error", "Network error. Please check your connection.");
  } else {
    showToast("error", error.message);
  }
}
```

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Admin Operations | 50 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1630000000
Retry-After: 60
```

### Handling Rate Limits

```typescript
// Implement exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await api.get(url);
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}
```

---

## Endpoint Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with credentials | No |
| POST | `/auth/refresh` | Refresh access token | Yes |
| POST | `/auth/logout` | Logout (invalidate token) | Yes |

### Colonies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies` | List all colonies (paginated) | Yes |
| POST | `/colonies` | Create new colony | Yes |
| GET | `/colonies/{id}` | Get colony details | Yes |
| PUT | `/colonies/{id}` | Update colony | Yes (manager+) |
| DELETE | `/colonies/{id}` | Delete colony | Yes (manager+) |
| GET | `/colonies/{id}/stats` | Get colony statistics | Yes |

### Infrastructure

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/infrastructure` | List infrastructure (paginated) | Yes |
| POST | `/colonies/{id}/infrastructure` | Add infrastructure | Yes (manager+) |
| GET | `/colonies/{id}/infrastructure/{infra_id}` | Get details | Yes |
| PUT | `/colonies/{id}/infrastructure/{infra_id}` | Update | Yes (manager+) |
| DELETE | `/colonies/{id}/infrastructure/{infra_id}` | Delete | Yes (manager+) |
| POST | `/colonies/{id}/infrastructure/{infra_id}/repair` | Repair | Yes (manager+) |

**Query Parameters:**
- `state`: Filter by state (`working`, `planned`, `in_progress`, `needed`, `not_working`)
- `type`: Filter by type (`transport`, `power`, `housing`, `life_support`, `defense`, `production`)
- `name_search`: Search by name (case-insensitive)

### Resources

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/resources` | List resources (paginated) | Yes |
| POST | `/colonies/{id}/resources` | Add resource | Yes (manager+) |
| PUT | `/colonies/{id}/resources/{resource_id}` | Update | Yes (manager+) |
| DELETE | `/colonies/{id}/resources/{resource_id}` | Delete | Yes (manager+) |

### Modifiers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/modifiers` | List modifiers (paginated) | Yes |
| POST | `/colonies/{id}/modifiers` | Add custom modifier | Yes (manager+) |
| DELETE | `/colonies/{id}/modifiers/{modifier_id}` | Delete | Yes (manager+) |

**Query Parameters:**
- `colony_id`: Filter by colony
- `is_active`: Filter by active status

### Support Upgrades

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/upgrades` | List upgrades (paginated) | Yes |
| POST | `/colonies/{id}/upgrades` | Add upgrade | Yes (manager+) |
| PUT | `/colonies/{id}/upgrades/{upgrade_id}` | Update | Yes (manager+) |
| DELETE | `/colonies/{id}/upgrades/{upgrade_id}` | Delete | Yes (manager+) |

**Query Parameters:**
- `type`: Filter by type
- `name_search`: Search by name

### Events

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/events` | List events (paginated) | Yes |
| POST | `/colonies/{id}/events` | Create event | Yes (manager+) |
| PUT | `/colonies/{id}/events/{event_id}` | Update | Yes (manager+) |
| DELETE | `/colonies/{id}/events/{event_id}` | Delete | Yes (manager+) |

**Query Parameters:**
- `active_only`: Filter to active events only
- `name_search`: Search by name

### Colony Members

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/members` | List members (paginated) | Yes |
| POST | `/colonies/{id}/members` | Add member | Yes (manager+) |
| PUT | `/colonies/{id}/members/{user_id}` | Update role | Yes (manager+) |
| DELETE | `/colonies/{id}/members/{user_id}` | Remove member | Yes (manager+) |

### Development Plans

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/development-plans/colonies/{id}` | List plans (paginated) | Yes |
| POST | `/development-plans/colonies/{id}` | Create plan | Yes (manager+) |
| PUT | `/development-plans/{plan_id}` | Update plan | Yes (manager+) |
| DELETE | `/development-plans/{plan_id}` | Delete plan | Yes (manager+) |
| POST | `/development-plans/{plan_id}/install` | Install plan | Yes (manager+) |

**Query Parameters:**
- `status`: Filter by status (`planned`, `in_progress`, `acquired`, `delivered`)
- `upgrade_type`: Filter by type (`infrastructure`, `support_upgrade`)
- `priority`: Filter by priority (1-5)
- `name_search`: Search by target name

### Representatives

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/representatives` | List representatives (paginated) | Yes |
| POST | `/representatives` | Create representative | Yes (admin) |
| GET | `/representatives/{id}` | Get details | Yes |
| PUT | `/representatives/{id}` | Update | Yes (admin) |
| DELETE | `/representatives/{id}` | Delete | Yes (admin) |

**Query Parameters:**
- `loyalty_search`: Filter by loyalty range
- `name_search`: Search by name

### Users (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List users (paginated) | Admin |
| POST | `/users` | Create user | Admin |
| GET | `/users/{id}` | Get user details | Admin |
| PUT | `/users/{id}` | Update user | Admin |
| DELETE | `/users/{id}` | Delete user (soft) | Admin |
| POST | `/users/{id}/reset-password` | Reset password | Admin |

### Audit Logs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/colonies/{id}/audit-logs` | List logs (paginated) | Yes |

**Query Parameters:**
- `entity_type`: Filter by entity type
- `offset`: Pagination offset
- `limit`: Pagination limit

---

## Data Models

### Core Models

```typescript
interface Colony {
  id: number;
  name: string;
  colony_type: string;
  founder_name: string;
  state: {
    size: number;
    complacency: number;
    order: number;
    productivity: number;
    piety: number;
    profit_factor: number;
  };
  created_at: string; // ISO 8601 datetime
  updated_at: string;
}

interface ColonyListItem {
  id: number;
  name: string;
  colony_type: string;
  founder_name: string;
  current_size: number;
  current_profit_factor: number;
  state_label: string;
}

interface Infrastructure {
  id: number;
  colony_id: number;
  name: string;
  type: "transport" | "power" | "housing" | "life_support" | "defense" | "production";
  state: "working" | "planned" | "in_progress" | "needed" | "not_working";
  bonus_stat: string;
  bonus_value: number;
  description: string;
  notes: string;
  order: number;
  is_faulty: boolean;
  created_at: string;
}

interface Resource {
  id: number;
  colony_id: number;
  name: string;
  abundance: "rare" | "uncommon" | "common" | "abundant" | "plentiful";
  extraction_rate: number;
  notes: string;
  order: number;
  created_at: string;
}

interface Modifier {
  id: number;
  colony_id: number;
  modifier_type: "infrastructure" | "support_upgrade" | "event" | "custom";
  stat: "size" | "complacency" | "order" | "productivity" | "piety";
  value: number;
  description: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface SupportUpgrade {
  id: number;
  colony_id: number;
  name: string;
  type: "population" | "military" | "economic" | "loyalty";
  level: number;
  bonus_stat: string;
  bonus_value: number;
  notes: string;
  order: number;
  created_at: string;
}

interface Event {
  id: number;
  colony_id: number;
  name: string;
  description: string;
  is_active: boolean;
  modifiers: Modifier[];
  created_at: string;
}

interface ColonyUser {
  id: number;
  colony_id: number;
  user_id: number;
  username: string;
  role: "owner" | "manager" | "member" | "viewer";
  joined_at: string;
}

interface DevelopmentPlan {
  id: number;
  colony_id: number;
  upgrade_type: "infrastructure" | "support_upgrade";
  target_type: string;
  target_name: string;
  priority: number; // 1-5
  description: string;
  notes: string;
  order: number;
  status: "planned" | "in_progress" | "acquired" | "delivered";
  created_by: number;
  created_at: string;
}

interface Representative {
  id: number;
  name: string;
  loyalty: number; // 1-100
  leadership: number; // 1-100
  stats: {
    size: number;
    complacency: number;
    order: number;
    productivity: number;
    piety: number;
  };
  notes: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "colony_manager" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Best Practices

### 1. Token Management

```typescript
// Store token securely
const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.authToken = token;
};

const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  delete window.authToken;
};

// Auto-refresh token before expiry
const scheduleTokenRefresh = (expiryTime: number) => {
  const refreshTime = expiryTime - TOKEN_REFRESH_THRESHOLD_MS;
  const delay = refreshTime - Date.now();
  
  if (delay > 0) {
    setTimeout(async () => {
      try {
        const response = await api.post("/auth/refresh");
        setAuthToken(response.access_token);
      } catch (error) {
        clearAuthToken();
        window.location.href = "/login";
      }
    }, delay);
  }
};
```

### 2. API Client Setup (Axios Example)

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### 3. Pagination Component Pattern

```typescript
function usePaginatedList(fetchFn, pageSize = 20) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPage = async (page) => {
    setLoading(true);
    const offset = (page - 1) * pageSize;
    const response = await fetchFn(offset, pageSize);
    setItems(response.items);
    setMeta(response.meta);
    setLoading(false);
  };

  return { items, meta, loading, loadPage };
}
```

### 4. Caching Strategy

Use React Query, SWR, or similar for caching:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useColonies() {
  return useQuery({
    queryKey: ["colonies"],
    queryFn: () => api.get("/colonies?offset=0&limit=100"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useCreateColony() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/colonies", data),
    onSuccess: () => queryClient.invalidateQueries(["colonies"]),
  });
}
```

### 5. Form Validation

Match API validation rules:

```typescript
import { z } from "zod";

const colonySchema = z.object({
  name: z.string().min(1).max(100),
  colony_type: z.enum(["mining", "agricultural", "military", "trade"]),
  founder_name: z.string().min(1).max(100),
});
```

---

## OpenAPI/Swagger Documentation

Interactive API documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs` (when running locally)
- **ReDoc:** `http://localhost:8000/redoc`
- **Raw JSON:** `http://localhost:8000/openapi.json`

The OpenAPI schema is also available in the repository at `docs/api/openapi.json`.

---

## Development Environment

### Local API Server

```bash
# Start the API server
python -m uvicorn colony_manager.adapters.api.app:app --reload

# Server runs at http://localhost:8000
# API endpoints at http://localhost:8000/api/v1/...
```

### CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React default)
- `http://localhost:8080` (Vue default)
- `http://localhost:4200` (Angular default)

For production, update CORS origins in `src/colony_manager/adapters/api/app.py`.

---

## Support

For questions or issues:
1. Check the OpenAPI documentation at `/docs`
2. Review error response `detail` field for specific messages
3. Contact the backend team for API-related issues
