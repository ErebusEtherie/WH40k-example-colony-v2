# Warhammer 40K: Rogue Trader Colony Manager — UI Visualisation

Design a high-quality, production-oriented UI/UX visualisation for a **Warhammer 40,000: Rogue Trader Colony Manager** application.

The result should look like a real application that a Game Master and players could use during a Rogue Trader tabletop campaign, not like a generic sci-fi dashboard or a fictional spaceship computer interface.

## 1. Product Context

### Target audience

- Game Masters running Warhammer 40,000: Rogue Trader tabletop campaigns
- Players managing their Rogue Trader's colonies
- Users who need to quickly understand the current state of a colony while also being able to manage its infrastructure and representatives

### Application goal

The application manages and presents the state of a player's colony.

The primary purpose is **information clarity and campaign management**, with a relatively small amount of editing.

The application should allow users to:

1. Create a colony.
2. View the colony's current state.
3. View basic colony lore information.
4. View colony age and current status.
5. View colony characteristics and their calculated values.
6. View the infrastructure currently installed in the colony.
7. View planned future infrastructure and upgrades.
8. Change the colony's Size value.
9. Advance the number of days since founding.
10. Change infrastructure and upgrade statuses.
11. Edit infrastructure and upgrade notes.
12. Create and manage a colony Development Plan.
13. Assign a Representative to the colony.
14. View the Representative's characteristics, personality and type.
15. Create and edit Representatives.
16. Define custom modifiers affecting colony characteristics.
17. Inspect calculated colony characteristics and see exactly which modifiers affect each value.

The backend/API performs calculations. The frontend primarily **presents the results clearly and provides controlled editing where explicitly allowed**.

---

# 2. Overall Visual Direction

Create a **dark, highly readable, information-dense but uncluttered application UI**.

The visual language should combine:

- Warhammer 40,000 atmosphere
- Imperial administrative / bureaucratic aesthetics
- Rogue Trader campaign-management feeling
- Functional modern desktop application UX
- Subtle industrial / gothic elements
- Strong hierarchy and readability

Avoid turning the interface into a decorative Warhammer-themed mockup.

This is an actual management application first and a thematic interface second.

### Theme

Use a dark interface with:

- charcoal / near-black backgrounds
- dark metal and parchment-inspired surfaces
- restrained warm accent colours
- muted gold / brass / amber accents
- desaturated red used primarily for warnings or critical states
- subtle off-white text
- clear contrast between primary information and secondary metadata

Do not make every element gold, red, or glowing.

Avoid excessive:

- neon effects
- holographic UI
- cyberpunk aesthetics
- glowing borders
- ornamental backgrounds
- skulls everywhere
- excessive gothic decoration
- visual noise

The Warhammer identity should come from **typography, iconography, terminology, subtle ornamentation and colour accents**, while the layout remains modern and practical.

---

# 3. Application Layout

Design this as a desktop-first application.

Use a persistent application shell:

### Left navigation

A compact vertical navigation/sidebar containing:

- Colony Overview
- Colony Details
- Representative
- Infrastructure
- Development Plan
- Modifiers

At the top of the navigation show the current colony name.

At the bottom show application/user controls.

### Main content area

The main content should use:

- cards
- compact information panels
- tables where appropriate
- badges
- status indicators
- expandable calculation details
- clear section headings

Avoid excessive rounded "modern SaaS" styling.

Panels should feel sturdy and utilitarian, appropriate for an Imperial administrative system.

### Header

The main content header should show:

- current colony name
- star system
- colony status
- optional contextual actions

Use breadcrumbs or a clear page title to establish the current location within the application.

---

# 4. Colony Overview — "At a Glance"

This is the primary screen shown when opening an existing colony.

It is **read-only**.

The purpose is to let a player or GM understand the colony's state within a few seconds.

Prioritize information hierarchy over decorative elements.

## Header information

Display:

- Colony Name
- Star System
- Colony Type
- Colony Founder
- Current Representative
- Colony Status

Display colony age prominently:

- Days since founding
- Human-readable calculated age

Example:

**1,483 days**\
**4 years, 0 months, 23 days**

## Colony Characteristics

Create a visually strong characteristics section.

Display:

- Size
- Complacency
- Order
- Productivity
- Piety
- Profit Factor

For:

- Size
- Complacency
- Order
- Productivity
- Piety

display:

1. numerical value
2. lore description associated with that value

Example:

**PRODUCTIVITY**\
`7`\
"Highly Productive"

Characteristics should be easy to compare visually.

Profit Factor should be displayed separately because it represents a different kind of value.

## Status

Use clear status badges.

Statuses should look like meaningful game-state indicators rather than generic web tags.

---

# 5. Colony Details

Create a detailed colony screen.

This screen contains the same core information as the overview but provides considerably more detail.

Editable fields:

- Colony Name
- Star System
- Colony Founder

Non-editable:

- Colony Type
- Colony Status
- Calculated colony characteristics

## Characteristic calculation details

Each characteristic should support an expandable "calculation details" area.

Example:

