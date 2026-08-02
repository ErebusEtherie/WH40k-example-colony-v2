# Project Overview & Rule Set Index

## What this project is

A Python engine for organizing and simulating a **Warhammer 40k Rogue Trader
Colony** (tabletop RPG). It replaces a manually-maintained Excel sheet that
tracks:

- Core colony stats: Size, Complacency, Order, Productivity, Piety, and a
  derived Profit Factor.
- Hard Infrastructure and Support Upgrades, each with bonuses/penalties that
  apply conditionally (working vs. faulty) and stack.
- A Representative (governor-type character) with RPG stats/skills/talents
  that further modify colony behavior.
- Threshold-based state transitions (e.g. Order reaching 0 → "Anarchy",
  Complacency exceeding Size → "Placated").
- Time-based cycles (e.g. every 90 days) that trigger growth/decay and
  events.

The core engine must be consumable from multiple front ends: a REST API, a
web frontend, and (eventually) a desktop frontend. **The engine itself must
never depend on any of these.**

## Project stage

Greenfield. No code exists yet. These rules are meant to establish the
architecture and conventions from the first commit, not retrofit them later.

## How this rule set is organized

Each file below covers one concern. Cline should treat all files as binding
simultaneously — they are not alternatives.

| File | Covers |
|---|---|
| `01-architecture.md` | Layering, dependency direction, where things live |
| `02-domain-modeling.md` | Domain models vs. API schemas vs. persistence models, rule engine design |
| `03-persistence-and-io.md` | Repository pattern, SQLite, JSON/YAML import/export, Excel migration |
| `04-testing-strategy.md` | pytest + hypothesis, what to test and how much |
| `05-code-style-and-documentation.md` | Type hints, docstrings, linting/formatting |
| `06-collaboration-and-uncertainty.md` | When Cline must stop and ask instead of assuming |

## Non-negotiable guardrails (summary)

These recur across the individual files but are worth stating once, up
front:

1. **Domain logic has zero I/O and zero framework coupling** beyond Pydantic
   for structural validation. No FastAPI, SQLAlchemy, or file-system access
   inside domain code.
2. **Game rule data is data, not code.** Numeric tables (bonuses, PF-by-size,
   upgrade costs) live in config files, not in if/elif chains.
3. **Don't abstract preemptively.** Before introducing an interface, base
   class, or shared helper, confirm: is it used in ≥2 places? Is the
   duplication actually causing harm? Would the abstraction make the code
   *less* readable? If any answer points away from abstracting, don't.
4. **When unsure, ask.** See `06-collaboration-and-uncertainty.md` — this
   applies to business rules, architectural decisions, and anything not
   explicitly covered here.
