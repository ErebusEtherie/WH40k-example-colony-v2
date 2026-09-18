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

Modify only what was explicitly requested.

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

This rule also applies to findings from:

- review-team
- security-first
- codex-grade-coding

Issues identified by review skills are not automatically authorized for implementation.

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

## Skill Usage

Project-provided skills should be used when applicable.

Skills provide specialized expertise.

Project rules remain authoritative.

Skills must not override:

- architecture rules
- domain modelling rules
- testing strategy
- code style
- security requirements
- dependency decisions
- AI behaviour rules

If a skill recommendation conflicts with project rules:

1. Follow project rules.
2. Report the conflict.

---

## Required Skills

### codex-grade-coding

Use for:

- implementation of new features
- non-trivial code changes
- code quality review
- maintainability review

Run before considering implementation complete.

Purpose:

- improve implementation quality
- identify maintainability concerns
- identify design issues
- identify unnecessary complexity

---

### review-team

Use for:

- medium-sized changes
- large changes
- architectural modifications
- public API changes
- changes affecting multiple modules

Run after implementation and before considering work complete.

Purpose:

- peer review simulation
- identify risks
- identify edge cases
- identify overlooked design concerns

Review findings are recommendations.

They do not automatically authorize additional code changes.

---

### security-first

Use whenever changes affect:

- authentication
- authorization
- JWT handling
- cookies
- CSRF
- permissions
- roles
- ownership transfer
- audit logging
- user management
- session management
- security-sensitive API endpoints

Run before considering work complete.

Purpose:

- identify security risks
- identify authorization gaps
- identify privilege escalation risks
- identify session management issues

Security findings directly related to the implemented change should be addressed before considering work complete.

---
## Change Classification

Before starting work, classify the change.

### Small Bugfix

Examples:

- typo fixes
- documentation fixes
- import corrections
- missing type annotations
- failing test fixes that do not change behaviour
- linting fixes
- straightforward bug fixes isolated to a single module

Characteristics:

- limited scope
- no architectural impact
- no API contract changes
- no schema changes
- no security impact

Required:

1. Inspect existing code.
2. Implement the change.
3. Run validation tools.
4. Report results.

Optional:

- codex-grade-coding
- review-team

Not required:

- security-first (unless security-related)

---

### Standard Change

Examples:

- new features
- behaviour changes
- API modifications
- database model changes
- non-trivial refactoring approved by the user

Required:

1. Inspect existing code.
2. Use codex-grade-coding.
3. Implement the change.
4. Run validation tools.
5. Run review-team.
6. Report results.

---

### Security Sensitive Change

Examples:

- authentication
- authorization
- JWT handling
- cookies
- CSRF
- session management
- audit logging
- permissions
- ownership transfer

Required:

1. Inspect existing code.
2. Use codex-grade-coding.
3. Implement the change.
4. Run validation tools.
5. Run review-team.
6. Run security-first.
7. Report results.

---

## Development Workflow

Determine the change classification first.

Follow the workflow associated with that classification.

In all cases:

1. Read relevant rule files.
2. Inspect existing code.
3. Search for an existing implementation.
4. Apply the appropriate workflow.
5. Run required validation.
6. Report results.

Skills complement validation.

Skills do not replace validation.

When uncertain whether a change is a Small Bugfix or a Standard Change:

treat it as a Standard Change.

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

## Definition of Done

Backend task:

- requested change implemented
- Ruff passes
- Mypy passes
- relevant tests pass
- no unrelated changes introduced

Frontend task:

- requested change implemented
- Oxlint passes
- TypeScript checks pass
- relevant tests pass
- no unrelated changes introduced

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
