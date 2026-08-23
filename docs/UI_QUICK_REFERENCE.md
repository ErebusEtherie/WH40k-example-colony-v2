# Mechanicum UI Quick Reference

**For:** Frontend Developers  
**Version:** 1.0  
**CSS File:** `src/assets/css/mechanicum-design-system.css`

---

## Color Variables

```css
--mech-void: #0d0d0d      /* Background */
--mech-dark: #1a1a1a      /* Panels */
--mech-steel: #2d2d2d     /* Borders */
--mech-copper: #b87333    /* Primary accent */
--mech-plasma: #00d4ff    /* Calculated values */
--mech-amber: #ff6b35     /* Warnings */
--mech-blood: #8b0000     /* Critical errors */
--mech-gold: #d4af37      /* Totals/highlights */
```

---

## Component Classes

### Panels

```html
<div class="mech-panel">
  <div class="panel-header">
    <span class="panel-title">Title</span>
  </div>
  <div class="panel-content">...</div>
</div>
```

### Stat Boxes (5 Colony Characteristics)

```html
<div class="stat-box placated">
  <div class="stat-label">Complacency</div>
  <div class="stat-value placated">85</div>
  <div class="status-badge placated">● Placated</div>
</div>
```

**States:** `placated` | `anarchy` | `warning` | `stable`

### Input Fields

```html
<!-- Editable -->
<input class="mech-input" type="text" placeholder="Enter value...">

<!-- Calculated (read-only) -->
<input class="mech-input calculated" value="5.2" readonly>

<!-- Warning state -->
<input class="mech-input warning" value="15" readonly>

<!-- Critical state -->
<input class="mech-input critical" value="0" readonly>
```

### Tables

```html
<table class="mech-table">
  <thead>
    <tr>
      <th>Infrastructure</th>
      <th>Status</th>
      <th>Effect</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Power Network</td>
      <td>Working</td>
      <td>+10 Productivity</td>
    </tr>
  </tbody>
</table>
```

### Upgrade Items

```html
<div class="upgrade-item">
  <div class="upgrade-checkbox checked"></div>
  <div>
    <div class="upgrade-name">Power Network</div>
    <div class="upgrade-effect">+10 Productivity, +5 Complacency</div>
  </div>
</div>
```

### Calculation Display

```html
<div class="calc-row">
  <span class="calc-label">Base PF</span>
  <span class="calc-value">5</span>
  <span class="calc-desc">Colony Size 50-75</span>
</div>
<div class="calc-total">
  <span class="calc-label">Total Profit Factor</span>
  <span class="calc-value">5.2</span>
</div>
```

### Status Badges

```html
<span class="status-badge placated">● Placated</span>
<span class="status-badge anarchy">🛑 Anarchy</span>
<span class="status-badge stable">✓ Stable</span>
<span class="status-badge heretical">⚠ Heretical</span>
```

---

## Layout Utilities

```css
.grid-5  /* 5 columns (colony stats) */
.grid-2  /* 2 columns */
.corner-accent  /* Decorative corners */
```

**Responsive:** `.grid-5` becomes 3 columns at 768px, then 2 columns on mobile

---

## Typography

| Class | Font | Use |
|-------|------|-----|
| `.panel-title`, `h1-h3` | Cinzel | Headers |
| Default | Rajdhani | Body text |
| `.data-value`, `.calc-value` | Share Tech Mono | Numbers/calculations |

---

## Imperial Header

```html
<div class="imperial-header">
  <div class="imperial-title">Colony Name</div>
  <div class="imperial-subtitle">Rogue Trader Colony Management</div>
</div>
```

---

## State Color Mapping

| Colony State | Border Color | Value Color | Badge |
|--------------|--------------|-------------|-------|
| **Placated** (Complacency > Size) | Plasma Blue | Plasma Blue | ● Placated |
| **Riots and Unrest** (Complacency = 0) | Blood Red | Blood Red | ⚠ Riots |
| **Anarchy** (Order = 0) | Blood Red | Blood Red | 🛑 Anarchy |
| **Orderly** (Order > Size) | Copper | Copper | ✓ Orderly |
| **Productive** (Productivity > Size) | Plasma Blue | Plasma Blue | ▲ Productive |
| **Halted** (Productivity = 0) | Amber | Amber | ⏸ Halted |
| **Pious** (Piety > Size) | Copper | Copper | ✝ Pious |
| **Heretical** (Piety = 0) | Amber | Amber | ⚠ Heretical |
| **Stable** (Normal) | Copper | Copper | ✓ Stable |

---

## Key Interactions

### Focus States

- Inputs: Copper border + glow on focus
- Buttons: Lift 2px + plasma glow on hover
- Tables: Copper highlight on row hover

### Custom Scrollbar

- Width: 8px
- Track: Dark background
- Thumb: Copper with rounded corners

---

## File Locations

| File | Purpose |
|------|---------|
| `src/assets/css/mechanicum-design-system.css` | Canonical CSS implementation |
| `docs/UI_DESIGN_SYSTEM.md` | Detailed design documentation |
| `docs/UI_DESIGN_ANALYSIS.md` | Implementation alignment analysis |
| `docs/UI_PANEL_REQUIREMENTS.md` | Feature specifications |
| `docs/api_guide_phase_3.md` | API endpoints (Phase 3) |

**Note:** The dashboard endpoint (`/api/v1/colonies/{id}/dashboard`) documented in UI_PANEL_REQUIREMENTS.md is not yet implemented. Use `GET /api/v1/colonies/{id}` which returns `ColonyResponse` with full nested state information.

---

## Quick Start

1. Import the CSS in your main component:

   ```jsx
   import '../../assets/css/mechanicum-design-system.css'
   ```

2. Wrap your app with the base styles:

   ```jsx
   <div className="app-container">
     <header className="imperial-header">...</header>
     <main className="grid-5">...</main>
   </div>
   ```

3. Use semantic state classes:

   ```jsx
   <div className={`stat-box ${colony.order === 0 ? 'anarchy' : 'stable'}`}>
   ```
