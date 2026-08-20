---
name: security-first
description: Preventive security guardrail for general app and backend work. Use when Codex is planning or implementing sensitive changes involving authentication, authorization, secrets, untrusted input, file uploads, external integrations, configuration, infrastructure, or sensitive data handling; identify trust boundaries, choose secure defaults, surface assumptions, and define verification before coding.
_agensi: "ec27bf6a-8c9c-4ea7-a15e-bdb48f9b3d5f"
---

# Security First

Use this skill to force early security framing before coding. Keep the output practical, brief, and specific to the requested change.

## Workflow

1. Identify the trust boundaries.
   List the actors, privileges, untrusted inputs, external systems, stored secrets, and sensitive data involved in the requested change.
2. State assumptions explicitly.
   Surface any security-relevant ambiguity that would change the design. Stop and ask instead of silently picking an auth model, trust boundary, data retention rule, or secret-handling pattern.
3. Prefer the minimum secure design.
   Choose the simplest approach that satisfies the request with secure defaults. Avoid adding configurability, fallback paths, or optional insecure modes unless the user explicitly requires them.
4. Review the attack surface that matches the change.
   Check only the relevant categories:
   - authentication and session handling
   - authorization and privilege boundaries
   - secrets and runtime configuration
   - untrusted input validation, encoding, and parsing
   - file upload, storage, and retrieval paths
   - outbound calls, webhooks, and third-party integrations
   - dependency, config, and infrastructure exposure
   - logging, auditability, rollback, and recovery
5. Define verification before implementation.
   Describe the minimum tests, checks, or manual validations needed to prove the change preserves the intended security properties.
6. Verify after implementation.
   Run or recommend the focused checks that match the actual change. Prefer concrete validation over general reassurance.

## Response Rules

- Keep advice scoped to the requested implementation work, not a full security audit.
- Call out concrete risks and secure defaults before suggesting code changes.
- Mention simpler safer alternatives when the proposed design expands the attack surface unnecessarily.
- Distinguish observed facts from assumptions and inferred risks.
- For retrospective review, severity-ranked findings, or a report-driven vulnerability assessment, switch from this preventive guardrail to a dedicated security review flow instead of treating this skill as a full audit.

## Out Of Scope

- Do not turn this skill into a long OWASP reference dump.
- Do not produce exploit playbooks, bypass guidance, credential harvesting steps, or destructive instructions.
- Do not claim a system is secure based only on intent or code shape; require change-specific verification.
