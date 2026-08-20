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


## Cline execution environment — hard constraints

These rules describe the actual development environment and take precedence over assumptions about other coding agents, IDEs, shells, or MCP environments.

### Available Cline tools

Cline may use **only tools explicitly available in the current session**.

The expected tools are:

- `skills` — invoke available skills
- `read_files` — read known files
- `search_codebase` — search/discover files and code in the workspace
- `fetch_web_content` — retrieve web content
- `editor` — create or modify files
- `ask_question` — ask the user for clarification
- `run_commands` — execute shell commands

**Never invent, infer, simulate, or substitute tool names from other AI coding agents, MCP servers, IDEs, SDKs, or previous environments.**

In particular, `list_directory` is NOT an available tool. Do not attempt to call it.

When an operation requires functionality that does not correspond to an available tool, choose the closest available tool or ask the user rather than inventing a tool call.

### Workspace and shell environment

The development environment is **Windows**.

When using `run_commands`, assume commands must be compatible with the Windows environment unless the current session explicitly establishes that another shell is being used.

Do not assume Unix/Linux/macOS utilities are available. In particular, do not blindly use commands such as:

- `wc`
- `grep`
- `sed`
- `awk`
- `cat`
- `head`
- `tail`
- `find`
- `xargs`
- `chmod`
- `rm`
- `cp`
- `mv`

Prefer PowerShell commands for filesystem and text-processing operations when appropriate. Examples:

| Intent | Preferred Windows/PowerShell approach |
|---|---|
| Count lines | `(Get-Content -LiteralPath 'file').Count` |
| Search text | `Select-String` |
| Read text | `Get-Content` |
| First N lines | `Get-Content | Select-Object -First N` |
| Last N lines | `Get-Content | Select-Object -Last N` |
| Find files/directories | `Get-ChildItem -Recurse` |
| Remove | `Remove-Item` |
| Copy | `Copy-Item` |
| Move | `Move-Item` |

Do not assume that a command is available merely because it is common in Linux development environments.

### Workspace inspection workflow

Before modifying code:

1. Use `search_codebase` to locate relevant files and understand existing code.
2. Use `read_files` when the relevant file path is known and its contents are required.
3. Use `run_commands` only for operations that genuinely require command-line execution.
4. Use `editor` for file modifications.

Do not use shell commands as a substitute for tools that already provide the required functionality.

### Command failure handling

If a command fails because a tool, executable, shell feature, or command is unavailable:

1. Do not immediately retry the same command.
2. Determine whether the failure is caused by the operating system, shell, missing executable, or incorrect tool assumption.
3. Choose a compatible alternative.
4. If no compatible alternative is clear, ask the user.

Do not repeatedly attempt unavailable tools or commands.

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
