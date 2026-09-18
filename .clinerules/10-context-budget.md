# Context Budget

Work in small retrieved slices, not whole-repo reads. Hold enough context
to make the current change correct, and no more.

## Default budget (soft guidance)

Treat these as a target, not a hard ceiling:

- ~2000 tokens: loaded rules
- ~3000 tokens: code inspection
- ~2000 tokens: implementation
- ~1000 tokens: verification

If a task needs more than this, it is likely too large for one pass.

## When context grows

1. **Stop and reassess** — the task is too large for a single pass.
2. **Split the task** — into independently verifiable steps, and stop
   between steps.
3. **Inspect targeted slices** — specific symbols/functions, not whole
   files.

## Inspection strategy

- Read signatures and type hints first; read bodies only for the symbol
  you are changing.
- Use symbol/reference search to locate definitions and usages instead of
  scanning files line by line.
- Check the layer's `__init__.py` docstring or `docs/AI_NAVIGATION.md`
  before diving into its modules.

## Documentation retrieval

Do not read a full doc file up front. Instead:

1. Check `docs/.manifest.yaml` for the section matching the task.
2. Read the section/file summary first.
3. Read only the section you need, not the whole document.

## Signal when over budget

If you catch yourself:

- summarizing large files to yourself,
- reading past ~5 source files for context,
- writing "let me check ..." repeatedly without converging,

→ **Stop and ask for task clarification or decomposition** (see
`09-workflow.md` — task size and stop conditions).
