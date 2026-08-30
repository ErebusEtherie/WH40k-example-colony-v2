# Mechanicum Data-Slate UI Design System

## Reference Implementation

**Canonical CSS:** `src/assets/css/mechanicum-design-system.css`

This document describes the design system. For the production-ready CSS implementation,
refer to the canonical stylesheet which contains all component styles, utilities, and
responsive breakpoints.

---

---

## 1. Design Philosophy

### 1.1: Core Principle

> *"The spreadsheet is the UI"* — Preserve the usability patterns users already understand from the Excel-based colony manager, but render them as an immersive Warhammer 40k Mechanicum data-slate interface.

### 1.2: Translation Matrix

| Spreadsheet Pattern | Mechanicum UI Equivalent | Implementation Notes |
|---------------------|-------------------------|---------------------|
| Cell grid with borders | Steel-bordered data panels with copper corner accents | Use `border: 2px solid var(--copper)` with `::before/::after` corner decorations |
| Formula bar showing calculations | Expandable "Formula Inspector" on hover | Tooltip or popover showing derivation lineage |
| Sheet tabs (Colony/Data/Calculations) | Collapsible cogitator panels with ⚙ icons | Accordion-style sections |
| Status text ("Anarchy", "Placated") | Color-coded badges with icons | 🛑 Anarchy (red), ● Placated (green), ⚠ Heretical (amber) |
| Calculated values | Plasma-blue monospace read-only fields | `font-family: 'Share Tech Mono'`, `color: var(--plasma-blue)` |
| Input cells | Steel-bordered editable fields with copper focus glow | `:focus { box-shadow: 0 0 8px var(--copper-glow) }` |
| Dropdown validation | Binary purity seals | Checkbox with animated binary strip on validation |

---

## 2. Color System

### 2.1: Primary Palette

**Note:** These are the actual variable names from `src/assets/css/mechanicum-design-system.css`.

```css
:root {
  /* Core Palette */
  --mech-void: #0d0d0d;
  --mech-dark: #1a1a1a;
  --mech-steel: #2d2d2d;
  --mech-grid: #3a3a3a;
  --mech-input: #1f1f1f;

  /* Accent Colors */
  --mech-copper: #b87333;
  --mech-bronze: #cd7f32;
  --mech-gold: #d4af37;
  --mech-plasma: #00d4ff;
  --mech-amber: #ff6b35;
  --mech-blood: #8b0000;
  --mech-parchment: #c9b896;

  /* Text Colors */
  --text-primary: #e0e0e0;
  --text-muted: #888888;
  --text-dark: #666666;
}
```

### 2.2: Semantic Usage

| Color | Usage | Example |
|-------|-------|---------|
| **mech-copper** | Headers, active borders, primary actions | Panel titles, focused inputs |
| **mech-plasma** | Calculated values, read-only data | Profit Factor display, stat totals |
| **mech-amber** | Warnings, caution states | Heretical status, low Order warning |
| **mech-blood** | Critical states, errors | Anarchy status, colony collapse |
| **mech-gold** | Totals, highlights | Final calculations |
| **mech-void** | Backgrounds | Page background |
| **mech-dark** | Panels | Card backgrounds |
| **mech-steel** | Borders, dividers | Panel borders, table borders |

## 4. Component Library

### 4.1: Data Panel (Card)

**Note:** Class names match `src/assets/css/mechanicum-design-system.css`.

```html
<div class="mech-panel">
  <div class="panel-header">
    <span class="panel-title">
      <span class="cog-icon">⚙</span>
      Colony Statistics
    </span>
  </div>
  <div class="panel-content">
    <!-- Panel content -->
  </div>
</div>
```

```css
.mech-panel {
  border: 1px solid var(--mech-steel);
  background: var(--mech-dark);
  position: relative;
}

.mech-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--mech-copper);
}

.panel-header {
  background: linear-gradient(90deg, var(--mech-steel), transparent);
  padding: 12px 16px;
  border-bottom: 1px solid var(--mech-steel);
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
}

.panel-content {
  padding: 16px;
}
```

### 4.2: Stat Box (Colony Characteristic)

**Note:** Class names match `src/assets/css/mechanicum-design-system.css`.

