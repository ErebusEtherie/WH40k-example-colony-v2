# 03 — Component Patterns & Visual Anatomy

This document provides visual patterns, class compositions, and structural templates for all primary components within the **WH40k Colony Manager**.

---

## 1. Mechanical Dossier Card (`.gothic-bracket-box`)

The flagship container for Imperial colony summaries, dashboards, and tactical readouts. It features CSS pseudo-element corner brackets that simulate stamped metal framing.

```tsx
<div className="gothic-bracket-box p-4 sm:p-5 rounded shadow-xl bg-[#0b0f19] border border-[#f59e0b]/40">
  <div className="gothic-bracket-bottom-left" />
  <div className="gothic-bracket-bottom-right" />

  {/* Dossier Header */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1f293d] pb-4 mb-4">
    <div>
      <div className="flex items-center space-x-2">
        <h2 className="font-gothic font-bold text-xl text-[#f59e0b] tracking-wide">
          {colony.name}
        </h2>
        <span className="px-2 py-0.5 text-[10px] font-mono-slate uppercase font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40 rounded">
          {colony.colony_type.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-xs text-[#94a3b8] font-mono-slate mt-0.5">
        Canonical Dossier • System Sector: Koronus Expanse
      </p>
    </div>

    <button
      id="btn-edit-charter"
      onClick={onOpenEditCharter}
      className="px-3 py-1.5 bg-[#121622] hover:bg-[#1a2133] border border-[#2c364d] text-xs font-mono-slate text-[#cbd5e1] rounded transition flex items-center space-x-1.5"
    >
      <Edit3 className="w-3.5 h-3.5 text-[#f59e0b]" />
      <span>Edit Charter</span>
    </button>
  </div>

  {/* Dossier Details Grid */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-slate">
    {/* Key-Value Pair Item */}
    <div>
      <span className="text-[#64748b] uppercase block text-[10px] tracking-wider">FOUNDING DATE</span>
      <span className="text-[#cbd5e1] font-semibold">41st Millennium</span>
    </div>
  </div>
</div>
```

---

## 2. Imperial Stat Cards & Numerical Gauges

Stat cards display characteristic scores (Size, Complacency, Order, Productivity, Piety, Profit Factor). They feature high-contrast `Cinzel` digits paired with monospace telemetry and dynamic condition badges.

```tsx
<div className="stat-card p-4 rounded shadow-md flex flex-col justify-between bg-[#0f1422] border border-[#1e293b] hover:border-[#334155] transition">
  {/* Header */}
  <div className="flex items-center justify-between text-[#94a3b8]">
    <span className="text-[10px] font-mono-slate tracking-wider uppercase font-bold">
      PRODUCTIVITY
    </span>
    <TrendingUp className="w-4 h-4 text-[#10b981]" />
  </div>

  {/* Value Display */}
  <div className="my-2">
    <div className="text-3xl font-gothic font-bold text-[#f8fafc]">
      {stats.productivity.final}
    </div>
    <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/40 rounded text-[10px] uppercase font-bold tracking-wider">
      {productivityLabel}
    </span>
  </div>

  {/* Lore Target Rule */}
  <div className="text-[10px] font-mono-slate text-[#64748b]">
    Target: &gt; Size for Productive (+2 PF)
  </div>
</div>
```

### Golden Profit Factor Card Variant

When presenting Dynasty Profit Factor, use the golden highlight card:

```tsx
<div className="stat-card-gold p-4 rounded shadow-md flex flex-col justify-between bg-gradient-to-b from-[#181d2c] to-[#121624] border border-[#f59e0b]/40 hover:border-[#f59e0b]/70 transition">
  <div className="flex items-center justify-between text-[#f59e0b]">
    <span className="text-[10px] font-mono-slate tracking-wider uppercase font-bold">
      PROFIT FACTOR
    </span>
    <Coins className="w-4 h-4 text-[#f59e0b]" />
  </div>
  <div className="my-2">
    <div className="text-3xl font-gothic font-bold text-[#fef08a]">
      {stats.profitFactor.final}
    </div>
    <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#f59e0b]/15 text-[#fcd34d] border border-[#f59e0b]/40 rounded text-[10px] uppercase font-bold tracking-wider">
      DYNASTY CONTRIBUTION
    </span>
  </div>
  <div className="text-[10px] font-mono-slate text-[#94a3b8]">
    Calculated via Koronus Rule Engine
  </div>
</div>
```

---

## 3. Lore Condition Badges Matrix

Stat thresholds trigger specific 40k lore states. Render these states with the following standard tokens:

