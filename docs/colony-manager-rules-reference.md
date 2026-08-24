# Colony Manager - Rules Reference Document

## Overview

Colony Manager is a "living character card" for Rogue Trader RPG colonies. This document contains all rules, calculations, and data structures needed for implementation.

---

## Core Principles

1. **No Dice Rolls**: All random results (1d5, 1d10, 1d100) are provided by Player/GM as input values.
2. **No Event System**: Colony Manager tracks state only; events are handled externally.
3. **No Automated Tests**: Acquisition Tests, skill checks, etc. are not performed by the app.
4. **GM Control**: Custom modifiers allow GM to apply situational bonuses/penalties.
5. **Representative Uniqueness**: Personalities cannot be duplicated on the same Representative.

---

## Data Structures

### Modifier Object

```typescript
interface Modifier {
  id: string;                    // Unique identifier
  statistic: Statistic;          // Target characteristic
  value: number;                 // Positive or negative integer
  source: string;                // Description of origin
  category: ModifierCategory;    // Permanent | Conditional | Custom
  isActive: boolean;             // For toggling conditional modifiers
  dateApplied?: Date;            // Optional timestamp
}

enum Statistic {
  SIZE = "Size",
  COMPLACENCY = "Complacency",
  ORDER = "Order",
  PRODUCTIVITY = "Productivity",
  PIETY = "Piety",
  PF_VALUE = "PF_Value"
}

enum ModifierCategory {
  PERMANENT = "Permanent",        // Infrastructure, upgrades, personalities
  CONDITIONAL = "Conditional",   // Threshold-based (auto-calculated)
  CUSTOM = "Custom"              // GM/player input
}
```

### Infrastructure Object

```typescript
interface Infrastructure {
  id: string;
  type: InfrastructureType;      // Transport | Power | Water | Food | Communications
  name: string;                  // Custom name (e.g., "Mag-Lev Transit Network")
  installationDate: Date;
  description: string;            // Lore/flavor text
  status: InfrastructureStatus;  // Working | NotWorking | InProgress
}

enum InfrastructureType {
  TRANSPORT = "Transport",
  POWER = "Power",
  WATER = "Water",
  FOOD_PRODUCTION = "Food Production",
  COMMUNICATIONS = "Communications"
}

enum InfrastructureStatus {
  WORKING = "Working",            // Positive modifiers apply
  NOT_WORKING = "Not Working",    // Penalty modifiers apply
  IN_PROGRESS = "In Progress"     // No modifiers apply
}
```

### Support Upgrade Object

```typescript
interface SupportUpgrade {
  id: string;
  type: UpgradeType;             // See table below
  name: string;                  // Custom name (e.g., "Garrison of Combat Engineers")
  installationDate: Date;
  description: string;           // Lore/flavor text
  status: InfrastructureStatus;  // Same status enum as Infrastructure

  // For Contacts upgrade only
  contactCount?: number;         // Number of NPCs (1-5), player/GM provides
  contactDetails?: string;       // Description of contacts
}

enum UpgradeType {
  // Original Upgrades
  ARBITES_PRECINCT = "Arbites Precinct",
  ECCLESIARCHY_MISSION = "Ecclesiarchy Mission",
  MECHANICUM_STATION = "Mechanicum Station",
  INFANTRY_GARRISON = "Infantry Garrison",
  IMPERIAL_NAVY_STATION = "Imperial Navy Station",
  CULTURAL_IMPROVEMENT = "Cultural Improvement",
  INDUSTRIAL_FACILITY = "Industrial Facility",
  PERSONAL_LODGINGS = "Personal Lodgings",
  CONTACTS = "Contacts",
  TRAPPINGS = "Trappings"
}
```

### Development Plan Item Object (Planning Panel)

