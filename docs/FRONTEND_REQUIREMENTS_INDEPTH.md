# Frontend Requirements - In-Depth Specification

This document provides detailed frontend requirements based on stakeholder answers, along with identified backend implications that require API/database changes.

---

## Document Purpose

- **For Frontend Team**: Complete UI/UX specifications, user flows, and component requirements
- **For Backend Team**: Identified gaps between current API and frontend needs
- **For Project Planning**: Clear scope definition for PoC phase

---

## 1. User Roles & Permissions Matrix

### Role Definitions

| Role | Count per Colony | Permissions |
|------|------------------|-------------|
| **Owner** | 1 (creator) | Full access: view, edit, delete, export, import, manage users, change colony status |
| **Game Master** | 1 | Same as Owner except cannot transfer ownership |
| **Party Member** | Many | View, edit, export (cannot delete, cannot manage users, cannot change colony status) |
| **Viewer** | Many (with link) | View only (must be logged in) |

### Permission Matrix by Action

| Action | Owner | GM | Party Member | Viewer |
|--------|-------|-----|--------------|--------|
| View colony | ✅ | ✅ | ✅ | ✅ |
| Edit colony stats | ✅ | ✅ | ✅ | ❌ |
| Add/remove modifiers | ✅ | ✅ | ✅ | ❌ |
| Build/change upgrades | ✅ | ✅ | ✅ | ❌ |
| Manage representative | ✅ | ✅ | ✅ | ❌ |
| Add development plan items | ✅ | ✅ | ✅ | ❌ |
| Add events | ✅ | ✅ | ✅ | ❌ |
| Export colony (JSON) | ✅ | ✅ | ✅ | ❌ |
| Import colony | ✅ | ✅ | ❌ | ❌ |
| Delete colony | ✅ | ✅ | ❌ | ❌ |
| Set colony read-only | ✅ | ✅ | ❌ | ❌ |
| Manage user access | ✅ | ❌ | ❌ | ❌ |
| View version history | ✅ | ✅ | ✅ | ✅ |
| Submit feedback | ✅ | ✅ | ✅ | ✅ |

### Backend Implications ⚠️

**Current API gaps identified:**

1. **Role system needs expansion** - Current API has `role` field on User model but needs colony-specific roles
2. **Colony-user relationship table** - Need junction table for colony access with role per colony
3. **Permission checking middleware** - Need to enforce permissions at API level
4. **Read-only colony state** - Need `is_read_only` flag on Colony model
5. **Shareable links** - Need token-based access for view-only links

---

## 2. Core User Flows

### Flow 2.1: View Colony Dashboard

**Trigger**: User navigates to colony page

**Steps**:
1. Load colony summary (age, profit factor, lore states)
2. Load 5 core stats (Size, Complacency, Order, Productivity, Piety)
3. Load active modifiers
4. Load infrastructure list with working status
---

### Flow 2.3: Add/Change Infrastructure Upgrade

**Trigger**: Colony acquires new infrastructure or existing upgrade status changes

**Steps**:
1. Navigate to Infrastructure section
2. Click "Add Upgrade" or edit existing
3. Fill form:
   - Type (from predefined list: Power Network, Water Purification, etc.)
   - Custom name (e.g., "Drogi", "Garnizon Burzycieli")
   - Installation date (colony age in days)
   - Working status (checkbox: true/false)
   - Player notes (rich text: lore context, current issues, etc.)
4. Save
5. Colony stats recalculate immediately

**UI Requirements**:
- Form with validation (installation date cannot be in future)
- Working status toggle with visual feedback (green/red indicator)
- Notes field supports multi-line text
- Clear display of stat bonuses/penalties from each upgrade
- Filter/sort options if many upgrades exist

**Backend Implications ⚠️**:
- **Upgrade model needs extension**:
  - `custom_name` field
  - `installation_date` field
  - `is_working` boolean field
  - `player_notes` text field
- **Current upgrades table may need migration**
- **Stat recalculation trigger** - Changing `is_working` must trigger full stat recalculation

---

### Flow 2.4: Manage Development Plan

**Trigger**: Player plans future colony development

**Steps**:
1. Navigate to Development Plan section
2. Click "Add Plan Item"
3. Fill form:
   - Upgrade type planned
   - Priority (1-5 scale, 1 = highest)
   - Upgrade description (lore: "Karczowanie lasów pod tory dla kolei")
   - Acquisition plan (steps needed: "Pozyskanie ciężkiego sprzętu, wysłanie ludzi do roboty")
   - Current progress (text: "Zdobyliśmy sprzęt")
   - Notes (issues, blockers: "Problem - mamy za mało ludzi")