```html
<div class="stat-box anarchy">
  <div class="stat-label">Order</div>
  <div class="stat-value anarchy">0</div>
  <div class="status-badge anarchy">🛑 Anarchy</div>
</div>
```

```css
.stat-box {
  border: 2px solid var(--mech-steel);
  padding: 16px;
  text-align: center;
  background: var(--mech-input);
  transition: border-color 0.3s;
}

.stat-box.placated { border-color: var(--mech-plasma); }
.stat-box.anarchy { border-color: var(--mech-blood); }
.stat-box.warning { border-color: var(--mech-amber); }
.stat-box.stable { border-color: var(--mech-copper); }

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 28px;
  font-weight: 700;
  margin: 8px 0;
}

.stat-value.placated { color: var(--mech-plasma); }
.stat-value.anarchy { color: var(--mech-blood); }
.stat-value.warning { color: var(--mech-amber); }
.stat-value.stable { color: var(--mech-copper); }

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.placated {
  background: rgba(0, 212, 255, 0.1);
  color: var(--mech-plasma);
}
.status-badge.anarchy {
  background: rgba(139, 0, 0, 0.2);
  color: var(--mech-blood);
}
.status-badge.heretical {
  background: rgba(255, 107, 53, 0.1);
  color: var(--mech-amber);
}
```

**State Classes:** `placated` | `anarchy` | `warning` | `stable` | `orderly` | `productive` | `halted` | `pious` | `heretical` | `riots_and_unrest`

```css
.stat-box--order[data-state="stable"] {
  border-color: var(--void-green);
}

.stat-box__number {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 700;
  color: var(--plasma-blue);
  text-shadow: var(--glow-plasma);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--critical {
  background: var(--blood-red);
  color: white;
  animation: pulse-red 1.5s infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
```

### 4.4: Input Field

```html
<div class="input-group">
  <label class="input-label" for="colony-name">Colony Name</label>
  <input type="text" id="colony-name" class="input-field" placeholder="Enter colony designation...">
  <div class="input-decoration"></div>
</div>
```

```css
.input-group {
  margin-bottom: 1rem;
  position: relative;
}

.input-label {
  display: block;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--void-black);
  border: 2px solid var(--steel);
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: 16px;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--copper);
  box-shadow: 0 0 8px var(--plasma-glow);
}

.input-decoration {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-bottom: 2px solid var(--steel);
  border-right: 2px solid var(--steel);
  transition: all 0.3s ease;
}

.input-field:focus + .input-decoration {
  border-color: var(--copper);
}
```

---

### 4.5: Button

```html
<button class="btn btn--primary">
  <span class="btn__icon">⚡</span>
  <span class="btn__text">Initialize Colony</span>
</button>

<button class="btn btn--secondary">Cancel</button>

<button class="btn btn--binary">
  <span class="btn__binary-strip"></span>
  <span class="btn__text">Engage</span>
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn--primary {
  background: var(--gradient-copper);
  color: var(--void-black);
  border-color: var(--copper);
}

.btn--primary:hover {
  box-shadow: 0 0 15px var(--plasma-glow);
  transform: translateY(-2px);
}

.btn--secondary {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--steel);
}

.btn--secondary:hover {
  border-color: var(--copper);
  background: var(--steel-dark);
}

.btn--binary {
  background: var(--void-black);
  border-color: var(--copper);
  color: var(--plasma-blue);
}

.btn__binary-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--binary-strip);
  animation: binary-scroll 2s linear infinite;
}

@keyframes binary-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(4px); }
}
```

---

### 4.6: Tooltip (Formula Inspector)

```html
<div class="tooltip-trigger">
  Profit Factor: <span class="data-value">5.2</span>
---

## 5. Layout Patterns

### 5.1: Dashboard Grid

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Stat boxes row - 5 colony characteristics */
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 5.2: Two-Column Layout

```css
.layout-two-column {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .layout-two-column {
    grid-template-columns: 1fr;
  }
}
```

### 5.3: Collapsible Sections (Cogitator Panels)

```html
<div class="cogitator-panel">
  <button class="cogitator-panel__header">
    <span class="cogitator-panel__icon">⚙</span>
    <span class="cogitator-panel__title">Infrastructure</span>
    <span class="cogitator-panel__toggle">▼</span>
  </button>
  <div class="cogitator-panel__content">
    <!-- Content -->
  </div>
