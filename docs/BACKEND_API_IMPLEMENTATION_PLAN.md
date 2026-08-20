# Backend API Gap Implementation Plan

**Document Purpose:** Comprehensive implementation plan for backend changes required to support frontend features identified in `FRONTEND_REQUIREMENTS_INDEPTH.md`.

**Date Created:** 2026-08-20  
**Status:** Draft - Pending Review

---

## Executive Summary

This plan addresses 13 new API endpoints, 4 new database models, 4 model extensions, and a permission system overhaul required to support the frontend's collaborative colony management features.

### Implementation Phases

| Phase | Focus | Duration Estimate | Priority |
|-------|-------|-------------------|----------|
| **Phase 1** | Foundation: Models + Permission System | 2-3 weeks | Critical |
| **Phase 2** | Core Endpoints: Events, Development Plans, History | 2-3 weeks | High |
| **Phase 3** | Collaboration: Export/Import, Real-time | 1-2 weeks | Medium |
| **Phase 4** | Polish: Analytics, Feedback, Documentation | 1 week | Low |

---

## 1. New Database Models

### 1.1: Event Model

**Purpose:** Track GM-created events that affect colony stats (e.g., "Warp Storm", "Trade Embargo", "Xenos Raid").

**Location:** `src/colony_manager/domain/models/event.py` (domain), `src/colony_manager/adapters/persistence/orm_models.py` (ORM)

**Domain Model:**
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
    stat: ModifierStat  # complacency, order, productivity, piety, size
    value: int  # + or - value
    description: str
```

**Backend Implications:**
- Events automatically create `Modifier` records when activated
- Events can be edited/deleted by GM+ roles
- Event history preserved via soft delete (`is_active`)

---

### 1.2: DevelopmentPlan Model

**Purpose:** Track long-term colony development goals.

**Location:** `src/colony_manager/domain/models/development_plan.py`

**Domain Model:**
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

**Backend Implications:**
- Purely informational - no automatic stat effects
- Progress tracking is manual

---

### 1.3: AuditLog Model

**Purpose:** Track all changes to colony state for version history.

**Location:** `src/colony_manager/domain/models/audit_log.py`

**Domain Model:**
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
    colony_id: int
```
---

### 1.4: ColonyUser Junction Model

**Purpose:** Enable colony-specific user permissions.

**Location:** `src/colony_manager/domain/models/colony_user.py`

**Domain Model:**
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
    granted_by: int
    granted_at: datetime
    invite_token: str | None
```

**Backend Implications:**
- Replaces global `User.role` for colony operations
- One role per user per colony (unique constraint)
---

## 2. Model Extensions

### 2.1: Colony Model

| Field | Type | Purpose |
|-------|------|---------|
| `is_read_only` | bool | Lock colony to prevent changes |
| `owner_id` | int | Reference to ColonyUser with OWNER role |
| `current_version` | int | Optimistic locking version |
| `updated_at` | datetime | Last modification timestamp |
| `updated_by` | int | User ID of last modifier |

### 2.2: Infrastructure Model

| Field | Type | Purpose |
|-------|------|---------|
| `custom_name` | str | Player-defined name |
| `installation_date` | date | When operational |
| `is_working` | bool | Faulty = no bonuses |
| `player_notes` | str | Player notes |

### 2.3: SupportUpgrade Model

Same fields as Infrastructure.

### 2.4: Modifier Model

| Field | Type | Purpose |
|-------|------|---------|
| `source_type` | str | "event", "infrastructure", "upgrade", "manual" |
| `source_id` | int | ID of source entity |
| `duration_days` | int | Days until expiry |
| `created_by` | int | User ID who created |

---

## 3. Permission System Overhaul

### 3.1: Two-Tier System

1. **Global Role** (`User.role`): System-level (admin, viewer)
2. **Colony Role** (`ColonyUser.role`): Per-colony (owner, gm, party_member, viewer)

### 3.2: Permission Matrix

| Action | Owner | GM | Party | Viewer |
|--------|-------|-----|-------|--------|
| View | ✅ | ✅ | ✅ | ✅ |
| Edit stats | ✅ | ✅ | ✅ | ❌ |
| Infrastructure | ✅ | ✅ | ✅ | ❌ |
| Create Events | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Delete Colony | ✅ | ❌ | ❌ | ❌ |
| Export | ✅ | ✅ | ✅ | ✅ |

### 3.3: Implementation

New middleware: `src/colony_manager/adapters/api/middleware/permissions.py`

```python
def require_colony_permission(permission: ColonyPermission):
---

## 4. New API Endpoints

### 4.1: Events
| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/v1/colonies/{id}/events` | GM+ |
| GET | `/api/v1/colonies/{id}/events` | Viewer+ |
| PUT | `/api/v1/colonies/{id}/events/{id}` | GM+ |
| DELETE | `/api/v1/colonies/{id}/events/{id}` | GM+ |
| POST | `/api/v1/colonies/{id}/events/preview` | Viewer+ |

### 4.2: Development Plans
| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/colonies/{id}/development-plans` | Viewer+ |
| POST | `/api/v1/colonies/{id}/development-plans` | Party+ |
| PUT | `/api/v1/colonies/{id}/development-plans/{id}` | Creator/GM+ |
| DELETE | `/api/v1/colonies/{id}/development-plans/{id}` | Creator/GM+ |
| PATCH | `/api/v1/colonies/{id}/development-plans/{id}/progress` | Party+ |

### 4.3: Version History
| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/colonies/{id}/history` | Viewer+ |
| GET | `/api/v1/colonies/{id}/history/summary` | Viewer+ |

### 4.4: Export/Import
| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/colonies/{id}/export` | Viewer+ |
| POST | `/api/v1/colonies/import` | Party+ |
| POST | `/api/v1/colonies/import/validate` | Party+ |

