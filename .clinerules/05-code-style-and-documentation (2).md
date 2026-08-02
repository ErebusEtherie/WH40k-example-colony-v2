# Code Style & Documentation

## Type hints

Full type hints everywhere — function signatures, class attributes, and
return types. Domain and application code should be fully typed; this is
what makes Pydantic validation and static analysis actually pay off.

## Docstrings

Suggested default: **Google-style docstrings** for all public
modules/classes/functions (short, readable, works well with most doc
generators). This is a suggestion pending your confirmation — flag it if
you'd rather use NumPy-style or reST, and don't mix styles within the
project once decided.

For the rule engine specifically, docstrings on any function encoding a game
rule should reference *where the rule comes from* (e.g. "per Rogue Trader
Core Rulebook, Colony rules" or "per project houserule, see
`config/rules.yaml`") so it's traceable back to source later.

## Suggested tooling (pending your confirmation)

- **ruff** — linting and formatting (fast, covers what flake8 + isort +
  black would separately).
- **mypy** — static type checking, run in CI once CI exists.
- **pre-commit** — to run the above automatically before commits.

These are recommendations based on current Python best practice, not yet
confirmed as project decisions — ask before assuming they're configured, and
don't silently add config files for tools that haven't been agreed on.

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