**PRODUCTIVITY 8**

Base Value: `5`

Modifiers:

- Representative: `+1`
- Agricultural Complex: `+1`
- Imperial Charter: `+1`

Final Value: `8`

Make the source of every modifier immediately understandable.

The calculation details should be visually secondary and expandable, so the main page does not become overwhelming.

---

# 6. Representative Section

The colony has a current Representative.

Show:

- Representative name
- Representative type
- Personality
- Effects on the colony

Provide actions:

- View Representative
- Change Representative

Changing the Representative should use a dropdown/select control containing only available, unassigned Representatives.

Changing the Representative requires confirmation.

---

# 7. Planetary Resources

Display resources available to the colony on its planet.

Each resource should show:

- Name
- Type
- Subtype
- Abundance
- Notes

Use a compact table or card-based list.

Make resource abundance visually distinguishable without relying solely on colour.

---

# 8. Hard Infrastructure

Display currently installed Hard Infrastructure.

Each entry contains:

- Name
- Type
- Status
- Current modifiers
- Notes

The Colony Details view is primarily informational.

Editing infrastructure should happen through the dedicated Infrastructure section.

---

# 9. Upgrades

Display currently installed Upgrades.

Each entry contains:

- Name
- Type
- Status
- Current modifiers
- Notes

Again, keep this section informational on the Colony Details screen.

---

# 10. Representative Panel

Create a dedicated Representative management screen.

A Representative may either:

- be assigned to a colony
- exist independently and remain unassigned

## Representative header

Display:

- Representative Name
- Representative Type
- Personality
- Colony assignment

## Characteristics

Display the nine characteristics in a compact, highly readable table.

Characteristics:

- Weapon Skill (WS)
- Ballistic Skill (BS)
- Strength (S)
- Toughness (T)
- Agility (Agi)
- Intelligence (Int)
- Perception (Per)
- Willpower (W)
- Fellowship (Fel)

Each characteristic shows:

**Name | Value | Bonus**

Example:

`Weapon Skill | 35 | +3`

Values range from 0–100 in the general application, although values above 60 are uncommon.

The bonus is derived from the characteristic value.

Characteristics can be edited and increased.

Clearly communicate when an increase changes the bonus.

## Skills

Show skills as a simple editable list.

Examples:

- Awareness
- Charm +10
- Scholastic Lore (Adeptus Mechanicus)
- Tech-Use +20

Allow:

- Add
- Edit
- Remove

## Talents

Use the same interaction pattern as Skills.

Allow:

- Add
- Edit
- Remove

---

# 11. Infrastructure Section

Create an Infrastructure area composed of three connected sections presented together:

1. Hard Infrastructure
2. Upgrades
3. Development Plan

They should be visually related because they represent the colony's physical development.

Do not force the user to navigate between three completely separate pages to understand colony development.

---

# 12. Hard Infrastructure Management

Create an editable list of Hard Infrastructure entities.

Each item contains:

- Name
- Type
- Status
- Current Modifiers
- Notes
- Status transition actions
- Edit
- Delete

### Status workflow

Status transitions are predefined by the backend/application.

Only display actions that are valid for the current status.

For example, if an item can transition from:

`Planned → Under Construction → Operational`

show only the appropriate next action.

Do not present invalid status transitions.

### Modifiers

Show current modifiers as compact entries.

Example:

`+1 Productivity`\
`-1 Complacency`

Allow the user to inspect the source/details when appropriate.

---

# 13. Upgrades Management

Use the same interaction model as Hard Infrastructure.

Each Upgrade contains:

- Name
- Type
- Status
- Current Modifiers
- Notes
- Valid status transition actions
- Edit
- Delete

Keep the visual design consistent between Infrastructure and Upgrades.

---

# 14. Development Plan

Create a planning-oriented section for future colony development.

Each Development Plan item contains:

- Name
- Infrastructure Type
- Type
- Priority
- Status
- Description
- Progress
- Edit
- Delete

Infrastructure Type is editable.

The available Type options depend on the selected Infrastructure Type.

Priority should be visually obvious.

Consider a priority indicator such as:

`CRITICAL`\
`HIGH`\
`MEDIUM`\
`LOW`

The exact presentation should remain restrained and readable.

Progress is a longer user-defined text field and should be displayed differently from the short metadata fields.

The Development Plan should feel like a campaign planning board rather than a generic project-management SaaS application.

---

# 15. Custom Modifiers

Create a dedicated modifier management/view section.

Users can define custom modifiers affecting colony characteristics.

Each modifier should clearly show:

- Modifier value
- Affected characteristic
- Description
- Source
- Active/inactive state if applicable

The resulting calculated characteristics should make it possible to trace their final values back to:

- base value
- Representative modifiers
- Infrastructure modifiers
- Upgrade modifiers
- Custom modifiers

The UI should communicate this relationship clearly.

---

# 16. Colony Creation Dialog

Create a multi-section Colony Creation dialog.

Required fields:

1. Colony Name
2. Star System
3. Colony Type
4. Colony Founder

After selecting Colony Type, automatically display:

