# Agent Briefing — Rogue Trader Colony Manager

Start here. Read the documents below **in this order** before writing any
code. Each builds on the one before it — skipping ahead will lose context
that later documents assume you already have.

## Reading order

1. **`.clinerules/00-overview.md`** through **`06-collaboration-and-uncertainty.md`**
   Project-wide engineering rules: architecture, domain modeling,
   persistence, testing, code style, and — critically —
   `06-collaboration-and-uncertainty.md`, which governs what you do when
   something is ambiguous or unspecified. Read all six files; they apply
   simultaneously, not as alternatives.

2. **`business_analysis.md`**
   What the system needs to do, in domain terms: entities, fields,
   business rules, calculation formulas, and an explicit list of what's
   in and out of scope for this first prototype (V1).
   **Status:** All business rules confirmed and implemented.

3. **`technical_analysis.md`**
   How the business requirements map to Python: stack choices, project
   structure, class/interface designs with code sketches, and the
   reasoning behind each design decision (including two revisions made
   mid-discussion — read §3.6 carefully, it overrides an earlier draft
   elsewhere in the same document).

4. **`implementation_plan.md`**
   The build order: environment setup → folder structure → domain layer →
   config → application layer → persistence → import/export → CLI →
   tooling. Each phase has a checklist and a checkpoint. Work through it
   sequentially — later phases assume earlier ones are complete and
   tested, not just written.

## The one rule that overrides convenience

**If something is unspecified, ambiguous, or conflicts with one of these
documents — stop and ask.** Do not invent game rule numbers, do not guess
at unconfirmed labels, do not resolve a conflict silently in either
direction. This is stated in `06-collaboration-and-uncertainty.md` and
repeated here because it's the rule most likely to get skipped under
pressure to keep moving. Every phase in `implementation_plan.md` that
depends on not-yet-provided data (colony types, personalities, rule
tables, two lore-state labels) tells you explicitly to placeholder it
and flag it — not to fill it in with something plausible.

## Current known gaps (as of this briefing)

- Colony Type config (types, base stats, base size, resource exploit
  bonuses) — not yet provided.
- Personality list (name, description, effect) — not yet provided.
- Two lore-state labels (Complacency == 0, Order > Size) — unconfirmed.
- Full Leadership Modifier lookup table (only a partial range confirmed).
- Deletion semantics when a Representative assigned to a Colony is
  deleted — a default is chosen (`technical_analysis.md` §3.6) but not
  independently re-confirmed since.

Check `business_analysis.md` §7 and `technical_analysis.md`'s resolved
decisions section for the authoritative, up-to-date list — this section
is a snapshot, not a live source.

## Phase 5 work - Scope for this phase

- **Representative Personality mechanics**: 18 of 19 rulebook Personalities are now
  fully specified and in scope. `Representative.personalities: list[PersonalityAssignment]`,
  min 1 / no duplicates. Two special input types: roll-based (Mad) and choice-based
  (Ties With…, Scholarly) — both default to 0 contribution when unset.
- **Representative Type**: descriptive only. Do NOT wire Type into any calculation.
  Add `special_trait_description` for display purposes only.
- **Hard Infrastructure**: new `Infrastructure` model, same aggregation pattern as
  `SupportUpgrade`. Starting infrastructure is NOT modeled as instances — it's already
  in `ColonyType` base stats. No build-order validation. Growth-triggered Complacency
  penalty is surfaced via a `pending_infrastructure_growth` flag on `Colony`, cleared
  manually by the GM — the app does not auto-calculate this penalty.

## Explicitly out of scope this phase — do not implement, ask if tempted to

- **Administrative Expert** personality (`+2 Productivity if Order > Size`) — continuously
  evaluated condition, deferred alongside other conditional mechanics.
- **Infrastructure "shortage" mechanic** (`Colony_Sheet_Analysis.md` §15) — no confirmed
  rulebook source, not yet discussed with the GM group. Marked "To Be Discussed with GM."
- **Skills/Talents** mechanical effects — remain reference-only per existing V1 decision,
  unaffected by this phase.

## ⚠️ Known blocker — verify before starting

`DECISIONS_AND_QUESTIONS.md` contains **contradictory** statements about whether Hard
Infrastructure is already implemented (Part 4 says no, Part 5 lists it as a to-do, Part 9's
log claims it's done as of "Phase 4b"). **Check the actual codebase**
(`domain/models/`, `domain/rules/`) before writing new Infrastructure code — this may be
a reconciliation/gap-check task rather than greenfield work. If code already exists,
compare it against the Part 10 reference tables and flag any discrepancies rather than
silently changing it (per `06-collaboration-and-uncertainty.md`).

Also unresolved: **where in the app Colony Size increase is currently triggered** — needed
to wire the `pending_infrastructure_growth = True` assignment at the right point. Ask if
not obvious from the application layer.
