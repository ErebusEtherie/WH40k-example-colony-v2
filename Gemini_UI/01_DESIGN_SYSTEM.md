# 01 — Design System & Visual Tokens

This document defines the visual foundations of the **WH40k Colony Manager**: typography scales, color palettes, borders, mechanical framing, and spatial rules.

---

## 1. Typographic Hierarchy

The application pairs three distinct font families imported via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Lexend:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

### Font Roles & CSS Classes

| Font Family | CSS Class / Selector | Weight | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Cinzel** | `h1`, `h2`, `h3`, `.font-gothic` | 600, 700, 900 | Imperial titles, colony names, modal headers, major numerical stat values. Evokes ecclesiastical Imperial inscriptions. |
| **Rajdhani** | `body`, default sans-serif | 500, 600, 700 | Technical body text, descriptions, table contents, and form field values. Crisp, readable, and slightly squared. |
| **Share Tech Mono** | `.font-mono-slate` | 400 | Data-slate readouts, status labels, timestamps, Imperial dates, code badges, and system identifiers. |
| **Lexend** | `body.optics-dyslexic *` | 400, 500, 600 | Dynamically applied when the user activates the Dyslexia-Optimized Optics setting. Maximizes glyph distinction. |

### Typography Rules

1. **Section & Modal Headers**: Always use `.font-gothic font-bold tracking-wider uppercase`.
   ```tsx
   <h2 className="font-gothic font-bold text-base tracking-wider text-[#f59e0b] uppercase">
     Commission Infrastructure System
   </h2>
   ```
2. **Telemetry & Meta Badges**: Always use `.font-mono-slate uppercase text-[10px]` or `text-xs`.
   ```tsx
   <span className="font-mono-slate text-[10px] uppercase tracking-wider text-[#64748b]">
     STC BLUEPRINT ARCHIVE
   </span>
   ```
3. **Imperial Stat Numbers**: Render large stat metrics in `.font-gothic font-bold text-3xl`.
   ```tsx
   <div className="text-3xl font-gothic font-bold text-[#fef08a]">
     {stats.size.final}
   </div>
   ```
4. **No Wrapped Labels**: Badges, status chips, and button text must always remain on **a single line** using `whitespace-nowrap`.

---

## 2. Color Palette & Semantic Tokens

All UI colors follow the grimdark palette of the Imperium of Man, balancing abyssal dark void backgrounds with high-contrast phosphor and gold highlights.

### Core CSS Variables (`src/index.css`)

```css
:root {
  --mech-void: #08090d;              /* Deepest screen background */
  --mech-dark: #0d111a;              /* Secondary header & container background */
  --mech-panel: #0f1422;             /* Surface cards and panels */
  --mech-steel: #1a2234;             /* Interactive element hover backgrounds */
  --mech-border: #1e293b;            /* Standard structural border */
  --mech-border-highlight: #334155;  /* Hovered or focused structural border */
  --mech-copper: #b87333;            /* Canonical data-slate metal trim */
  --mech-bronze: #cd7f32;            /* Secondary ecclesiastical trim */
  --mech-gold: #f59e0b;              /* Imperial gold, active selections, primary icons */
  --mech-plasma: #00d4ff;            /* Void plasma cyan, technology, status highlights */
  --mech-plasma-glow: rgba(0, 212, 255, 0.25);
  --mech-amber: #f59e0b;
  --mech-amber-glow: rgba(245, 158, 11, 0.25);
  --mech-emerald: #10b981;           /* Auspex green, stable/working/pious states */
  --mech-crimson: #ef4444;           /* Heresy, anarchy, offline, destructive actions */
}
```

### Functional Color Matrix

