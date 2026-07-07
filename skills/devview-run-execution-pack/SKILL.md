---
name: devview-run-execution-pack
description: Execute the selected DevView Cycle Contract and Node Execution Contracts, enforce tree scope, run selected tests, attach evidence, and create Change Nodes for discoveries outside the contract.
---

# DevView Run execution-pack

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill to execute an existing Autonomous Codex Execution Pack.

execution-pack execution is contract execution, not only task execution. Codex must keep Product, Project, Work, Test, requirement, task, verification, UI/UX, evidence, and coverage links intact.

Graph-first boundary: `.devview/codex-execution-pack/*`, execution-pack manifests, task cards, Cycle Contracts, and Node Execution Contracts are compatibility/execution views for bounded work. They are not Graph-source authority, do not retire tree-native artifacts, and do not replace read-model projection evidence or explicit user acceptance.

In DevView v2, execution-pack Runner executes only the selected Cycle Contract and its Node Execution Contracts. It must not execute excluded, deferred, blocked, or out-of-scope nodes unless the user changes scope through an approved gate.

execution-pack Runner is deterministic in Autoflow. Run it automatically after execution-pack generation succeeds, then stop at the Review Result gate.

Run execution-pack only for selected scope and required foundation scope. Deferred and out-of-scope items are protected scope and must not be implemented unless the user changes the implementation scope through a gate.

Before starting implementation, run:

```bash
devview execution start
```

After implementation and verification, run:

```bash
devview files check
devview execution complete
devview evidence check
devview review submit
```

Do not mark any scope as accepted. Acceptance requires explicit user approval and must pass `devview accept`.

## execution-pack Human Gate Preflight

Before execution, check whether the selected cycle contains unconfirmed assumptions:

- Product intent clear?
- expectedFiles clear and within profile cap?
- Product AC testable?
- Product -> Work mapping free of unconfirmed implementation alternatives?
- Work -> Test mapping has concrete verification method?
- Test -> Evidence mapping has appropriate evidence type for the AC?
- hard triggers absent?
- user acceptance still reserved for after review?

If `clarityScore` is low or hard triggers exist, do not execute yet. Ask the smallest Human Gate question that resolves
the blocker.

## Inputs

Prefer v2 cycle-native inputs:

```text
.devview/execution/cycle-tree.json
.devview/execution/cycle-contract.md
.devview/evidence/evidence-tree.json
.devview/control/change-tree.json
.devview/control/impact-tree.json
.devview/control/legacy-control-inventory.json
.devview/control/surface-completion-ledger.json
.devview/control/hardware-readiness-ledger.json
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
.devview/control/visual-verification-profile.json
.devview/control/verification-miss-log.json
.devview/blueprint/visual-reference.json
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
.devview/codex-execution-pack/22-cycle-contract.md
.devview/codex-execution-pack/11-node-execution-contracts/
```

Also read execution-pack compatibility inputs:

```text
.devview/codex-execution-pack/00-readme.md
.devview/codex-execution-pack/execution-manifest.json
.devview/codex-execution-pack/04-traceability-matrix.md
.devview/codex-execution-pack/04-traceability-matrix.json
.devview/codex-execution-pack/05-ui-ux-spec.md
.devview/codex-execution-pack/05-ui-ux-spec.json
.devview/codex-execution-pack/10-codex-operating-loop.md
.devview/codex-execution-pack/11-task-cards/
.devview/codex-execution-pack/15-ui-ux-evidence-checklist.md
.devview/codex-execution-pack/16-final-coverage-check.md
.devview/codex-execution-pack/18-execution-strategy.md
.devview/codex-execution-pack/19-source-of-truth-matrix.md
.devview/codex-execution-pack/20-foundation-contract.md
.devview/codex-execution-pack/21-parallel-safety-contract.md
```

## Required Actions

