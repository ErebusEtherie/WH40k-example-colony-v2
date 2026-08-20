# Frontend Requirements - ANSWERED

This document contains stakeholder answers to the frontend planning questions from `FRONTEND_GUIDE.md`.

---

## User Personas & Roles - ANSWERED

### 1. Who are the primary users?

**Answer:** Both players and Game Masters have the same permission level. They can have more than 1 colony to manage (though it's more likely for GMs to manage many colonies than players).

**Actions available to all users:**
- Increase colony time
- Add modifiers
- Remove modifiers
- Apply growth
- Build or change status of upgrades
- Add talents to representative
- Increase representative stats
- Full access to colony management

**GM additionally can:**
- Remove colony
- Change colony status to read-only state

### 2. What devices will users access the app on?

**Answer:** Desktop only, via web browser

**Default browsers:** Chrome (Chromium) / Firefox

### 3. What is the typical session length?

**Answer:** Both use cases need to be supported

- **During gameplay:** One game session is 4 hours during which users may need to check or update colony
- **Between games:** Single player may have longer planning sessions

---

## Core Use Cases - ANSWERED

### 4. What are the top 3-5 tasks users perform most often?

**A) View colony current state, especially:**
- Colony age
- Pending events
- Profit factor from colony
- Development plan for the colony (Infrastructure/Upgrade; Priority; Comment: what it will be lore-wise; Comment: team approach to the upgrade acquisition; Comment: Current progress; Additional comments, for example: problems to solve before installing upgrade)

**B) Upgrade colony stats (via adding modifiers or changing upgrades status) because of events:**
- Add lore-wise event name
- Add comment describing the event (lore and mechanical-wise)
- Add positive or negative modifiers to colony stats (for example: add -2 modifier to Piety, add -1 modifier to Order)
- See current state of the colony due to stats change (for example: colony becoming heretical, drop of productivity and profit factor due to changes in piety and order)

**C) Development of the Representative:**
- Add or upgrade skills
- Add new talents
- Increase stats (which can increase leadership bonus with other consequences)

**D) Install new infrastructure upgrades / change upgrades state:**
- Example: Because players completed quest for Infantry Garrison, this upgrade is added to Support Upgrades (Custom name: Garnizon Burzycieli; Type: Infantry Garrison; Installation Date: 102; Works: TRUE; Players notes: Dowódca: Harver Mulondo)
- Due to events disable existing Infrastructure Upgrade, for example: Due to event Transportation Infrastructure Upgrade does not work. So Hard Infrastructure Upgrades table will present info about this (Custom name: Drogi; Type: Transportation; Installation Date: 130; Works: FALSE; Players notes: bandyci napadają na podróżnych, dopóki nie zorganizujemy patroli lub nie wyeliminujemy bandytów drogi uznaje się za niebezpieczne) → because this element does not work, it has impact on the statistics of the colony

**E) Leave notes about colony development plan:**
- Players can leave notes about colony development - endeavours they need to achieve or state of current progress to gain given upgrade
- Example table: (Type: Transportation; Priority: 2; Upgrade Description: Karczowani lasów pod tory dla kolei; Acquisition: Pozyskanie ciężkiego sprzętu, wysłanie ludzi do roboty; Progress: Zdobyliśmy sprzęt; Notes: Problem - mamy za mało ludzi do ogarnięcia tego, trzeba przekierować ich z innych zadań)

### 5. During gameplay, what information needs to be visible at all times?

**Answer:** All of the following:
- Current stat values (Size, Complacency, Order, Productivity, Piety)
- Profit Factor
- Active modifiers
- Colony lore states (Anarchy, Placated, etc.)

### 6. What actions need to be quick/one-click during active play?

- Change upgrade state
- Change colony age (because sometimes it is incremented by 1, but sometimes it is changed by x days or to given number)
- Add event (Name: Bandyci na drogach; Description: Bandyci opanowali szlaki komunikacyjne, co utrudnia transport surowców. Ulepszenie "Drogi" uznaje się za tymczasowo niedziałające. Spada Order o 1)
- Add temporary modifier (can also be part of Add event action, in case of above example custom Order -1 penalty is added)

