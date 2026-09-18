# Context: Investigation & Audit

Applies when a task is primarily diagnostic: auditing configuration,
checking rules or docs for drift, verifying claims made in rules, or
investigating why something is the way it is. Additional rules on top of
the base rules.

## Narrow-scan discipline

1. Locate canonical config/settings paths up front and read them by
   direct path. Do not breadth-first search (`-Recurse`) when the location
   is already knowable — broad scans pull large irrelevant payloads into
   context. (Cline MCP settings, for example, have two locations: the
   active `~/.cline/data/settings/cline_mcp_settings.json` and a legacy
   empty copy under
   `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\`;
   read the active one by path first.)
2. Filter-then-read structured files: grep/`Select-String` JSON, logs,
   and config for the keys you need before dumping raw content.

## Claims as hypotheses

- "Resolved"/"verified" markers in rules and docs are claims, not facts.
  Do one cheap spot-check when you pass through.
- If you find drift between a marker and the current state, report it with
  `file:line` anchors. Do not silently believe the marker, and do not
  silently fix documented state unless that is the assigned task.

## Secrets hygiene

- When a file may hold tokens (MCP config, env files, CI settings), read
  structure and presence only — "a token exists and looks well-formed" —
  never the secret value itself.
- Do not copy secret values into reports, messages, or output.

## Ask before guessing, verify before asking

- Before raising a question, make one cheap attempt to self-answer from
  the repo: read the relevant rule file, inspect the code, follow
  existing patterns.
- Ask only when multiple reasonable interpretations still remain; when
  asking, lead with a concrete recommendation among 2-3 options rather
  than an open-ended question.

## Completion

- Final report lists drift and actionable follow-ups with `file:line`
  anchors.
- Do not fix unrelated problems found during the audit unless asked.
