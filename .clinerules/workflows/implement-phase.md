# Implement Coding Phase

Execute a controlled coding phase from planning through implementation and code review.

This workflow is intentionally decision-gated. Do not make material product, architectural, or behavioral decisions on the user's behalf when the correct choice is unclear.

## 1. Establish Context

Before changing any code:

1. Inspect the repository structure relevant to the task.
2. Inspect the existing implementation and established patterns.
3. Inspect relevant tests.
4. Inspect applicable project rules and instructions.
5. Run `git status` and record the current working-tree state.
6. If the user supplied a task or goal, treat it as the initial scope.

Do not modify files during this phase.

If the task is unclear enough that a meaningful implementation plan cannot be created, ask the user for clarification before continuing.

## 2. Create the Implementation Plan

Create a concrete implementation plan based on the current repository state.

The plan must include:

* Objective
* Relevant files/components
* Required implementation changes
* Tests that should be added or modified
* Validation/testing approach
* Important assumptions
* Decisions that require user input

Distinguish between:

* Facts established by inspecting the repository
* Reasonable implementation choices
* Decisions that require user approval

Do not start implementation yet.

## 3. Decision Gate

Review the plan for unresolved questions.

If there are questions that could materially affect:

* application behavior
* API behavior
* data model/schema
* architecture
* interfaces/contracts
* test strategy
* security
* scope
* backwards compatibility
* dependencies
* other significant implementation decisions

STOP and ask the user.

Present the questions clearly and explain the relevant alternatives when appropriate.

Do not continue implementation until the user has answered.

After receiving the user's answer:

1. Update the implementation plan.
2. Incorporate the user's decision explicitly.
3. Re-check whether the updated plan creates any additional unresolved questions.
4. If new questions arise, ask the user before continuing.

Repeat this gate until the plan contains no unresolved material decisions.

## 4. Implement the Plan

Implement the approved plan.

Rules:

* Follow the plan.
* Apply all decisions made by the user.
* Respect existing project patterns.
* Do not perform unrelated cleanup.
* Do not refactor unrelated code.
* Do not expand scope because an improvement happens to be noticed.
* Do not change validation strategy merely because of tooling limitations.
* Use the available editor/file-editing capabilities appropriately.
* Do not weaken, remove, skip, or alter tests merely to make them pass unless the approved plan explicitly requires changing the tests.
* Preserve pre-existing user changes.
* Do not overwrite unrelated modifications.

If implementation reveals a new material decision that is not covered by the plan:

STOP.

Explain the newly discovered issue, ask the user what should be done, and wait for the answer.

After the answer:

1. Update the plan.
2. Continue implementation using the updated plan.

## 5. Validate the Implementation

After implementation:

1. Inspect the resulting changes.
2. Run the relevant tests.
3. Run additional validation appropriate to the changed code when required by the project.
4. Investigate test failures rather than assuming they are caused by the implementation.
5. Do not modify unrelated code simply to obtain a passing test result.

If validation reveals a material design or implementation decision not covered by the plan:

STOP and ask the user.

## 6. Establish the Review Scope

Before invoking the code reviewer, determine which changes were introduced by this workflow.

The repository may already contain uncommitted changes.

Do not assume that the entire current `git diff` belongs to this task.

Compare the repository state established in Step 1 with the current state and identify the files and changes attributable to this workflow.

The review scope must exclude:

* pre-existing user changes
* unrelated modifications
* unrelated formatting changes
* unrelated work from other tasks

If the review scope cannot be determined reliably, STOP and ask the user before proceeding.

## 7. Code Review

Invoke the `code-reviewer` skill.

Tell the reviewer explicitly:

* Review the changes introduced by this workflow.
* Do not review unrelated pre-existing changes.
* Focus on the resulting implementation.
* Use the reviewer's established severity categories.
* Return actionable findings with file and line context.

Use the reviewer's normal output format.