1. Read `.devview/execution/cycle-tree.json` and `.devview/execution/cycle-contract.md` when present.
2. Read `.devview/codex-execution-pack/22-cycle-contract.md` when present.
3. Read `00-readme.md`.
4. Read `execution-manifest.json`.
5. Read `04-traceability-matrix.json`.
6. Read `05-ui-ux-spec.json`.
7. Read `18-execution-strategy.md` when present.
8. Confirm active cycle ID, included nodes, excluded nodes, task order, phases, parallel groups, and integration tasks from the manifest.
9. Follow `10-codex-operating-loop.md`.
10. Execute phases in manifest order.
11. Execute sequential phases task by task in order.
12. Execute parallel phases by `parallelGroups`.
13. If actual parallel execution is not available, execute tasks inside each parallel group sequentially while preserving the declared dependencies and integration step.
14. Do not execute a group's integration task until all group tasks are complete.
15. Do not move to the next phase until the integration task passes required validation or records a stop condition.
16. Execute selected and foundation tasks only.
17. Execute only included Work nodes and included Test nodes unless a broader regression check is explicitly included in the Cycle Contract.
18. Treat deferred, excluded, blocked, and out-of-scope task requests as stop conditions unless scope was approved.
19. Respect scope, non-scope, Cycle Contract, Node Execution Contract, and Execution Strategy in every task.
20. Track evidence after every task.
21. Attach or update evidence in `.devview/evidence/evidence-tree.json` when evidence can be represented.
22. Run focused validation after each task when feasible.
23. If UI changed, update or complete UI/UX evidence checklist notes.
    23a. If visual UI changed, follow Visual Design Contract references from the task card or Node Execution Contract, update screenshot/manual visual evidence, and run Visual Implementation Audit before review.
24. Fix failures and revalidate.
25. Run broader validation at phase or pack completion.
26. When parity/completeness profile artifacts exist, update surface completion, visual/runtime verification, hardware readiness, and verification miss evidence before final coverage.
27. Record any uninspected dialog, subdialog, control, event handler, hardware action, or workflow state in the final report `Not Checked` section and in the relevant control artifact.
28. Complete `16-final-coverage-check.md`.
29. Check `13-completion-criteria.md`.
30. Write the final report using `17-final-report-template.md` only when technical completion criteria are satisfied.
31. Do not mark the result `accepted` or `accepted_done`.
32. End as `submitted_for_review` and stop at the Review Result gate.
33. Run `devview execution start` before execution-pack implementation begins.
34. Run `devview files check` after source file changes and before review submission.
35. Run `devview execution complete` after required evidence is attached.
36. If visual UI work changed, complete Visual Implementation Audit before review submission.
37. Run `devview review submit`; it also runs File Change Guard before entering review.
38. Continue to Result Review gate only if the CLI commands succeed.

## Per-Task Loop

For each task:

1. Read the task card.
2. Read the linked Node Execution Contract when present.
3. Inspect its `## Cycle Scope` and `## Execution Strategy` sections.
4. Inspect linked Product, Project, Work, and Test node IDs.
5. Inspect linked requirement IDs.
6. Inspect linked verification IDs.
7. Inspect linked UI/UX IDs if any.
8. Inspect approved UI/UX direction and non-scope for UI tasks.
9. Confirm the task is inside the active Cycle Slice.
10. Confirm the task is being run in the correct phase and mode.
11. Confirm the task is selected or foundation scope.
12. If the task is foundation scope, ensure it does not implement deferred feature behavior.
13. If the task is in a parallel group, verify it does not require forbidden changes before starting.
14. Implement the smallest coherent change.
15. Add or update tests.
16. Run focused validation.
17. Capture evidence:
    - changed files
    - test files
    - command output
    - validation summary
    - UI manual verification note if UI changed
    - screenshot path if available
    - Visual Design Contract compliance note if visual UI changed
    - required state screenshot/manual evidence if visual UI changed
    - legacy inventory comparison result when parity is claimed
    - visual/runtime verification result when required
    - hardware readiness or certification result when relevant
18. Update traceability, evidence, or coverage notes.
19. Move to the next task only when task acceptance criteria and evidence requirements are satisfied.

## Evidence Quality During Execution

