# 02 — Application Structure

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 2.1 Screen Map

```
Application Root
├── Authentication
│   ├── Login Screen
│   ├── Registration Screen
│   └── Password Reset (future)
│
├── Main Application (authenticated)
│   ├── Dashboard (Colony List)
│   │
│   ├── Colony Management
│   │   ├── Colony Dashboard (3-panel view)
│   │   ├── Infrastructure Management
│   │   ├── Support Upgrades Management
│   │   ├── Planetary Resources
│   │   ├── Modifiers Management
│   │   ├── Representatives
│   │   ├── Colony Members
│   │   └── Audit Log
│   │
│   ├── Representative Management (global)
│   │   ├── Representative List
│   │   └── Representative Detail/Edit
│   │
│   └── Administration (Admin only)
│       ├── User Management
│       ├── Colony Access Management
│       └── Export/Import
│
└── Settings (future)
    ├── User Profile
    └── Application Preferences
```

---

## 2.2 Navigation Model

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [Logo] | Colony Name (context) | Notifications | [User▼]│
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ SIDEBAR  │  MAIN CONTENT AREA                                   │
│ (240px)  │  (flexible width, min 800px)                         │
│          │                                                      │
│ 📊 Dash  │  ┌────────────────────────────────────────────────┐ │
│ 🏛 Colony │  │                                                │ │
│ ⚙ Infra  │  │  [Screen-specific content]                     │ │
│ 🔧 Upgrade│  │                                                │ │
│ 🌟 Reps  │  │                                                │ │
│ 📋 Mod   │  │                                                │ │
│ 📜 Events│  │                                                │ │
│ 👥 Members│ │                                                │ │
│          │  │                                                │ │
│ ──────── │  └────────────────────────────────────────────────┘ │
│ 📖 Audit │                                                      │
│ ⚙ Admin  │                                                      │
│          │                                                      │
│ ──────── │                                                      │
│ ⚙ Settings│                                                     │
│ 🚪 Logout │                                                      │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

### Sidebar Navigation Items
### Sidebar Navigation Items

| Item | Icon | Route | Permission | Description |
|------|------|-------|------------|-------------|
| Dashboard | 📊 | `/dashboard` | All | Colony list / home |
| Colony | 🏛 | `/colony/:id` | Viewer+ | Colony dashboard |
| Infrastructure | ⚙ | `/colony/:id/infrastructure` | Editor+ | Hard infrastructure |
| Upgrades | 🔧 | `/colony/:id/upgrades` | Editor+ | Support upgrades |
| Resources | 🌟 | `/colony/:id/resources` | Editor+ | Planetary resources |
| Modifiers | 📋 | `/colony/:id/modifiers` | Editor+ | Custom modifiers |
| Representatives | 👤 | `/representatives` | All | Representative pool |
| Events | 📜 | `/colony/:id/events` | Editor+ | Event log |
| Members | 👥 | `/colony/:id/members` | Admin | Colony access |
| Audit Log | 📖 | `/colony/:id/audit` | Admin | Change history |
| Admin | ⚙ | `/admin` | Admin | User management |

### Header Components

| Component | Description | Interaction |
|-----------|-------------|-------------|
| Logo | WH40k Colony Manager branding | Click → Dashboard |
| Colony Selector | Dropdown when multiple colonies accessible | Switch context |
| Notifications | Bell icon with badge count | Click → notification panel |
| User Menu | Avatar + username | Click → dropdown (Profile, Settings, Logout) |

---

---

## 2.3 Authentication Flow

### Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Landing   │────▶│    Login     │────▶│  Dashboard      │
│   Page      │     │   Screen     │     │  (Colony List)  │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Registration │
                    │   Screen     │
                    └──────────────┘
```

### Token Handling

| Token Type | Storage | Expiry | Refresh |
|------------|---------|--------|---------|
| Access Token | Memory (not localStorage) | 15 minutes | Via refresh token |
| Refresh Token | httpOnly cookie | 7 days | Automatic |

### Auth States

| State | UI Behavior |
|-------|-------------|
| Unauthenticated | Show login/registration; redirect to `/login` |
| Token Expiring (<5 min) | Show warning toast; auto-refresh |
| Token Expired | Attempt refresh; if fails → logout |
| Refresh Failed | Clear tokens; redirect to `/login` |
| 403 Forbidden | Show "Access Denied" message |

---

## 2.4 Permission Levels

### Role Definitions

| Role | View | Edit | Delete | Admin Actions |
|------|------|------|--------|---------------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |

### Permission Enforcement

**UI Level:**
- Hide edit/delete buttons for users without permission
- Disable form inputs for Viewer role
- Show "Upgrade Required" messaging where applicable

**API Level:**
- All endpoints validate permissions server-side
- 403 Forbidden returned for unauthorized actions
- UI handles 403 with appropriate messaging

### Permission Matrix by Screen

| Screen | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| Dashboard | View | View | View |
| Colony Dashboard | View | View | View |
| Infrastructure | View | Add/Remove | Add/Remove |
| Support Upgrades | View | Add/Remove | Add/Remove |
| Modifiers | View | Add/Remove | Add/Remove |
| Representatives | View | Assign | Assign |
| Events | View | Add | Add |
| Members | ❌ | ❌ | Manage |
| Audit Log | ❌ | ❌ | View |
| Admin Panel | ❌ | ❌ | Full Access |

---

## 2.5 Routing Rules

### Protected Routes

All routes except `/login`, `/register`, and `/` (landing) require authentication.

### Route Guards

| Route Pattern | Guard | Redirect If Unauthenticated |
|---------------|-------|----------------------------|
| `/dashboard` | Auth | `/login` |
| `/colony/:id/*` | Auth + Colony Access | `/login` |
| `/admin/*` | Auth + Admin Role | `/dashboard` |
| `/representatives` | Auth | `/login` |

### Colony Context

When accessing `/colony/:id/*`, verify user has access to that colony:
- If no access → Show "Access Denied" page
- If Viewer → Show read-only UI
- If Editor/Admin → Show full UI

---

## 2.6 State Management

### Global State

| State | Source | Usage |
|-------|--------|-------|
| `auth.user` | API | Current user info, role |
| `auth.isAuthenticated` | Token presence | Route guards |
| `colony.current` | API | Active colony context |
| `colony.stats` | Calculated stats | API fetch on load |
| `colony.infrastructure` | Infrastructure list | API fetch on load |
| `colony.upgrades` | Support upgrades | API fetch on load |
| `colony.modifiers` | Custom modifiers | API fetch on load |
| `colony.representative` | Assigned rep | API fetch on load |

---

**Related Documents:**
- [Authentication Screens](./03-authentication.md)
- [API Integration](./14-api-integration.md)
- [User Flows](./12-user-flows.md)