| Semantic State | Tailwind Utility Reference | Hex Code | Visual Meaning in Imperial Lore |
| :--- | :--- | :--- | :--- |
| **Imperial Gold** | `text-[#f59e0b]`, `border-[#f59e0b]/40`, `bg-[#f59e0b]/15` | `#f59e0b` | Warrant of Trade authority, Arch Magos, active colonies, primary actions. |
| **Plasma Cyan** | `text-[#38bdf8]`, `border-[#38bdf8]/40`, `bg-[#38bdf8]/15` | `#38bdf8` / `#00d4ff` | Lord Captain clearance, technical infrastructure, chronometer ticks. |
| **Auspex Emerald** | `text-[#34d399]`, `border-[#10b981]/40`, `bg-[#10b981]/15` | `#10b981` / `#34d399` | Working machinery, stable/pious lore state, healthy resource deposits. |
| **Inquisition Crimson** | `text-[#f87171]`, `border-[#ef4444]/40`, `bg-[#ef4444]/15` | `#ef4444` / `#f87171` | Riots, anarchy, disrupted infrastructure, heretical status, dangerous events. |
| **Sanctum Violet** | `text-[#c084fc]`, `border-[#a855f7]/40`, `bg-[#a855f7]/15` | `#a855f7` | Imperial Order stat, Psyker telemetry, ecclesiarchy authority. |
| **Servitor Slate** | `text-[#cbd5e1]`, `border-[#64748b]/40`, `bg-[#64748b]/20` | `#64748b` | Read-only clearance, inactive modifiers, secondary metadata. |

---

## 3. Spatial Math & Geometry

To maintain an authentic tactical cogitator interface without visual clutter:

### Padding & Margins
- **Container Outers**: Major panels and page containers require at least `p-4 sm:p-6 md:p-8`.
- **Card Internals**: Standard data-slates and cards use `p-3` or `p-4`.
- **Button Padding**: Always maintain a **2:1 horizontal-to-vertical ratio**:
  - Small: `px-2.5 py-1.5` (compact header buttons)
  - Medium: `px-4 py-2` (standard modal buttons)
  - Large: `px-6 py-3` (prominent actions)

### Border Radii & Nesting
- **Cards & Modals**: Max radius is `rounded` (4px) or `rounded-md` (6px). Never use soft, bubble-like 20px+ radii for structural panels.
- **Pills & Chips**: Badges, status chips, and clearance pills use `rounded` or `rounded-full`.
- **Nested Corner Rule**: When a badge or input sits inside a padded panel, calculate inner radius:
  $$\text{Radius}_{inner} = \text{Radius}_{outer} - \text{Padding}$$

---

## 4. Mechanical Accents & CSS Decorators

The application includes custom CSS mechanical details defined in `src/index.css`:

### 1. Mechanical Corner Brackets (`.gothic-bracket-box`)
Draws machined corner brackets around primary dossiers:
```html
<div className="gothic-bracket-box p-4 rounded shadow-lg">
  <div className="gothic-bracket-bottom-left" />
  <div className="gothic-bracket-bottom-right" />
  <!-- Panel Content -->
</div>
```

### 2. Glowing Plasma Accents (`.glow-plasma`, `.glow-amber`)
Subtle phosphor glows for focal interactive elements:
- `.glow-plasma`: `box-shadow: 0 0 15px rgba(0, 212, 255, 0.2)`
- `.glow-amber`: `box-shadow: 0 0 15px rgba(245, 158, 11, 0.25)`

### 3. Cogitator CRT Vignette
When enabled in Optics settings, a non-intrusive CRT vignette is projected:
```tsx
<div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-40 opacity-70" />
```

---

## 5. Anti-Slop Directive (Craftsmanship Rules)

All frontend developers must actively reject generic "AI-generated" UI clichés:

1. ❌ **No Purple-to-Blue Gradients**: Do not use generic neon gradients (`bg-gradient-to-r from-purple-500 to-blue-500`). Use tactile Imperial metals (amber, copper, plasma cyan, carbon slate).
2. ❌ **No Cards Nested Within Cards**: Avoid stacking borders within borders. Use whitespace, typography, and subtle single-line dividers (`border-[#1e293b]`) for grouping.
3. ❌ **No Arbitrary Hero Eyebrows**: Do not add random uppercase tracked subtitles unless they represent actual Imperial telemetry or category tags.
4. ❌ **No Cartoon Emojis in Place of Icons**: All icons must be imported from `lucide-react` with precise sizing (`w-3.5 h-3.5` or `w-4 h-4`) and semantic tinting.