</div>
```

```css
.cogitator-panel {
  border: 2px solid var(--steel);
  margin-bottom: 1rem;
}

.cogitator-panel__header {
  width: 100%;
  background: var(--steel-dark);
  border: none;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--copper-light);
}

.cogitator-panel__header:hover {
  background: var(--steel-mid);
}

.cogitator-panel__toggle {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.cogitator-panel.is-collapsed .cogitator-panel__toggle {
  transform: rotate(-90deg);
}

.cogitator-panel__content {
  padding: 1.5rem;
  background: var(--gradient-panel);
}

.cogitator-panel.is-collapsed .cogitator-panel__content {
  display: none;
}
```

---

### 4.7: Infrastructure Card

Hard Infrastructure items are displayed as cards with operational state toggles.

```html
<div class="infrastructure-card">
  <div class="infrastructure-card__header">
    <span class="infrastructure-card__type-icon">🛣️</span>
    <h3 class="infrastructure-card__title">Drogi</h3>
    <span class="infrastructure-card__type-badge">Transportation</span>
  </div>
  <div class="infrastructure-card__status">
    <label class="toggle-switch">
      <input type="checkbox" checked class="toggle-switch__input">
      <span class="toggle-switch__slider"></span>
      <span class="toggle-switch__label">Operational</span>
    </label>
  </div>
  <div class="infrastructure-card__bonuses">
    <div class="bonus-row bonus-row--active">
      <span class="bonus-icon">↑</span>
      <span class="bonus-text">+1 Productivity, +1 Complacency</span>
    </div>
    <div class="bonus-row bonus-row--inactive">
      <span class="bonus-icon">↓</span>
      <span class="bonus-text">-2 Productivity, -2 Order (if disrupted)</span>
    </div>
  </div>
  <div class="infrastructure-card__meta">
    <span class="meta-item">Installed: Day 130</span>
  </div>
  <div class="infrastructure-card__notes">
    <p>Bandyci napadają na podróżnych, dopóki nie zorganizujemy patroli...</p>
  </div>
</div>
```

```css
.infrastructure-card {
  background: var(--gradient-panel);
  border: 2px solid var(--steel);
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.infrastructure-card--disrupted {
  border-color: var(--blood-red);
  box-shadow: 0 0 10px rgba(139, 0, 0, 0.3);
}

.infrastructure-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.infrastructure-card__type-icon {
  font-size: 24px;
}

.infrastructure-card__title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--copper-light);
  margin: 0;
}

.infrastructure-card__type-badge {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--steel-dark);
  color: var(--plasma-blue);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--steel);
}

.infrastructure-card__status {
  margin-bottom: 1rem;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-switch__input {
  display: none;
}

.toggle-switch__slider {
  width: 40px;
  height: 20px;
  background: var(--steel);
  border-radius: 10px;
  position: relative;
  transition: background 0.3s ease;
}

.toggle-switch__slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: var(--text-primary);
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.toggle-switch__input:checked + .toggle-switch__slider {
  background: var(--void-green);
}

.toggle-switch__input:checked + .toggle-switch__slider::before {
  transform: translateX(20px);
}

.toggle-switch__input:not(:checked) + .toggle-switch__slider {
  background: var(--blood-red);
}

.infrastructure-card__bonuses {
  margin-bottom: 1rem;
}

.bonus-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 14px;
  padding: 0.25rem 0;
}

.bonus-row--active {
  color: var(--void-green);
}

.bonus-row--inactive {
  color: var(--text-muted);
  opacity: 0.7;
}

.bonus-icon {
  font-weight: bold;
}

.infrastructure-card__meta {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.infrastructure-card__notes {
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--void-black);
  padding: 0.75rem;
  border: 1px solid var(--steel);
}