---

## UX/UI Preferences - ANSWERED

### 7. What visual theme is expected?

**Answer:**
- Grimdark/Warhammer 40k aesthetic
- Clean/minimalist functional design
- Dark mode preferred

### 8. Dark mode required?

**Answer:** Yes, dark mode preferred (see question 7)

### 10. What level of data density is preferred?

**Answer:** Collapsible/expandable sections (open for discussion)

---

## Additional UI Design Details - Cult Mechanicus Aesthetic

**Visual Theme:** Dark, industrial aesthetic of the Cult Mechanicus from Warhammer 40k

### Color Palette

| Color | Usage | Hex (Suggested) |
|-------|-------|-----------------|
| **Deep Crimson Red** | Primary accents, alerts, important headers | `#8B1A1A` or `#A52A2A` |
| **Burnished Copper** | Secondary elements, borders, icons | `#B87333` or `#CD7F32` |
| **Bronze** | Tertiary accents, decorative elements | `#CD7F32` or `#B87333` |
| **Plasma Blue** | Data readouts, active states, highlights | `#00BFFF` or `#1E90FF` |
| **Dark Background** | Main UI background | `#0D0D0D` or `#1A1A1A` |
| **Charcoal** | Secondary backgrounds, cards | `#2B2B2B` or `#333333` |

**Inspiration:** Forge worlds of Mars — industrial, sacred technology, ancient machine spirits

### Typography

| Element | Font | Purpose |
|---------|------|---------|
| **Headers** | Cinzel (Google Fonts) | Gothic, religious/ancient feel — evokes sacred texts |
| **Data/Body** | Rajdhani (Google Fonts) | Technical, squared, futuristic — evokes machine readouts |

**Font Pairing Rationale:**
- **Cinzel** brings the gothic, ecclesiastical weight of the Mechanicus dogma
- **Rajdhani** provides clean, readable technical data display reminiscent of cogitator screens

### Additional Design Elements (Recommended)

- **Icons:** Cog motifs, skull iconography, gothic arches, circuit patterns
- **Borders:** Angular, industrial frames with rivet or panel details
- **Effects:** Subtle glow on plasma blue elements, scanline overlays on data displays
- **Textures:** Brushed metal, worn industrial surfaces, subtle grunge
- **UI Components:** Panel-like cards, data-slate aesthetic for forms

---

## Data Flow & State Management - ANSWERED

### 11. Real-time updates needed?

**Answer:** Usually there will be two concurrent users working on one colony: Game Master and player who manages the colony for the group. They should see saved changes made by other user.

### 12. Offline capability required?

**Answer:** Always-online is acceptable

### 13. Data persistence preferences?

**Answer:**
- Auto-save with longer interval (if user forgets to save)
- Manual save with confirmation
- Version history (what value changed, by whom, when) would be nice
- Rollback to that point of history is not needed

### 14. Export/Import needs?

**Answer:** Colony should be exportable to file for backup (if server fails). JSON format is preferred.

---

## Authentication & Multi-User - ANSWERED

### 15. Authentication flow preferences?

**Answer:**
- Email/password only is ok
- No guest access
- Passwords should be encrypted, at least hashed with salt
- Pick safest way privacy-wise

### 16. Colony sharing model?

**Answer:**
- Private colony - creator has access by default
- Can add user as GM (then that player gains full control over colony) or player (then player can read, edit but can't delete)
- It would be good to have shareable view-only links (user needs to be logged in to view colony)

**Roles for colony access / permissions:**
- **A) Owner** - creator of the colony; can view, edit, remove colony, export colony, import colony, add users with roles; colony can have only one Owner
- **B) Game Master** - game master; same permissions as Owner, colony can have only one Game Master
- **C) Party member** - member of the party; view, edit, export; Colony can have many players added
- **D) Viewer** - logged in user; can only view colony, but needs to know colony name / have link

---

## Performance & Scale - ANSWERED

### 17. Expected scale?

**Answer:**
- One player will have tops 2 colonies
- GM will probably manage up to 4-5 colonies
- Upgrades - can be around 10-15 total
- Performance expectations: fast load times for active gameplay

### 18. Calculation visibility?

