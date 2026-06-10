---
name: pbe-run-acep
description: Execute an ACEP contract by following task cards, evidence rules, traceability, UI/UX checks, and final coverage gates.
---

# PBE Run ACEP

Use this skill to execute an existing Autonomous Codex Execution Pack.

ACEP execution is contract execution, not only task execution. Codex must keep requirement, task, verification, UI/UX, evidence, and coverage links intact.

ACEP Runner is deterministic in Autoflow. Run it automatically after ACEP
generation succeeds, then stop at the Review Result gate.

Run ACEP only for selected scope and required foundation scope. Deferred and out-of-scope items are protected scope and must not be implemented unless the user changes the implementation scope through a gate.

## Inputs

```text
.pbe/codex-execution-pack/00-readme.md
.pbe/codex-execution-pack/execution-manifest.json
.pbe/codex-execution-pack/04-traceability-matrix.md
.pbe/codex-execution-pack/04-traceability-matrix.json
.pbe/codex-execution-pack/05-ui-ux-spec.md
.pbe/codex-execution-pack/05-ui-ux-spec.json
.pbe/codex-execution-pack/10-codex-operating-loop.md
.pbe/codex-execution-pack/11-task-cards/
.pbe/codex-execution-pack/15-ui-ux-evidence-checklist.md
.pbe/codex-execution-pack/16-final-coverage-check.md
.pbe/codex-execution-pack/18-execution-strategy.md
.pbe/codex-execution-pack/19-source-of-truth-matrix.md
.pbe/codex-execution-pack/20-foundation-contract.md
.pbe/codex-execution-pack/21-parallel-safety-contract.md
```

## Required Actions

1. Read `00-readme.md`.
2. Read `execution-manifest.json`.
3. Read `04-traceability-matrix.json`.
4. Read `05-ui-ux-spec.json`.
5. Read `18-execution-strategy.md` when present.
6. Confirm task order, phases, parallel groups, and integration tasks from the manifest.
7. Follow `10-codex-operating-loop.md`.
8. Execute phases in manifest order.
9. Execute sequential phases task by task in order.
10. Execute parallel phases by `parallelGroups`.
11. If actual parallel execution is not available, execute tasks inside each parallel group sequentially while preserving the declared dependencies and integration step.
12. Do not execute a group's integration task until all group tasks are complete.
13. Do not move to the next phase until the integration task passes required validation or records a stop condition.
14. Execute selected and foundation tasks only.
15. Treat deferred and out-of-scope task requests as stop conditions unless scope was approved.
16. Respect scope, non-scope, and Execution Strategy in every task card.
17. Track evidence after every task.
18. Run focused validation after each task when feasible.
19. If UI changed, update or complete UI/UX evidence checklist notes.
20. Fix failures and revalidate.
21. Run broader validation at phase or pack completion.
22. Complete `16-final-coverage-check.md`.
23. Check `13-completion-criteria.md`.
24. Write the final report using `17-final-report-template.md` only when technical completion criteria are satisfied.
25. Do not mark the result `accepted`.
26. End as `submitted_for_review` and run or recommend `pbe-review-result`.
27. Update `pbe-state.json.autoflow.state` to `ACEP_RUN_DONE`.
28. Add `run_acep` to `autoflow.completedSteps`.
29. Set `autoflow.nextStep` to `review_result`.
30. Continue automatically to Result Review gate.

## Per-Task Loop

For each task:

1. Read the task card.
2. Inspect its `## Execution Strategy` section.
3. Inspect linked requirement IDs.
4. Inspect linked verification IDs.
5. Inspect linked UI/UX IDs if any.
6. Inspect approved UI/UX direction and non-scope for UI tasks.
7. Confirm the task is being run in the correct phase and mode.
8. Confirm the task is selected or foundation scope.
9. If the task is foundation scope, ensure it does not implement deferred feature behavior.
10. If the task is in a parallel group, verify it does not require forbidden changes before starting.
11. Implement the smallest coherent change.
12. Add or update tests.
13. Run focused validation.
14. Capture evidence:
   - changed files
   - test files
   - command output
   - validation summary
   - UI manual verification note if UI changed
   - screenshot path if available
13. Update traceability or coverage notes.
14. Move to the next task only when task acceptance criteria and evidence requirements are satisfied.

## Phase And Parallel Group Rules

When `execution-manifest.json` contains `phases`, follow them:

1. Foundation phase is sequential.
2. Independent feature phase may contain parallel groups.
3. Each parallel group must finish all group tasks before its integration task.
4. Integration phase is sequential.
5. Final validation and review phases are sequential.

For a parallel phase:

1. Read each `parallelGroups[]` entry.
2. Confirm every `requiredCompletedBeforeStart` task is complete.
3. Confirm tasks do not overlap expected files or require forbidden shared changes.
4. Execute group tasks in parallel only if the Codex environment supports it.
5. Otherwise execute them sequentially as parallel-capable tasks.
6. Run the `integrationTask`.
7. Stop if the integration task cannot resolve conflicts safely.

## No-Question Rule

Do not ask the user during ACEP execution unless a stop condition is reached.

## Stop Conditions

Stop when work requires:

- credentials or secrets
- deployment or billing changes
- destructive migration
- out-of-scope behavior
- deferred-scope implementation
- foundation work expanding into deferred feature behavior
- a decision that changes product intent
- a repeated validation failure after three attempts
- unavailable dependency or environment that blocks meaningful progress
- unresolved traceability gap that blocks completion
- missing UI/UX evidence for a required UI screen or state
- implementation would conflict with confirmed UI/UX direction
- a parallel group task requires shared schema, shared type, build config, auth, permission, migration, package configuration, deployment, billing, secret handling, or another forbidden change
- two tasks in the same parallel group need to modify the same file
- a parallel group has no integration task
- an integration task cannot safely resolve conflicts or shared contract issues

## Final Coverage Gate

Before final completion:

1. Read the traceability matrix.
2. Read the UI/UX evidence checklist.
3. Complete the final coverage check.
4. Verify there are no requirements without tasks.
5. Verify there are no tasks without verification or explicit explanation.
6. Verify there are no verification items without evidence or not-runnable explanation.
7. Verify no required UI state is missing without explanation.
8. Verify no unresolved stop condition remains.

If coverage issues remain, continue working or record a stop condition. Do not write the final report first.

## Autoflow Failure

If ACEP execution cannot continue:

- Set `autoflow.state` to `BLOCKED`.
- Record `autoflow.lastFailure.failedStep` as `run_acep`.
- Record downstream steps that would be retried after repair.
- Do not continue to Result Review.
- Show the Autoflow failure guidance.

## Delivery Status

Codex may set or report:

```text
implemented
verified
submitted_for_review
```

Codex must not set:

```text
accepted
```

Only the user can accept the result. If the user is dissatisfied, continue with `pbe-collect-feedback`, `pbe-create-revision-pack`, and `pbe-run-revision`.

## Completion Report

When complete, report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that ACEP execution ended as `submitted_for_review` and PBE is stopping at the Review Result gate. Include user reply examples for approval, revision, question, and stop.

Include:

- tasks completed
- selected/foundation tasks completed
- deferred/out-of-scope items protected
- files changed
- validations run
- skipped validations and reasons
- traceability matrix result
- UI/UX evidence result
- final coverage check result
- execution strategy result
- parallel group and integration task result
- delivery status: `submitted_for_review`
- unresolved risks
- final report path
- current gate: review_result
- recommended reply for the user

Use `[Codex 메모]` only for short explanation of remaining risk or validation interpretation.