4. Save
5. Can reorder by priority (drag-drop or manual reordering)

**UI Requirements**:
- Card-based layout for each plan item
- Priority indicator (color-coded: 1=red/urgent, 5=grey/low)
- Progress visual (text field or progress bar)
- Collapse/expand individual items
- Filter by priority or upgrade type
- Mark items as complete (moves to history)

**Backend Implications ⚠️**:
- **New DevelopmentPlan model needed**:
  - `colony_id` (foreign key)
  - `upgrade_type` (string or enum)
  - `priority` (integer 1-5)
  - `upgrade_description` (text)
  - `acquisition_plan` (text)
  - `current_progress` (text)
  - `notes` (text)
  - `is_complete` (boolean)
  - `created_at`, `updated_at`, `created_by`
- **Ordering support** - Need `position` field or use priority + timestamp
- **Completion tracking** - `completed_at` timestamp when marked complete

---

### Flow 2.5: Develop Representative

**Trigger**: Representative gains experience or new abilities

**Steps**:
1. Navigate to Representative section
2. View current stats, skills, talents
3. To increase stat:
   - Click + button next to stat
   - Confirm increase (if costs XP, show cost)
   - Stat updates, leadership bonus recalculates
4. To add skill:
   - Click "Add Skill"
   - Select from skill list or enter custom
   - Save
5. To add talent:
   - Click "Add Talent"
   - Enter talent name and description
   - Save

**UI Requirements**:
- Character sheet layout (similar to Dark Heresy sheet style)
- Stats displayed in grid (WS, BS, S, T, Ag, Int, Per, WP, Fel)
- Skills list with checkboxes for advancement levels (+10, +20, +30)
- Talents displayed as cards or tags
- Clear display of leadership bonus and its impact on colony
- History of changes (what increased when)

**Backend Implications ⚠️**:
- **Representative model may need extension**:
  - Skills need to be structured (not just text list)
  - Talents may need structured storage for filtering
- **Leadership bonus calculation** - May need dedicated endpoint or computed field
- **Skill advancement tracking** - Need to track base skill vs advanced levels
- **Version history for representative changes**
---

### Flow 2.7: Collaboration & Real-Time Updates

**Trigger**: Another user saves changes to the colony

**Steps**:
1. User A is viewing colony
2. User B (different session) makes and saves changes
3. User A sees notification: "Changes were made by [User B] at [time]"
4. User A can:
   - Refresh to see changes
   - Continue viewing (data refreshes in background)
5. If User A was editing, warn about potential conflict

**UI Requirements**:
- Non-intrusive notification banner
- Timestamp and user attribution
- Auto-refresh option or manual refresh button
- Conflict detection if editing same field simultaneously
- "Last updated" timestamp always visible

**Backend Implications ⚠️**:
- **WebSocket or polling** - Need real-time or near-real-time update mechanism
- **Change notification endpoint** - API to announce changes to other connected clients
- **Optimistic locking** - Prevent conflicting updates (version field on colony)
- **Last-updated tracking** - `updated_at` and `updated_by` on all mutable models
- **Session tracking** - Know which users are currently viewing a colony

---

### Flow 2.8: Version History View

**Trigger**: User wants to see what changed and when

**Steps**:
1. Click "Version History" or "Audit Log"
2. View chronological list of changes:
   - Timestamp
   - User who made change
   - Type of change (stat modified, upgrade added, event created, etc.)
   - Before/after values (for stat changes)
3. Can filter by:
   - Date range
   - User
   - Change type
4. Can click entry for more details

**UI Requirements**:
- Timeline or list view
- Expandable entries for details
- Color coding by change type (additions=green, modifications=blue, deletions=red)
- Filter controls
- Pagination if many entries
- Export history option (optional)

**Backend Implications ⚠️**:
- **Audit log system** - Need to track all changes with:
  - Entity type and ID
  - Field changed
  - Old value, new value
  - User ID
  - Timestamp
  - Optional: change reason/comment
- **Query endpoint** - API to fetch audit log with filters
- **Storage consideration** - Audit logs can grow large, may need retention policy
- **Performance** - Audit logging should not slow down regular operations

---

### Flow 2.9: Export Colony

**Trigger**: User wants to backup colony data

