# Code Style & Documentation

## Type Hints

Full type hints everywhere.

Provide type annotations for:

- function parameters
- return values
- class attributes
- public interfaces

Domain and application code should be fully typed.

Type hints are considered part of the code contract, not optional documentation.

---

## Type Safety

The project uses Mypy in strict mode.

Do not:

- introduce Any unless unavoidable
- silence type-checking errors
- disable Mypy checks locally
- use casts to bypass type checking without justification

Prefer improving type definitions over suppressing errors.

If a type issue cannot be resolved cleanly, explain the trade-off and ask before introducing a workaround.

---

## Docstrings

Google-style docstrings are required for:

- public modules
- public classes
- public functions

Keep them concise and focused.

For rule-engine code, document the source of the rule whenever possible.

Examples:

- Rogue Trader Core Rulebook
- project rule tables
- configuration files
- documented house rules

The goal is traceability, not verbosity.

---

## Tooling

Mandatory backend tooling:

- Ruff for linting
- Mypy for static type checking
- Pytest for automated testing
- Hypothesis for property-based testing
- Pydantic for validation

These tools act as automated safeguards against common implementation mistakes.

Before considering backend work complete:

1. Run Ruff.
2. Run Mypy.
3. Run relevant pytest tests.

New linting errors, type-checking errors and failing tests must be resolved before work is considered complete.

Do not suppress Ruff or Mypy warnings without explicit approval.

---

## Linting Configuration

Existing Ruff configuration is intentional.

Do not modify:

- enabled rules
- ignored rules
- Ruff configuration structure

without explicit approval.

When Ruff reports an issue:

- prefer fixing the code
- avoid weakening Ruff configuration

Configuration changes should be proposed separately from feature work.

---

## Comments

Explain why, not what.

Good reasons for comments:

- rule source
- design decisions
- business constraints
- non-obvious behaviour
- ordering requirements

Avoid comments that merely repeat what the code already states.

---

## Naming

Use domain terminology consistently.

Prefer names taken directly from the source material:

- Complacency
- Order
- Productivity
- Piety
- Profit Factor
- Hard Infrastructure
- Support Upgrade

Do not replace established domain terms with generic alternatives.

Consistency with the game terminology is more important than generic software terminology.