- Starting Size
- Starting Complacency
- Starting Order
- Starting Productivity
- Starting Piety
- Colony Type Description
- Additional Colony Type Bonus

Starting statistics are **not editable** because they are consequences of the selected Colony Type.

Also provide:

- Colony Description — optional, multiline
- Rogue Trader Representative — optional

If no Representative is selected, clearly ask:

"Do you want to create a Representative now?"

Provide:

- Create Representative
- Continue without Representative

The dialog should clearly distinguish:

**User input**

from

**Calculated / automatically determined values**.

---

# 17. Representative Creation Dialog

Create a dedicated Representative creation workflow.

Required:

### Identity

- Representative Name
- Representative Type

Representative Type allows exactly one selection.

### Personality

Allow selection of:

- minimum 1 personality
- maximum 4 personalities
- no duplicate personalities

Each personality is selected from an enum/list.

### Characteristics

Nine mandatory characteristics:

- WS
- BS
- S
- T
- Agi
- Int
- Per
- W
- Fel

Value range:

`20–69`

Display:

**Name | Value | Bonus**

The bonus is automatically calculated.

### Skills

Optional list of unique user-defined text values.

Examples:

- Tech-Use
- Charm +10

Allow:

- Add
- Edit
- Remove

### Talents

Optional list of unique user-defined text values.

Allow:

- Add
- Edit
- Remove

---

# 18. Representative Creation Summary

Before saving, provide a clear read-only summary of all decisions.

This should feel like a "final character sheet" preview.

Display:

### Representative

Name

### Type

Type name and description

### Personalities

Each selected personality with its description

### Characteristics

Name, Value, Bonus

### Additional Bonuses

Bonuses originating from:

- Representative Type
- Representative Personalities

### Skills

Complete list

### Talents

Complete list

### Modifiers

List all resulting modifiers.

For each modifier show:

- Value
- What it affects
- Source

The summary should visually communicate the consequences of the user's choices.

This is particularly important because the user should be able to understand:

**"I selected these options, therefore this Representative produces these effects."**

Provide:

- Save Representative
- Cancel

If the Representative creation dialog was opened from Colony Creation:

**Save → assign the new Representative to the colony and return to Colony Creation.**

If opened independently:

**Save → return to the previous screen.**

---

# 19. Interaction Design Principles

The application should follow these principles:

### Read-only vs editable

Make the difference between editable and calculated data immediately obvious.

Do not make calculated backend values look like editable text fields.

### Backend calculations

The frontend must not visually imply that users can manually edit calculated values.

When a value is calculated, show its source/calculation details instead.

### Confirmation

Use confirmation dialogs for destructive or consequential actions:

- Delete
- Change Representative
- potentially important status transitions

### Status

Statuses should be represented consistently throughout the application.

Use:

- badge
- icon
- text

Do not rely exclusively on colour.

### Dense but readable

This application contains a lot of data.

Use information density deliberately:

- compact tables
- grouped cards
- collapsible details
- clear typography
- whitespace between conceptual groups

Avoid excessive empty space that makes the application feel like a marketing website.

---

# 20. Warhammer 40K Visual Identity

The UI should evoke the Imperium of Man without becoming parody.

Use subtle visual references:

- Imperial administrative typography
- brass/gold accents
- parchment-like secondary panels
- industrial separators
- restrained gothic ornamentation
- subtle Adeptus Administratum-inspired visual language
- tactical/status iconography
- occasional Imperial-style seals or insignia

Avoid filling every screen with Warhammer symbols.

The application should feel like a **functional colony administration terminal used by a Rogue Trader**, not a game HUD.

---

# 21. UX Hierarchy

The most important information should always be immediately visible.

Priority hierarchy:

1. Colony identity
2. Colony status
3. Colony age
4. Core colony characteristics
5. Current Representative
6. Major infrastructure state
7. Detailed modifiers/calculations
8. Notes and secondary information

On the Overview screen, the user should understand the colony's overall condition within approximately 5–10 seconds.

On detailed screens, the user should be able to investigate exactly why a calculated value has its current value.

---

# 22. Visualisation Requirements

Generate a coherent multi-screen application design rather than isolated unrelated mockups.

Show the relationship between screens and maintain:

- identical navigation
- identical typography
- identical colour system
- identical status indicators
- identical component language
- consistent spacing
- consistent table/card design

Recommended visualisation set:

1. Colony Overview / At a Glance
2. Colony Details
3. Representative
4. Infrastructure — Hard Infrastructure + Upgrades + Development Plan
5. Colony Creation Dialog
6. Representative Creation Dialog
7. Representative Creation Summary

If presenting several screens together, make it obvious that they belong to the same application.

The final result should look like a **real, implementable desktop web application for managing a Rogue Trader colony**, with a dark Imperial aesthetic, excellent readability, strong information hierarchy and clear distinction between user-editable data and backend-calculated game data.

Do not simplify away important fields merely to make the UI look cleaner.

Instead, solve the information-density problem through good UX, grouping, hierarchy, expandable details and appropriate component selection.
