---
name: pbe-generate-acep
description: Generate an execution-contract ACEP with traceability, UI/UX, evidence, and final coverage requirements.
---

# PBE Generate ACEP

Use this skill to generate `.pbe/codex-execution-pack/` from completed blueprint artifacts.

ACEP is not only a task-card bundle. It is a Codex execution contract that links requirements, tasks, verification, UI/UX expectations, evidence, and final coverage checks.

ACEP generation is deterministic in Autoflow. Run it automatically after
Coverage Audit and UX Audit pass.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
.pbe/blueprint/verification-design.json
.pbe/blueprint/verification-plan.md
.pbe/blueprint/execution-strategy.json
.pbe/blueprint/execution-strategy.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/coverage-audit.md
.pbe/blueprint/ux-audit.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/pbe-invariants.md
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/parallel-safety-contract.md
```

## Output Folder

```text
.pbe/codex-execution-pack/
```

## Required Files

Create or update:

```text
00-readme.md
01-autonomous-execution-policy.md
02-project-blueprint.md
03-requirement-tree.md
04-traceability-matrix.md
04-traceability-matrix.json
05-ui-ux-spec.md
05-ui-ux-spec.json
06-ui-ux-preview.md
07-ui-ux-confirmation.md
08-work-roadmap.md
09-verification-plan.md
10-codex-operating-loop.md
11-task-cards/task-001.md
11-task-cards/task-002.md
12-validation-commands.md
13-completion-criteria.md
14-failure-recovery.md
15-ui-ux-evidence-checklist.md
16-final-coverage-check.md
17-final-report-template.md
18-execution-strategy.md
19-source-of-truth-matrix.md
20-foundation-contract.md
21-parallel-safety-contract.md
execution-manifest.json
```

Create as many task cards as the roadmap requires. Do not create fake work just to fill a count.

## Execution Contract Rules

Enforce these rules when generating ACEP:

- No requirement without task.
- No task without verification.
- No verification without evidence.
- No UI screen without state coverage.
- No final completion without coverage check.
- No UI implementation without UI/UX confirmation.
- No accepted status from Codex.
- No parallel execution plan without WPD WorkGraph.
- No parallel group without an integration task.
- No RPD requirement node copied directly into a Codex coding task.
- No forbidden shared-risk task inside a parallel group.
- No deferred requirement implemented by the current ACEP.
- No foundation task that implements deferred feature behavior.
- No slice completion recorded as whole-project completion.

If an item is deferred or out of scope, record the reason explicitly in the traceability matrix and final coverage check.

## Scope Contract

ACEP must separate:

- Selected Scope: implemented now.
- Foundation Scope: structural work required now for selected or future-safe implementation.
- Deferred Scope: recorded and protected, not implemented now.
- Blocked Scope: stop condition.
- Out-of-Scope: forbidden unless the user changes scope.

Only selected and foundation scope can become current ACEP implementation tasks.

## Traceability Matrix

Generate both:

```text
04-traceability-matrix.md
04-traceability-matrix.json
```

Each item links:

```text
Requirement Node -> Work Task -> Verification Item -> Evidence Required -> Coverage Status
```

Before final completion, Codex must inspect the traceability matrix and must not complete if:

- any requirement has no linked task
- any task has no linked verification
- any verification item has no required evidence
- any traceability item remains pending without explanation

## UI/UX Spec

Generate both:

```text
05-ui-ux-spec.md
05-ui-ux-spec.json
```

For every required screen or UI flow, include:

- screen name
- screen purpose
- primary user
- primary flow
- required UI elements
- empty, loading, success, validation error, server error, and permission states where applicable
- responsive priority
- accessibility expectations
- forbidden UX
- evidence required

## Task Cards

Every task card must include:

```text
## Requirement Links
## WorkGraph Links
## Verification Links
## UI/UX Links
## Evidence Required
## Coverage Update Required
```

UI task cards must also include:

```text
## Approved UI/UX Direction
## UI/UX Non-Scope
## UI/UX Evidence Required
## UI/UX Confirmation Reference
```

## Verification Plan

`09-verification-plan.md` must separate:

1. Automated Tests
2. Manual Checks
3. UI/UX Evidence Checks
4. Regression Checks
5. Acceptance Checks
6. Not Runnable / Environment-limited Checks

Every verification item must identify its linked requirement and task.

## Completion And Final Report

`13-completion-criteria.md` must require:

- task completion or explicit deferral/out_of_scope reason
- requirement coverage
- task-to-verification coverage
- evidence for every verification item
- validation pass or not-runnable explanation
- UI/UX evidence for required screens and states
- completed Final Coverage Check
- Result Review Pack creation
- delivery status `submitted_for_review`
- no unresolved stop condition
- user acceptance as a separate post-review decision

`17-final-report-template.md` must include requirement, task, verification, UI/UX confirmation, approved UI/UX implemented, traceability, evidence, files changed, deviations, known issues, delivery status, user review, revision history, stop conditions, and remaining manual review sections.

## Manifest Rules

`execution-manifest.json` must include:

- `autonomyLevel`
- `sourceBlueprintFiles`
- `contractFiles`
- ordered `tasks`
- validation strategy
- stop conditions
- final report path

Every task must include:

- `id`
- `file` or `taskCard`
- `title`
- `phase`
- `requirementIds`
- `verificationIds` or `verificationExplanation`
- `uiUxIds`
- `evidenceRequired`
- focused validation
- execution mode
- parallel group, when applicable
- conflict risk
- expected files
- expected shared files
- forbidden files
- dependencyResolved, writeSetKnown, rollbackPathAvailable when in a parallel group
- forbidden changes
- integration task, when applicable

Before generating ACEP, run or satisfy:

- `pbe-coverage-audit`
- `pbe-ux-audit`
- `pbe-plan-execution`

Do not generate ACEP if either audit has blocking issues.

## Autoflow

When ACEP generation succeeds:

- Set `pbe-state.json.autoflow.state` to `ACEP_GENERATED`.
- Add `generate_acep` to `autoflow.completedSteps`.
- Set `autoflow.nextStep` to `run_acep`.
- Continue automatically to ACEP Runner.

When ACEP generation fails:

- Set `autoflow.state` to `BLOCKED`.
- Record `autoflow.lastFailure.failedStep` as `generate_acep`.
- Do not continue to ACEP Runner.
- Show the Autoflow failure guidance.

## Execution Strategy

ACEP generation must include:

```text
18-execution-strategy.md
execution-manifest.json phases
parallelGroups
integrationTask for every parallel group
integrationEvidenceRequired
groupCannotCompleteWithoutIntegrationPass
Task Card Execution Strategy sections
```

Before generating ACEP, verify:

1. WPD WorkGraph exists in `work-graph.json` or `work-design.json`.
2. WPD Module Boundary Check was performed.
3. `pbe-plan-execution` produced `execution-strategy.json` and `execution-strategy.md`.
4. Every parallel group has an integration task.
5. Every parallel group requires integration evidence and integration pass before completion.
6. Forbidden shared-risk work is not placed in a parallel group.
7. Parallel group size follows policy or has human approval.
8. Final validation and review phases exist.

If any condition fails, report blocking issues instead of generating ACEP.

## Task Cards

Every task card must include:

```text
## Execution Strategy
```

The section must list:

- Mode
- Parallel Group
- Can Run In Parallel With
- Must Run After
- Must Run Before
- Conflict Risk
- Expected Files
- Expected Shared Files
- Forbidden Changes
- Integration Required
- Integration Task

Integration task cards must also include:

```text
## Parallel Group Integrated
## Tasks Integrated
## Conflict Checks
## Shared Contract Checks
## UI/UX Consistency Checks
## Validation Commands
## Evidence Required
## Remaining Risks
```

## Autonomy

Default autonomy level:

```text
autonomous_until_stop
```

Codex should continue through the task cards without asking the user unless a stop condition is reached.

## Stop Conditions

Stop and ask the user when work requires:

- credentials, secrets, tokens, or private accounts
- deployment, billing, or external infrastructure changes
- destructive migrations or irreversible data changes
- out-of-scope implementation
- legal, medical, financial, or security-sensitive decisions outside the repo context
- the same validation failure repeating three times
- missing requirements that make the task impossible to complete safely
- unresolved traceability or UI evidence gaps that block completion
- missing UI/UX confirmation for UI tasks
- missing WorkGraph or Module Boundary Check
- missing execution strategy from `pbe-plan-execution`
- parallel group without an integration task
- parallel group task requiring forbidden shared changes
- parallel group tasks likely to modify the same file

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether ACEP generation succeeded and PBE is continuing automatically to ACEP Runner, or whether generation stopped with blockers.

Include:

- number of generated task cards
- traceability item count
- UI/UX screen count
- execution manifest path
- execution strategy path
- parallel group and integration task summary
- selected/foundation/deferred/out-of-scope scope summary
- validation command summary
- stop condition summary
- next automatic step: run ACEP
- review/revision workflow reminder
- user reply examples when blocked

Use `[Codex 메모]` only for short explanation of ACEP contract risk.
