# Lint Check & Fix

Scan the whole repository for problems reported by **markdownlint-cli2** (Markdown) and **pyright** (Python — the same type-checking engine Pylance uses; Pylance itself has no CLI, so pyright is the equivalent). Fix everything that can be fixed safely, then report.

## 1. Discover configs — don't invent them

- Look for an existing markdownlint config: `.markdownlint-cli2.jsonc`, `.markdownlint-cli2.yaml`, `.markdownlintrc`, or a `markdownlint-cli2` key in `package.json`.
- Look for an existing pyright config: `pyrightconfig.json` or a `[tool.pyright]` section in `pyproject.toml`.
- If neither exists, run both tools with their defaults and note in the final report that no project config was found — do not silently create one.

## 2. Run markdownlint

```bash
npx markdownlint-cli2 "**/*.md" "#node_modules" "#.venv"
```

- Capture full output (rule id + file + line for every finding).

## 3. Run pyright

```bash
npx pyright --outputjson .
```

(or `pyright` directly if installed globally / in the venv)

- Parse the JSON output into a list of diagnostics: file, line, severity (error/warning), rule/message.

## 4. Categorize before touching anything

Split findings into:

- **Markdown, auto-fixable** — rules markdownlint-cli2's `--fix` can resolve (spacing, list markers, trailing whitespace, heading style, etc.)
- **Markdown, needs manual edit** — e.g. line-length violations requiring rewording, duplicate headings.
- **Python, mechanical** — missing/incorrect type annotations, unused imports, unreachable code, simple `reportMissingImports` fixes.
- **Python, needs judgement** — anything where fixing the type error would require changing logic, adding a real `# type: ignore[code]` with justification, or restructuring a function signature.

## 5. Apply fixes

**Markdown:**

```bash
npx markdownlint-cli2 --fix "**/*.md" "#node_modules" "#.venv"
```

Then re-check remaining findings and fix manually one file at a time.

**Python** — fix in place, following project conventions already established in `.clinerules/`:

- Prefer a correct, narrow type annotation over `Any` or a suppression.
- Only use `# type: ignore[specific-code]` when the underlying types genuinely can't be expressed (e.g. an untyped third-party stub) — include a one-line comment explaining why.
- Do **not** refactor or abstract code to fix a type error unless the abstraction independently satisfies the 3-condition gate (used ≥2 places, duplication is actually harmful, readability doesn't suffer). A type fix is not itself a reason to abstract.
- Do not change business logic, locator strategy, or synchronization patterns (no `Sleep`, keep condition-based waits) as a side effect of a lint/type fix — if a "fix" would require that, flag it for manual review instead of applying it.

## 6. Verify

Re-run both tools (steps 2–3) after fixes. If new findings appear or some remain unresolved, repeat steps 4–5 for what's left. Do not loop more than 3 times — anything still failing after that goes into the report as unresolved.

## 7. Report

Summarize, grouped by tool:

- Total issues found → total auto-fixed → total needing manual attention
- List of files changed
- List of any issues intentionally left unfixed, with the reason (judgement call, missing config, would violate project conventions, etc.)
- Any new `# type: ignore` suppressions added, each with its justification