```typescript
interface DevelopmentPlanItem {
  id: string;
  name: string;                  // Custom name (e.g., "Garrison of Combat Engineers")
  type: PlanType;                // Hard Infrastructure or Support Upgrade type
  priority: number;              // >0 integer, higher = more important
  status: PlanStatus;            // Planning | In Progress
  planDescription: string;       // Player/GM input: in-game plan for acquisition

  // Optional: Link to actual item when promoted
  linkedItemId?: string;         // ID of actual Infrastructure or SupportUpgrade
}

// PlanType includes all InfrastructureTypes and UpgradeTypes
enum PlanType {
  // Hard Infrastructure
  TRANSPORT = "Transport",
  POWER = "Power",
  WATER = "Water",
  FOOD_PRODUCTION = "Food Production",
  COMMUNICATIONS = "Communications",

  // Support Upgrades
  ARBITES_PRECINCT = "Arbites Precinct",
  ECCLESIARCHY_MISSION = "Ecclesiarchy Mission",
  MECHANICUM_STATION = "Mechanicum Station",
  INFANTRY_GARRISON = "Infantry Garrison",
  IMPERIAL_NAVY_STATION = "Imperial Navy Station",
  CULTURAL_IMPROVEMENT = "Cultural Improvement",
  INDUSTRIAL_FACILITY = "Industrial Facility",
  PERSONAL_LODGINGS = "Personal Lodgings",
  CONTACTS = "Contacts",
  TRAPPINGS = "Trappings"
}

enum PlanStatus {
  PLANNING = "Planning",          // Initial idea stage
  IN_PROGRESS = "In Progress"    // Actively working toward acquisition
}

// Sort options for Planning Panel
enum PlanSortOption {
  PRIORITY = "Priority",          // High to low
  PRIORITY_ASC = "Priority Asc",  // Low to high
  STATUS = "Status",              // Group by status
  TYPE = "Type",                  // Group by type
  NAME = "Name"                   // Alphabetical
}
```

### Representative Object

```typescript
interface Representative {
  type: RepresentativeType;
  personalities: Personality[];  // No duplicates allowed
  dynastyRoll?: number;          // d100 result if Dynasty Member (1-100)
}

enum RepresentativeType {
  SATRAP = "Satrap",
  JUDGE = "Judge",
  CARDINAL = "Cardinal",
  COLONIST_REP = "Colonist Representative",
  MILITARY_COMMANDER = "Military Commander",
  DYNASTY_MEMBER = "Dynasty Member"
}

interface Personality {
  type: PersonalityType;
  description: string;
  modifiers: Modifier[];         // Modifiers this personality provides
}
```

### Colony Object

```typescript
interface Colony {
  id: string;
  name: string;
  type: ColonyType;
  creationDate: Date;             // Day 0
  currentDay: number;

  // Base Stats (from colony type)
  baseStats: {
    size: number;
    complacency: number;
    order: number;
    productivity: number;
    piety: number;
  };

  // Leadership
  leaderQuality: number;           // 2-6 (Int/Per/Fel)
  representative: Representative;

  // Infrastructure & Upgrades
  hardInfrastructure: Infrastructure[];
  supportUpgrades: SupportUpgrade[];

  // Planning Panel (no calculation impact)
  developmentPlans: DevelopmentPlanItem[];

  // Modifiers
  permanentModifiers: Modifier[];
  customModifiers: Modifier[];     // User-managed

  // Calculated (not stored, computed on demand)
  // displayStats: CalculatedStats;
}
```

---

## Calculation Pipeline

### Phase 1: Base Stats

Set according to selected **Colony Type**:

| Colony Type | Size | Complacency | Order | Productivity | Piety |
|---|---:|---:|---:|---:|---:|
| Research Mission | 1 | 2 | 1 | 1 | 1 |
| Mining and Industry | 1 | 1 | 1 | 2 | 1 |
| Ecclesiastical | 1 | 1 | 2 | 1 | 2 |
| Agricultural | 1 | 1 | 2 | 1 | 1 |

### Phase 2: Permanent Modifiers

Apply all modifiers from:

- Colony Type Specialties
- Leader Quality
- Representative Type
- Representative Personalities
- Dynasty Member Roll (if applicable)
- Hard Infrastructure (if Working)
- Support Upgrades (if Working)

> **Note:** Development Plan Items are NOT included in calculations.

### Phase 3: Conditional Modifiers

Auto-calculated based on current statistics:

| Condition | Trigger | Effect |
|---|---|---|
| **Placated** | Complacency > Size | PF_Value +1 |
| **Riots and Unrest** | Complacency = 0 | Order -1d5, Productivity -1d5 (GM inputs values) |
| **Orderly** | Order > Size | Productivity +2 |
| **Anarchy** | Order = 0 | PF_Value = 0, all stats decay (GM applies via Custom Modifiers) |
| **Productive** | Productivity > Size | PF_Value +2 |
| **Production Halted** | Productivity = 0 | PF_Value ÷ 2 (round down) |
| **Pious** | Piety > Size | Order +1, Complacency +1 |
| **Heretical** | Piety = 0 | Order -1d5, Complacency -1d5 (GM inputs values), lose Imperial recognition |