| Lore State | Condition | Background Class | Text Class | Border Class |
| :--- | :--- | :--- | :--- | :--- |
| **PLACATED** | Complacency > Size | `bg-[#10b981]/15` | `text-[#34d399]` | `border-[#10b981]/40` |
| **RIOTS** | Complacency = 0 | `bg-[#ef4444]/15` | `text-[#f87171]` | `border-[#ef4444]/40` |
| **ORDERLY** | Order > Size | `bg-[#10b981]/15` | `text-[#34d399]` | `border-[#10b981]/40` |
| **ANARCHY** | Order = 0 | `bg-[#ef4444]/15` | `text-[#f87171]` | `border-[#ef4444]/40` |
| **PRODUCTIVE** | Productivity > Size | `bg-[#10b981]/15` | `text-[#34d399]` | `border-[#10b981]/40` |
| **HALTED** | Productivity = 0 | `bg-[#ef4444]/15` | `text-[#f87171]` | `border-[#ef4444]/40` |
| **PIOUS** | Piety > Size | `bg-[#38bdf8]/15` | `text-[#38bdf8]` | `border-[#38bdf8]/40` |
| **HERETICAL** | Piety = 0 | `bg-[#ef4444]/15` | `text-[#f87171]` | `border-[#ef4444]/40` |
| **DEVOUT / NORMAL** | Default baseline | `bg-[#1e293b]` | `text-[#94a3b8]` | `border-[#334155]` |

---

## 4. User Role & Clearance Badges

User identities map to Imperial clearances in the header and cogitator readouts:

```tsx
const getRoleBadge = (role: "admin" | "colony_manager" | "viewer") => {
  switch (role) {
    case "admin":
      return (
        <span className="px-2 py-0.5 rounded text-[9px] font-mono-slate uppercase font-bold bg-[#f59e0b]/15 text-[#fcd34d] border border-[#f59e0b]/40">
          ARCH MAGOS
        </span>
      );
    case "colony_manager":
      return (
        <span className="px-2 py-0.5 rounded text-[9px] font-mono-slate uppercase font-bold bg-[#38bdf8]/15 text-[#7dd3fc] border border-[#38bdf8]/40">
          LORD CAPTAIN
        </span>
      );
    case "viewer":
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[9px] font-mono-slate uppercase font-bold bg-[#64748b]/20 text-[#cbd5e1] border border-[#64748b]/40">
          SERVITOR
        </span>
      );
  }
};
```

---

## 5. Standard Modal Anatomy

All dialogs use an authentic darkened cogitator lightbox with gold trims:

```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-[#0c101a] border border-[#f59e0b]/50 rounded shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
    
    {/* Modal Header */}
    <div className="px-4 py-3 bg-[#121726] border-b border-[#252f44] flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Building2 className="w-4 h-4 text-[#f59e0b]" />
        <span className="font-gothic font-bold text-sm tracking-wider text-[#f59e0b] uppercase">
          Commission Facility
        </span>
      </div>
      <button
        onClick={onClose}
        className="text-[#94a3b8] hover:text-white p-1 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Modal Form Body */}
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-xs font-mono-slate text-[#cbd5e1] uppercase font-bold mb-1">
          Facility Type
        </label>
        <select className="w-full bg-[#141b2a] border border-[#2c364d] text-xs font-mono-slate text-[#f8fafc] px-3 py-2 rounded focus:outline-none focus:border-[#f59e0b]">
          <option value="manufactorum">Manufactorum (+2 Productivity)</option>
        </select>
      </div>

      {/* Modal Actions Footer */}
      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1f293d]">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 bg-[#121622] hover:bg-[#1a2133] border border-[#2c364d] text-xs font-mono-slate text-[#94a3b8] rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono-slate font-bold text-xs rounded transition"
        >
          Commission System
        </button>
      </div>
    </form>
  </div>
</div>
```

---

## 6. Iconography Rules (`lucide-react`)

- **Library**: `lucide-react` is strictly mandatory. Never write custom `<svg>` paths or paste emoji characters.
- **Sizing**:
  - `w-3.5 h-3.5` for inline text badges, chips, and small action links.
  - `w-4 h-4` for standard card headers, button triggers, and table actions.
  - `w-5 h-5` for modal headers and major dashboard markers.
- **Coloring**: Always assign semantic color classes:
  - Gold: `text-[#f59e0b]`
  - Cyan: `text-[#38bdf8]`
  - Green: `text-[#10b981]`
  - Red: `text-[#ef4444]`
  - Slate: `text-[#64748b]` or `text-[#94a3b8]`
