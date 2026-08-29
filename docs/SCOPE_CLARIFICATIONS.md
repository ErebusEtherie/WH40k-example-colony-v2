# Application Scope Clarifications

**Last Updated:** 2026-08-29

This document provides explicit clarification about what the WH40k Colony Manager application does and does not do. This is critical for developers and AI assistants to understand the project's scope.

---

## Core Principle

**This application is a tracking and organization tool for tabletop gameplay, NOT a game automation system.**

All game mechanics, dice rolls, and event resolutions happen **at the table** during the actual play session with the GM and players present. The application serves as a digital replacement for spreadsheets and character sheets.

---

## What The Application Does ✅

1. **Track Colony Stats**
   - Store and calculate: Size, Complacency, Order, Productivity, Piety
   - Calculate derived Profit Factor based on colony size and modifiers
   - Apply threshold-based state labels (Anarchy, Placated, Productive, etc.)

2. **Manage Infrastructure & Upgrades**
   - Record Hard Infrastructure installations
   - Track working vs. faulty state
   - Record Support Upgrades and their stat choices
   - Calculate stacking bonuses from infrastructure and upgrades

3. **Manage Representatives**
   - Store Representative character data (stats, skills, talents)
   - Track personality type (Judge, Cardinal, Satrap)
   - Apply representative-based modifiers to colony stats

4. **Record GM-Created Modifiers**
   - Store custom modifiers created by the GM
   - Record dice roll results (entered manually by GM)
   - Track event effects (as determined and entered by GM)
   - Support optional expiry tracking for temporary effects

5. **Organizational Features**
   - Multi-user access control (Owner, Admin, Editor, Viewer)
   - Audit logging of all changes
   - Export/import colony data for backup and sharing
   - REST API for frontend consumption

---

## What The Application Does NOT Do ❌

1. **No Automated Dice Rolling**
   - The application does NOT generate random numbers or dice rolls
   - When rules require a roll (e.g., \"roll 1d10\"), the GM rolls physical/digital dice at the table
   - The GM manually enters the result as a modifier if needed
   - The application stores the result but never generates it

2. **No Automatic Event Cycles**
   - The application does NOT trigger events automatically
   - The application does NOT simulate time passage or game cycles
   - Event cards or tables are used at the table by the GM
   - GM records event outcomes in the application manually

3. **No Automatic Growth/Decay**
   - The application does NOT automatically adjust stats over time
   - No background processes or scheduled tasks modify colony state
   - All stat changes result from explicit GM actions
   - Time-based mechanics are tracked manually by the GM

4. **No Gameplay Decision Making**
   - The application does NOT make rules interpretations
   - The application does NOT resolve game mechanics automatically
   - The application does NOT replace GM judgment
   - All game decisions happen at the table

---

## Why This Distinction Matters

### For Developers

- Do NOT implement dice rolling functions
- Do NOT create background job schedulers for game cycles
- Do NOT automate event resolution logic
- Do NOT add features that assume the app runs "during" gameplay

### For AI Assistants

When suggesting features or reviewing code:
- **DO NOT** propose: event automation, dice rolling, cycle simulation
- **DO** focus on: tracking, organization, calculation, data management
- **ALWAYS** assume the GM is the source of game mechanic decisions

### For Users

The application is designed to:
- Reduce bookkeeping during gameplay
- Provide quick reference for colony state
- Enable easy sharing and backup
- Maintain complete audit history

The application is NOT designed to:
- Run the game for you
- Replace the GM
- Automate gameplay mechanics
- Make decisions about rules or outcomes

---

## Examples

### Correct Usage Flow

1. **Event occurs in game** → GM draws/reads event card
2. **GM decides effect** → GM determines impact on colony
3. **GM rolls dice (if needed)** → GM uses physical dice or external roller
4. **GM enters result** → GM creates modifier in application with roll result
5. **Application calculates** → Stats update based on modifier
6. **Application tracks** → State changes recorded in audit log

### Incorrect Usage (NOT Supported)

1. ❌ Application triggers event automatically
2. ❌ Application rolls dice for event resolution
3. ❌ Application decides event outcome
4. ❌ Application advances game time automatically

---

## Technical Implications

### No Background Workers
- No Celery, RQ, or similar job queues for game mechanics
- No cron jobs or scheduled tasks for cycle advancement
- All state changes come from explicit API calls

### No Random Number Generation
- No andom module usage for game mechanics
- Dice results come from user input, not code
- Deterministic calculations only (no RNG)

### No Assumptions About Game State
- Application doesn't know "what should happen next"
- No validation against game rules beyond basic constraints
- GM input is authoritative

---

## Related Documentation

- .clinerules/00-overview.md — Project overview and architecture
- .clinerules/02-domain-modeling.md — Domain model design
- README.md — User-facing documentation
- docs/api_guide_phase_3.md — API reference

---

**Remember:** If you're unsure whether a feature fits the scope, ask: *"Does this automate a game mechanic, or does it help the GM track and organize information?"*
