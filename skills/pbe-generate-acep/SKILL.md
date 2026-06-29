---
name: pbe-generate-acep
description: Generate Cycle Contract and Node Execution Contracts from selected tree nodes, preserving traceability, UI/UX, verification, evidence, parallel safety, and change rules.
---

# PBE Generate ACEP

## CLI Transition Rule

Use PBE CLI transition commands for workflow state changes. Do not edit `.pbe/blueprint/pbe-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill to generate `.pbe/codex-execution-pack/` from completed tree-control compatibility artifacts.

ACEP is not only a task-card bundle. It is a Codex execution contract that links Product, Project, Work, Test, Cycle, traceability, UI/UX expectations, evidence, and final coverage checks.

Graph-first boundary: ACEP and `.pbe/codex-execution-pack/*` are compatibility/execution views over selected cycle
obligations. They are not Graph-source authority, do not retire tree-native artifacts, and do not replace user
acceptance or read-model projection evidence.

In PBE v2, ACEP generation packages the selected Cycle Slice. It does not package the whole product unless the user selected the whole product as the active cycle.

ACEP generation is deterministic in Autoflow. Run it automatically after Coverage Audit and UX Audit pass.

After generating ACEP files and the execution manifest, run:

```bash
pbe acep check
```

If the command fails, do not report ACEP as ready.

## Inputs

Prefer v2 tree and cycle files when present:

```text
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
.pbe/execution/cycle-tree.json
.pbe/execution/cycle-contract.md
.pbe/control/legacy-control-inventory.json
.pbe/control/surface-completion-ledger.json
.pbe/control/hardware-readiness-ledger.json
.pbe/control/ui-surface-inventory.json
.pbe/control/component-style-inventory.json
.pbe/control/visual-verification-profile.json
.pbe/control/verification-miss-log.json
```

Also read compatibility, audit, and strategy files:

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
.pbe/blueprint/verification-design.json
.pbe/blueprint/verification-plan.md
.pbe/blueprint/dependency-impact-audit.json
.pbe/blueprint/dependency-impact-audit.md
.pbe/blueprint/execution-strategy.json
.pbe/blueprint/execution-strategy.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/visual-reference.json
.pbe/blueprint/ui-theme-spec.md
.pbe/blueprint/design-tokens.json
.pbe/blueprint/component-style-contract.json
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

Create or update the existing ACEP files:

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

Also create or update v2 cycle-native contract files:

```text
22-cycle-contract.md
23-change-rules.md
11-node-execution-contracts/
```

Create as many task cards and Node Execution Contracts as the active Cycle Slice requires. Do not create fake work just to fill a count.

## Execution Contract Rules

Enforce these rules when generating ACEP:

- No lower-tree node without an upper-tree source.
- No requirement without task.
- No Work node without Test node or explicit not-runnable reason.
- No Test node without evidence requirement.
- No task without verification.
- No verification without evidence.
- No UI screen without state coverage.
- No final completion without coverage check.
- No UI implementation without UI/UX confirmation.
- No visual UI implementation without Visual Design Contract source, Theme Spec, Design Tokens, Component Style Contract, and UI Surface Inventory unless visual quality is explicitly waived by the user.
- No shared visual component change without Component Style Contract reference or approved exception.
- No required visual UI state without screenshot/manual evidence requirement.
- No stale screenshot evidence used for closure.
- No accepted or accepted_done status from Codex.
- No parallel execution plan without WPD WorkGraph.
- No parallel group without an integration task.
- No RPD/Product Tree requirement node copied directly into a Codex coding task.
- No forbidden shared-risk task inside a parallel group.
- No deferred or out-of-scope node implemented by the current ACEP.
- No foundation task that implements deferred feature behavior.
- No slice completion recorded as whole-project completion.
- No technical stability reported as parity review or product acceptance.
- No parity claim without inventory/evidence when the parity/completeness profile is active.
- No command-mapped dialog, popup, subdialog, or secondary workflow treated as complete without child surface inventory, Work/Test coverage, and evidence.
- No required legacy control or event handler left missing, unverified, or not checked while claiming technical stability or parity.
- No hardware-gated surface closed without mock-backed, fake-result, UI-automation, or explicit blocking manual-not-verified evidence.
- No blocking `notChecked` item hidden from final coverage or final report.
- No hardware certification claim without certification evidence.
- No silent Product Tree edits during execution.
- Any product/scope/UX/risk/acceptance/verification change must become a Change Node.

If an item is deferred or out of scope, record the reason explicitly in the traceability matrix, Cycle Contract, and final coverage check.

## Scope Contract

ACEP must separate:

- Selected Scope: implemented now.
- Foundation Scope: structural work required now for selected or future-safe implementation.
- Deferred Scope: recorded and protected, not implemented now.
- Blocked Scope: stop condition.
- Out-of-Scope: forbidden unless the user changes scope.

Only selected and foundation scope inside the active Cycle Slice can become current ACEP implementation tasks.

## Cycle Contract

`22-cycle-contract.md` must mirror `.pbe/execution/cycle-contract.md` and include:

- cycle ID and goal
- included Product, Project, Work, and Test node IDs
- explicitly excluded node IDs
- selected/foundation/deferred/blocked/out-of-scope split
- allowed local changes
- forbidden changes
- changes requiring Change Nodes
- required evidence
- validation and close criteria
- rollback plan
- parallel safety summary

`execution-manifest.json` must include an `activeCycle` object or equivalent fields with:

- `cycleId`
- `cycleTree`
- `cycleContract`
- `includedProductNodeIds`
- `includedProjectNodeIds`
- `includedWorkNodeIds`
- `includedTestNodeIds`
- `explicitlyExcludedNodeIds`

## Node Execution Contracts

For every selected or foundation Work node included in the active cycle, create one Node Execution Contract under:

```text
11-node-execution-contracts/
```

Each Node Execution Contract must include:

- Product Tree links
- Project Tree links
- Work Tree links
- Test Tree links
- Evidence required
- included scope
- explicit non-scope
- allowed local changes
- changes requiring Change Node
- validation commands
- rollback path
- close criteria

Task cards may remain as user-friendly compatibility views, but they must reference the corresponding Node Execution Contract.

## Traceability Matrix

Generate both:

```text
04-traceability-matrix.md
04-traceability-matrix.json
```

Each item links:

```text
Product/Requirement Node -> Project Node -> Work Node/Task -> Test/Verification Item -> Evidence Required -> Coverage Status
```

Before final completion, Codex must inspect the traceability matrix and must not complete if:

- any selected Product node has no linked Work node
- any included Work node has no linked Test node or explicit not-runnable reason
- any included Test node has no required evidence
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
- linked Product/Work/Test nodes
- primary user
- primary flow
- required UI elements
- empty, loading, success, validation error, server error, and permission states where applicable
- responsive priority
- accessibility expectations
- forbidden UX
- evidence required
- visual source, token source, component style contract, UI surface inventory, and visual evidence requirements when visual appearance changes

## Task Cards

Every task card must include:

```text
## Cycle Scope
## Node Execution Contract
## Product Tree Links
## Project Tree Links
## Work Tree Links
## Test Tree Links
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

Visual UI task cards must also include:

```text
## Visual Design Contract
## Design Token Source
## Component Style Contract
## UI Surface Inventory
## Visual Non-Scope
## Required Visual States
## Screenshot Evidence Required
## Visual Deviation Rule
```

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

## Verification Plan

`09-verification-plan.md` must separate:

1. Automated Tests
2. Manual Checks
3. UI/UX Evidence Checks
4. Regression Checks
5. Acceptance Checks
6. Not Runnable / Environment-limited Checks

Every verification item must identify its linked Product, Work, task, and Test node when available.

## Completion And Final Report

`13-completion-criteria.md` must require:

- active Cycle Slice completion or explicit deferral/out_of_scope reason
- Product node coverage for included nodes
- Work node to Test node coverage
- evidence for every included Test node
- validation pass or not-runnable explanation
- UI/UX evidence for required screens and states
- Visual Design Contract evidence for required selected visual states
- screenshot/manual visual evidence for every required surface state, or explicit deferral/blocker
- no unresolved visual deviations
- child dialog/subdialog/control/event-handler evidence for commands that open secondary surfaces
- hardware-gated substitute evidence or explicit blocking manual-not-verified entries
- a Not Checked section for uninspected dialogs, controls, event handlers, hardware actions, and workflow states
- completed Final Coverage Check
- Result Review Pack creation
- delivery status `submitted_for_review`
- no unresolved stop condition
- user acceptance as a separate post-review decision

`17-final-report-template.md` must include cycle ID, included/excluded nodes, requirement, task, verification, UI/UX confirmation, Visual Design Contract result, approved UI/UX implemented, traceability, evidence, files changed, deviations, known issues, delivery status, user review, revision history, stop conditions, and remaining manual review sections.

When parity/completeness artifacts exist, final coverage and final report sections must also include surface completion, legacy inventory gaps, dialog/subdialog inventory gaps, event-handler gaps, visual/runtime verification, hardware readiness, verification miss promotion status, and all blocking Not Checked items.

## Manifest Rules

`execution-manifest.json` must include:

- `autonomyLevel`
- `activeCycle`
- `sourceBlueprintFiles`
- `contractFiles`
- ordered `tasks`
- validation strategy
- stop conditions
- final report path

Every task must include:

- `id`
- `file` or `taskCard`
- `nodeExecutionContract`
- `title`
- `phase`
- `productNodeIds`
- `projectNodeIds`
- `workTreeNodeIds`
- `testTreeNodeIds`
- `requirementIds`
- `verificationIds` or `verificationExplanation`
- `uiUxIds`
- `visualContractRefs`
- `designTokenRef`
- `componentStyleContractRef`
- `uiSurfaceInventoryRefs`
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
- `pbe visual check` or equivalent Visual Design Contract preflight when visual UI work is selected
- `pbe-plan-execution`

Do not generate ACEP if either audit has blocking issues.

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

1. Product, Work, Test Trees exist when v2 mode is active.
2. `.pbe/execution/cycle-tree.json` and `.pbe/execution/cycle-contract.md` exist.
3. WPD WorkGraph exists in `work-graph.json` or `work-design.json`.
4. WPD Module Boundary Check was performed.
5. `pbe-plan-execution` produced `execution-strategy.json` and `execution-strategy.md`.
6. Every parallel group has an integration task.
7. Every parallel group requires integration evidence and integration pass before completion.
8. Forbidden shared-risk work is not placed in a parallel group.
9. Parallel group size follows policy or has human approval.
10. Final validation and review phases exist.

If any condition fails, report blocking issues instead of generating ACEP.

## Autonomy

Default autonomy level:

```text
autonomous_until_stop
```

Codex should continue through the active cycle task cards without asking the user unless a stop condition is reached.

## Stop Conditions

Stop and ask the user when work requires:

- credentials, secrets, tokens, or private accounts
- deployment, billing, or external infrastructure changes
- destructive migrations or irreversible data changes
- out-of-scope implementation
- deferred-scope implementation
- legal, medical, financial, or security-sensitive decisions outside the repo context
- the same validation failure repeating three times
- missing requirements that make the task impossible to complete safely
- unresolved traceability or UI evidence gaps that block completion
- missing UI/UX confirmation for UI tasks
- missing Visual Design Contract source, design tokens, component style contract, UI surface inventory, or screenshot evidence for selected visual UI tasks
- missing WorkGraph or Module Boundary Check
- missing execution strategy from `pbe-plan-execution`
- missing Cycle Tree or Cycle Contract
- parallel group without an integration task
- parallel group task requiring forbidden shared changes
- parallel group tasks likely to modify the same file

## Autoflow

When ACEP generation succeeds:

- Run `pbe acep ready`.
- Let the CLI validate ACEP artifacts, implementation-scope confirmation, and required pre-ACEP checkpoints: `dependency_impact_audit`, `plan_execution`, `coverage_audit`, and `ux_audit`.
- Continue automatically to ACEP Runner.

When ACEP generation fails:

- Keep the workflow on the last valid canonical state reported by the CLI.
- Do not write `autoflow.lastFailure` by hand; follow the CLI issue output, `suggestedFix`, and `nextCommand`.
- Do not continue to ACEP Runner.
- Show the Autoflow failure guidance.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether ACEP generation succeeded and PBE is continuing automatically to ACEP Runner, or whether generation stopped with blockers.

Include:

- active cycle ID
- included/excluded node counts
- number of generated task cards
- number of generated Node Execution Contracts
- traceability item count
- UI/UX screen count
- execution manifest path
- cycle contract path
- execution strategy path
- parallel group and integration task summary
- selected/foundation/deferred/out-of-scope scope summary
- validation command summary
- stop condition summary
- next automatic step: run ACEP
- review/revision workflow reminder
- user reply examples when blocked

Use `[Codex 메모]` only for short explanation of ACEP contract risk.
