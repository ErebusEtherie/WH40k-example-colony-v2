# Collaboration & Handling Uncertainty

## Core Rule

If uncertain about a requirement, ask.

Do not invent behaviour, business rules or technical requirements.

---

## When To Ask

Ask when uncertainty affects:

- game rules
- numeric values
- thresholds
- modifier behaviour
- authorization rules
- architectural decisions
- API behaviour
- ambiguous scope

If multiple reasonable interpretations exist, ask the user to choose.

---

## What "Ask" Means

Ask a specific question.

Good:

> Should assigning a Representative automatically unassign them from another colony?

Bad:

> What should I do?

Provide:

- identified ambiguity
- possible interpretations
- preferred recommendation if relevant

Do not continue with a guess after identifying ambiguity.

---

## Use Reasonable Judgment

Before asking:

1. Read relevant rule files.
2. Inspect the existing codebase.
3. Follow existing project patterns.

Ask only when multiple reasonable interpretations still exist.

Do not ask about information that is:

- already defined in the rule files
- already present in the codebase
- directly implied by existing project conventions

First investigate.

Ask only when uncertainty remains.

---

## Conflicts

If:

- a user request
- existing code
- project rules

appear to conflict, stop and explain the conflict.

Do not silently choose one side.

Explain:

- what conflicts
- why it conflicts
- available options

Then ask how to proceed.

---

## Architectural Decisions

If a piece of work does not clearly fit the existing architecture:

- identify the uncertainty
- explain the options
- ask before introducing new patterns

Do not solve uncertainty by introducing new abstractions.

---

## Game Automation vs Tracking

This application is a tracking and organization tool.

It is not a gameplay automation system.

Do not propose features that automate gameplay.

Examples:

Not allowed:

- automatic dice rolling
- automatic event resolution
- automatic gameplay decisions
- automatic game progression

Allowed:

- recording results
- storing modifiers
- calculating derived values
- tracking historical changes
- audit logging
- import/export functionality

When in doubt:

prefer tracking over automation.

---

## Scope Expansion

Identifying a possible improvement does not authorize implementing it.

Suggestions are welcome.

Implementation requires explicit approval.

If additional improvements are found:

- describe them
- explain their impact
- leave them unchanged unless requested
