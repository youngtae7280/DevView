---
name: devview-create-revision-pack
description: Create a bounded revision pack from Change Nodes, Feedback Items, Impact Tree analysis, and reopened affected nodes.
---

# DevView Create Revision Pack

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

## Role

`devview-create-revision-pack` is a compatibility/helper skill for preparing revision context.

The primary revision path is:

`devview change create` -> `devview impact analyze` -> `devview revision start` -> bounded work -> `devview revision complete`

This skill may help organize revision inputs, but it must not bypass the CLI Change / Impact / Revision flow.

Use this skill after `devview-collect-feedback`.

In Autoflow, this skill may be used as a helper route after feedback is mapped clearly.

## Purpose

Create a bounded revision instruction pack from user feedback, Change Tree entries, Impact Tree analysis, and reopened affected nodes. Revision is Change/Impact/Reopen execution, not a full project rewrite.

The revision pack must preserve implementation scope classifications. Feedback may affect selected or foundation work from the current slice. Deferred or out-of-scope work can only enter the revision if the user explicitly changes the scope at a human gate.

If a Change Node has `requiresRevisionRpd: true`, run Revision RPD for that Change Node before generating implementation tasks. Product Tree or acceptance criteria changes must be tied to `devview change create`, `devview impact analyze`, and user-confirmed revision scope; do not quietly edit Product Tree meaning from feedback.
If a Change Node has criteria deltas, the revision pack must include a criteria-specific retest/reopen/replace-evidence plan before implementation tasks are issued.

## Inputs

Prefer v2 files when present:

```text
.devview/tree/product-tree.json
.devview/tree/project-tree.json
.devview/tree/work-tree.json
.devview/tree/test-tree.json
.devview/execution/cycle-tree.json
.devview/control/change-tree.json
.devview/control/impact-tree.json
.devview/control/acceptance-tree.json
.devview/control/legacy-control-inventory.json
.devview/control/surface-completion-ledger.json
.devview/control/hardware-readiness-ledger.json
.devview/control/visual-verification-profile.json
.devview/control/verification-miss-log.json
.devview/evidence/evidence-tree.json
```

Also read compatibility and review artifacts:

```text
.devview/review/feedback-items.json
.devview/review/user-feedback.md
.devview/blueprint/requirement-tree.json
.devview/blueprint/work-design.json
.devview/blueprint/verification-design.json
.devview/codex-execution-pack/execution-manifest.json
```

## Output Folder

```text
.devview/revisions/rev-001/
```

Use the next available revision number.

## Required Files

```text
00-revision-summary.md
01-user-feedback.md
02-affected-nodes.md
03-revision-requirements.md
04-revision-work-plan.md
05-revision-verification-plan.md
06-revision-task-cards/revision-task-001.md
07-regression-checks.md
08-review-checklist.md
revision-manifest.json
```

Also update:

```text
.devview/control/impact-tree.json
.devview/control/change-tree.json
.devview/control/acceptance-tree.json
.devview/control/verification-miss-log.json
```

## Required Actions

1. Read Feedback Items and Change Tree.
2. Build or update Impact Tree for affected Product, Project, Work, Test, Evidence, UI/UX, Cycle, and Acceptance nodes.
3. Mark affected states when needed:
   - `implemented` -> `stale`
   - `verified` -> `invalidated`
   - `accepted_done` -> `reopened`
   - evidence attached -> stale or requires replacement
4. Decide whether each change is local fix, blueprint mutation, scope expansion, or breaking impact.
5. Run Ambiguity Gate for ambiguous Change Nodes and ask exactly one focused Revision RPD question when needed.
6. Update or create structured acceptance criteria before creating implementation tasks when criteria changed.
7. Ask the user when product/scope/risk/UX/acceptance/verification changes are not already approved.
8. Generate bounded revision tasks only for affected selected/foundation nodes.
9. Preserve deferred/out-of-scope nodes unless user approves mutation.
10. Include allowed files, forbidden files, non-scope, and regression checks.
11. Include the verification miss root cause and any promoted validation contract requirements when feedback exposed a missed verification dimension.
12. Write revision manifest with source feedback IDs, source change IDs, impact IDs, affected nodes, reopened nodes, stale evidence nodes, verification miss IDs, criteria deltas, and promoted checks.
13. Run `devview revision start` before implementation if it has not already succeeded, then execute the bounded revision work and close it with `devview revision complete` when the revision pack is safe and bounded.

## Scope Rules

1. Include only feedback/Change/Impact-mapped affected Product, Project, Work, Test, Evidence, requirement, task, UI/UX, and verification items.
2. Do not modify unrelated behavior.
3. Include regression checks for previously accepted or unaffected behavior.
4. If feedback scope is unclear, ask clarification before creating implementation tasks.
5. Record explicit non-scope.
6. Preserve `selected`, `foundation`, `deferred`, `blocked`, and `out_of_scope` classifications.
7. Do not convert deferred items into revision tasks without user scope approval.
8. If feedback reveals a missing foundation dependency, create a foundation revision task and record why it is required.
9. If the revision would change an accepted Product branch, mark the branch reopened and require user review again.

## Impact Tree Rules

Every Impact Tree entry must state:

- `changeId`
- affected node
- impact type: `none`, `stale`, `invalidated`, `reopened`, `obsolete`, `requires_retest`, or `requires_new_evidence`
- required action: `preserve`, `defer`, `fork`, `reopen`, `retest`, `replace_evidence`, or `human_decision`
- reason
- affected acceptance criteria IDs when the change modifies acceptance meaning

If an affected completed node remains valid, record `impactType: none` and `requiredAction: preserve` so Codex does not unnecessarily rewrite it.

## Revision Manifest Additions

`revision-manifest.json` must include or preserve:

- `sourceFeedbackItems`
- `sourceChangeIds`
- `impactIds`
- `affectedProductNodeIds`
- `affectedProjectNodeIds`
- `affectedWorkNodeIds`
- `affectedTestNodeIds`
- `affectedEvidenceNodeIds`
- `affectedCycleIds`
- `reopenedNodeIds`
- `staleEvidenceNodeIds`
- `allowedFiles`
- `forbiddenFiles`
- `mustNotTouch`
- `maxChangeIntent`
- `nonScope`
- `regressionChecks`
- `verificationMissIds`
- `affectedAcceptanceCriteriaIds`
- `criteriaDelta`
- `revisionRpdStatus`
- `whyPreviousVerificationMissedThis`
- `promotedValidationContractRefs`
- `surfaceReauditRequired`

If a repeated miss requires broader surface audit, include audit and verification tasks in the revision pack, but keep implementation tasks bounded to affected selected/foundation scope. Scope expansion still requires user approval.

## Autoflow

When the revision pack is created:

- Ensure the related Change nodes have Impact analysis from `devview impact analyze`.
- Run `devview revision start` to enter revision workflow state.
- Continue to bounded revision execution only if the CLI command succeeds.

When revision scope is unclear or too broad:

- Keep the user at the Review Result gate with one clarification question, or follow the CLI failure output.
- Do not run revision tasks.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether the revision pack was created and DevView is continuing automatically to Revision Runner, or whether scope is unclear and the user must answer.

Include:

- revision pack path
- source feedback and Change Tree entries
- Impact Tree entries created or updated
- affected/reopened/stale nodes
- allowed files and forbidden files
- task count
- regression checks
- verification miss root-cause and promoted validation checks
- surface re-audit scope, when relevant
- next step
- user reply examples when blocked
- one recommended reply

Use `[Codex 硫붾え]` only for short explanation of revision boundaries.
