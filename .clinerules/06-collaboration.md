# Collaboration & Uncertainty

## Core Rule

If uncertain about a requirement, ask. Do not invent behavior, business
rules, or technical requirements.

## When To Ask

Ask when uncertainty affects:

- Game rules, numeric values, thresholds
- Modifier behavior, authorization rules
- Architectural decisions, API behavior, ambiguous scope

Provide identified ambiguity, possible interpretations, and preferred
recommendation. Do not continue with a guess.

## Before Asking

1. Read relevant rule files
2. Inspect existing codebase
3. Follow existing patterns

Ask only when multiple reasonable interpretations still exist.

## Conflicts

If user request, existing code, and project rules conflict:

1. Stop
2. Explain what conflicts and why
3. Present available options
4. Ask how to proceed

Do not silently choose one side.

## Scope Expansion

Identifying a possible improvement does not authorize implementing it.
Report findings, explain impact, leave unchanged unless requested.

## Game Automation vs Tracking

This is a tracking tool, not gameplay automation. Do not implement:

- Automatic dice rolling
- Automatic event resolution
- Automatic gameplay decisions
- Automatic game progression

Allowed: recording results, storing modifiers, calculating derived values,
tracking historical changes, audit logging, import/export.