### Phase 4: Custom Modifiers

Applied last. GM/Player inputs for:

- Event results
- Narrative consequences
- Manual adjustments
- Random roll results (1d5, 1d10, 1d100)

### Phase 5: Representative Damage Reduction

When applying **negative** modifiers:

| Representative | Protected Stat | Reduction |
|---|---|---:|
| Judge | Order | -1 (minimum loss: 1) |
| Cardinal | Piety | -1 (minimum loss: 1) |
| Colonist Representative | Complacency | -1 (minimum loss: 1) |
| Military Commander | Productivity | -1 (minimum loss: 1) |
| Satrap | None | — |
| Dynasty Member | None | — |

**Example:** GM inputs Order -3 from riot. Representative is Judge. Final: Order -2.

### Phase 6: Final Calculation

```text
Display Value = Base + Σ(Permanent Modifiers) + Σ(Conditional Modifiers) + Σ(Custom Modifiers)
```

**Constraints:**

- Size: 0-10 (cannot exceed 10)
- Other stats: minimum 0
- PF_Value: calculated separately based on Size + modifiers

---

## Colony Type Specialties

### Research Mission

- **Productivity +2** when harvesting Organic Compounds, Archeotech Caches, or Xenos Ruins
- **PF_Value +1** additional when harvesting these resources
- *Source: "Research Specialty"*

### Mining and Industry

- Begins with **Mine** or **Manufactorum** (free Working upgrade)
- **Productivity +2** when harvesting Mineral Resources
- **PF_Value +2** additional when harvesting minerals
- *Source: "Mining Specialty"*

### Ecclesiastical

- **Special Rule:** When Order would decrease, may decrease Piety instead
- Begins with **Cultural District** (free Working upgrade)
- *Source: "Ecclesiastical Flexibility"*

### Agricultural

- **Special Rule:** When Size would decrease, player/GM may roll 1d10; on 8+ ignore the decrease
- *Source: "Agricultural Resilience"*

---

## Leadership

### Leader Quality (PF_Value Modifier)

| Leader Int/Per/Fel | Modifier |
|---:|---:|
| 2 | -2 |
| 3 | -1 |
| 4 | 0 |
| 5 | +1 |
| 6 | +2 |

*Source: "Leadership Quality"*

### Representative Types

| Type | Protected Stat | Description |
|---|---|---|
| **Satrap** | None | A governor or viceroy, often a local noble or Imperial official appointed to oversee the colony in the Rogue Trader's name. They excel at administration and commerce, ensuring the colony runs efficiently and generates profit. |
| **Judge** | Order | A Judge of the Adeptus Arbites brings the iron fist of Imperial law to the colony. Their presence ensures order through fear of authority and swift justice, reducing the impact of civil unrest and criminal activity. |
| **Cardinal** | Piety | A Cardinal of the Ecclesiarchy maintains the spiritual wellbeing of the colonists, ensuring their faith in the Emperor remains strong. Their leadership minimizes the spread of heresy and keeps the population devoted to the Imperial Creed. |
| **Colonist Representative** | Complacency | A representative elected by the colonists themselves, speaking for the common people. Their presence keeps the population content and loyal, reducing dissatisfaction and unrest by addressing the concerns of the masses. |
| **Military Commander** | Productivity | A seasoned officer from the Imperial Guard or other military force who maintains discipline and operational readiness. Their command structure ensures that work continues even under adverse conditions, keeping the colony productive. |
| **Dynasty Member** | None | A member of the Rogue Trader's own dynasty, blood-bound to the warrant of trade. Their personal investment in the colony's success is absolute, though their competence and methods vary wildly based on their upbringing and ambitions. |

**Satrap Special:** +5 to Acquisition Tests on this colony (tracked separately, not a stat modifier)

### Dynasty Member Results (Table 3-5)

Player/GM provides d100 (1-100):

