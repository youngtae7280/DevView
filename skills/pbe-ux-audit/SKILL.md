---
name: pbe-ux-audit
description: Audit Product-linked UI/UX preview, confirmation, Work/Test linkage, task-card UI sections, UI states, evidence, impact, and reopened UI scope.
---

# PBE UX Audit

Use this skill after UI/UX confirmation, before ACEP generation, and before final completion when UI is involved.

UX Audit is deterministic in Autoflow. Run it automatically after Coverage Audit succeeds.

## Purpose

Ensure UI/UX work is confirmed before implementation and remains traceable through Product, Work, Test, ACEP, evidence, impact, review, and revision.

UX Audit applies to selected UI work and required foundation UI contracts. Deferred UI flows must be documented but must not be implemented by the current ACEP unless the implementation scope is changed and approved.

In PBE v2, UI/UX audit starts from Product Tree UI nodes and closes only through Test/Evidence coverage.

## Inputs

Prefer v2 files when present:

```text
.pbe/tree/product-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
.pbe/execution/cycle-tree.json
.pbe/control/impact-tree.json
.pbe/control/acceptance-tree.json
.pbe/evidence/evidence-tree.json
```

Also read compatibility and ACEP files:

```text
.pbe/blueprint/ui-ux-preview.json
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/ui-ux-confirmation-log.md
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/verification-design.json
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/foundation-contract.md
.pbe/codex-execution-pack/05-ui-ux-spec.json
.pbe/codex-execution-pack/15-ui-ux-evidence-checklist.md
.pbe/codex-execution-pack/11-task-cards/
.pbe/codex-execution-pack/11-node-execution-contracts/
```

Read paths only when they exist.

## Output

```text
.pbe/blueprint/ux-audit.md
```

## Audit Rules

Check UI/UX confirmation:

1. Every selected UI-required Product node, screen, or flow has a preview.
2. Every selected required preview is `confirmed`.
3. Deferred UI previews are recorded as deferred and not implemented.
4. Out-of-scope UI items are recorded as forbidden changes.
5. No UI item is treated as confirmed without user confirmation.
6. Confirmed UX rules are reflected in WPD/Work Tree.
7. Confirmed UX rules are converted into VD/Test Tree verification checks.
8. Foundation UI contracts are named without implementing deferred UI behavior.

Check task and contract coverage:

1. UI task cards include Approved UI/UX Direction.
2. UI task cards include UI/UX Non-Scope.
3. UI task cards include UI/UX Evidence Required.
4. Node Execution Contracts for UI work link Product, Work, Test, and Evidence nodes.
5. Required selected UI states are not missing.
6. Evidence checklist exists for selected UI work.
7. Parallel integration tasks include UI/UX consistency checks when any group task changes UI.

Check v2 UI closure:

1. Product Tree nodes of type `ui_surface` or `ui_state` have linked Work nodes or explicit deferral/out-of-scope reason.
2. UI Work nodes have Test Tree nodes of type `ui_state_test`, `component_test`, `manual_check`, or relevant acceptance/regression checks.
3. UI Test nodes have required evidence.
4. Evidence Tree contains attached or replaced screenshot/manual_note/test_output evidence for required UI states when the cycle is submitted for review.
5. Stale UI evidence blocks branch acceptance.
6. Impact Tree entries for UI nodes with `reopened`, `invalidated`, `requires_retest`, `requires_new_evidence`, or `requiredAction: human_decision` block completion until handled.
7. Accepted UI branches must not have reopened Product nodes or stale evidence.
8. Deferred or out-of-scope UI nodes are not included in the active Cycle Slice.

If gaps exist, report them as blocking issues before ACEP generation or final completion.

## Autoflow

When the audit passes or UI/UX is not required:

- Set `pbe-state.json.autoflow.state` to `UX_AUDITED`.
- Add `ux_audit` to `autoflow.completedSteps`.
- Set `autoflow.nextStep` to `generate_acep`.
- Continue automatically to ACEP generation.

When the audit has blocking issues:

- Set `autoflow.state` to `BLOCKED`.
- Record `autoflow.lastFailure.failedStep` as `ux_audit`.
- Do not continue to ACEP generation.
- Show the Autoflow failure guidance.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether the audit passed and PBE is continuing automatically to ACEP generation, or whether blocking UX issues stopped Autoflow.

Include:

- screens/flows audited
- Product UI node coverage
- confirmation status summary
- selected/deferred/foundation UI split
- missing states
- missing Work/Test links
- missing or stale evidence
- Impact/Reopen UI issues
- Acceptance Tree UI guard result
- blocking issues
- pass/fail result
- next automatic step when passed: Generate ACEP
- user reply examples when blocked

Use `[Codex 메모]` only for short explanation of UX risk.