### 4.5: Colony Users
| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/colonies/{id}/users` | Owner |
| POST | `/api/v1/colonies/{id}/users` | Owner |
| PUT | `/api/v1/colonies/{id}/users/{id}` | Owner |
| DELETE | `/api/v1/colonies/{id}/users/{id}` | Owner |
| POST | `/api/v1/colonies/{id}/users/transfer-ownership` | Owner |

### 4.6: Colony Status
| Method | Path | Permission |
|--------|------|------------|
| PATCH | `/api/v1/colonies/{id}/status` | GM+ |
| GET | `/api/v1/colonies/{id}/last-modified` | Viewer+ |

### 4.7: Real-Time
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notifications/stream` | SSE endpoint |

---

## 5. Real-Time Notifications

**Architecture:** Server-Sent Events (SSE)
- Simpler than WebSocket
- One-way (server → client)
- Built-in reconnection

**Implementation:**
```python
@router.get("/notifications/stream")
async def notification_stream(current_user: User):
    async def event_generator():
        queue = notification_service.subscribe(current_user.id)
        while True:
            notification = await queue.get()
            yield f"data: {notification.json()}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Notification Types:**
- `colony_changed` - User made changes
- `event_created` - New event
- `invite_received` - Colony invite
- `colony_deleted` - Colony removed

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Create new ORM models
- Create domain models + repositories
- Extend existing models
- Database migrations
- Permission system
- Audit logging

**Deliverables:** DB schema updated, permissions working, tests passing

### Phase 2: Core Endpoints (Weeks 4-6)
- Events CRUD
- Development Plans CRUD
- Version History
- Last-Modified endpoint
- Integration tests

**Deliverables:** All endpoints working, API docs updated

### Phase 3: Collaboration (Weeks 7-8)
- Export/Import
- Colony User Management
- Real-time notifications (SSE)
- Multi-user testing

**Deliverables:** Export/Import E2E, notifications functional

### Phase 4: Polish (Week 9)
- Feedback endpoint
- Analytics tracking
- Documentation
- Performance testing

**Deliverables:** Complete docs, benchmarks

---

## 7. Design Decisions (Resolved)

The following architectural decisions were made during planning:

| # | Question | Decision | Status |
|---|----------|----------|--------|
| 1 | Events immutable or editable? | Editable, soft-delete | ✅ Resolved |
| 2 | Audit log retention? | Forever, configurable | ✅ Resolved |
| 3 | WebSocket vs SSE vs polling? | SSE for real-time updates | ✅ Resolved |
| 4 | Import validation strictness? | Strict default, lenient option | ✅ Resolved |
| 5 | Concurrent edits? | Optimistic locking | ✅ Resolved |
| 6 | Export storage? | On-demand generation | ✅ Resolved |
| 7 | Feedback storage? | External service | ✅ Resolved |
| 8 | Analytics? | External service (PostHog) | ✅ Resolved |

**Note:** These decisions apply to Phase 4+ features (events, audit logs, real-time collaboration, export/import). Current Phase 3 implementation is complete without these features.

---

## 8. File Locations

### New Files
```
src/colony_manager/
├── domain/models/
│   ├── event.py
│   ├── development_plan.py
│   ├── audit_log.py
│   └── colony_user.py
├── domain/ports/
│   ├── event_repository.py
│   ├── development_plan_repository.py
│   ├── audit_log_repository.py
│   └── colony_user_repository.py
├── adapters/persistence/repositories/
│   ├── event_repository_impl.py
│   ├── development_plan_repository_impl.py
│   ├── audit_log_repository_impl.py
│   └── colony_user_repository_impl.py
├── adapters/api/middleware/permissions.py
├── adapters/api/routers/
│   ├── events.py
│   ├── development_plans.py
│   ├── audit_logs.py
│   └── colony_users.py
└── adapters/api/schemas/
    ├── event.py
    ├── development_plan.py
    ├── audit_log.py
    └── colony_user.py
```

### Files to Modify
- `domain/models/`: colony, infrastructure, support_upgrade, modifier
- `adapters/persistence/`: orm_models, mappers, user_repository_impl
- `adapters/api/routers/`: colonies
- `application/services/`: colony, infrastructure, support_upgrade (add audit logging)

---

## 9. Success Criteria

### Phase 1
- [ ] All new models created/tested
- [ ] Permission system working
- [ ] Audit logging captures changes
- [ ] Existing tests passing

### Phase 2
- [ ] All endpoints working
- [ ] Permission checks enforced
- [ ] Integration tests passing
- [ ] API docs complete

### Phase 3
- [ ] Export/Import E2E working
- [ ] Notifications < 5s latency
- [ ] Multi-user testing passed

### Phase 4
- [ ] Feedback mechanism in place
- [ ] Analytics tracking working
- [ ] Benchmarks met

---

## 10. Next Steps

All design questions have been resolved. Implementation can proceed:

1. **Align on API contract** - Export OpenAPI spec for frontend team
2. **Create mock API server** - Enable parallel frontend development
3. **Set up migrations** - Alembic configuration for schema evolution
4. **Begin Phase 1** - Models and permissions implementation

---

**End of Document**
    async def check(colony_id: int, current_user: User, repo: ColonyUserRepository):
        if current_user.role == UserRole.ADMIN:
            return None  # Admin bypass
        colony_user = repo.get_by_colony_and_user(colony_id, current_user.id)
        if colony_user is None or permission not in ROLE_PERMISSIONS[colony_user.role]:
            raise HTTPException(status_code=403)
        return colony_user
    return check
```

**Backend Implications:**
- **Auto-populated** via service layer - not manually created
- Every colony modification creates audit log entries
- Retention: Configurable (default: forever)

---

**End of Document**