**Steps**:
1. Click "Export" button
2. System generates JSON file
3. Browser downloads file: `colony_[name]_[date].json`
4. File contains complete colony state

**UI Requirements**:
- Single button action
- Loading state during generation
- Clear filename with colony name and date
- Success confirmation
- Error handling if export fails

**Backend Implications ⚠️**:
- **Export endpoint** - GET `/api/v1/colonies/{id}/export`
- **Complete data serialization** - Include all related data:
  - Colony base data
  - Stats and modifiers
  - Infrastructure and upgrades
  - Representative with all details
  - Development plans
  - Events history
  - Version history (optional, may be too large)
- **File format** - JSON with clear structure, documented schema
- **Permissions** - Only Owner, GM, Party Member can export

---

### Flow 2.10: Import Colony

**Trigger**: Owner wants to restore from backup or clone a colony

**Steps**:
1. Click "Import" button
2. Select JSON file
3. System validates file structure
---

## 3. Screen/Layout Specifications

### 3.1: Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Colony Name | Age: 142 days | PF: 46 | [Actions]   │
├─────────────────────────────────────────────────────────────┤
│  LORE STATES: [Placated] [Productive] [alert badges]        │
├───────────────┬───────────────┬───────────────┬─────────────┤
│  COMPLACENCY  │    ORDER      │ PRODUCTIVITY  │    PIETY    │
│      42       │      38       │      28       │     51      │
│   [▓▓▓▓▓░░]   │   [▓▓▓▓░░░]   │   [▓▓▓░░░░]   │  [▓▓▓▓▓▓░]  │
├───────────────┴───────────────┴───────────────┴─────────────┤
│  REPRESENTATIVE (collapsible)                               │
│  Name: Magos Varn Kell | Type: Factorium Overseer           │
│  Stats: [WS 32] [BS 28] [S 30] ... | Skills: ...            │
├─────────────────────────────┬───────────────────────────────┤
│  INFRASTRUCTURE             │  SUPPORT UPGRADES             │
│  ☐ Power Network [+3 Prod]  │  ☑ PDF Garrison [+2 Order]    │
│  ☑ Drogi [NOT WORKING] ⚠️   │  ☐ Mechanicus Shrine          │
│  ☑ Hab-Spires [+2 Size]     │  ☐ Astropathic Relay          │
├─────────────────────────────┴───────────────────────────────┤
│  DEVELOPMENT PLAN                                             │
│  [Priority 1] Transportation - Karczowanie lasów...          │
│  [Priority 2] Power Network - Rozbudowa elektrowni...        │
├─────────────────────────────────────────────────────────────┤
│  TERRITORIES & RESOURCES                                      │
│  [Ash Flats] [Sunken Hives] [Fungal Forests]                 │
├─────────────────────────────────────────────────────────────┤
│  NOTES / CHARTER                                              │
│  [Rich text editor for colony lore and player notes]         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2: Modal Dialogs

**Event Creation Modal**:
```
┌──────────────────────────────────────────────────┐
│  Add Event                              [X]      │
├──────────────────────────────────────────────────┤
│  Event Name: [____________________________]      │
│                                                  │
│  Description:                                    │
│  [_________________________________________]     │
│  [_________________________________________]     │
│                                                  │
│  Stat Modifiers:                                 │
│  [Complacency ▼] [+][-] [2]  → +2 Complacency   │
│  [Order ▼] [+][-] [-1]  → -1 Order              │
│  [+ Add Another Modifier]                        │
│                                                  │
│  Affected Upgrades:                              │
│  ☐ Mark "Drogi" as non-functional               │
│  ☐ Mark "Power Network" as non-functional       │
│                                                  │
│  Duration:  ○ Permanent  ○ Temporary [7] days   │
│                                                  │
├──────────────────────────────────────────────────┤
│  PREVIEW: Order will drop to 37 → No change     │
│           Productivity will drop to 26           │
│                                                  │
│         [Cancel]          [Save Event]           │
└──────────────────────────────────────────────────┘
```

---
---

## 5. State Management Requirements

### 5.1: Global State

```typescript
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  colonies: {
    list: ColonySummary[];
    currentColonyId: number | null;
  };
  ui: {
    locale: 'en' | 'pl';
    theme: 'dark'; // Only dark mode supported
    collapsedSections: string[];
  };
  realtime: {
    connected: boolean;
    lastSyncAt: Date | null;
    pendingChanges: boolean;
  };
}
```

### 5.2: Colony State (Local)

