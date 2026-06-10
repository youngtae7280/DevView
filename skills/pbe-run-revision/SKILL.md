---
name: pbe-run-revision
description: Execute a bounded Revision Pack, update evidence, run regression checks, and submit for review again.
---

# PBE Run Revision

Use this skill to execute the latest revision pack.

In Autoflow, run this skill automatically after a revision pack is created, then
return to the Review Result gate.

Revision execution stays inside affected selected/foundation scope. It must not implement deferred or out-of-scope behavior unless the user explicitly approved a scope change.

## Inputs

```text
.pbe/revisions/rev-*/revision-manifest.json
.pbe/revisions/rev-*/06-revision-task-cards/
.pbe/revisions/rev-*/07-regression-checks.md
```

## Required Actions

1. Find the latest revision pack.
2. Read `revision-manifest.json`.
3. Execute revision task cards in order.
4. Respect scope and non-scope.
5. Do not change outside affected requirements, tasks, UI/UX items, or verification items.
6. Preserve selected/foundation/deferred/out_of_scope classifications.
7. Stop if the revision requires scope expansion.
8. Run regression checks.
9. If UI changed, update UI evidence.
10. Write `revision-result.md`.
11. Set or report status as `revision_verified` or `submitted_for_review`.
12. Add `run_revision` to `pbe-state.json.autoflow.completedSteps`.
13. Set `autoflow.nextStep` to `review_result`.
14. Continue to `pbe-review-result`.

## Stop Conditions

Stop when:

- feedback mapping is ambiguous
- revision requires changes outside affected scope
- revision tries to implement deferred or out-of-scope behavior
- regression checks fail repeatedly
- user approval is needed for scope expansion

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that revision execution is returning to the Review Result gate or that a stop condition blocks review.

Include:

- revision tasks completed
- selected/foundation scope changed
- deferred/out-of-scope scope protected
- files changed
- validation results
- regression checks
- remaining risks
- next step: review result gate
- user reply examples at review gate

Use `[Codex 메모]` only for short explanation of revision risk or validation interpretation.