- Do not record evidence as only "checked", "passed", or "works".
- Evidence must be observable and reviewable.
- Link evidence to the Test and AC it proves.
- For CLI work, include command output.
- For UI work, include screenshot or manual visual result.
- For docs work, include changed section or excerpt.
- For hardware/environment-limited work, record manual log, mock/fake result, or manual_not_verified blocker.
- Evidence must be specific enough for a reviewer to judge pass/fail.
- Use `docs/evidence-quality-rubric.md` and `templates/evidence-quality-checklist-template.md` when evidence quality is
  non-obvious.

## Compact Execution

Compact workflow depth does not disable execution-pack safety. For small bounded work, still keep:

- `devview files check`
- minimal evidence linked to the Test or AC
- `devview review submit`
- explicit user acceptance through `devview accept`

Do not skip evidence because the work is small. If execution reveals broader file changes, product meaning changes, or
risk beyond the expectedFiles scope, stop and escalate through Change/Impact/Product Patch or full planning depth before
continuing.

For compact work, keep evidence and review but avoid long reports. Do not run full validation/test/build by default
during interactive execution. Use target/stage checks unless checkpoint/release or user request requires full
verification.

Compact Fast Path:

- Use `devview context pack` or the smallest available recommended context before opening long docs.
- Preserve AC, evidence, review, and acceptance.
- Do not skip DevView gates.
- Prefer target/stage validation over full validation by default.
- Produce compact final reports.
- Avoid long product-intake/work-planning/verification-design explanations unless needed.
- Do not create separate long reports unless requested or required by release/checkpoint/audit/high-risk/repeated-failure context.

Compact completion report shape:

- Changed: `<files>`
- AC: pass/fail summary
- Evidence: key checks or diff summary
- Validation: target/stage checks
- Review: waiting / accepted / needs revision

## Scope Enforcement

Allowed:

- implementation details inside included Work nodes
- included Test nodes and explicitly required regression checks
- selected and foundation files named by the task card or NEC

Requires Change Node:

- new product behavior
- new UI flow
- API contract change not included in the Cycle Contract
- permission/security change
- acceptance criterion change
- verification strategy change
- parity/completeness claim change
- hardware certification claim change
- changes to excluded/deferred/blocked/out-of-scope nodes
- implementation that makes previously verified evidence stale

When a Change Node is required, run `devview change create` and then `devview impact analyze`. If the change requires implementation, enter the bounded revision flow with `devview revision start`; do not silently continue or edit workflow state by hand.

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

## Parallel Safety During Execution

- Run DevView state transition commands sequentially.
- Do not run validation commands in parallel unless shared generated resources are known to be isolated.
- On Windows, do not start `validate:devview` and `test:examples` at the same time because both may touch generated `dist` / `clean-dist` areas.
- Prefer sequential local verification.
- Use `docs/parallel-safety.md` and `templates/parallel-safety-checklist-template.md` before actual parallel execution when safety is not obvious.

## Partial Testing

Selected Test nodes may pass, fail, be manual_required, skipped, deferred, or blocked. Product nodes receive only partial satisfaction when Test coverage is partial.

Do not mark Product branches `accepted_done`. Only the user may close Product branches through review/acceptance.

## No-Question Rule

Do not ask the user during execution-pack execution unless a stop condition is reached.

## Stop Conditions

Stop when work requires:

- credentials or secrets
- deployment or billing changes
- destructive migration
- out-of-scope behavior
- deferred-scope implementation
- excluded Cycle Slice node changes
- foundation work expanding into deferred feature behavior
- a decision that changes product intent
- a repeated validation failure after three attempts
- unavailable dependency or environment that blocks meaningful progress
- unresolved traceability gap that blocks completion
- missing UI/UX evidence for a required UI screen or state
- command-mapped dialog, popup, subdialog, or workflow that lacks child surface inventory, child Test coverage, or evidence
- required legacy control or event handler that remains missing, unverified, or not checked
- hardware-gated surface that lacks mock-backed, fake-result, UI-automation, or explicit blocking manual-not-verified evidence
- a not-checked item that blocks technical stability, parity review, or product acceptance
- implementation would conflict with confirmed UI/UX direction
- implementation would conflict with the Visual Design Contract, design tokens, component style contract, or visual non-scope
- selected visual UI work lacks required screenshot/manual evidence
- visual deviations are discovered but not recorded with disposition
- missing Cycle Contract or missing Node Execution Contract for a selected Work node
- a parallel group task requires shared schema, shared type, build config, auth, permission, migration, package configuration, deployment, billing, secret handling, or another forbidden change
- two tasks in the same parallel group need to modify the same file
- a parallel group has no integration task
- an integration task cannot safely resolve conflicts or shared contract issues