| d100 | Statistic | Value | Source | Description |
|---|---|---:|---|---|
| 01-20 | Player Choice | +1 | "Dynasty Potential" | This scion shows surprising aptitude for leadership, with a natural talent that could serve the dynasty well if nurtured properly. |
| 21-40 | Productivity | +1 | "One To Keep an Eye On" | A capable administrator who gets results, though their methods may raise eyebrows among the more traditional elements of the colony. |
| 41-60 | Piety | +1 | "Thrilling Heroics" | This dynasty member inspires the faithful through bold action and visible devotion to the Emperor, becoming a figure of religious admiration. |
| 61-80 | Order | +1 | "Come On, It's Just a Grox!" | A reckless but charismatic leader whose casual attitude toward danger somehow keeps things under control through sheer force of personality. |
| 81-100 | Complacency | +1 | "Volcano Palace" | An eccentric visionary who builds grandiose projects that somehow please the populace, even if their architectural choices seem questionable. |

### Representative Personalities (Table 3-6)

Select any combination. **No duplicates allowed.**

| Personality | Statistic | Value | Source | Description |
|---|---|---:|---|---|
| **Beloved** | Complacency | +1 | "Beloved" | The Representative is genuinely loved by the people, seen as a benevolent figure who truly cares for their wellbeing. Stories of their kindness spread throughout the colony. |
| **Military-Minded** | Order | +1 | "Military-Minded" | The Representative views all problems through a military lens, organizing the colony like a regimented force. While effective at maintaining discipline, their approach can be inflexible. |
| **Corrupt** | Productivity | +2 | "Corrupt" | The Representative skims resources and cuts corners, but their graft somehow keeps things running efficiently. Their web of illicit dealings actually facilitates trade and production. |
| **Corrupt** | Order | -1 | "Corrupt" | Their corruption breeds resentment and undermines legitimate authority, as citizens lose faith in fair governance. |
| **Idle** | Complacency | +2 | "Idle" | A lazy administrator who avoids making difficult decisions, which somehow keeps the population content through benign neglect and lack of interference. |
| **Idle** | Productivity | -1 | "Idle" | Their laziness means problems fester and work slows as no one is held accountable for inefficiency. |
| **Ambitious** | Productivity | +2 | "Ambitious" | Driven to prove themselves, the Representative pushes the colony to achieve greater output and expansion, often at the cost of popular support. |
| **Ambitious** | Complacency | -1 | "Ambitious" | Their relentless drive exhausts the populace, who feel overworked and undervalued in pursuit of the Representative's glory. |
| **Zealous** | Piety | +1 | "Zealous" | Deeply devoted to the Imperial Creed, the Representative ensures regular worship and religious observance, keeping the Emperor at the center of colonial life. |
| **Patron of the Arts** | Complacency | +2 | "Patron of the Arts" | The Representative sponsors culture, entertainment, and beauty, making the colony a more pleasant place to live and lifting spirits. |
| **Patron of the Arts** | Piety | -1 | "Patron of the Arts" | Some traditionalists view their secular cultural focus as distracting from proper religious observance, causing minor spiritual concerns. |
| **Unlucky** | Piety | +2 | "Unlucky" | Prone to disasters and misfortune, the Representative has turned to faith as their only solace, becoming extremely devout and inspiring religious fervor as a coping mechanism. |
| **Ties With...** | Player Choice | +1 | "Ties With [Org]" | The Representative has connections to a specific organization (Military, Criminal, Ecclesiarchy, Mechanicum, etc.), granting them influence and resources from that faction. GM decides which stat receives the bonus based on the organization. |
| **Administrative Expert** | Productivity | +2 | "Administrative Expert" | A master of bureaucracy and logistics, the Representative streamlines operations brilliantly—but only when the colony is already orderly. |
| **Administrative Expert** | Condition: Only if Order > Size | — | — | — |
| **Cruel** | Productivity | +2 | "Cruel" | Through fear and harsh discipline, the Representative extracts maximum work from the population, though morale suffers terribly. |
| **Cruel** | Complacency | -1 | "Cruel" | The populace lives in fear of the Representative's punishments, creating an atmosphere of terror and resentment. |
| **Spymaster** | Order | +2 | "Spymaster" | The Representative maintains an extensive network of informants and agents, crushing dissent before it can organize and keeping the population monitored. |
| **Spymaster** | Complacency | -1 | "Spymaster" | The constant surveillance makes citizens paranoid and unhappy, as privacy becomes a forgotten luxury. |
| **Generalissimo** | Order | +2 | "Generalissimo" | A military dictator who rules with absolute authority, their armed presence ensuring compliance through overwhelming force. |
| **Generalissimo** | Piety | -1 | "Generalissimo" | Their focus on military matters neglects spiritual needs, and their soldiers sometimes encroach on Ecclesiarchal prerogatives. |
| **Paranoid** | Order | +2 | "Paranoid" | The Representative sees enemies everywhere, creating extensive security measures that keep the colony safe but also oppressive. |
| **Paranoid** | Productivity | -1 | "Paranoid" | Their constant security checks and suspicion slow down legitimate work and commerce. |
| **Mad** | Complacency | +1 | "Mad" | Their eccentricities amuse the population, who find their unpredictable behavior entertaining in a grim sort of way. |
| **Mad** | Piety | +1 | "Mad" | Some interpret their madness as divine inspiration or holy frenzy, attracting religious interest. |
| **Mad** | Productivity | +1 | "Mad" | Their manic energy occasionally produces bursts of creative problem-solving and unconventional solutions. |
| **Mad** | Order | Variable | "Mad" | Their insanity creates chaos and unpredictable governance. GM inputs -1d5 (provides value -1 to -5). |
| **Charitable** | Complacency | +1 | "Charitable" | The Representative gives generously to the poor and downtrodden, earning gratitude and loyalty from the masses. |
| **Charitable** | Piety | +1 | "Charitable" | Their charity is seen as pious duty, inspiring religious devotion among the faithful. |
| **Charitable** | Productivity | -1 | "Charitable" | Resources diverted to charity reduce industrial output and available working capital. |
| **Vainglorious** | Productivity | +2 | "Vainglorious" | Desperate to build monuments to their own glory, the Representative drives construction and industry to impressive heights. |
| **Vainglorious** | Piety | -1 | "Vainglorious" | Their self-aggrandizement borders on hubris, troubling the faithful who believe glory belongs to the Emperor alone. |
| **Scholarly** | Lowest Stat | +1 | "Scholarly" | The Representative studies and applies knowledge to improve the colony's weakest area through careful analysis and learning. If multiple stats are tied for lowest, GM/player chooses which receives the bonus. |
| **Avaricious** | Productivity | +1 | "Avaricious" | The Representative's greed drives them to maximize resource extraction and profit, though they may skim some for themselves. |
| **Quite a character** | — | — | "Quite a Character" | An exceptionally complex individual combining two distinct personality traits. Select two other personalities (must be compatible). |

