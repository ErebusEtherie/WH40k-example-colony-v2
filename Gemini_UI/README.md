# Warhammer 40,000 Colony Manager — Frontend UI & Design System Guide

Welcome to the **Imperial Cogitator Interface Design System** documentation. This directory provides comprehensive style references, theme specifications, component patterns, and frontend development standards for engineers working on the **WH40k Rogue Trader Colony Manager** application.

---

## Guide Structure

The documentation is split into specialized guides for clarity and fast developer reference:

| Document | Title | Purpose |
| :--- | :--- | :--- |
| [**01_DESIGN_SYSTEM.md**](./01_DESIGN_SYSTEM.md) | **Design System & Visual Tokens** | Typography hierarchy, color palettes, spacing math, borders, mechanical accents, and anti-slop rules. |
| [**02_THEMES_AND_OPTICS.md**](./02_THEMES_AND_OPTICS.md) | **Imperial Themes & Accessibility Optics** | Full specifications of the 7 themes, CSS variable switching, high-contrast, dyslexia font, color-blind profiles, and CRT effects. |
| [**03_COMPONENT_PATTERNS.md**](./03_COMPONENT_PATTERNS.md) | **Component Patterns & Anatomy** | Mechanical bracket boxes, metric cards, lore status chips, clearance badges, modals, tables, and iconography. |
| [**04_DEVELOPMENT_GUIDELINES.md**](./04_DEVELOPMENT_GUIDELINES.md) | **UI Development & RBAC Guidelines** | Architecture standards, role-based clearance rules, API integration, form handling, HTML ID conventions, and testing guidelines. |
| [**05_CODE_TEMPLATES.md**](./05_CODE_TEMPLATES.md) | **Developer Code Templates & Cheatsheet** | Copy-paste TypeScript/Tailwind boilerplates for cards, modals, stat widgets, form controls, and role-guarded actions. |
| [**06_DOCKER_DEPLOYMENT.md**](./06_DOCKER_DEPLOYMENT.md) | **Frontend Docker & Compose Deployment** | Multi-stage Dockerfile, NGINX reverse-proxy, docker-compose full-stack configs, and Portainer stack deployment. |

---

## High-Level Tech Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` engine) + custom CSS layers in `src/index.css`
- **Iconography**: `lucide-react` (Strict requirement: no custom emojis or arbitrary SVG tags)
- **Typography**: Google Fonts CDN (`Cinzel`, `Rajdhani`, `Share Tech Mono`, `Lexend`)
- **Build Engine**: Vite on Node.js / Express reverse proxy

---

## Core Visual Identity: "Grimdark Precision"

The UI simulates an **Imperial Adeptus Mechanicus Cogitator Terminal** crossed with a **Rogue Trader Dynasty Void-Bridge Data-Slate**. It balances:
1. **Gothic Imperial Grandeur**: Classical serif titles (`Cinzel`), ecclesiastical gold/amber accents, high-contrast framing, and formal Imperial nomenclature.
2. **Industrial Utility & Mechanical Readouts**: Monospace telemetry (`Share Tech Mono`), technical stat brackets (`.gothic-bracket-box`), and dense tactical data-slates.
3. **Pristine Modern Usability**: WCAG AA contrast compliance, responsive fluidity, zero visual clutter, and seamless accessibility optics.

---

## Quick Navigation for Developers

- **Looking for Color Hexes or Font Classes?** $\rightarrow$ See [01_DESIGN_SYSTEM.md](./01_DESIGN_SYSTEM.md)
- **Need to Add or Modify an Imperial Theme?** $\rightarrow$ See [02_THEMES_AND_OPTICS.md](./02_THEMES_AND_OPTICS.md)
- **Building a New Modal or Stat Gauge?** $\rightarrow$ See [03_COMPONENT_PATTERNS.md](./03_COMPONENT_PATTERNS.md)
- **Implementing a New Action or Role-Guarded Button?** $\rightarrow$ See [04_DEVELOPMENT_GUIDELINES.md](./04_DEVELOPMENT_GUIDELINES.md)
- **Need a Ready-to-use Component Boilerplate?** $\rightarrow$ See [05_CODE_TEMPLATES.md](./05_CODE_TEMPLATES.md)
- **Deploying Frontend with Docker & Compose?** $\rightarrow$ See [06_DOCKER_DEPLOYMENT.md](./06_DOCKER_DEPLOYMENT.md)