**Answer:**
- Yes for tooltips and audit trail
- Math can be hidden (players can check rulebook)

---

## Accessibility & Internationalization - ANSWERED

### 19. Accessibility requirements?

**Answer:** No, no need for accessibility

### 20. Internationalization needed?

**Answer:** English / Polish

---

## Integration & Extensions - ANSWERED

### 21. Future integration plans?

**Answer:**
- No external tools integration
- Can contain links to entities from https://kanka.io/ - but it will be only clickable links, not embedded content

### 22. Print-friendly views needed?

**Answer:** One-pager, lightweight. Don't know if PDF generation server-side is ok.

---

## Analytics & Feedback - ANSWERED

### 23. Usage analytics?

**Answer:**
- Track feature usage
- User feedback mechanism (form will be ok, but it is accessible only to logged in users)

### 24. Onboarding needs?

**Answer:** Not now. Maybe in future. Currently it is created as PoC for 2-3 users.

---

## Summary for Frontend Development

### Key Takeaways:

1. **Dual-mode UI:** Support both quick in-game interactions (4-hour sessions) and longer planning sessions
2. **Real-time collaboration:** Two concurrent users (GM + player) need to see each other's saved changes
3. **Information density:** Collapsible sections with all key stats always visible
4. **Theme:** Cult Mechanicus aesthetic — deep crimson, burnished copper, bronze, plasma blue on dark backgrounds
5. **Quick actions:** One-click upgrade state changes, event creation, modifier addition
6. **Permissions:** 4 roles (Owner, GM, Party Member, Viewer) with different access levels
7. **Internationalization:** English and Polish language support
8. **Data export:** JSON backup functionality
9. **Audit trail:** Track what changed, by whom, and when (no rollback needed)
10. **PoC scope:** Initially for 2-3 users, no complex onboarding needed

### Technical Implications:

- Desktop-first responsive design (Chrome/Firefox)
- WebSocket or polling for seeing other user's saved changes
- Auto-save with manual save option
- Version history tracking
- Multi-language support (i18n) from the start
- Role-based UI (show/hide features based on permissions)
- Export to JSON functionality
- Feedback form for logged-in users
- **Design System:**
  - Google Fonts: Cinzel (headers), Rajdhani (body/data)
  - Color variables for Cult Mechanicus palette (crimson, copper, bronze, plasma blue)
  - Dark mode as default
  - Component library with industrial/panel-like cards
  - Subtle glow effects and scanline overlays for data displays

---

## UI Design Specifications - Based on Reference Examples

The following specifications are derived from analysis of provided UI mockups (Adeptus Mechanicus dashboard, Colony Administration, Infrastructure/Support panels, and Dark Heresy character sheet).

### Color Palette (Refined)

| Usage | Color | Hex | Notes |
|-------|-------|-----|-------|
| **Primary Background** | Void Black | `#0a0f14` | Main app background |
| **Secondary Background** | Ferrous Dark | `#151a21` | Card/panel backgrounds |
| **Tertiary Background** | Gunmetal | `#1f2630` | Nested cards, inputs |
| **Primary Accent** | Burnished Copper | `#CD7F32` | Headers, borders, icons |
| **Secondary Accent** | Amber Gold | `#FFD700` | Key metrics, important values |
| **Tertiary Accent** | Deep Crimson | `#8B0000` | Alerts, critical states, Mechanicus elements |
| **Data Highlight** | Plasma Blue | `#00BFFF` | Active states, links, good status |
| **Status - Good** | Machine Spirit Green | `#00FF7F` | Working systems, stable |
| **Status - Warning** | Warning Amber | `#FFA500` | Degraded, caution |
| **Status - Critical** | Alert Red | `#FF4444` | Failed, disrupted, dangerous |
| **Text - Primary** | Bone White | `#E8E8E8` | Main text |
| **Text - Secondary** | Slate Grey | `#9CA3AF` | Labels, secondary info |
| **Text - Muted** | Dark Grey | `#6B7280` | Disabled, inactive |

### Typography