---

## Hard Infrastructure

### Status Effects

| Status | Effect |
|---|---|
| **Working** | Apply positive modifiers |
| **Not Working** | Apply penalty modifiers |
| **In Progress** | No modifiers (infrastructure exists but not fully operational) |

### Infrastructure Types (Table 3-7)

When Size increases, player/GM provides d5 (1-5) or selects:

| d5 | Type | Working Modifiers | Not Working Penalties | Description |
|---:|---|---|---|---|
| 1 | **Transport** | Productivity +1, Complacency +1 | Productivity -2, Order -2 | Roads, railways, mag-levs, and void-shuttles that move goods and people throughout the colony and to orbital facilities. |
| 2 | **Power** | Productivity +2 | Productivity -3, Complacency -1 | Plasma generators, solar arrays, geothermal taps, or other energy sources that keep the colony's lights on and machines running. |
| 3 | **Water** | Order +1, Complacency +1 | Order -2, Complacency -2 | Purification plants, wells, recycling systems, and distribution networks that provide clean water to the population. |
| 4 | **Food Production** | Productivity +1, Complacency +1 | Productivity -2, Complacency -2 | Agri-domes, protein vats, hydroponic bays, and food processing facilities that feed the colony. |
| 5 | **Communications** | Productivity +1, Order +1 | Productivity -2, Order -2 | Vox-casters, data networks, and astropathic relays that allow coordination, governance, and contact with the wider Imperium. |

### Missing Infrastructure Penalty

Until a required infrastructure is built (moved from In Progress to Working):

- **Statistic:** Complacency
- **Value:** -1
- **Source:** "Missing Infrastructure"

---

## Support Upgrades

### Status Effects

| Status | Effect |
|---|---|
| **Working** | Apply positive modifiers |
| **Not Working** | No modifiers (or GM may apply situational penalties as Custom Modifiers) |
| **In Progress** | No modifiers |

### Upgrade Types