```typescript
interface ColonyLocalState {
  data: Colony | null;
  loading: boolean;
  error: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: Date | null;
  hasUnsavedChanges: boolean;
  optimisticUpdates: PendingChange[];
}
```

### 5.3: Real-Time Sync Strategy

**Recommended approach**: Polling with optimistic updates

- **Poll interval**: 30 seconds for changes by other users
- **Optimistic UI**: Apply user's own changes immediately
- **Conflict detection**: Compare `updated_at` timestamps
- **Conflict resolution**: Prompt user if same field modified

**Backend support needed**:
- `GET /api/v1/colonies/{id}/last-modified` - Lightweight endpoint for polling
- `updated_at` and `updated_by` on all resources
- ETag or version field for optimistic locking

---

## 6. Internationalization (i18n)

### 6.1: Supported Languages

- English (default)
- Polish

### 6.2: Translation Scope

**Must translate**:
- UI labels and buttons
- Error messages
- Validation messages
- Static game terms (Infrastructure types, Upgrade types)
- Lore state names

**Do NOT translate** (store as-is):
- User-entered content (event names, notes, descriptions)
- Custom upgrade names
- Representative name and details

### 6.3: Implementation Notes

- Use i18n library (react-i18next, vue-i18n, etc.)
- Translation files in JSON format
- Language switcher in user menu
- Persist language preference

**Backend Implications ⚠️**:
- API responses should not contain hardcoded English text for system messages
- Consider accepting `Accept-Language` header for error messages
- Game rule data (upgrade types, etc.) may need translation tables

---

## 7. Non-Functional Requirements

### 7.1: Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load time | < 3 seconds | Time to interactive |
| Colony data load | < 2 seconds | API response + render |
| Action response | < 500ms | Click to UI update |
| Real-time update latency | < 5 seconds | Other user saves → notification |

### 7.2: Reliability

- Auto-save every 5 minutes (if changes exist)
- Manual save always available
- Recovery from network errors (retry with exponential backoff)
- Clear error messages for failed operations

### 7.3: Security

- JWT tokens stored securely (httpOnly cookies preferred)
- Token refresh before expiry
- Logout on token expiry
- No sensitive data in localStorage
- HTTPS required in production

### 7.4: Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- No IE support
- No mobile browser optimization required (but should not break)

---

## 8. Backend API Gaps Summary

### 8.1: Missing Endpoints

| Need | Method | Path | Priority |
|------|--------|------|----------|
| Export colony | GET | `/api/v1/colonies/{id}/export` | High |
| Import colony | POST | `/api/v1/colonies/import` | High |
| Get version history | GET | `/api/v1/colonies/{id}/history` | High |
| Get last modified | GET | `/api/v1/colonies/{id}/last-modified` | High |
| Create event | POST | `/api/v1/colonies/{id}/events` | High |
| List events | GET | `/api/v1/colonies/{id}/events` | Medium |
| Preview event impact | POST | `/api/v1/colonies/{id}/events/preview` | Medium |
| Development plans CRUD | GET/POST/PUT/DELETE | `/api/v1/colonies/{id}/development-plan` | High |
| Colony user management | GET/POST/DELETE | `/api/v1/colonies/{id}/users` | High |
| Set colony read-only | PATCH | `/api/v1/colonies/{id}/status` | Medium |
| Submit feedback | POST | `/api/v1/feedback` | Low |
| Feature usage tracking | POST | `/api/v1/analytics/track` | Low |
| Real-time notifications | WebSocket | `/api/v1/ws/notifications` | Medium |

### 8.2: Model Extensions Needed

| Model | Fields to Add | Reason |
|-------|---------------|--------|
| `Colony` | `is_read_only`, `owner_id`, `current_version` | Read-only mode, ownership tracking, optimistic locking |
| `Infrastructure` | `custom_name`, `installation_date`, `is_working`, `player_notes` | Custom upgrade tracking |
| `SupportUpgrade` | `custom_name`, `installation_date`, `is_working`, `player_notes` | Same as Infrastructure |
| `Modifier` | `source_type`, `source_id`, `duration_days`, `created_by` | Event-sourced modifiers, temporary modifiers |
| `User` | Junction table for colony roles | Per-colony permissions |
| **NEW: `Event`** | `name`, `description`, `colony_id`, `created_by`, `timestamp` | Event tracking |
| **NEW: `DevelopmentPlan`** | `colony_id`, `upgrade_type`, `priority`, `description`, `acquisition_plan`, `progress`, `notes`, `is_complete` | Development planning |
| **NEW: `AuditLog`** | `entity_type`, `entity_id`, `field`, `old_value`, `new_value`, `user_id`, `timestamp` | Version history |

