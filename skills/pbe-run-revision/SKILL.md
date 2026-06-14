---
name: pbe-run-revision
description: Execute a bounded PBE revision pack against affected reopened nodes only, rerun impacted tests, refresh evidence, and resubmit for review.
---

# PBE Run Revision

## CLI Transition Rule

Use PBE CLI transition commands for workflow state changes. Do not edit `.pbe/blueprint/pbe-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

## Role

`pbe-run-revision` is a helper skill for executing a bounded revision after Change / Impact / Revision context exists.

It is not a shortcut around review, impact analysis, Product Patch Proposal, or user acceptance. Do not start blind revision immediately after review rejection; first classify the feedback, create or confirm Change/Impact context, and use Product Patch Proposal when product meaning changes.

Use the CLI revision flow as the source of truth.

Use this skill to execute the latest revision pack.

In Autoflow, this skill may be used as a helper route after a revision pack is created, then return to the Review Result gate.

Revision execution stays inside affected selected/foundation scope. It must not implement deferred or out-of-scope behavior unless the user explicitly approved a scope change.

## Inputs

```text
.pbe/revisions/rev-*/revision-manifest.json
.pbe/revisions/rev-*/06-revision-task-cards/
.pbe/revisions/rev-*/07-regression-checks.md
.pbe/control/change-tree.json
.pbe/control/impact-tree.json
.pbe/control/acceptance-tree.json
.pbe/control/legacy-control-inventory.json
.pbe/control/surface-completion-ledger.json
.pbe/control/hardware-readiness-ledger.json
.pbe/control/visual-verification-profile.json
.pbe/control/verification-miss-log.json
.pbe/evidence/evidence-tree.json
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
```

## Required Actions

1. Find the latest revision pack.
2. Read `revision-manifest.json`.
3. Read Change Tree and Impact Tree.
4. Confirm each task maps to affected or reopened nodes.
5. Execute revision task cards in order.
6. Respect allowed files, forbidden files, explicit non-scope, and `mustNotTouch`.
7. Do not change outside affected Product, Project, Work, Test, Evidence, requirement, task, UI/UX, or verification items.
8. Preserve selected/foundation/deferred/out_of_scope classifications.
9. Stop if the revision requires scope expansion.
10. Rerun impacted Test nodes and required regression checks.
11. If the revision has verification miss IDs, update the miss log with root cause and promotion outcome.
12. Replace or refresh stale evidence when required.
13. Update Work/Test/Evidence/Acceptance states and parity/completeness ledgers when affected.
14. If UI changed, update UI evidence and visual verification profile evidence when required.
15. Write `revision-result.md`.
16. Run `pbe files check` before closing revision if source files changed.
17. Run `pbe revision complete`.
18. Follow the CLI `nextCommand`; rerun WPD, VD, ACEP, execution, or review closure as requested.
19. Continue to the Review Result gate only after the required CLI closure path succeeds.

## Reopen Execution Rules

Run only affected/reopened nodes from the revision manifest and Impact Tree.

When Impact Tree says:

- `preserve`: do not edit the node; only verify it remains valid if needed.
- `defer`: do not implement now; record deferral.
- `fork`: create isolated revised work without rewriting the preserved node.
- `reopen`: revise the affected node and require review again.
- `retest`: rerun affected Test nodes and update evidence.
- `replace_evidence`: refresh stale evidence and update Evidence Tree.
- `human_decision`: stop and ask the user.

## Hard Rules

- If revision work discovers new scope, create a new Change Node. Do not expand the revision silently.
- If revision work discovers ambiguous product meaning, pause implementation and route only that Change Node through Revision RPD.
- If revision work discovers unexplained source file changes, do not close the revision; run `pbe change create`, `pbe impact analyze`, and `pbe revision start` for the new scope.
- If acceptance criteria changed, rerun or update affected Test Tree and Evidence Tree links before resubmitting.
- Do not report the revision as verified until modified or invalidated criteria have fresh Test/Evidence coverage or an explicit blocked reason.
- Do not touch deferred or out-of-scope nodes without explicit user scope approval.
- Do not mark Product branches `accepted_done`; return to Review Result.
- Do not clear `reopened`, `stale`, or `invalidated` state without refreshed validation/evidence.
- Do not edit files outside `allowedFiles` unless the manifest explicitly permits it.
- Do not mark a repeated verification miss as resolved unless the promoted validation contract, Test node, Evidence requirement, or explicit blocked reason is recorded.
- Do not use surface re-audit as permission to implement adjacent deferred or out-of-scope behavior.

## Stop Conditions

Stop when:

- feedback mapping is ambiguous
- Impact Tree has `human_decision` actions
- revision requires changes outside affected scope
- revision tries to implement deferred or out-of-scope behavior
- revision touches forbidden files
- revision needs files not listed in `allowedFiles`
- regression checks fail repeatedly
- user approval is needed for scope expansion
- new product/scope/UX/risk/acceptance/verification change is discovered

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that revision execution is returning to the Review Result gate or that a stop condition blocks review.

Include:

- revision ID
- source Change/Impact IDs
- revision tasks completed
- affected/reopened nodes handled
- selected/foundation scope changed
- deferred/out-of-scope scope protected
- files changed
- validation results
- regression checks
- evidence refreshed
- verification miss root-cause and promotion result
- surface completion, visual profile, or hardware readiness updates when affected
- remaining stale/invalidated/reopened nodes
- remaining risks
- next step: review result gate
- user reply examples at review gate

Use `[Codex 메모]` only for short explanation of revision risk or validation interpretation.