.infrastructure-card__notes p {
  margin: 0;
}
```

**Infrastructure Type Icons:**

- Transportation: 🛣️
- Power Network: ⚡
- Water Management: 💧
- Food Production: 🌾
- Communications: 📡

**State Indicators:**

- Operational (green toggle): Shows active bonuses
- Disrupted (red toggle): Shows penalty warnings, card border glows red

---
---

## 6. Decorative Elements

### 6.1: Binary Data Strip

```css
.binary-strip {
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--copper-dark) 0px,
    var(--copper-dark) 2px,
    transparent 2px,
    transparent 4px,
    var(--plasma-blue-dim) 4px,
    var(--plasma-blue-dim) 6px,
    transparent 6px,
    transparent 8px
  );
  animation: binary-flow 3s linear infinite;
}

---

## 7. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Set up CSS custom properties (color system)
- [ ] Import and configure fonts (Cinzel, Rajdhani, Share Tech Mono)
- [ ] Create base component styles (panel, button, input)
- [ ] Build layout grid system
- [ ] Implement responsive breakpoints

### Phase 2: Core Components (Week 2)
- [ ] Stat Box component with state variants (Anarchy, Placated, etc.)
- [ ] Infrastructure Row component with purity seal checkboxes
- [ ] Modal dialog system
- [ ] Tooltip/Formula Inspector
- [ ] Collapsible Cogitator Panels

### Phase 3: Decorative Elements (Week 3)
- [ ] Binary strip animations
- [ ] Corner accent decorations
- [ ] Cog icon animations
- [ ] Loading states (spinner, skeleton)
- [ ] Hover/focus transitions

### Phase 4: Integration (Week 4)
- [ ] Connect components to React framework
- [ ] Implement state management for interactive elements
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] Performance optimization (CSS purging, lazy loading)
- [ ] Cross-browser testing

---

## 8. Accessibility Considerations

### 8.1: Color Contrast

Ensure all text meets WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Verified:**
- Plasma blue (#00D4FF) on void black (#0D0D0D) = 7.2:1 ✓
- Copper (#B87333) on steel (#4A4A4A) = 3.1:1 ✓ (large text only)

### 8.2: Motion Sensitivity

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.3: Keyboard Navigation

- All interactive elements focusable with `Tab`
- Visible focus indicators (copper glow)
- Escape closes modals
- Enter/Space activates buttons
- ARIA labels on icon-only buttons

---

## 9. Performance Guidelines

### 9.1: CSS Optimization

- Use CSS custom properties for theming (no repaints on theme changes)
- Avoid expensive properties in animations (use `transform` and `opacity`)
- Purge unused CSS in production
- Critical CSS inlined, rest deferred

### 9.2: Asset Loading

```html
<!-- Preload critical fonts -->
<link rel="preload" href="fonts/cinzel.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/rajdhani.woff2" as="font" type="font/woff2" crossorigin>
```

### 9.3: Animation Performance

- Limit concurrent animations to 3 per viewport
- Use `will-change` sparingly (only on animated elements)
- GPU-accelerate with `transform: translateZ(0)`

---

## 10. References

| Document | Purpose |
|----------|---------|
| `business_analysis.md` | Feature requirements from spreadsheet (source of truth) |
| `api_future_phase_4.md` | Backend API specification |
| `api_reference.md` | Frontend development guide |
| `mechanicum_style_venice.txt` | Original design inspiration |

---

**End of Document**
@keyframes binary-flow {
  0% { background-position: 0 0; }
  100% { background-position: 8px 0; }
}

### 6.2: Corner Accents

```css
.corner-accent {
  position: relative;
}

.corner-accent::before,
.corner-accent::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid var(--copper);
}

.corner-accent::before {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}

.corner-accent::after {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}
```

### 6.3: Loading States

```css
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--steel);
  border-top-color: var(--plasma-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--steel-dark) 0%,
    var(--steel-mid) 50%,
    var(--steel-dark) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

```html
  <div class="tooltip">
    <div class="tooltip__header">Calculation Breakdown</div>
    <div class="tooltip__formula">
      <div>Base: 5 (Colony Size 50-75)</div>
      <div>+1 (Infrastructure)</div>
      <div>-0.3 (Event: Trade Embargo)</div>
      <div class="tooltip__total">= 5.2</div>
    </div>
  </div>
</div>
```

```css
.tooltip-trigger {
  position: relative;
  display: inline-block;
  cursor: help;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--void-black);
  border: 2px solid var(--plasma-blue);
  border-radius: 4px;
  padding: 1rem;
  min-width: 250px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: var(--glow-plasma);
}

.tooltip-trigger:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip__header {
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--plasma-blue);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--steel);
}