Do not modify code while the review is being performed.

## 8. Process Review Findings

Evaluate the code-reviewer's findings.

### Critical findings

Critical findings must be fixed.

### Suggestions

Suggestions should be fixed.

However, if implementing a suggestion requires a material decision that is not already established by the implementation plan or existing project conventions:

STOP and ask the user.

After receiving the answer:

1. Update the plan if necessary.
2. Implement the approved resolution.

### Nitpicks

Do not implement Nitpicks automatically.

Ignore Nitpicks unless:

* they reveal a real defect that was incorrectly classified, or
* the user explicitly asks for them to be addressed.

### Positive feedback

Do not take action on the reviewer's "What looks good" section.

## 9. Fix Review Findings

Fix all applicable Critical findings and Suggestions.

Rules:

* Fix the reported problem, not unrelated problems.
* Keep changes within the established scope.
* Do not perform opportunistic refactoring.
* Do not introduce new behavior unless required to resolve the finding.
* Preserve the user's pre-existing changes.
* If a finding is ambiguous, STOP and ask the user rather than guessing.

After fixes:

1. Inspect the resulting diff.
2. Run relevant tests.
3. Confirm that the fixes address the reported findings.

## 10. Re-Review

Invoke the `code-reviewer` skill again.

The second review must cover the resulting changes from this workflow, including the fixes.

Explicitly instruct the reviewer to:

* verify that the previous findings have been resolved;
* identify regressions introduced by the fixes;
* review the resulting implementation for new Critical findings or Suggestions;
* ignore unrelated pre-existing changes.

Do not finish the workflow while applicable Critical findings or Suggestions remain.

## 11. Review/Fix Loop

Repeat:

```text
Code Review
    ↓
Evaluate findings
    ↓
Critical/Suggestions?
    ├── No → Continue
    └── Yes
         ↓
       Fix
         ↓
       Test
         ↓
       Code Review
```

For every iteration:

* Critical findings must be fixed.
* Suggestions should be fixed.
* Nitpicks are ignored unless explicitly requested.
* New material decisions require user approval before continuing.

Continue until the reviewer reports no applicable Critical findings and no applicable Suggestions.

## 12. Final Verification

Before declaring the workflow complete:

1. Run the relevant test suite.
2. Inspect the final diff.
3. Confirm that the implementation remains within the approved scope.
4. Confirm that user decisions made during the workflow are reflected in the implementation.
5. Confirm that no unrelated pre-existing changes were modified.
6. Confirm that the final code-review pass contains no applicable Critical findings or Suggestions.

Then provide a concise final summary containing:

* What was implemented
* Tests/validation performed
* Any user decisions that materially affected the implementation
* Final code-review status

Do not make additional changes after the final verification unless the user explicitly requests them.

## Hard Rules

The following rules apply throughout the entire workflow:

1. Never silently make a material product, architectural, or behavioral decision when the correct choice is unclear.
2. Ask the user before continuing when such a decision is required.
3. Always update the plan after receiving a user decision.
4. Never discard or overwrite pre-existing user changes.
5. Never expand the scope without user approval.
6. Never use code review as justification for unrelated cleanup or refactoring.
7. Never weaken validation or tests merely to make the implementation pass.
8. Do not automatically implement Nitpicks.
9. Do not finish while applicable Critical findings or Suggestions remain.
10. Re-review after fixing review findings.
11. If a new material question appears at any stage, stop and ask the user.

## Completion Criteria

The workflow is complete only when all of the following are true:

* The implementation plan was established.
* All material user decisions were explicitly resolved.
* The approved plan was implemented.
* Relevant validation was performed.
* The resulting changes were reviewed by `code-reviewer`.
* Applicable Critical findings were fixed.
* Applicable Suggestions were fixed.
* Fixes were re-reviewed.
* No applicable Critical findings remain.
* No applicable Suggestions remain.
* The final implementation is within the approved scope.
*
