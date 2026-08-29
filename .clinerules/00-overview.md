# Project Overview & Rule Set Index

## What this project is

A Python engine for organizing and tracking a **Warhammer 40k Rogue Trader
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
- GM-created modifiers (including manual dice roll results and event effects
  entered by the GM during play).

**Important: This is a tracking/organization tool, not a game automation system.**
All game mechanics (dice rolls, event resolution, cycle advancement) happen at
the table during the actual gameplay session. The GM manually enters results
and modifiers into the system — the application does not automate gameplay.

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
| --- | --- |
| `01-architecture.md` | Layering, dependency direction, where things live |
| `02-domain-modeling.md` | Domain models vs. API schemas vs. persistence models, rule engine design |
| `03-persistence-and-io.md` | Repository pattern, SQLite, JSON/YAML import/export |
| `04-testing-strategy.md` | pytest + hypothesis, what to test and how much |
| `05-code-style-and-documentation.md` | Type hints, docstrings, linting/formatting |
| `06-collaboration-and-uncertainty.md` | When Cline must stop and ask instead of assuming |
| `07-frontend-architecture.md` | React/TS/Vite layering, TanStack Query state split, Tailwind + Mechanicum styling, oxlint |
| `08-frontend-testing.md` | Vitest + RTL + MSW, frontend-specific risk prioritization |

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

The development environment **must be detected at session start**, not assumed. The agent should determine the OS and shell type before executing platform-specific commands.

**Detection strategy:**

1. **Check the environment** at the start of any session that requires shell commands:
   - Run `python -c "import platform; print(platform.system())"` to detect OS (Windows, Linux, Darwin)
   - Observe the shell prompt and command behavior to identify shell type (PowerShell, bash, zsh, etc.)

2. **Default to cross-platform Python commands** when possible:
   - Prefer `python -m module` over shell-specific invocations
   - Use Python for file operations when shell commands would diverge significantly
   - Use `pathlib` in Python code instead of shell path operations

3. **When shell commands are necessary**, use the appropriate syntax for the detected environment:

   | Intent | PowerShell (Windows) | bash/zsh (Linux/macOS) |
   | --- | --- | --- |
   | Count lines | `(Get-Content 'file').Count` | `wc -l < file` |
   | Search text | `Select-String -Pattern 'x' file` | `grep 'x' file` |
   | Read text | `Get-Content 'file'` | `cat file` |
   | First N lines | `Get-Content 'file' \| Select-Object -First N` | `head -n N file` |
   | Last N lines | `Get-Content 'file' \| Select-Object -Last N` | `tail -n N file` |
   | Find files | `Get-ChildItem -Recurse -Filter '*.py'` | `find . -name '*.py'` |
   | Remove | `Remove-Item 'path'` | `rm 'path'` |
   | Copy | `Copy-Item 'src' 'dst'` | `cp 'src' 'dst'` |
   | Move | `Move-Item 'src' 'dst'` | `mv 'src' 'dst'` |
   | Path separator | `\` (backslash) | `/` (forward slash) |

4. **Path handling:**
   - In Python code, always use `pathlib.Path` which handles cross-platform paths automatically
   - In shell commands, use the appropriate path separator for the detected OS
   - When in doubt, use forward slashes — PowerShell 7+ accepts them

5. **Do not assume** that any Unix/Linux/macOS utilities are available on Windows, or that PowerShell cmdlets are available on Linux/macOS.

**Current session detection:**

- If uncertain about the environment, run a quick detection command before proceeding with platform-specific operations.
- If a command fails with "command not found" or similar, re-evaluate the shell/OS assumptions.

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
