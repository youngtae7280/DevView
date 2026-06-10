---
name: pbe-ux-audit
description: Audit UI/UX preview, confirmation, WPD/VD linkage, task-card UI sections, states, and evidence requirements.
---

# PBE UX Audit

Use this skill after UI/UX confirmation, before ACEP generation, and before final completion when UI is involved.

UX Audit is deterministic in Autoflow. Run it automatically after Coverage
Audit succeeds.

## Purpose

Ensure UI/UX work is confirmed before implementation and remains traceable through WPD, VD, ACEP, evidence, and review.

UX Audit applies to selected UI work and required foundation UI contracts. Deferred UI flows must be documented but must not be implemented by the current ACEP unless the implementation scope is changed and approved.

## Inputs

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
```

Read paths only when they exist.

## Output

```text
.pbe/blueprint/ux-audit.md
```

## Audit Rules

Check:

1. Every selected UI-required screen or flow has a preview.
2. Every selected required preview is `confirmed`.
3. Deferred UI previews are recorded as deferred and not implemented.
4. Out-of-scope UI items are recorded as forbidden changes.
5. No UI item is treated as confirmed without user confirmation.
6. Confirmed UX rules are reflected in WPD.
7. Confirmed UX rules are converted into VD verification checks.
8. Foundation UI contracts are named without implementing deferred UI behavior.
9. UI task cards include Approved UI/UX Direction.
10. UI task cards include UI/UX Non-Scope.
11. UI task cards include UI/UX Evidence Required.
12. Required selected UI states are not missing.
13. Evidence checklist exists for selected UI work.
14. Parallel integration tasks include UI/UX consistency checks when any group task changes UI.

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
- confirmation status summary
- selected/deferred/foundation UI split
- missing states
- missing evidence
- blocking issues
- pass/fail result
- next automatic step when passed: Generate ACEP
- user reply examples when blocked

Use `[Codex 메모]` only for short explanation of UX risk.