| Type | Working Modifier | Limit | Description |
|---|---|---|---|
| **Arbites Precinct** | Order +1 | Cumulative | A fortress-courthouse of the Adeptus Arbites, where judges and enforcers dispense Imperial justice. The presence of these black-armored lawkeepers ensures compliance with Imperial law through investigation, prosecution, and summary execution when necessary. |
| **Ecclesiarchy Mission** | Piety +1 | Cumulative | A church, shrine, or missionary station tended by priests of the Adeptus Ministorum. Here the faithful gather for worship, confession, and spiritual guidance, ensuring the Emperor's light reaches even the darkest corners of the colony. |
| **Mechanicum Station** | Productivity +1 (+2 for Mining/Industry, +3 for Research) | One only | A small forge, outpost, or laboratory maintained by the Adeptus Mechanicus. Tech-priests and their servitors tend to the colony's machinery, perform sacred rites of maintenance, and pursue their own mysterious technological agendas. |
| **Infantry Garrison** | Order +1 | One only | A barracks and headquarters for Imperial Guard or other military forces stationed to protect the colony. Their presence deters external threats and internal rebellion through show of force and martial discipline. |
| **Imperial Navy Station** | Order +1 | One only | A void-port, orbital dock, or aerospace facility maintained by the Imperial Navy. Enables system defense, void transport, and maintains the Rogue Trader's connection to the wider stellar neighborhood. |
| **Cultural Improvement** | Player Choice +1 | Once per stat | A theater, museum, garden, or other cultural institution that elevates the colony beyond mere survival, improving quality of life and community spirit in the chosen area. |
| **Industrial Facility** | Productivity +2, PF_Value +1 | — | A manufactorum, refinery, or production center that significantly increases the colony's industrial output and economic value. |
| **Personal Lodgings** | Order +1 | Once (no benefit after first) | Rogue Traders frequently build lavish personal accommodations on their colonised worlds, from fortified compounds to grand palaces, or humble prefabricated hab units. Security measures, armouries, dungeons, teleportariums, or ostentatious banqueting halls may be included. +10 to Charm, Commerce, and Deceive Tests while entertaining dignitaries here. |
| **Contacts** | Special (see below) | Cumulative | A network of 1d5 NPCs who have risen above the faceless masses—each with connections to local groups (Ecclesiarchy, Mechanicus, underworld, mutant societies, hidden cults). +10 to Fellowship-based Tests with affiliated groups. Can be used to investigate shadowy portions of the colony. |
| **Trappings** | Complacency +1 | Cumulative | Large-scale and grandiose signs of the Rogue Trader's skill, courage, and cunning—the prow of a rival's flagship as a monument, the skeleton of an exotic predator, or a massive effigy of the Rogue Trader. These inspire the populace and keep them blinded by the shining legend of their leader. |

**Maximum Support Upgrades:** Equal to current Colony Size.

### Contacts Upgrade Details

Since the app does not roll dice, the player/GM provides the number of contacts (1-5):

| Field | Description |
|---|---|
| **Contact Count** | Player/GM inputs 1-5 (represents 1d5 result) |
| **Contact Details** | Free text describing who the contacts are, their affiliations, and what makes them useful |

**Effect Tracking:**

- Store contact count and description in the SupportUpgrade object.
- The +10 Fellowship bonus is narrative; not tracked as a modifier (GM applies situational bonuses via Custom Modifiers if needed).
- Contacts can be used for investigation and proactive crisis management (narrative tool).

---

## Development Planning Panel

A separate planning interface for players to organize and prioritize future infrastructure and upgrades. **This panel has no impact on colony calculations.**

### Purpose

- Plan colony development roadmap
- Track acquisition progress
- Coordinate between players and GM
- Maintain wishlist of desired improvements

### Plan Item Fields

| Field | Type | Description |
|---|---|---|
| **Name** | string | Custom name (e.g., "Garrison of Combat Engineers", "Cathedral of the Golden Throne") |
| **Type** | PlanType | Hard Infrastructure or Support Upgrade category |
| **Priority** | number (>0) | Integer priority level. Higher = more important. Suggested range: 1-10 |
| **Status** | PlanStatus | **Planning**: Initial idea stage / **In Progress**: Actively working toward acquisition |
| **Plan Description** | text | Free-form field for players to describe: acquisition method, resources needed, in-game narrative, challenges, etc. |

### Plan Type Options

**Hard Infrastructure:**

- Transport
- Power
- Water
- Food Production
- Communications

**Support Upgrades:**

- Arbites Precinct
- Ecclesiarchy Mission
- Mechanicum Station
- Infantry Garrison
- Imperial Navy Station
- Cultural Improvement
- Industrial Facility
- Personal Lodgings
- Contacts
- Trappings

### Status Definitions

