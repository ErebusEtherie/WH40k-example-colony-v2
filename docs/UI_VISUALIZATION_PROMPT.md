# UI Visualization Prompt — WH40k Rogue Trader Colony Manager

**Version:** 3.0 (Consolidated — merges original requirements + v2.0 draft, corrected against rules reference)
**Status:** Ready for use with a UI visualization/mockup tool
**Source of truth for all data/rules claims below:** `colony-manager-rules-reference.md` and `business_analysis.md`

---

## 0. Flagged Corrections vs. the Prior Draft (`UI_VISUALIZATION_PROMPT.md` v2.0)

The prior draft contained several details not supported by — or contradicting — the project's rules reference. Per project convention, these are flagged rather than silently dropped:

| # | v2.0 draft said | Rules reference actually says | Resolution in this prompt |
|---|---|---|---|
| 1 | Infrastructure status: `Working / Disrupted / Not Working` | 4 states: `Working / Not Working / In Progress / Needed` | Corrected to 4-state enum, §5.3 |
| 2 | Infrastructure types: `Manufactorum, Habitation, Utility, Agricultural, Mining, Spaceport, Defense, Administrative` | 5 confirmed types: `Transport, Power, Water, Food Production, Communications` | Corrected, §5.3 |
| 3 | Representative types include `Merchant` | 6 confirmed types: `Satrap, Judge, Cardinal, Colonist Representative, Military Commander, Dynasty Member` — no Merchant | Corrected, §5.2 |
| 4 | Representative characteristics include `Wounds, Fate` | Confirmed stat set is 9 characteristics only (WS/BS/S/T/Ag/Int/Per/WP/Fel) | Removed Wounds/Fate |
| 5 | Size lore labels: `Extinct/Hamlet/Freehold/City/Metropolis/Hive World` bucketed by size range | No "Size lore state" mechanic exists. The closest real data is the **per-size** (not ranged) description column in the Size→PF table (`Ghost Town…Hive`, one per size 0–10) | Corrected, §5.4 — use the real per-size labels, and don't present them as a state/condition the way Complacency/Order/Productivity/Piety states work |
| 6 | Development Plan status: `Planned ↔ In Progress ↔ Delivered` / `Cancelled` | Confirmed `PlanStatus` enum has only **two** values: `Planning`, `In Progress`. Promotion to a real item is a manual workflow step (create real Infrastructure/Upgrade, then archive/delete the plan item) — there's no stored "Delivered/Cancelled" state | Corrected, §5.6 |
| 7 | Development Plan priority: enum `Low/Medium/High/Critical` | Priority is a plain **integer > 0**, suggested range 1–10, higher = more important | Corrected, §5.6 |
| 8 | "Phase 5: Resources & Events", incl. an Events API and event CRUD UI | `business_analysis.md` §6 explicitly puts an **event system out of scope** for V1 (GM handles events externally; app never rolls dice or tracks pending events) | Removed all event-management UI. Planetary Resources moved into core Colony Details scope (it's not a "future phase" — it's an original requirement) |
| 9 | Permission levels table (`Viewer/Editor/Colony Manager/Admin`) | Not present anywhere in the requirements or rules docs | Removed — resolved via GM answer, see §12 |
| 10 | Specific REST paths (e.g. `/roll-status`, `/events/colonies/{id}`) presented as confirmed | Project memory notes the FastAPI layer's implementation status is itself an **open, unresolved documentation contradiction** in this project | This prompt avoids committing to endpoint paths; it describes data fields only, since it's for visual mockup, not integration |
| 11 | "Quite a Character" described as auto-granting 2 extra personalities (3 total) | Rulebook: QaC triggers 2 additional rolls/selections; total depends on when it's selected (first=3, second of two=4, not selected=1-2) | Corrected, §5.1 |

