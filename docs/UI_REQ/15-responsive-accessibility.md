# 15 — Responsive & Accessibility

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Complete  

---

## 15.1 Overview

This document defines responsive breakpoints and accessibility requirements for the WH40k Colony Manager application.

---

## 15.2 Responsive Breakpoints

### Breakpoint Definitions

| Name | Min Width | Max Width | Target Devices |
|------|-----------|-----------|----------------|
| Mobile | 0 | 767px | Phones |
| Tablet | 768px | 1199px | Tablets, small laptops |
| Desktop | 1200px | ∞ | Desktops, large screens |

### Layout Adaptations

#### Mobile (<768px)

- **Sidebar:** Collapsed by default, hamburger menu
- **Stats Grid:** 2 columns instead of 5
- **Panels:** Full width, stacked vertically
- **Tables:** Horizontal scroll or card layout
- **Buttons:** Full width, stacked
- **Modals:** Full screen overlay

#### Tablet (768px - 1199px)

- **Sidebar:** Collapsible, 200px width
- **Stats Grid:** 3-4 columns
- **Panels:** Full width within content area
- **Tables:** Standard layout
- **Modals:** Centered, 90% width

#### Desktop (≥1200px)

- **Sidebar:** Expanded, 240px width
- **Stats Grid:** 5 columns (all stats in one row)
- **Panels:** Max-width constrained, centered
- **Tables:** Full layout with all columns
- **Modals:** Centered, fixed width (500-600px)

---

## 15.3 Touch Targets

| Element | Minimum Size | Notes |
|---------|--------------|-------|
| Buttons | 44x44px | Including padding |
| Links | 44x44px | Clickable area |
| Form Inputs | 44px height | Minimum touch target |
| Checkboxes | 44x44px | Including label |

---

## 15.4 Accessibility (WCAG 2.1 AA)

### Color Contrast

| Element | Minimum Ratio |
|---------|---------------|
| Normal Text | 4.5:1 |
| Large Text (18px+) | 3:1 |
| UI Components | 3:1 |

**Mechanicum Palette Compliance:**

- Plasma Blue on Dark: ✅ 7.2:1
- Copper on Dark: ✅ 5.1:1
- Red (Error) on Dark: ✅ 6.3:1
- Green (Success) on Dark: ✅ 4.8:1

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate button/link |
| Space | Toggle checkbox/button |
| Escape | Close modal/dropdown |
| Arrow Keys | Navigate within components |

### Focus Indicators

All focusable elements must have visible focus states:

```css
:focus {
  outline: 2px solid #00ffff; /* Plasma blue */
  outline-offset: 2px;
}
```

### Screen Reader Support

| Element | Requirement |
|---------|-------------|
| Images | Alt text describing content |
| Icons | aria-label or aria-hidden |
| Form Fields | Associated labels |
| Errors | aria-describedby linking to error |
| Live Regions | aria-live for dynamic content |
| Modals | aria-modal, role="dialog" |

### Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<button>` for buttons, `<a>` for links
- Use `<nav>` for navigation
- Use `<main>` for main content
- Use `<table>` with proper headers for data tables

---

## 15.5 Loading States (Accessibility)

### Screen Reader Announcements

```html
<div aria-live="polite" aria-atomic="true">
  Loading colony data...
</div>
```

### Reduced Motion

Respect user's `prefers-reduced-motion` setting:

```css
@media (prefers-reduced-motion: reduce) {
  .shimmer, .spinner {
    animation: none;
  }
}
```

---

## 15.6 Form Accessibility

### Label Association

```html
<label for="email">Email Address</label>
<input type="email" id="email" name="email" />
```

### Error Association

```html
<input 
  type="email" 
  id="email" 
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" class="error">
  Invalid email format
</span>
```

### Required Fields

```html
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input type="text" id="name" name="name" required />
```

---

## 15.7 Color Independence

Do not rely on color alone to convey information:

| Information | Color | Additional Indicator |
|-------------|-------|---------------------|
| Success | Green | ✓ Checkmark icon |
| Error | Red | ✗ X icon |
| Warning | Yellow | ⚠ Warning icon |
| Working | Green | ☑ Checked seal |
| Not Working | Red | ☐ Unchecked seal |
| Lore State | Varied | Text label in badge |

---

## 15.8 Testing Checklist

### Responsive Testing

- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1920px width)
- [ ] Sidebar collapses/expands correctly
- [ ] Modals are usable on all sizes
- [ ] Touch targets are 44x44px minimum

### Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators are visible
- [ ] Screen reader announces dynamic content
- [ ] Color contrast meets WCAG AA
- [ ] Forms have proper labels
- [ ] Images have alt text
- [ ] Icons have aria-labels or are hidden

---

**Related Documents:**

- [UI Design System](../UI_DESIGN_SYSTEM.md)
- [Shared Components](./11-components.md)
