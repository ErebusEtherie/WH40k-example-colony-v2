# AI Agent Behavior

## Purpose

These rules govern AI behaviour while working on the project.

Architectural rules describe how the system should be built.

This document describes how the AI should behave while building it.

---

## Existing Code First

Before creating:

- a new class
- a new service
- a new repository
- a new hook
- a new component
- a new utility
- a new helper module

search the existing codebase for similar functionality.

Prefer extending existing code over creating parallel implementations.

Do not introduce a second implementation of an existing concept unless explicitly required.

Creating a new file is not automatically preferable to modifying an existing one.

---

## Respect Existing Patterns

When multiple valid implementations exist:

prefer the pattern already used in the project.

Consistency is usually more important than theoretical perfection.

Do not replace existing patterns simply because another approach is cleaner.

---

## Minimal Scope Changes

Modify only what was requested.

Do not expand scope without approval.

Examples:

- adding a feature does not justify refactoring nearby code
- fixing a bug does not justify renaming unrelated classes
- adding a test does not justify restructuring the test suite

Keep changes focused.

---

## Report, Don't Fix

While working on a task, additional problems may be discovered.

Examples:

- duplication
- inconsistent naming
- missing tests
- architectural concerns
- technical debt

Unless explicitly requested:

- report them
- explain their impact
- do not fix them

Unrelated improvements should not be bundled into the requested work.

---

## No Opportunistic Refactoring

Do not perform refactoring solely because a better design is possible.

Refactoring requires explicit approval.

Suggestions are encouraged.

Implementation is not.

---

## No Architectural Migrations

Do not introduce:

- new architectural styles
- new frameworks
- new dependency injection systems
- new state-management approaches
- plugin architectures
- generic abstraction layers

without explicit approval.

Use the architecture already established by the project.

---

## One Concept, One Implementation

Avoid parallel implementations.

Prefer a single implementation of a concept whenever practical.

Examples:

- one domain model per concept
- one repository per responsibility
- one source of truth per state
- one query hook per operation

Duplication should be intentional, not accidental.

---

## Tool Configuration Is Authoritative

Project configuration files are the source of truth.

Examples:

- pyproject.toml
- Ruff configuration
- Mypy configuration
- pytest configuration
- TypeScript configuration

If documentation and project configuration disagree:

1. Report the inconsistency.
2. Follow the actual project configuration.
3. Do not silently change either.

---

## Dependency Approval

Do not introduce new dependencies without approval.

Before proposing a dependency:

- explain the problem
- explain why current dependencies are insufficient
- explain alternatives considered

Default preference is to avoid adding dependencies.

---

## Verify Before Claiming Success

Do not claim work is complete until validation has been performed.

Backend changes:

- Ruff passes
- Mypy passes
- relevant tests pass

Frontend changes:

- Oxlint passes
- TypeScript type checks pass
- relevant tests pass

If validation was not performed, explicitly state that it was not performed.

---

## Comments Explain Why

Comments should explain:

- why a decision was made
- business constraints
- rule sources
- non-obvious behaviour
- historical context

Comments should not explain what the code is doing.

Code should explain what.

Comments should explain why.

---

## Think Before Creating Abstractions

Before introducing:

- interfaces
- base classes
- strategy patterns
- plugin systems
- reusable helpers
- generic components
- generic hooks

verify:

1. Is it used in at least two places today?
2. Does it solve a real maintenance problem?
3. Does it improve readability?

If not, prefer the simpler solution.

## Skill Usage

Skills are encouraged when available.

Skills provide recommendations.

Project rules remain authoritative.

Skills must not override:

- architecture rules
- testing strategy
- code style
- security requirements
- dependency decisions
