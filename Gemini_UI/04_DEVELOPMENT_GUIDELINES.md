# 04 — UI Development & RBAC Guidelines

This document outlines coding standards, role-based security rules, state management, and testing requirements for frontend developers.

---

## 1. Project Directory Architecture

Keep components cleanly separated by functional domain:

```
src/
├── components/
│   ├── modals/                      # Isolated dialog components (add, edit, commission)
│   │   ├── AddBlueprintModal.tsx
│   │   ├── AddCustomModifierModal.tsx
│   │   ├── AddSupportUpgradeModal.tsx
│   │   ├── CommissionHardInfrastructureModal.tsx
│   │   ├── CommissionRepresentativeModal.tsx
│   │   ├── EditCharterModal.tsx
│   │   ├── LogResourceDepositModal.tsx
│   │   ├── NewColonyModal.tsx
│   │   └── ReassignRepresentativeModal.tsx
│   ├── ApiExplorer.tsx              # Interactive REST endpoint tester
│   ├── AuditLogViewer.tsx           # Chronological change trail modal
│   ├── ColonyDetailsView.tsx        # Deep inspector for modifiers, plans, resources
│   ├── ColonyOverview.tsx           # Primary executive dashboard & metric cards
│   ├── Header.tsx                   # Top terminal banner, navigation tabs, user badge
│   ├── InfrastructureManager.tsx    # Commissioned systems & upgrade grids
│   ├── LegibilityPopover.tsx        # WCAG AA optics tuning panel
│   ├── LoginScreen.tsx              # Imperial clearance cogitator authentication
│   ├── RepresentativesManager.tsx   # Retinue stats, characteristics, skills, talents
│   └── ThemeDropdown.tsx            # Visual theme selector
├── lib/
│   ├── api.ts                       # Typed fetch client with Bearer token injection
│   ├── chronometer.ts               # In-game calendar & day advance math
│   └── calculations.ts              # Client-side mirror of Koronus rule engine
├── types/
│   ├── api.ts                       # Backend DTOs & response schemas
│   └── colony.ts                    # Core domain models (Colony, Stats, Upgrades, etc.)
├── App.tsx                          # Root coordinator, global state, tab router
├── index.css                        # Tailwind v4 directives, custom themes & variables
└── main.tsx                         # React 18 createRoot mounting
```

---

## 2. Role-Based Access Control (RBAC) in the UI

The application enforces three distinct Imperial clearance levels:

| Role Identifier | Imperial Title | Clearance Privileges |
| :--- | :--- | :--- |
| `admin` | **Arch Magos** | Full Imperial administrative clearance. Can delete colonies, reset seed database, create users, and modify any system. |
| `colony_manager` | **Lord Captain** | Sovereign colony governor. Full operational authority: charter colonies, commission infrastructure, promote plans, assign representatives. |
| `viewer` | **Servitor** | Read-only observational clearance. All mutations must be blocked. |

### Mutation Guard Pattern

Whenever an event handler performs an operational mutation (create, edit, delete, advance age, reset database), verify the user's role:

```typescript
const handleCommissionSystem = (data: NewInfrastructureData) => {
  if (currentUser?.role === "viewer") {
    alert("Clearance Denied: Servitor clearance is read-only. Lord Captain or Arch Magos clearance required.");
    return;
  }

  // Proceed with mutation
  apiFetch(`/api/v1/colonies/${colonyId}/infrastructure`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};
```

### UI Button Disabling

Where appropriate, disable buttons directly for Servitors and display an explanatory tooltip:

```tsx
<button
  id="btn-advance-chronometer"
  disabled={currentUser?.role === "viewer"}
  onClick={handleAdvanceDays}
  className={`px-3 py-1.5 rounded font-mono-slate text-xs transition ${
    currentUser?.role === "viewer"
      ? "opacity-50 cursor-not-allowed bg-[#141b2a] text-[#64748b] border border-[#232b3d]"
      : "bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40"
  }`}
  title={
    currentUser?.role === "viewer"
      ? "Clearance Denied: Servitor clearance is read-only"
      : "Advance planetary chronometer"
  }
>
  Advance 30 Days
</button>
```

---

## 3. API Communication & Optimistic UI

1. **Authentication Token**: All API requests must include the JWT token retrieved during login:
   ```typescript
   const headers = {
     "Content-Type": "application/json",
     Authorization: `Bearer ${localStorage.getItem("wh40k_access_token")}`,
   };
   ```
2. **Optimistic Updates**: For instantaneous user feedback, update local React state immediately, then fire the asynchronous API call. If the request fails, revert the state and notify the user:
   ```typescript
   const toggleModifier = async (id: string, newActive: boolean) => {
     // 1. Optimistic Update
     setModifiers((prev) =>
       prev.map((m) => (m.id === id ? { ...m, is_active: newActive } : m))
     );

     // 2. Persist to Backend
     try {
       await apiFetch(`/api/v1/colonies/${colonyId}/modifiers/${id}`, {
         method: "PUT",
         body: JSON.stringify({ is_active: newActive }),
       });
     } catch (err) {
       // 3. Rollback on failure
       setModifiers((prev) =>
         prev.map((m) => (m.id === id ? { ...m, is_active: !newActive } : m))
       );
       console.error("Failed to toggle modifier:", err);
     }
   };
   ```

---

## 4. HTML ID Attribute Standard (Automated QA & Styling)

Every interactive or meaningful UI element **must include a unique `id` attribute**. This enables automated End-to-End testing (Playwright/Cypress) and programmatic styling.

### Naming Conventions

| Component Type | ID Pattern | Example |
| :--- | :--- | :--- |
| **Buttons** | `btn-{action}-{target}` | `btn-commission-infrastructure`, `btn-export-save` |
| **Form Inputs** | `input-{field-name}` | `input-colony-name`, `input-target-base-size` |
| **Select Dropdowns** | `select-{entity}` | `select-infrastructure-type`, `select-representative` |
| **Modals** | `modal-{name}` | `modal-commission-facility`, `modal-edit-charter` |
| **Cards & Rows** | `card-{type}-{id}` | `card-colony-1`, `row-infra-manufactorum-1` |
| **Tab Controls** | `tab-{tab-id}` | `tab-overview`, `tab-infrastructure` |

---

## 5. Performance & React Best Practices

- **Avoid Infinite Loops**: Never update state directly in the component render body. Ensure all `useEffect` dependency arrays only contain stable primitives.
- **Extract Large Sub-Components**: Do not bloat `App.tsx`. New modals or complex tables must be placed into dedicated files inside `src/components/`.
- **Responsive Tables**: Always wrap management tables in an `<div className="overflow-x-auto">` container to prevent mobile layout breaking.
- **Minimum Touch Targets**: On mobile viewports (`sm:` and below), buttons and interactive targets must be at least **44px** tall (`min-h-[44px]` or adequate padding).