| Status | Meaning |
|---|---|
| **Planning** | Item is on the wishlist. No active effort to acquire it yet. Aspirational or awaiting opportunity. |
| **In Progress** | Players are actively pursuing this through Endeavours, negotiations, or other in-game actions. |

### Sorting Options

Players can sort the planning list by:

1. **Priority (High to Low)** - Default view. Shows most important items first
2. **Priority (Low to High)** - Shows lower priority items first
3. **Status** - Groups by Planning vs In Progress
4. **Type** - Groups by infrastructure/upgrade category
5. **Name (A-Z)** - Alphabetical by custom name

### Workflow: Plan → Reality

When a planned item is actually acquired in-game:

1. Create actual Infrastructure or SupportUpgrade object.
2. Set status to In Progress or Working (based on narrative).
3. For Contacts: Player/GM inputs contact count (1-5).
4. Optionally link Plan Item to actual item via `linkedItemId`.
5. Archive or delete Plan Item (GM/Player choice).

---

## Colony Growth System

When player initiates Growth Check:

1. Player/GM provides d10 result (1-10).
2. Add any "Burned PF" bonus (player input).
3. Determine outcome:

| d10 + Bonus | Effect |
|---|---|
| 1-2 | **Decline**: Size -1; GM inputs -1d5 to random stat via Custom Modifier |
| 3-7 | **Stagnation**: No change |
| 8+ | **Growth**: Size +1; GM selects/determines d5 for new Infrastructure requirement |

### Burning Profit Factor

Player can permanently reduce PF_Value by any amount to add that amount to the next growth check result.

### Agricultural Special Rule

When Size would decrease, player may roll 1d10; on 8+ ignore the decrease (flag tracked separately, not a modifier).

---

## Resource Harvesting

At end of 90-day cycle, player selects:

### Option A: Grow Colony

- Create Custom Modifier: Size (next growth check) +[player input 1d5]
- Source: "Harvest Investment"

### Option B: Take Profits

- Size 1-4: PF_Value +1 (Source: "Harvest Profits")
- Size 5+: PF_Value +2 (Source: "Harvest Profits")
- **OR** if Explorers not present: Complacency -[player input 1d5] (Source: "Absentee Profits")

---

## Profit Factor Value Calculation

### Base PF Value by Size

| Size | Base PF Value | Description |
|---:|---:|---|
| 0 | 0 | Ghost Town |
| 1 | 1 | Settlement |
| 2 | 2 | Outpost |
| 3 | 3 | Freehold |
| 4 | 4 | Demesne |
| 5 | 6 | Holding |
| 6 | 8 | Dominion |
| 7 | 10 | Territory |
| 8 | 12 | City |
| 9 | 14 | Metropolis |
| 10 | 18 | Hive |

### PF Value Modifiers

| Source | Value | Condition |
|---|---:|---|
| Placated | +1 | Complacency > Size |
| Productive | +2 | Productivity > Size |
| Industrial Facility | +1 | Per Working facility |
| Leader Quality | -2 to +2 | Based on stat |
| Colony Type Special | Variable | See Colony Type section |

**Final PF Value = Base + Sum(all modifiers)**

---

## Conditional States Reference

### Positive Thresholds

| State | Trigger | Effect |
|---|---|---|
| **Placated** | Complacency > Size | PF_Value +1 |
| **Orderly** | Order > Size | Productivity +2 |
| **Productive** | Productivity > Size | PF_Value +2 |
| **Pious** | Piety > Size | Order +1, Complacency +1 |

### Crisis States

| State | Trigger | Effect | Description |
|---|---|---|---|
| **Riots and Unrest** | Complacency = 0 | Order -1d5, Productivity -1d5 | The population has reached breaking point. Riots erupt, work stops, and the colony teeters on the edge of anarchy as desperate citizens vent their rage at the ruling powers. |
| **Anarchy** | Order = 0 | PF_Value = 0 | Law has collapsed completely. Gangs rule the streets, the Representative is dead or fled, and the colony consumes itself in violence. All stats begin decaying until order is restored. |
| **Production Halted** | Productivity = 0 | PF_Value ÷ 2 | All industry has ceased. Mines are flooded, manufactorums silent, agri-domes overgrown. The colony consumes more than it produces, becoming a drain on resources. |
| **Heretical** | Piety = 0 | Order -1d5, Complacency -1d5 | The faith of the colony has been lost. Cults flourish, churches stand empty or profaned, and dark whispers speak of forbidden practices. The colony loses Imperial recognition and may face crusade. |