### 8.3: Permission System Overhaul

Current API uses simple user roles. Need:
- Colony-specific roles (Owner, GM, Party Member, Viewer per colony)
- Permission checking middleware
- Shareable link token system

---

## 9. Backend Design Decisions (Answered)

The following questions have been resolved (see `BACKEND_API_IMPLEMENTATION_PLAN.md` §7):

1. **Event model design**: ✅ Editable, soft-delete
2. **Audit log retention**: ✅ Forever, configurable
3. **Real-time architecture**: ✅ Server-Sent Events (SSE)
4. **Import validation**: ✅ Strict default, lenient option available
5. **Concurrent edits**: ✅ Optimistic locking
6. **File storage**: ✅ On-demand generation (no persistent storage)
7. **Feedback storage**: ✅ External service
8. **Analytics tracking**: ✅ External service (PostHog)

These decisions apply to Phase 4+ features. Current Phase 3 implementation is complete.

---

## 10. Next Steps

### For Backend Development

1. **Priority 1**: Implement missing models (Event, DevelopmentPlan, AuditLog)
2. **Priority 1**: Extend existing models with custom fields
3. **Priority 1**: Implement permission system overhaul
4. **Priority 2**: Create missing endpoints (export, import, history, events)
5. **Priority 2**: Implement real-time notification system
6. **Priority 3**: Add analytics and feedback endpoints

### For Frontend Development

1. **Setup**: Initialize project, configure i18n, set up design system
2. **Phase 1**: Build core components (StatCard, UpgradeCard, etc.)
3. **Phase 1**: Implement authentication flow
4. **Phase 1**: Build main dashboard layout
5. **Phase 2**: Implement all user flows from Section 2
6. **Phase 2**: Add real-time update notifications
7. **Phase 3**: Polish, animations, binary decorative elements
8. **Phase 3**: Export/import functionality
9. **Phase 3**: Version history viewer

### For Project Coordination

1. Backend and frontend teams align on API contract (OpenAPI/Swagger)
2. Create mock API server for frontend development
3. Set up shared component library / design tokens
4. Plan integration testing strategy
5. Define deployment pipeline (separate repos for FE/BE)

---

## 7. Non-Functional Requirements

### 7.1: Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load time | < 3 seconds | Time to interactive |
| Colony data load | < 2 seconds | API response + render |
| Action response | < 500ms | Click to UI update |
| Real-time update latency | < 5 seconds | Other user saves → notification |

### 7.2: Reliability

- Auto-save every 5 minutes (if changes exist)
- Manual save always available
- Recovery from network errors (retry with exponential backoff)
- Clear error messages for failed operations

### 7.3: Security

- JWT tokens stored securely (httpOnly cookies preferred)
- Token refresh before expiry
- Logout on token expiry
- No sensitive data in localStorage
- HTTPS required in production

### 7.4: Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- No IE support
- No mobile browser optimization required (but should not break)

## 4. Component Library Requirements

### 4.1: Core Components

| Component | Purpose | Props/Inputs | Events/Outputs |
|-----------|---------|--------------|----------------|
| `StatCard` | Display single colony stat | name, value, base_value, modifiers[], lore_state | onValueClick |
| `StatGrid` | 5-colony stats layout | stats object | - |
| `ProgressBar` | Visual stat indicator | value, max, status (good/warn/critical) | - |
| `LoreStateBadge` | Display active lore state | state_type, active | - |
| `UpgradeCard` | Infrastructure/upgrade item | name, type, bonuses, is_working, notes | onToggleWorking, onEdit |
| `UpgradeList` | Grid of upgrades | upgrades[], filter | onAddUpgrade |
| `RepresentativeSheet` | Character stats display | rep data | onStatIncrease, onAddSkill |
| `DevelopmentPlanItem` | Single plan entry | plan data | onEdit, onComplete, onReorder |
| `DevelopmentPlanList` | Plan board | items[], filters | onAddItem, onReorder |
| `EventModal` | Event creation form | - | onSave, onCancel |
| `ModifierInput` | Dynamic modifier creator | - | onAddModifier |
| `VersionHistoryTimeline` | Audit log display | entries[], filters | onEntryClick |
| `ColonyHeader` | Top bar with key info | colony name, age, PF, actions | onAdvanceTime, onExport |
| `CollapsibleSection` | Expandable panel | title, icon, defaultExpanded | onToggle |
| `NotificationBanner` | Real-time change alert | message, user, timestamp | onDismiss, onRefresh |

