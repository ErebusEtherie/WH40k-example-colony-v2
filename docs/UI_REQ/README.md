# UI Requirements — WH40k Colony Manager

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Requirements Defined  

---

## Overview

This folder contains the complete UI requirements for the WH40k Colony Manager web application. Requirements are organized by functional area to enable focused development and easier maintenance.

## Document Structure

| File | Section | Description | Priority |
|------|---------|-------------|----------|
| [`01-introduction.md`](./01-introduction.md) | Introduction | Purpose, target users, design principles | 📖 Reference |
| [`02-application-structure.md`](./02-application-structure.md) | Application Structure | Screen map, navigation model, auth flow, permissions | 🔴 HIGH |
| [`03-authentication.md`](./03-authentication.md) | Authentication | Login, registration, password management | 🔴 HIGH |
| [`04-colony-dashboard.md`](./04-colony-dashboard.md) | Colony Dashboard | Main colony view with 3 panels | 🔴 HIGH |
| [`05-infrastructure-management.md`](./05-infrastructure-management.md) | Infrastructure | Hard infrastructure CRUD operations | 🔴 HIGH |
| [`06-support-upgrades.md`](./06-support-upgrades.md) | Support Upgrades | Support upgrades CRUD with custom choices | 🔴 HIGH |
| [`07-representatives.md`](./07-representatives.md) | Representatives | Representative creation, assignment, personalities | 🟠 MEDIUM |
| [`08-modifiers.md`](./08-modifiers.md) | Modifiers | Custom modifiers (GM tool) | 🟠 MEDIUM |
| [`09-resources-events.md`](./09-resources-events.md) | Resources & Events | Planetary resources and event tracking | 🟠 MEDIUM |
| [`10-admin-screens.md`](./10-admin-screens.md) | Administration | User management, colony access, export/import | 🟡 LOW |
| [`11-components.md`](./11-components.md) | Shared Components | Reusable UI components library | 🔴 HIGH |
| [`12-user-flows.md`](./12-user-flows.md) | User Flows | End-to-end workflows | 🟠 MEDIUM |
| [`13-states-and-errors.md`](./13-states-and-errors.md) | States & Errors | Loading, error, empty states | 🟠 MEDIUM |
| [`14-api-integration.md`](./14-api-integration.md) | API Integration | JWT handling, error codes, rate limiting | 🔴 HIGH |
| [`15-responsive-accessibility.md`](./15-responsive-accessibility.md) | Responsive & A11y | Breakpoints, accessibility requirements | 🟡 LOW |

## Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| UI Design System | `../UI_DESIGN_SYSTEM.md` | Visual design (colors, typography, CSS) |
| Panel Requirements | `../UI_PANEL_REQUIREMENTS.md` | Detailed colony dashboard specifications |
| Quick Reference | `../UI_QUICK_REFERENCE.md` | Developer quick lookup |
| Business Analysis | `../business_analysis.md` | Game rules and mechanics |
| API Specification | `../api/openapi.json` | Complete REST API schema |

## Permission Levels

All screens respect the following permission model:

| Role | View | Edit | Delete | Admin Actions |
|------|------|------|--------|---------------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |

## Implementation Priority

### Phase 1: Core Functionality (Required for MVP)
- 🔴 Authentication (login, registration, token handling)
- 🔴 Colony Dashboard (view colony stats)
- 🔴 Infrastructure Management (add/remove infrastructure)
- 🔴 Support Upgrades (add/remove upgrades)
- 🔴 Shared Components (stat displays, badges, inputs)
- 🔴 API Integration (auth, error handling)

### Phase 2: Extended Features
- 🟠 Representatives (create, assign to colony)
- 🟠 Modifiers (GM tools for custom bonuses/penalties)
- 🟠 Resources & Events (view and track)
- 🟠 User Flows (complete workflows documented)

### Phase 3: Polish & Administration
- 🟡 Admin Screens (user management, access control)
- 🟡 Responsive Design (tablet optimization)
- 🟡 Accessibility (WCAG compliance)

## Status Legend

| Icon | Status | Description |
|------|--------|-------------|
| 🔴 | HIGH | Required for MVP; implement first |
| 🟠 | MEDIUM | Important but can follow Phase 1 |
| 🟡 | LOW | Nice-to-have or admin-only features |
| 📖 | REFERENCE | Documentation/reference only |

---

**Next Steps:**
1. Review this index and confirm structure
2. Begin Phase 1 implementation (authentication + colony dashboard)
3. Reference individual section files during development