| Element | Font | Weight | Size | Transform |
|---------|------|--------|------|-----------|
| **App Title / Major Headers** | Cinzel | 700 (Bold) | 28-36px | Uppercase, letter-spacing 0.15em |
| **Section Headers** | Cinzel | 600 (SemiBold) | 18-22px | Uppercase, letter-spacing 0.1em |
| **Card Titles** | Cinzel | 500 (Medium) | 14-16px | Uppercase, letter-spacing 0.08em |
| **Body Text** | Rajdhani | 400 (Regular) | 14-16px | Normal |
| **Data Values / Numbers** | Rajdhani | 600 (SemiBold) | 16-24px | Normal |
| **Large Metrics** | Rajdhani | 700 (Bold) | 32-48px | Normal |
| **Labels / Captions** | Rajdhani | 500 (Medium) | 12px | Uppercase, letter-spacing 0.05em |
| **Binary Decorative** | Share Tech Mono | 400 (Regular) | 10-12px | Uppercase, low opacity |

### Component Patterns

#### 1. Section Cards
- **Container:** Dark background (`#151a21`), 1px border with copper accent (`#CD7F32` at 30% opacity)
- **Header:** Icon + title, bottom border with accent color
- **Padding:** 16-24px internal spacing
- **Corner radius:** 4px (subtle, industrial feel)
- **Optional:** Binary code decorative strip at top/bottom (low opacity, `#CD7F32` at 20%)

#### 2. Stat/Metric Cards
- **Layout:** Grid of cards for related metrics (5 colony stats, 9 character stats)
- **Value display:** Large, bold numbers (Rajdhani Bold, 32-48px for key metrics)
- **Label:** Small uppercase label above value (Rajdhani Medium, 12px)
- **Color coding:** 
  - Normal: Amber Gold (`#FFD700`)
  - Modified/Warning: Warning Amber (`#FFA500`)
  - Critical: Alert Red (`#FF4444`)
  - Bonus: Plasma Blue (`#00BFFF`)

#### 3. Progress Bars / Status Indicators
- **Container:** Dark inset track (`#0a0f14`)
- **Fill:** Gradient or solid color based on status
  - Good/Stable: Plasma Blue (`#00BFFF`) → Machine Spirit Green (`#00FF7F`)
  - Warning: Warning Amber (`#FFA500`)
  - Critical/Degraded: Alert Red (`#FF4444`)
- **Height:** 8-12px
- **Optional:** Segmented appearance (digital/industrial look)
- **Label:** Status text next to bar (STABLE, DEGRADED, CRITICAL)

#### 4. Checkbox Toggles (Infrastructure/Upgrades)
- **Style:** Square checkbox with copper border
- **Checked:** Copper background with checkmark icon
- **Unchecked:** Transparent with copper border
- **Label:** Item name with bonus effects in smaller text below
- **State indicator:** Additional visual cue for working/disrupted (color-coded dot or icon)

#### 5. Command Buttons / Action Buttons
- **Layout:** Grid of buttons (2-4 columns)
- **Style:** Outlined with copper border, dark background
- **Hover:** Border glow effect, slight background lighten
- **Icon:** Left of label, appropriate WH40k icon (lightning, cog, skull, etc.)
- **Text:** Uppercase, Rajdhani Medium, 14px
- **Active state:** Filled copper background, dark text

#### 6. Character Stat Tables
- **Layout:** Compact grid (3 columns for characteristics: WS, BS, S, T, Ag, Int, Per, WP, Fel)
- **Cell style:** Dark background, copper border
- **Value:** Centered, large (Rajdhani Bold, 18-20px)
- **Label:** Above or below value, small uppercase
- **Advancement tracking:** Checkboxes for +10, +20, +30 (from Dark Heresy sheet style)

#### 7. Counter Display
- **Style:** Individual digit boxes (from "Rites of Maintenance" example)
- **Each digit:** Separate box with glowing number
- **Font:** Rajdhani or digital-style font
- **Color:** Plasma blue glow effect
- **Use case:** Tracking counts (maintenance rites, resources, etc.)

#### 8. Territory/Resource Cards
- **Layout:** 3-column grid for territories
- **Content:**
  - Territory name (prominent, colored by type)
  - Type descriptor (Wasteland, Ruins, Wilderness)
  - Resource name
  - Abundance (Moderate, Rare, Plentiful)
  - Development Level (Level 1, 2, 3)
