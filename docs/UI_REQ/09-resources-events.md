# 09 — Resources & Events

**Version:** 1.0
**Date:** 2026-08-24
**Status:** Complete

---

## 9.1 Planetary Resources

### Overview

Track planetary resources available to the colony (e.g., Minerals, Agriculture, Void Trade).

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Yukonia III > Resources         [+ Add New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ PLANETARY RESOURCES                                       ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Minerals: Abundant                    [Edit] [Delete] │ ║ │
│  ║ │ Bonus: +1 Size, +1 Productivity                       │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Agriculture: Sparse                   [Edit] [Delete] │ ║ │
│  ║ │ Penalty: -1 Complacency                               │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Integration

| Action | Method | Endpoint |
|--------|--------|----------|
| List resources | GET | `/api/v1/colonies/:id/resources` |
| Add resource | POST | `/api/v1/colonies/:id/resources` |
| Update resource | PATCH | `/api/v1/colonies/:id/resources/:id` |
| Delete resource | DELETE | `/api/v1/colonies/:id/resources/:id` |

---

## 9.2 Events Log

### Overview

Track significant events affecting the colony (e.g., "Xenos Raid", "Discovery of STC Fragment").

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: [← Back] | Yukonia III > Events            [+ Log New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ EVENT LOG                                                 ║ │
│  ║ ───────────────────────────────────────────────────────── ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Day 150: Plague Outbreak                   [⚠ Major]  │ ║ │
│  ║ │ Size -1, Productivity -2                              │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ║ ┌───────────────────────────────────────────────────────┐ ║ │
│  ║ │ Day 145: Growth Spurt                       [✓ Minor] │ ║ │
│  ║ │ Size +2                                               │ ║ │
│  ║ └───────────────────────────────────────────────────────┘ ║ │
│  ║                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Event Severity Levels

| Level | Icon | Color | Example |
|-------|------|-------|---------|
| Minor | ✓ | Green | Small trade bonus |
| Moderate | ⚡ | Yellow | Infrastructure damage |
| Major | ⚠ | Orange | Plague, raid |
| Critical | ☠ | Red | Colony threat |

### API Integration

| Action | Method | Endpoint |
|--------|--------|----------|
| List events | GET | `/api/v1/colonies/:id/events` |
| Log event | POST | `/api/v1/colonies/:id/events` |
| Update event | PATCH | `/api/v1/colonies/:id/events/:id` |
| Delete event | DELETE | `/api/v1/colonies/:id/events/:id` |

---

## 9.3 Roll Status

Shows days until next event/development roll.

**API:** `GET /api/v1/colonies/:id/roll-status`

```json
{
  "days_until_event": 15,
  "days_until_development": 45,
  "next_roll_type": "event"
}
```

---

**Related Documents:**

- [Colony Dashboard](./04-colony-dashboard.md)
- [Modifiers](./08-modifiers.md)
