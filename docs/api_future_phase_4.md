# API Roadmap — Phase 4+ Future Features

**Created:** 2026-08-23  
**Based on:** `BACKEND_API_IMPLEMENTATION_PLAN.md`  
**Status:** Design Complete, Not Implemented

---

## Overview

Phase 4+ adds collaborative colony management features: events, audit logs, real-time notifications, export/import, and development planning.

---

## New Models

### 1. Event Model

Track GM-created events affecting colony stats (e.g., "Warp Storm", "Trade Embargo").

```python
class Event(BaseModel):
    id: int | None = None
    colony_id: int
    name: str
    description: str
    created_by: int  # User ID
    created_at: datetime
    is_active: bool = True
    modifiers: list[EventModifier]

class EventModifier(BaseModel):
    stat: ModifierStat
    value: int  # + or -
    description: str
```

**Endpoints:**

- `POST /colonies/{id}/events` — Create event
- `GET /colonies/{id}/events` — List events
- `PATCH /events/{id}` — Edit event
- `DELETE /events/{id}` — Deactivate event

---

### 2. DevelopmentPlan Model

Track long-term colony development goals.

```python
class DevelopmentPlanStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ACQUIRED = "acquired"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class DevelopmentPlan(BaseModel):
    id: int | None = None
    colony_id: int
    upgrade_type: str  # "infrastructure" or "support_upgrade"
    target_name: str
    priority: int  # 1-5
    description: str
    acquisition_plan: str
    progress: int  # 0-100
    status: DevelopmentPlanStatus
    created_by: int
    completed_at: datetime | None
```

**Endpoints:**

- `POST /colonies/{id}/plans` — Create plan
- `GET /colonies/{id}/plans` — List plans
- `PATCH /plans/{id}` — Update progress/status

---

### 3. AuditLog Model

Track all changes to colony state for version history

### 4. ColonyUser Model

Per-colony user roles for collaboration.

```python
class ColonyUserRole(str, Enum):
    OWNER = "owner"
    GM = "gm"
    PARTY_MEMBER = "party_member"
    VIEWER = "viewer"

class ColonyUser(BaseModel):
    colony_id: int
    user_id: int
    role: ColonyUserRole
    joined_at: datetime
```

**Endpoints:**

- `POST /colonies/{id}/users` — Add user to colony
- `GET /colonies/{id}/users` — List colony users
- `PATCH /colony-users/{id}` — Change role
- `DELETE /colony-users/{id}` — Remove user

---

## Permission System

### Role Matrix

| Action | Owner | GM | Party | Viewer |
|--------|-------|----|-------|--------|
| Edit colony stats | ✅ | ✅ | ❌ | ❌ |
| Toggle infrastructure | ✅ | ✅ | ✅ | ❌ |
| Add custom modifier | ✅ | ✅ | ❌ | ❌ |
| Create events | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Delete colony | ✅ | ❌ | ❌ | ❌ |
| View all | ✅ | ✅ | ✅ | ✅ |

---

## Real-time Updates

### Server-Sent Events (SSE)

**Endpoint:** `GET /colonies/{id}/updates`

**Stream Format:**

```text
data: {"type": "infrastructure_updated", "colony_id": 1, "timestamp": "..."}
data: {"type": "modifier_added", "colony_id": 1, "timestamp": "..."}
```

**Latency Target:** < 5 seconds from change to notification

### Why SSE over WebSocket?

- Simpler implementation
- Auto-reconnect
- HTTP-compatible (easier through proxies)
- Sufficient for colony update notifications

---

## Export/Import

### Export Colony

**Endpoint:** `POST /colonies/{id}/export`

**Request:**

```json
{
  "format": "json",  // or "yaml"
  "include_history": false,
  "include_audit_log": false
}
```

**Response:** File download or presigned URL

### Import Colony

**Endpoint:** `POST /colonies/import`

**Request:** Multipart form with file

**Validation:**

- Strict mode (default): Reject unknown fields
- Lenient mode: Ignore unknown fields, warn in response

**Storage:** On-demand generation (not stored on server)

---

## Implementation Phases

| Phase | Focus | Duration | Priority |
|-------|-------|----------|----------|
| **Phase 4a** | Models + Permission System | 2-3 weeks | Critical |
| **Phase 4b** | Core Endpoints (Events, Plans, History) | 2-3 weeks | High |
| **Phase 4c** | Collaboration (Export/Import, SSE) | 1-2 weeks | Medium |
| **Phase 4d** | Polish (Analytics, Feedback, Docs) | 1 week | Low |

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Audit log retention? | Forever, configurable |
| WebSocket vs SSE vs polling? | SSE for real-time updates |
| Import validation strictness? | Strict default, lenient option |
| Concurrent edits? | Optimistic locking (version field) |
| Export storage? | On-demand generation |
| Feedback storage? | External service |
| Analytics? | External service (PostHog) |

---

## Success Criteria

### Phase 4a

- [ ] All new models created/tested
- [ ] Permission system working
- [ ] Audit logging captures changes
- [ ] Existing tests passing

### Phase 4b

- [ ] All endpoints working
- [ ] Permission checks enforced
- [ ] Integration tests passing
- [ ] API docs complete

### Phase 4c

- [ ] Export/Import E2E working
- [ ] Notifications < 5s latency
- [ ] Multi-user testing passed

---

## End of Document

```python
class AuditLogAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"

class AuditLog(BaseModel):
    entity_type: str  # "colony", "infrastructure", etc.
    entity_id: int
    action: AuditLogAction
    field: str | None
    old_value: str | None  # JSON-serialized
    new_value: str | None  # JSON-serialized
    changed_by: int
    changed_at: datetime
```

**Endpoints:**

- `GET /colonies/{id}/audit-log` — List change history
- `GET /audit-log/{id}` — Get specific entry

**Note:** Auto-populated by service layer — no manual creation.
