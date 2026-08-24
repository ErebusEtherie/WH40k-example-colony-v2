# 13 — States & Errors

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 13.1 Overview

This document defines standard UI states for loading, error, empty, and success conditions across all screens.

---

## 13.2 Loading States

### Skeleton Loading

Used when content is being fetched from the API.

**Pattern:**

```
╔═══════════════════════════════════════════════════════════╗
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║
║ ───────────────────────────────────────────────────────── ║
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║
╚═══════════════════════════════════════════════════════════╝
```

**Usage:**

- Panel loading → Skeleton panel
- List loading → Skeleton list items (3-5 items)
- Stat loading → Skeleton stat cards

**Animation:** Shimmer effect (CSS animation)

**Duration:** Show skeleton if loading > 200ms

---

### Spinner Loading

Used for button/loading states during actions.

**Pattern:** `[  ⟳ Saving...  ]` (button disabled)

---

## 13.3 Error States

### Inline Form Errors

- Input border: Red
- Error text: Red, 14px, below input
- Icon: ⚠ warning icon

### API Error Messages

| Error Code | Message | Action |
|------------|---------|--------|
| 400 | "Invalid request. Please check your input." | Fix input |
| 401 | "Session expired. Please log in again." | Redirect to login |
| 403 | "You don't have permission to do this." | Contact admin |
| 404 | "Resource not found." | Navigate back |
| 422 | "Validation failed. Please check your input." | Show inline errors |
| 500 | "Something went wrong. Please try again." | Retry button |

---

## 13.4 Empty States

### Empty List Pattern

```
╔═══════════════════════════════════════════════════════════╗
║         ⚙                                                 ║
║     No infrastructure built yet.                          ║
║     Click "Add New" to build your first                   ║
║     infrastructure.                                       ║
║     [Add Infrastructure]                                  ║
╚═══════════════════════════════════════════════════════════╝
```

**Variants:**

- Empty infrastructure: "No infrastructure built yet."
- Empty upgrades: "No support upgrades installed."
- Empty modifiers: "No custom modifiers applied."
- Empty events: "No events logged yet."
- No colonies: "Create your first colony to begin."

---

## 13.5 Success States

### Toast Notifications

| Action | Message | Duration |
|--------|---------|----------|
| Login | "Welcome back, {name}!" | 3s |
| Add Infrastructure | "Infrastructure added" | 3s |
| Update | "Changes saved" | 3s |
| Delete | "Removed successfully" | 3s |
| Assign Representative | "Representative assigned" | 3s |

---

## 13.6 Confirmation Modals

### Delete Confirmation

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠ Confirm Delete                               [X]         │
│  Are you sure you want to delete "{name}"?                  │
│  This action cannot be undone.                              │
│  [Cancel]                                 [Delete]          │
└─────────────────────────────────────────────────────────────┘
```

---

**Related Documents:**

- [Shared Components](./11-components.md)
- [API Integration](./14-api-integration.md)