### 4.2: Layout Components

| Component | Purpose | Notes |
|-----------|---------|-------|
| `DashboardGrid` | Main 2-column layout | Responsive: 2-col → 1-col on small screens |
| `CardGrid` | 3-5 card layouts | For stats, territories |
| `ModalContainer` | Dialog management | Handles stacking, backdrop, ESC key |
| `PageLayout` | Standard page chrome | Header, nav, content area, footer |
4. Preview colony data (name, age, key stats)
5. Choose action:
   - Create new colony from import
   - Overwrite existing colony (dangerous, needs confirmation)
6. Confirm
7. System imports data
8. Success confirmation

**UI Requirements**:
- File upload component
- Validation feedback (invalid file, missing fields)
- Preview before import
- Clear warnings for overwrite action
- Progress indicator for large imports
- Error details if import fails

**Backend Implications ⚠️**:
- **Import endpoint** - POST `/api/v1/colonies/import`
- **Validation logic** - Validate JSON schema, check for required fields
- **ID remapping** - Imported IDs may conflict, need to generate new IDs
- **User reference resolution** - Imported `created_by` user IDs may not exist
- **Duplicate handling** - What if colony name already exists for this user
- **Rollback on failure** - If import fails partway, clean up partial data

---

### Flow 2.6: Colony Time Advancement

**Trigger**: New game session or time skip in campaign

**Steps**:
1. Click "Advance Time" button
2. Choose method:
   - Increment by 1 day
   - Add X days (enter number)
   - Set to specific day (enter target)
3. System calculates:
   - Growth/decay based on time passed
   - Scheduled events (if any)
   - Age-related thresholds
4. Preview changes
5. Confirm
6. Colony age updates, stats recalculate

**UI Requirements**:
- Clear display of current colony age
- Three input modes (increment, add, set)
- Preview of automatic changes (growth/decay)
- Warning if time jump triggers threshold events
- Confirmation dialog before applying

**Backend Implications ⚠️**:
- **Time advancement endpoint** - Current API may only allow setting age, not calculating effects
- **Growth/decay calculation** - Need clear rules for automatic stat changes over time
- **Scheduled events** - If events can be scheduled for future dates, need model for this
- **Threshold event detection** - System should detect and report when time change triggers lore states
5. Load support upgrades with working status
6. Load representative details
7. Load development plan items
8. Load pending events (if any)

**UI Requirements**:
- All stats visible without scrolling (or with minimal scrolling)
- Lore states clearly indicated (Anarchy, Placated, Productive, Halted, Heretical, Pious)
- Modified values highlighted (different color if changed from base)
- Loading state shown during data fetch
- Error state if load fails

**Backend Implications ⚠️**:
- Need single endpoint to fetch complete colony dashboard data (currently may require multiple calls)
- Need computed fields for lore states returned in response
- Need to indicate which stats are modified vs base values

---

### Flow 2.2: Add Event with Modifiers

**Trigger**: GM or player records an in-game event affecting the colony

**Steps**:
1. Click "Add Event" button
2. Fill modal form:
   - Event name (e.g., "Bandyci na drogach")
   - Description (lore + mechanical impact)
   - Stat modifiers (multiple: e.g., Order -1, Productivity -2)
   - Affected upgrades (optional: mark specific upgrades as non-functional)
   - Duration (optional: temporary or permanent)
3. Preview impact (see updated stats before confirming)
4. Confirm save
5. System applies modifiers and updates colony state
6. Version history entry created

**UI Requirements**:
- Modal dialog for event entry
- Dynamic modifier addition (add multiple stat changes)
- Real-time preview of affected stats
- Clear indication of lore state changes (e.g., "Order will drop to 0 → Anarchy triggered")
- Undo option immediately after save (within 5 seconds)

**Backend Implications ⚠️**:
- **New Event model needed** - Store events with name, description, timestamp, creator
- **Event-Modifier relationship** - Events can have multiple modifiers attached
- **Event-Upgrade relationship** - Events can mark specific upgrades as non-functional
- **Modifier model needs `source_type`** - Distinguish between event-created modifiers and manual modifiers
- **Preview endpoint** - API endpoint to calculate impact without committing
- **Undo window** - Track recent changes for quick rollback (optional stretch goal)