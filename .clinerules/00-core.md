# Core Development Rules

## Scope

Work only on the requested task. Do not refactor unrelated code, add
unrequested features, or change architecture without explicit approval.

## Inspect Before Editing

Before modifying code:

- Inspect existing implementation using available tools
- Follow established project patterns
- Do not invent new patterns when existing ones apply

## Tool Constraints

Use only explicitly available tools. Do not invent tool names from other
environments. If uncertain about tool availability, ask.

## Task Size

Prefer tasks that can be completed with:

- 1–5 source files changed
- One logical responsibility
- One coherent, testable change

If a task appears substantially larger, stop and present a breakdown before
implementing.

## Planning

For tasks with multiple logical responsibilities:

1. Inspect the repository
2. Identify affected components and dependencies
3. Split work into small, independently verifiable steps
4. Present the plan before implementation

Do not implement the entire plan in a single large change.

## Execution

Implement one logical step at a time. After each step:

- Verify the implementation
- Run relevant tests/checks
- Keep changes limited to the current step

## Scope Expansion

If implementation requires changes outside planned scope, stop and explain
why they are required before expanding.

## Ambiguity

Do not guess about:

- Domain behavior or game rules
- API contracts
- Database structure
- Architectural decisions

Ask for clarification when the decision materially affects the system.

## Stop Conditions

Stop and ask when:

- Requirements are ambiguous
- Requested behavior conflicts with existing rules
- Required change falls outside task scope
- Implementation requires architectural decision
- Task is substantially larger than expected
- Tests reveal unrelated existing problems

## Domain Logic Guardrails

- Domain logic has zero I/O and zero framework coupling
- Game rule data lives in config files, not code
- Don't abstract preemptively: confirm ≥2 uses, real harm, improved readability

## Completion

A task is complete when:

- Requested behavior is implemented
- Relevant tests/checks pass
- Changes remain within scope
- No unrelated refactoring was introduced

## Context Contract

How context loading and reporting work for AI agents working in this repo.

**On task start:**

1. `.clinerules/` rules are loaded (roughly 2000 tokens).
2. `docs/` content and source code are NOT loaded yet.
3. Source/docs are inspected on demand for the specific task — read
   targeted sections, not whole directories (`10-context-budget.md`).

**On completion:**

1. Summarize what changed and why.
2. List the specific files modified.
3. Note any docs that should be updated but were out of scope.

**When more context is needed:**

1. Ask for a specific doc or section, not "summarize the project" — use
   `docs/.manifest.yaml` and `10-context-budget.md`.
2. Read targeted code sections rather than whole modules.