## Final Coverage Gate

Before final completion:

1. Read the active Cycle Contract.
2. Read the traceability matrix.
3. Read the UI/UX evidence checklist.
4. Complete the final coverage check.
5. Verify included Product nodes have linked Work nodes or explicit explanation.
6. Verify included Work nodes have Test nodes or explicit not-runnable explanation.
7. Verify there are no verification items without evidence or not-runnable explanation.
8. Verify no required UI state is missing without explanation.
9. Verify any active surface completion ledger does not claim parity without inventory and evidence.
10. Verify commands that open dialogs have child surface inventory and workflow/dialog evidence.
11. Verify required legacy controls and event handlers are matched or explicitly deferred/blocked/out of scope.
12. Verify hardware-gated surfaces have substitute evidence or blocking `manual_not_verified` entries.
13. Verify the final report lists every not-checked dialog, control, event handler, hardware action, and workflow state.
14. Verify any hardware-certified feature has certification evidence.
15. Verify any required visual profile checks passed or have explicit not-runnable evidence/reason.
    15a. Verify Visual Design Contract artifacts exist or are explicitly waived for selected visual UI work.
    15b. Verify required UI surface states have current screenshot/manual evidence or explicit deferral/blocker.
    15c. Verify no stale screenshot evidence is used for review submission.
16. Verify no unresolved stop condition remains.
17. Verify excluded nodes were not changed.

If coverage issues remain, continue working or record a stop condition. Do not write the final report first.

## Autoflow Failure

If execution-pack execution cannot continue:

- Keep the workflow on the last valid canonical state reported by the CLI, usually `EXECUTION_PACK_READY` before start or `EXECUTION_IN_PROGRESS` during execution.
- Do not write `autoflow.lastFailure` by hand; follow the CLI issue output, `suggestedFix`, and `nextCommand`.
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
accepted_done
```

Only the user can accept the result. If the user is dissatisfied, structure the feedback, then continue with `devview change create`, `devview impact analyze`, `devview revision start`, bounded revision work, and `devview revision complete`.

## Completion Report

When complete, report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that execution-pack execution ended as `submitted_for_review` and DevView is stopping at the Review Result gate. Include user reply examples for approval, revision, question, and stop.

State transitions:

- Before implementation begins, run `devview execution start`.
- Before review submission after source file changes, run `devview files check`.
- After execution completes, run `devview execution complete`.
- If selected visual UI work changed, run `devview-visual-implementation-audit` next.
- Only after required evidence and visual audit pass or are explicitly waived, run `devview review submit` so the CLI runs File Change Guard, records `WAITING_REVIEW_RESULT`, the Review Result gate, and state history.

Include:

- active cycle ID
- included Work/Test nodes executed
- excluded/deferred/out-of-scope nodes protected
- tasks completed
- selected/foundation tasks completed
- files changed
- validations run
- skipped validations and reasons
- evidence tree update result
- traceability matrix result
- UI/UX evidence result
- Visual Design Contract result
- UI surface screenshot/manual evidence result
- visual audit result
- surface completion and parity result, when active
- dialog/subdialog controls and event-handler result, when active
- Not Checked section summary
- hardware readiness result, when active
- verification miss promotion result, when active
- final coverage check result
- execution strategy result
- parallel group and integration task result
- delivery status: `submitted_for_review`
- unresolved risks
- final report path
- current gate: review_result
- recommended reply for the user

Use `[Codex 硫붾え]` only for short explanation of remaining risk or validation interpretation.