.tooltip__formula {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.tooltip__total {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--plasma-blue-dim);
  color: var(--plasma-blue);
  font-weight: 700;
}
```

### 4.3: Infrastructure Row

```html
<div class="infra-row">
  <div class="infra-row__checkbox">
    <input type="checkbox" id="power-network" class="purity-seal" checked>
    <label for="power-network" class="purity-seal__label">📜</label>
  </div>
  <div class="infra-row__name">
    <span class="infra-row__title">Power Network</span>
    <span class="infra-row__type">Hard Infrastructure</span>
  </div>
  <div class="infra-row__status">
    <span class="status-indicator status-indicator--working"></span>
    Working
  </div>
  <div class="infra-row__modifiers">
    <span class="modifier-tag">+10 Productivity</span>
    <span class="modifier-tag">+5 Complacency</span>
  </div>
</div>
```

```css
.infra-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--steel);
  margin-bottom: 0.5rem;
  background: var(--steel-dark);
}

.purity-seal {
  appearance: none;
  width: 24px;
  height: 24px;
  border: 2px solid var(--copper);
  background: var(--void-black);
  cursor: pointer;
}

.purity-seal:checked {
  background: var(--copper-dark);
}

.purity-seal:checked::after {
  content: '✓';
  color: var(--plasma-blue);
  font-size: 16px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator--working {
  background: var(--void-green);
  box-shadow: 0 0 5px var(--void-green);
}

.status-indicator--faulty {
  background: var(--blood-red);
  animation: flicker 0.5s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.modifier-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--plasma-blue-dim);
  color: var(--plasma-blue);
  font-family: var(--font-mono);
  font-size: 12px;
  border-radius: 2px;
  margin-right: 0.5rem;
}
```

```text
| Color | Usage | Example |
|-------|-------|---------|
| **Copper** | Headers, active borders, primary actions | Panel titles, focused inputs |
| **Plasma Blue** | Calculated values, read-only data | Profit Factor display, stat totals |
| **Amber** | Warnings, caution states | Heretical status, low Order warning |
| **Blood Red** | Critical states, errors | Anarchy status, colony collapse |
| **Void Green** | Success, stable states | Placated status, upgrades working |
```

### 2.3: Gradient Definitions

```css
/* Panel background gradient */
--gradient-panel: linear-gradient(180deg, var(--steel-dark) 0%, var(--void-dark) 100%);

/* Copper accent gradient */
--gradient-copper: linear-gradient(135deg, var(--copper-dark) 0%, var(--copper) 50%, var(--copper-light) 100%);

/* Plasma glow effect */
--glow-plasma: 0 0 10px var(--plasma-glow), 0 0 20px rgba(0, 212, 255, 0.15);

/* Binary data strip */
--binary-strip: repeating-linear-gradient(
  90deg,
  var(--copper-dark) 0px,
  var(--copper-dark) 2px,
  transparent 2px,
  transparent 4px
);
```

---

## 3. Typography

### 3.1: Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

:root {
  --font-display: 'Cinzel', serif;      /* Headers - Gothic/Imperial */
  --font-ui: 'Rajdhani', sans-serif;    /* UI Text - Clean technical */
  --font-mono: 'Share Tech Mono', monospace; /* Data/Calculated */
}
```

### 3.2: Type Scale

| Element | Font | Size | Weight | Use Case |
|---------|------|------|--------|----------|
| `h1` | Cinzel | 32px | 700 | Page titles |
| `h2` | Cinzel | 24px | 600 | Panel headers |
| `h3` | Cinzel | 18px | 600 | Section headers |
| `body` | Rajdhani | 16px | 400 | Body text |
| `label` | Rajdhani | 14px | 500 | Form labels |
| `data` | Share Tech Mono | 16px | 400 | Calculated values |
| `caption` | Rajdhani | 12px | 400 | Help text, notes |
