# Collaboration & Handling Uncertainty

## The core rule: if unsure, ask — don't assume

This applies especially to:

1. **Game rules and numbers.** If a calculation, threshold, bonus value, or
   interaction isn't clearly present in the reference material (the colony
   sheet, its Data/Calculations tabs, or something the user has explicitly
   stated), do not invent a plausible-sounding value. Ask for the source
   rule or the intended behavior.
2. **Architectural decisions not covered by these rules.** If a new piece
   of work doesn't clearly fit the existing layering (e.g. "where does dice
   rolling for events live?", "does this need its own service or belongs in
   an existing one?"), ask rather than picking silently.
3. **Ambiguous scope.** If a request could reasonably mean two different
   things (e.g. "add upgrade support" — one upgrade type or the general
   mechanism?), ask which is intended before writing code.
4. **Conflicts with these rules.** If a request seems to conflict with
   something in this rule set (e.g. asks for logic to live somewhere these
   rules say it shouldn't), say so explicitly and ask how to proceed rather
   than silently overriding the rules or silently overriding the request.

## What "ask" looks like in practice

- Ask a specific, answerable question — not "what do you want me to do?"
  State the interpretations you're considering and let the user pick.
- It's fine to state a recommendation alongside the question (as with the
  architecture/tooling suggestions in these files) — but the recommendation
  is not permission to proceed without confirmation on anything
  non-trivial.
- Don't ask about things these rules already answer. Re-reading the
  relevant rule file first is expected before asking.

## Suggesting vs. doing

- Cline should surface suggestions for improvement (refactors, missing
  tests, a cleaner abstraction) but should not apply them unprompted.
  Propose, then wait for confirmation — this includes changes to files that
  weren't part of the original request.
- Don't modify code beyond what was explicitly asked for. If a fix
  incidentally reveals a related problem, mention it rather than fixing it
  inline.

## Keep the guardrails from `01-architecture.md` in view

Before proposing a new abstraction, interface, or pattern, apply the
two-or-more-uses / real-duplication-harm / readability test from
`01-architecture.md`. If it fails that test, say so and propose the
simpler direct version instead — don't propose the abstraction "just in
case" and wait to be told no.


---

## Game Automation vs. Tracking — Critical Distinction

**This application is a tracking/organization tool, NOT a game automation system.**

Before proposing any feature, check:

1. **Does this automate a game mechanic?**
   - Dice rolling → ❌ NO (GM rolls at table, enters result)
   - Event resolution → ❌ NO (GM decides outcomes)
   - Time-based cycles → ❌ NO (GM tracks game time)
   - Stat adjustments → ❌ NO (GM orders changes)

2. **Does this help track or organize information?**
   - Recording modifiers → ✅ YES
   - Calculating derived stats → ✅ YES
   - Audit logging → ✅ YES
   - Export/import → ✅ YES

**If a feature would automate gameplay, do not propose it.** Instead, suggest
a tracking mechanism that lets the GM record what happened at the table.

See docs/SCOPE_CLARIFICATIONS.md for detailed examples.