- **Color coding by type:** Different accent colors for different territory types

#### 9. Fillable Text Fields (Colony Charter style)
- **Style:** Underlined blank with copper line
- **Focus state:** Line glows or thickens
- **Label:** Inline or above field
- **Use case:** Lore-friendly text entry (colony name, dynasty, etc.)

### Decorative Elements

#### 1. Binary Code Strips
- **Content:** Binary strings (01100101 01100101...)
- **Placement:** Top/bottom of major sections, as dividers
- **Style:** Monospace font, low opacity (`#CD7F32` at 20%)
- **Size:** 10-12px, letter-spaced

#### 2. Section Icons
- **Style:** Simple line icons, copper color
- **Examples:** 
  - Cog (Infrastructure, settings)
  - Location pin (territories)
  - Crossed tools (support assets)
  - Skull (danger, critical)
  - Lightning (power, actions)
  - Quill (records, charter)
- **Size:** 16-20px, aligned with section titles

#### 3. Glow Effects
- **Active elements:** Subtle outer glow (box-shadow)
- **Color:** Matches element's accent color
- **Intensity:** Low (2-4px blur, 30-50% opacity)
- **Use:** Hover states, active states, critical alerts

#### 4. Dividers & Borders
- **Horizontal rules:** 1px solid, copper at 30% opacity
- **Card borders:** 1px solid, copper at 30% opacity
- **Section dividers:** Binary strip OR ornate border (for major sections)

### Layout Patterns

#### 1. Dashboard Grid
- **Top:** Key metrics summary (Profit Factor calculation: Base + Modifier = Total)
- **Middle:** Colony stats grid (5 cards: Complacency, Order, Productivity, Piety, Population)
- **Lower:** Representative details, Infrastructure, Support Assets
- **Bottom:** Territories, Resources, Notes

#### 2. Two-Column Layout (Infrastructure/Support)
- **Left column:** Hard Infrastructure (checkboxes with bonuses)
- **Right column:** Support Assets (checkboxes with bonuses)
- **Below:** Territories & Resources (3-column card grid)

#### 3. Collapsible Sections
- **Header:** Always visible with section title and icon
- **Toggle:** Click to expand/collapse content
- **Default state:** Key sections expanded (stats, representative), detail sections collapsed
- **Animation:** Smooth slide (200-300ms)

### Interactive States

| Element | Default | Hover | Active/Focus | Disabled |
|---------|---------|-------|--------------|----------|
| **Button** | Copper outline, dark bg | Border glow, bg lighten | Filled copper, dark text | Greyed outline, 50% opacity |
| **Checkbox** | Copper outline | Border glow | Filled copper with check | Greyed, no interaction |
| **Input Field** | Dark bg, copper underline | Underline glow | Thickened underline | Greyed text, no underline |
| **Card** | Standard border | Slight border brighten | - | - |
| **Link** | Plasma blue | Brighter blue, underline | - | Grey |

### Responsive Considerations

- **Desktop-first:** Primary target is desktop browser (1920x1080 minimum)
- **Tablet fallback:** Grid collapses to 2 columns at <1200px
- **Mobile:** Not required per requirements, but grid should stack to 1 column at <768px
- **Minimum width:** 1024px for full functionality

### Accessibility Notes

- **Contrast:** Ensure text meets minimum contrast ratios (WCAG AA where possible)
- **Color + Icon:** Don't rely on color alone for status (use icons/text labels too)
- **Focus states:** Clear focus indicators for keyboard navigation
- **Screen readers:** Semantic HTML, ARIA labels for interactive elements

### Implementation Priority

**Phase 1 (Core Dashboard):**
- Section card component
- Stat/metric cards
- Progress bars
- Basic button styles
- Typography system
- Color variables

**Phase 2 (Interactive Elements):**
- Checkbox toggles
- Input fields
- Collapsible sections
- Hover/active states

**Phase 3 (Polish):**
- Binary decorative elements
- Glow effects
- Icons
- Advanced layouts (territory cards, counter displays)