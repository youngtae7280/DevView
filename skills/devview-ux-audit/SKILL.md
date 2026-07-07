---
name: devview-ux-audit
description: Audit Product-linked UI/UX preview, confirmation, Work/Test linkage, task-card UI sections, UI states, evidence, impact, and reopened UI scope.
---

# DevView UX Audit

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after UI/UX confirmation, before execution-pack generation, and before final completion when UI is involved.

UX Audit is deterministic in Autoflow. Run it automatically after Coverage Audit succeeds.

## Purpose

Ensure UI/UX work is confirmed before implementation and remains traceable through Product, Work, Test, execution-pack, evidence, impact, review, and revision.

UX Audit applies to selected UI work and required foundation UI contracts. Deferred UI flows must be documented but must not be implemented by the current execution-pack unless the implementation scope is changed and approved.

In DevView v2, UI/UX audit starts from Product Tree UI nodes and closes only through Test/Evidence coverage.

## Inputs

Prefer v2 files when present:

```text
.devview/tree/product-tree.json
.devview/tree/work-tree.json
.devview/tree/test-tree.json
.devview/execution/cycle-tree.json
.devview/control/impact-tree.json
.devview/control/acceptance-tree.json
.devview/control/legacy-control-inventory.json
.devview/control/surface-completion-ledger.json
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
.devview/control/visual-verification-profile.json
.devview/evidence/evidence-tree.json
.devview/blueprint/visual-reference.json
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
```

Also read compatibility and execution-pack files:

```text
.devview/blueprint/ui-ux-preview.json
.devview/blueprint/ui-ux-confirmation.md
.devview/blueprint/ui-ux-confirmation-log.md
.devview/blueprint/work-design.json
.devview/blueprint/work-graph.json
.devview/blueprint/verification-design.json
.devview/blueprint/source-of-truth-matrix.md
.devview/blueprint/foundation-contract.md
.devview/codex-execution-pack/05-ui-ux-spec.json
.devview/codex-execution-pack/15-ui-ux-evidence-checklist.md
.devview/codex-execution-pack/11-task-cards/
.devview/codex-execution-pack/11-node-execution-contracts/
```

Read paths only when they exist.

## Output

```text
.devview/blueprint/ux-audit.md
```

## Audit Rules

Check UI/UX confirmation:

1. Every selected UI-required Product node, screen, or flow has a preview.
2. Every selected required preview is `confirmed`.
3. Deferred UI previews are recorded as deferred and not implemented.
4. Out-of-scope UI items are recorded as forbidden changes.
5. No UI item is treated as confirmed without user confirmation.
6. Confirmed UX rules are reflected in work-planning/Work Tree.
7. Confirmed UX rules are converted into verification-design/Test Tree verification checks.
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

Check Visual Design Contract coverage when visual appearance changes:

1. Selected visual UI work has `visual-reference.json`.
2. Visual source is one of screenshot, app/site reference, existing project screen, interview-derived, default DevView Clean Theme, or explicit waiver.
3. If not waived or not_required, Theme Spec, Design Tokens, and Component Style Contract exist.
4. Required token groups exist: colors, spacing, radius, typography, border, shadow, and motion.
5. Shared visual component changes are represented in Component Style Inventory and either use tokens or record an approved exception.
6. UI Surface Inventory lists selected surfaces, child surfaces, relevant states, and screenshot/manual evidence requirements.
7. Visual Verification Profile includes required contract checks and no blocking failures.
8. Visual deviations are recorded before review, and unresolved deviations block closure.
9. Stale screenshot evidence blocks closure.

Check parity/completeness UI controls when present:

1. Legacy or parity-critical UI surfaces have visible/enabled inventory before parity is claimed.
2. Surface completion separates technical stability, parity review, and user acceptance.
3. Popup, clipping, alignment, resize/DPI, and runtime coordinate concerns are included in the visual verification profile when they matter.
4. Missing, deferred, blocked, and verification-pending controls remain visible in the surface completion ledger.
5. Commands that open dialogs, popups, subdialogs, or secondary workflows have child surface inventory and child UI verification.
6. Required controls, default values, enable/disable states, and event handlers are checked for opened surfaces, not inferred from the parent command.
7. Hardware-gated UI actions have mock-backed, fake-result, UI-automation, or explicit blocking manual-not-verified evidence before closure.
8. Blocking `notChecked` UI items prevent final UX audit pass.
9. A visual mismatch feedback item can trigger surface re-audit and verification expansion, but implementation scope must remain bounded by Change/Impact and selected/foundation Work nodes.

If gaps exist, report them as blocking issues before execution-pack generation or final completion.

## Autoflow

When the audit passes or UI/UX is not required:

- Run `devview ux audit complete`.
- Let the CLI keep state on the current valid workflow point, record the UX-audit checkpoint, and report the next command.
- Continue automatically to execution-pack generation.

When the audit has blocking issues:

- Keep the workflow on the last valid canonical state reported by the CLI.
- Do not write `autoflow.lastFailure` by hand; follow the CLI issue output, `suggestedFix`, and `nextCommand`.
- Do not continue to execution-pack generation.
- Show the Autoflow failure guidance.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether the audit passed and DevView is continuing automatically to execution-pack generation, or whether blocking UX issues stopped Autoflow.

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
- surface completion ledger result, when active
- dialog/subdialog and not-checked UI result, when active
- legacy inventory and visual profile result, when active
- Visual Design Contract source, token, component, surface, and screenshot evidence result when visual UI work is active
- blocking issues
- pass/fail result
- next automatic step when passed: Generate execution-pack
- user reply examples when blocked

Use `[Codex 硫붾え]` only for short explanation of UX risk.
