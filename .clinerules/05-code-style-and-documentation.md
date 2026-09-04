# Code Style & Documentation

## Type hints

Full type hints everywhere — function signatures, class attributes, and
return types. Domain and application code should be fully typed; this is
what makes Pydantic validation and static analysis actually pay off.

## Docstrings

**Confirmed: Google-style docstrings** for all public modules/classes/
functions (short, readable, works well with most doc generators). Don't
mix styles within the project.

For the rule engine specifically, docstrings on any function encoding a game
rule should reference *where the rule comes from* (e.g. "per Rogue Trader
Core Rulebook, Colony rules" or "per project houserule, see
`config/rule_tables.yaml`") so it's traceable back to source later.

## Tooling — decided: not adopting ruff/mypy/pre-commit for now

Considered and declined for the current stage: ruff (lint/format), mypy
(static type checking), pre-commit (automation). Do not add config files
for any of these (`.ruff.toml`, `mypy.ini`, `.pre-commit-config.yaml`, or
equivalents) — this is a confirmed decision, not an open item.

This does not relax the "full type hints everywhere" rule above — type
hints are still mandatory throughout domain and application code, they're
just not mechanically enforced by mypy yet. If gaps in type-hint discipline
become a real problem without that enforcement, that's a reason to revisit
this decision explicitly later, not a reason to quietly add mypy back in
the meantime.

## Comments

Explain *why*, not *what*. The code should make the "what" obvious through
naming and structure; comments earn their place by explaining a rule's
source, a non-obvious ordering requirement (e.g. "modifiers must apply in
this order because X"), or a deliberate simplification.

## Naming

Match domain vocabulary as it appears in the source material (Complacency,
Order, Productivity, Piety, Profit Factor, Hard Infrastructure, Support
Upgrade) rather than inventing generic synonyms — this keeps the code
readable against the actual game rules it implements.
