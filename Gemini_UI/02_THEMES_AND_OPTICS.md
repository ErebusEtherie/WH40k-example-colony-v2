# 02 — Imperial Themes & Accessibility Optics

The WH40k Colony Manager features an adaptable theming engine and a comprehensive accessibility suite ("Legibility & Optics") engineered to ensure authentic 40k atmosphere while maintaining **WCAG AA contrast compliance**.

---

## 1. The 7 Imperial Themes

The user can select from seven thematic color schemes reflecting different branches of the Imperium of Man:

| Theme ID | Name | Accent Dot | Visual Atmosphere |
| :--- | :--- | :---: | :--- |
| `canonical` | **Mechanicum Data-Slate (Canonical)** | `#b87333` | Authentic copper, aged brass trim, deep void black. |
| `dataslate` | **Mechanicum Data-Slate** | `#f59e0b` | Standard Mars tech-amber and slate blue. |
| `forge` | **Omnissiah Shrine & Forge** | `#ea580c` | Molten orange, soot carbon, plasma foundry heat. |
| `voidfarer` | **Gothic Voidfarer** | `#0284c7` | Abyssal deep-space navy, star-chart cyan. |
| `inquisition` | **Inquisition Sanctum** | `#dc2626` | Ordo Hereticus crimson, obsidian black, rosarius red. |
| `auspex` | **Tactical Auspex** | `#16a34a` | Phosphor CRT emerald, tactical bio-scanner green. |
| `parchment` | **Imperial Parchment** | `#d97706` | Scribe vellum, sepia leather, ecclesiastical script. |

---

## 2. CSS Variable Theme Mapping

Themes work by swapping CSS custom properties on `body.theme-{id}`:

```css
/* Canonical Mechanicum */
body.theme-canonical {
  --mech-void: #06080e;
  --mech-dark: #0a0e18;
  --mech-panel: #0f1524;
  --mech-gold: #f59e0b;
  --mech-plasma: #00d4ff;
}

/* Omnissiah Forge */
body.theme-forge {
  --mech-void: #0d0806;
  --mech-dark: #160c0a;
  --mech-panel: #20120d;
  --mech-gold: #f97316;
  --mech-plasma: #fb923c;
}

/* Gothic Voidfarer */
body.theme-voidfarer {
  --mech-void: #030712;
  --mech-dark: #0b1329;
  --mech-panel: #0f172a;
  --mech-gold: #38bdf8;
  --mech-plasma: #06b6d4;
}

/* Inquisition Sanctum */
body.theme-inquisition {
  --mech-void: #0d0406;
  --mech-dark: #17070a;
  --mech-panel: #220b10;
  --mech-gold: #f43f5e;
  --mech-plasma: #fb7185;
}

/* Tactical Auspex */
body.theme-auspex {
  --mech-void: #020d06;
  --mech-dark: #06170d;
  --mech-panel: #0a2314;
  --mech-gold: #10b981;
  --mech-plasma: #34d399;
}

/* Imperial Parchment */
body.theme-parchment {
  --mech-void: #120e0a;
  --mech-dark: #1c1712;
  --mech-panel: #26201a;
  --mech-gold: #d97706;
  --mech-plasma: #f59e0b;
}
```

### Implementing Theme Switching in React

The current theme is controlled via `src/components/ThemeDropdown.tsx` and applied as a CSS class to the root document or wrapper:

```tsx
// Applying theme dynamically
useEffect(() => {
  const themeClass = `theme-${currentTheme}`;
  document.body.className = `${themeClass} ${activeOpticsClasses}`;
  localStorage.setItem("wh40k_colony_theme", currentTheme);
}, [currentTheme]);
```

---

## 3. Optics & Accessibility Controls (WCAG AA)

Accessibility is integrated via `src/components/LegibilityPopover.tsx`. The user can dynamically adjust the interface optics:

```typescript
export interface OpticsSettings {
  dyslexicFont: boolean;
  highContrast: boolean;
  colorBlindMode: "default" | "monochrome" | "deuteranopia" | "tritanopia";
  displayScale: "100" | "115" | "130";
}
```

### 1. Dyslexia-Optimized Font Mode (`.optics-dyslexic`)
Swaps all system fonts with Google's **Lexend**, increasing tracking and word-spacing:
```css
body.optics-dyslexic {
  font-family: 'Lexend', sans-serif !important;
  letter-spacing: 0.04em !important;
  word-spacing: 0.08em !important;
}

body.optics-dyslexic * {
  font-family: 'Lexend', sans-serif !important;
}
```

### 2. High-Contrast Boost (`.optics-highcontrast`)
Heightens luminance difference across panels and forces high-visibility golden borders:
```css
body.optics-highcontrast {
  filter: contrast(1.25);
}

body.optics-highcontrast .gothic-corner-box,
body.optics-highcontrast .border-highlight {
  border-color: #f59e0b !important;
  border-width: 2px !important;
}
```

### 3. Color-Blind Simulation & Compensators
Applies SVG/CSS hardware-accelerated color-shift matrices:
- **Monochrome**: `filter: grayscale(1);`
- **Deuteranopia / Protanopia**: `filter: hue-rotate(20deg) saturate(1.2);`
- **Tritanopia**: `filter: hue-rotate(180deg) saturate(1.1);`

### 4. Display Scale Zoom
Scales all rem/percent-based typography and layout boundaries without breaking responsive grids:
- `body.optics-scale-115 { font-size: 115%; }`
- `body.optics-scale-130 { font-size: 130%; }`

---

## 4. Theme Integration Checklist for New Components

When building any new component or view, verify the following:

- [ ] **Backgrounds**: Use variable-backed classes (`bg-[var(--mech-panel)]`) or standard void tokens (`bg-[#0b0f19]`, `bg-[#0f1422]`).
- [ ] **Borders**: Do not hardcode pure white or light grey borders. Use `border-[#1e293b]` or `border-[#f59e0b]/40`.
- [ ] **High-Contrast Compatibility**: Ensure all interactive controls have visible hover/focus outlines (`focus:ring-2 focus:ring-[#f59e0b]`).
- [ ] **Optics Scaling**: Avoid fixed pixel line-heights (e.g. `leading-[14px]`); use relative line heights (`leading-normal` or `leading-snug`) so text does not clip when `optics-scale-130` is active.