**Per explicit instruction (2026-08-26): no event-system UI or references at all.** Earlier drafts of this prompt (including v3.0's own first pass) floated a "next roll in X days" countdown as an in-scope display field, reasoning it was cycle-timing math rather than event management. That's been dropped entirely — this UI will not surface roll cadence, cycle countdowns, or anything else adjacent to the event system.

---

## 1. Project Overview

**Application:** Warhammer 40,000 Rogue Trader — Colony Manager
**Audience:** Game Masters and Players of the Rogue Trader tabletop RPG
**Purpose:** Present a colony's current state as a "living character sheet" — mostly read-only display, with a minimal, clearly-scoped set of editable fields. The app never rolls dice and never tracks or resolves events; it tracks state that the GM/players update manually based on what happens at the table.

### 1.1 Visual & Accessibility Direction

**Theme:** Cult Mechanicus / Imperial administrative-terminal / "data-slate" and "Warrant of Trade" aesthetic — this is an in-universe records terminal, not a game HUD.

**Readability is the priority, not theme purity.** A fully gothic, low-contrast, heavily-textured interface looks lore-accurate but is hard to read for a data-dense app, and specifically bad for dyslexic and colour-blind users. Concretely:

- **Body text and all data values** (stats, numbers, table contents, modifier lists) use a clean, high-legibility sans-serif or monospace face at solid contrast (aim for WCAG AA, 4.5:1+ for body text). No gothic/blackletter fonts for anything the user needs to actually read quickly.
- **Ornamentation is confined to chrome**: panel borders, corner brackets, section-header banners, iconography (skulls, cogs, aquilas), and background texture/vignetting. It should frame the data, not sit behind or inside it.
- **Never encode meaning with colour alone.** Status/state indicators (Working vs. Not Working, positive vs. crisis lore states, active vs. inactive modifiers) need a redundant cue — icon shape, text label, or border style — alongside colour, for colour-blind users.
- **Dark theme, but not universally near-black-on-black.** Panels can be dark, but text-bearing surfaces need enough of a contrast floor that data doesn't wash out.

**Reference screenshots provided** (other WH40k titles) — use selectively, per the above:

- *Mechanicus-style discipline/stat screen* (teal-on-dark grid, bordered stat rows, skull-cog iconography, clean tooltip box): good reference for the **Colony Details modifier breakdown** and **Representative characteristics list** — rows are evenly spaced, labels and values are clearly separated, and the font stays plain even though the chrome is thematic. Emulate this balance.
- *Pause-menu modal* (glassy teal panel, colour-coded button rows — teal for safe actions, red for destructive/exit actions): good reference for **dialog/modal styling** and for **status-workflow action buttons** (e.g. colour-code "advance status" vs. "delete" actions the same way).
- *Rogue Trader CRPG character-creation screen* (ornate gold filigree frame, top tab bar): useful for the **top-level tab/section navigation pattern** (Colony / Representative / Infrastructure tabs), but tone down the filigree density — this level of ornamentation works for a single hero screen, not for a data-heavy table-based app used repeatedly session after session.
- *Parchment/illuminated-book page* (aged paper, hand-lettered choice list): use only as an **accent motif** for flavor/description text blocks (e.g. colony type description, personality description text) — not as the base surface for stat tables or forms.

**Dice-roll conventions:** The rules text frequently references dice (e.g. "GM rolls 1d5", "d100 roll", "1d10 growth check"). The app **never rolls dice or shows a roll/animation control**. Where a value is roll-derived per the rules, the input is a plain number field, and the roll notation appears only as a **label/hint next to the field** (e.g. a field labeled "Order penalty (result of 1d5, rolled physically)") so the user knows what to enter. This applies consistently to: Mad's Order penalty, Riots and Unrest / Heretical penalties, Dynasty Member's d100 result, Growth Check d10 result, and Contacts' 1d5 NPC count.

---

## 2. Application Map

**Panels (persistent views):**

1. Colony — At a Glance (read-only dashboard/home)
2. Colony — Details (mostly read-only, some edits)
3. Representative (view/edit)
4. Infrastructure group — three sub-panels shown together in one scroll/layout, see §6:
   4a. Hard Infrastructure
   4b. Upgrades
   4c. Development Plan

**Dialogs (modal flows):**
5. Colony Creation
6. Representative Creation
7. Add Custom Modifier — see §7

**Cross-cutting concern (not a separate panel — lives inside Colony Details):**
8. Custom Modifiers management — see §7.

**Entry screen (minimal, partial scope — see §12):**
9. Login — username field, password field, login button. Backend permission system exists, but for initial frontend implementation all authenticated users are treated as Admin. User/role administration UI is out of scope — do not design beyond the login form itself.

---

## 3. Panel: Colony "At a Glance"

**Purpose:** First screen shown for an existing colony. Quick-read summary. **Nothing on this screen is editable.**

| Field | Type | Notes |
|---|---|---|
| Colony name | text | Set at creation |
| Star system | text | Set at creation |
| Colony type | enum, non-editable | Research Mission / Mining and Industry / Ecclesiastical / Agricultural |
| Colony founder | text | Set at creation |
| Days since founding | int | `age_days` |
| Age (formatted) | calculated | e.g. "1 year 3 months 23 days" from `age_days` |
| Current Representative | text | Name only; "— Unassigned —" if none |
| Colony status | badge list | Combined set of currently-active lore states across the four stats (e.g. "Orderly", "Placated"), not a single field. **Default: a stat with no active state shows an explicit "Stable" badge** — don't rely on the absence of a badge to communicate stability |
| Size | int (0–10) + descriptive label | See §5.4 for correct label source |
| Complacency | int + lore label | Placated / Riots and Unrest / Stable |
| Order | int + lore label | Orderly / Anarchy / Stable |
| Productivity | int + lore label | Productive / Halted / Stable |
| Piety | int + lore label | Pious / Heretical / Stable |
| Profit Factor | int | Calculated |

**Visualization guidance:**

- Crisis states (Riots and Unrest, Anarchy, Halted, Heretical) should read as clearly distinct/alarming from positive states (Placated, Orderly, Productive, Pious) and from Stable — use colour *plus* an icon/shape difference (e.g. warning triangle vs. up-arrow vs. a neutral dash), not colour alone.
- Each of the four stats always shows exactly one badge: Stable by default, or its active positive/crisis state when triggered.

---

## 4. Panel: Colony Details

**Purpose:** Expanded version of the At a Glance panel, with modifier transparency and the app's actual edit surface.

### Editable

- Colony name (text)
- Star system (text)
- Colony founder (text)
- Age in days (number input, "+N days" increment control per original requirement — this is how age advances)

### Non-editable, calculated

- Colony status badges (same as §3)
- Size, Complacency, Order, Productivity, Piety, Profit Factor — each shown **with a modifier breakdown**:
  - Base value (from Colony Type)
  - Each applied modifier: value, source, category (Permanent / Conditional / Custom)
  - Total
  - Final (clamped) value
  - Example layout:

    ```
    Complacency: 5
      Base: 2
      +1  Transport Infrastructure (Permanent)
      +1  Beloved (Permanent — Representative personality)
      +1  Pious threshold bonus (Conditional)
      +1  Custom Modifier: Festival celebration (Custom, GM input)
      ────────────────
      Total: 5
    ```

- Size is capped at 10 in the display, never shown above that regardless of raw modifier sum.

- For colonies with many modifiers, use collapsible sections per category (Permanent / Conditional / Custom) to reduce visual clutter.

### Representative summary

- Representative name (link/button to open Representative panel)
- Representative type + personality list, each personality shown with its effect text (pull descriptions from the personality table, §5.1)
- "Change Representative" action → dropdown of unassigned Representatives → confirmation step before reassigning (reassignment matters: `chosen_stat`/`mad_order_roll`-driven modifiers are cleared and must be reapplied by the GM for the new Representative)

### Planetary Resources

- List: Name, Type, Subtype, Abundance, Notes (this is a core requirement, not a future-phase item)

### Hard Infrastructure (read-only summary here — full edit surface lives in §6.1)

- List: Name, Type, Status, Notes

### Upgrades (read-only summary here — full edit surface lives in §6.2)

- List: Name, Type, Status, Notes

---

## 5. Reference Data (for populating enums/labels correctly)

### 5.1 Representative Personalities (19 confirmed traits)

Source: `personalities.yaml` / rules reference Table 3-6. Each entry needs: name, description, stat effect(s), and (for 3 of them) a "requires GM input" flag:

- **Mad** — GM rolls 1d5 physically for the Order penalty
- **Scholarly** — GM identifies the lowest stat at assignment time (ties broken by GM choice)
- **Ties With…** — GM chooses the affected stat based on the fictional organization

All three of these apply as **Permanent** modifiers with a GM-supplied value — display them the same way as any other personality modifier, just noting the value came from GM input, e.g. "Mad — Order −3 (GM roll)".

**Administrative Expert** is conditional: +2 Productivity only while Order > Size — display this as a conditional badge on the personality, similar to how Conditional colony states are shown.

**Quite a Character** is a meta-trait: when selected (by choice or roll), the player/GM selects or rolls for 2 additional unique personalities. This means: (A) if chosen first = 3 personalities total; (B) if rolled as one of two = 4 personalities total; (C/D) if not selected = 1 or 2 personalities as normal. No direct stat effects of its own.

### 5.2 Representative Types (6 confirmed)

| Type | Protected stat (damage reduction) | Notes |
|---|---|---|
| Satrap | None | +5 to Acquisition Tests on this colony (tracked as flavor/reference, not a stat modifier) |
| Judge | Order | −1 to negative modifiers on Order (min loss 1) |
| Cardinal | Piety | −1 to negative modifiers on Piety (min loss 1) |
| Colonist Representative | Complacency | −1 to negative modifiers on Complacency (min loss 1) |
| Military Commander | Productivity | −1 to negative modifiers on Productivity (min loss 1) |
| Dynasty Member | None | Triggers a d100 roll (Table 3-5) at creation — GM/player supplies the roll; result is one of 5 fixed outcomes affecting a stat |

### 5.3 Hard Infrastructure (5 confirmed types)

Transport, Power, Water, Food Production, Communications — each with its own Working-bonus and Not-Working-penalty modifiers (see rules reference Table 3-7 for exact values per type). See §6.1 for the panel's full editable field list.

**Status (4 states):**

| Status | Effect |
|---|---|
| Working | Positive modifiers apply |
| Not Working | Penalty modifiers apply |
| In Progress | No modifiers |
| Needed | Missing Infrastructure Penalty: Complacency −1 |

### 5.4 Size Descriptions (correct source)

Per-size, not range-bucketed — pulled from the Size→PF table, one label per size value 0–10:
Ghost Town (0), Settlement (1), Outpost (2), Freehold (3), Demesne (4), Holding (5), Dominion (6), Territory (7), City (8), Metropolis (9), Hive (10).
Display this as a flavor label next to the Size stat — it is **not** a "state" the way Placated/Orderly/etc. are (no threshold logic, just a direct size→label lookup).

### 5.5 Support Upgrades (10 confirmed types)

Arbites Precinct, Ecclesiarchy Mission, Mechanicum Station, Infantry Garrison, Imperial Navy Station, Cultural Improvement, Industrial Facility, Personal Lodgings, Contacts, Trappings. See §6.2 for the panel's full editable field list.

**Status:** shares the same enum as Infrastructure, but in practice only `Working / Not Working / In Progress` are used (no confirmed "missing upgrade" penalty exists).

**Limits per type** (for UI validation/disable-state, not silent rejection):

- One only: Mechanicum Station, Infantry Garrison, Imperial Navy Station, Personal Lodgings
- Once per stat: Cultural Improvement (max 4 instances — one per Complacency/Order/Productivity/Piety)
- Cumulative/unlimited: Arbites Precinct, Ecclesiarchy Mission, Industrial Facility, Contacts, Trappings
- **Global cap:** total Support Upgrades ≤ current Colony Size

**Contacts** needs two extra fields: contact count (1–5, GM-supplied in lieu of a 1d5 roll) and contact details (free text).

### 5.6 Development Plan

See §6.3 for the panel's full editable field list (Name, Description, Progress, Edit/Delete, etc.). Corrections vs. the v2.0 draft:

- Status: **Planning** or **In Progress** only (2 states, not 4)
- Priority: integer > 0, suggested display range 1–10 (higher = more important) — render as a number or a simple bar/chip scale, not a fixed Low/Med/High/Critical enum
- Type field depends on a chosen Infrastructure Type (Hard Infrastructure types vs. Support Upgrade types share the "Type" picker, filtered by whichever category was selected)
- Promotion workflow: "Promote" action creates a real Infrastructure/Upgrade entry and then the plan item is archived or deleted (GM choice) — no automatic "Delivered" state to display

---

## 6. Panel Group: Hard Infrastructure, Upgrades & Development Plan

**Purpose:** These three sub-panels are shown together, stacked in one layout (Hard Infrastructure → Upgrades → Development Plan), since they're thematically connected. This section is the actual editable surface; §5.3/§5.5/§5.6 are the reference data (valid types, statuses, limits) that populates it.

### 6.1 Hard Infrastructure

Editable list. Per entry:

- Name — text, editable
- Type — enum, non-editable (one of 5, §5.3)
- Status — visual stepper showing progression: Needed → In Progress → Working, with Not Working as a disruption state branching from Working. Direct jumps between non-sequential states are allowed but trigger a confirmation dialog (e.g. "Skip 'In Progress' state?").
- Current modifiers — read-only list, system-derived from the current status
- Notes — text, editable
- Edit / Delete actions

### 6.2 Upgrades

Same structure as Hard Infrastructure, with these differences:

- Type — one of the 10 Support Upgrade types (§5.5); per-type limits should disable "Add" once a limit is reached rather than allowing the add and rejecting it after
- Status — visual stepper showing progression: In Progress → Working, with Not Working as a disruption state branching from Working. Direct jumps between non-sequential states are allowed but trigger a confirmation dialog.
- Contacts-type entries need two extra fields: contact count (1–5) and contact details (free text), §5.5

### 6.3 Development Plan

Editable list. Per entry:

- Name — text, editable
- Infrastructure Type — Hard Infrastructure vs. Support Upgrade category, enum, editable
- Type — filtered picker depending on the chosen Infrastructure Type (§5.6)
- Priority — integer > 0, editable (§5.6 — not an enum)
- Status — Planning / In Progress only (§5.6), with a single toggle action between the two (unambiguous with only two states)
- Description — longer text, editable
- Progress — longer text, editable
- Edit / Delete actions
- "Promote" action — creates the real Infrastructure/Upgrade entry; the plan item is then archived or deleted (GM choice), §5.6. There's no separate "Delivered" state to render. If promoting would violate a per-type limit (e.g., second Mechanicum Station, exceeding Size cap for total upgrades), show a validation error and prevent promotion until the limit is resolved.

**⚑ Flagged:** the rules docs define the *effect* of each Hard Infrastructure status (4 states) and Upgrade status (3 states), but not the **allowed transitions** between them — e.g. whether "Needed" must pass through "In Progress" before reaching "Working," or can jump directly. Until confirmed, treat status-change as a general picker between all valid states for that entity rather than a constrained workflow with specific next/previous buttons. See open item in §12.

---

## 7. Dialog: Add Custom Modifier

**Entry point:** Colony Details view (e.g. an "Add Custom Modifier" action near the stat/modifier breakdown).

**Fields:**

| Field | Type | Required? | Notes |
|---|---|---|---|
| Modifier name | text | Yes | |
| Modifier category | fixed value: `Custom` | Yes | Not a user choice. This dialog only ever creates **Custom**-category modifiers, matching the rules docs: Permanent modifiers are always tied to a system-derived source (infrastructure, upgrades, personalities, leader quality) and Conditional modifiers are always auto-calculated from stat thresholds — neither is something created through a generic add-modifier form. Show "Custom" as a fixed/read-only label in this dialog rather than an open Permanent/Conditional/Custom picker. |
| Characteristic | enum | Yes | Which stat is affected: Size, Complacency, Order, Productivity, Piety, Profit Factor |
| Value | integer, ≠ 0 | Yes | Signed — positive or negative |
| Source | text | Yes | Free-text description of the modifier's origin |

**Defaults on creation (not user-set):** `isActive = False`, `dateApplied = <creation timestamp>`. A newly added modifier is created inactive; the user activates it separately once ready for it to apply.

**Display:** Modifiers created here surface in the Colony Details modifier breakdown (§4) for their stat, labeled Custom alongside system-derived Permanent and Conditional modifiers. Give each user-created modifier an active/inactive toggle (not delete-only) matching the `isActive` field, and show its `dateApplied` for audit purposes. Newly created modifiers show with a visual "inactive" state (e.g., grayed-out text, [INACTIVE] badge, or reduced opacity). The activate/deactivate toggle should be prominent with appropriate colour coding (green for activate, amber for deactivate).

---

## 8. Panel: Representative

| Field | Editable? | Notes |
|---|---|---|
| Name | Yes | Free text |
| Type | No | One of 6, see §5.2 |
| Personalities | No (structurally) | 1–4 unique traits, see §5.1; effect text shown per trait |
| Characteristics (WS/BS/S/T/Ag/Int/Per/WP/Fel) | Value increasable | Display as `Name: Value (Bonus)`, bonus = ⌊value/10⌋ |
| Skills | Yes | Free-text list, add/edit/remove, unique entries |
| Talents | Yes | Free-text list, add/edit/remove, unique entries |

A Representative can exist unassigned to any colony — the panel should work standalone as well as when opened from a Colony.

---

## 9. Dialog: Colony Creation

1. Colony name (required)
2. Star system (required)
3. Colony type (required — picking this determines starting stats, shown live as a read-only preview: Size/Complacency/Order/Productivity/Piety, plus the colony type's description and special ability text)
4. Colony founder (required)
5. Colony description (optional, longer text)
6. Representative (optional — pick from existing unassigned Representatives, or decline and go create one now via the Representative Creation dialog, or skip and assign later)

---

## 10. Dialog: Representative Creation

1. Name (required)
2. Type (required, single-select from §5.2)
3. Personalities (required, 1–4, unique, single-select-multi from §5.1)
4. Characteristics (required, 9 values; requirements suggest an input range of 20–69 per stat at creation — note this is general RPG character-generation convention, not something defined in the colony rules reference)
5. Skills (optional, free-text list)
6. Talents (optional, free-text list)
7. **Summary screen** (read-only, before save): name, type + description, personalities + effect text, characteristics with bonuses, resulting modifier list (value / affected stat / source), skills, talents
8. Save / Cancel — if entered from Colony Creation, saving assigns the Representative to that colony; if entered standalone, saving returns to the previous screen

---

## 11. Explicitly Out of Scope (do not build UI for these)

- **Any event system** — no event creation, event history, pending-event indicators, or roll-cadence/countdown displays. The app tracks state only; events happen at the table and their outcomes are entered manually as Custom Modifiers
- **Any dice-rolling UI** — no roll buttons, dice animations, or randomization of any kind. Every roll (1d5/1d10/1d100) is performed physically by the player/GM; the app only ever accepts the *result* as a plain number input, with the roll notation shown as label text (see §1.1)
- Automated skill/Acquisition Test resolution
- Colony type change after creation (outside an explicit admin/testing path)
- User/role administration UI beyond the login form itself (see §2, §12 — still gathering requirements)

---

## 12. Open Questions

**Resolved (2026-08-26):**

1. ~~Colony status badge set~~ → Stable is an explicit default badge, not an absence of badges. (§3)
2. ~~Custom Modifier UI~~ → Confirmed as a dialog (§7), entered from Colony Details.
3. ~~Multi-user roles/permissions~~ → Backend permission system exists. For initial frontend implementation, all authenticated users are treated as Admin. User/role administration UI is out of scope.
4. ~~API integration details~~ → Backend API is under active development, with substantial design work already done. This prompt still intentionally avoids committing to specific endpoint paths since that design isn't finalized/shared yet; treat this as a visual/structural prompt, and layer in real integration details separately once the API design is provided.
5. ~~Modifier-category field in the Add Custom Modifier dialog~~ → Resolved: no divergence from the rules docs. The field is fixed to `Custom`, not a free Permanent/Conditional/Custom choice — see §7.

**Still open:**

1. **Status-change workflow for Hard Infrastructure and Upgrades** (§6.1, §6.2) — the rules docs define what each status *does*, not what transitions between statuses are allowed. Needs a GM decision before status-change buttons can be built as a constrained workflow rather than a generic picker.

---

## 13. Success Criteria

1. Every enum, status, and threshold shown in the UI traces to `colony-manager-rules-reference.md` / `business_analysis.md` — no fabricated states or types.
2. Read-only vs. editable boundaries match the requirements exactly (Colony At-a-Glance = fully read-only; Colony Details = limited edits; Infrastructure/Upgrades = status + notes editable, name/type not; Development Plan = fully editable).
3. Crisis states are visually unambiguous from positive states.
4. Modifier breakdowns are transparent enough that a GM can audit why a stat is what it is, by category (Permanent/Conditional/Custom).
5. Dark, Cult Mechanicus/data-slate themed chrome — but body text, data values, and status coding stay high-contrast and legible, with status meaning never carried by colour alone.
6. No event-system UI anywhere, and no dice-rolling controls anywhere — roll-derived values are always plain number inputs with roll notation as a label.
