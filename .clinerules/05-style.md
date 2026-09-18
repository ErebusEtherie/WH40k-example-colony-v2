# Code Style Constraints

## Type Hints

Full type hints everywhere: parameters, returns, attributes, public
interfaces. Type hints are part of the code contract.

## Type Safety

Mypy in strict mode. Do not introduce `Any`, silence errors, disable
checks locally, or use casts without justification. Prefer improving
types over suppressing errors.

## Docstrings

Google-style docstrings for public modules, classes, functions. Keep
concise. For rule-engine code, document rule sources (rulebook, tables).

## Tooling

Before considering backend work complete:

1. Run Ruff
2. Run Mypy
3. Run relevant pytest tests

Before considering frontend work complete:

1. Run Oxlint
2. Run TypeScript checks
3. Run relevant tests

Do not suppress tool warnings without explicit approval.

## Configuration

Existing tool configuration is intentional. Do not modify without approval.

## Comments

Explain why, not what. Good reasons: rule source, design decisions,
business constraints, non-obvious behavior, ordering requirements.

## Naming

Use domain terminology from source material: Complacency, Order,
Productivity, Piety, Profit Factor, Hard Infrastructure, Support Upgrade.