---

## Custom Modifier Examples

| Situation | Statistic | Value | Source |
|---|---|---:|---|
| Riots rolled 1d5=3 | Order | -3 | "Riots and Unrest: GM Roll" |
| Riots rolled 1d5=2 | Productivity | -2 | "Riots and Unrest: GM Roll" |
| Heresy rolled 1d5=4 | Order | -4 | "Heretical: GM Roll" |
| Ties With Military | Order | +1 | "Ties With Military (GM Decision)" |
| Ties With Criminals | Productivity | +1 | "Ties With Criminals (GM Decision)" |
| Plague Event | Size | -1 | "GM Event: Plague" |
| Ork Raid | Order | -2 | "GM Event: Ork Raid" |
| Discovery of Ancient Cache | Complacency | +2 | "GM Event: Archaeological Discovery" |
| Burning PF for Growth | PF_Value | -X | "Burned for Growth" |
| Growth Bonus | Size (next check) | +X | "Burned PF Bonus" |
| Mad Personality | Order | -3 | "Mad: GM Roll" |

---

## UI Display Suggestions

### Main Colony Card

```text
[Colony Name]
Type: [Research Mission]
Day: [X]

Statistics:
Size: [X] / 10
Complacency: [X] ([Placated] if > Size)
Order: [X] ([Orderly] if > Size)
Productivity: [X] ([Productive] if > Size)
Piety: [X] ([Pious] if > Size)

PF Value: [X]

Representative: [Judge] [Ambitious, Zealous]
Upgrades: [3/5] (3 of 5 maximum)

[Tabs: Overview | Modifiers | Infrastructure | Upgrades | Development Plans]
```

### Modifier Breakdown (Expandable)

```text
Complacency: 5
  Base: 2
  +1: Transport Infrastructure (Working)
  +1: Beloved Representative
  +1: Pious Threshold Bonus
  +2: GM Event: Festival
  -------------------
  Total: 5
```

### Infrastructure/Upgrade Management

- List with status indicators (green=Working, red=Not Working, yellow=In Progress)
- Click to edit Name, Description, Status
- Show modifiers applied based on current status

### Contacts Upgrade Display

```text
Contacts (Working)
   "Underworld Informants Network"
   Contact Count: 3
   Details: Fixer Jax (Criminal), Sister Mera (Ecclesiarchy),
           Tech-Adept Zol (Mechanicus)

   Effect: +10 Fellowship with affiliated groups
```

### Development Planning Panel

```text
[Development Plans]                    [Sort: Priority ▼] [Filter: All]

┌─────────────────────────────────────────────────────────┐
│ Industrial Facility         [Planning]  Priority: 10  │
│ "Forge Complex Theta"                                     │
│ Type: Industrial Facility                               │
│ Plan: Need to complete Greater Endeavour "Ore to        │
│ Orbit" first. Then negotiate with Mechanicus for         │
│ tech-priest assignment.                                  │
│ [Promote] [Edit] [Delete]                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Power                      [In Progress] Priority: 8   │
│ "Geothermal Tap Alpha"                                  │
│ Type: Power                                             │
│ Plan: Mechanicum survey complete. Need 2 more sessions │
│ to complete drilling. Expected completion: Session 5  │
│ [View Linked] [Edit] [Complete] [Delete]               │
└─────────────────────────────────────────────────────────┘

[Add New Development Plan]
```

---

## Implementation Notes

1. **Modifier Application Order:** Always calculate Permanent → Conditional → Custom.
2. **Damage Reduction:** Apply after Custom modifiers are calculated but before final value.
3. **Status Changes:** When Infrastructure/Upgrade status changes, recalculate all modifiers.
4. **Threshold Checking:** Re-evaluate Conditional modifiers whenever base stats change.
5. **Persistence:** Store all Custom Modifiers with timestamps for audit trail.
6. **Validation:** Ensure no duplicate personalities; validate Size cannot exceed 10.
7. **Planning Panel:** Completely separate from calculations; optional feature for player coordination.
8. **Plan Promotion:** When plan becomes reality, create actual Infrastructure/Upgrade and optionally link back to plan.
9. **Personal Lodgings:** Track if already purchased; hide or disable "Purchase Again" if limit reached.
10. **Contacts:** Store contact count (1-5) and description; effect is narrative only.
