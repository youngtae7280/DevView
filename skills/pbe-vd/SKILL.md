---
name: pbe-vd
description: Derive Test Tree from Product, Project, and Work Trees while preserving Verification Design compatibility artifacts.
---

# PBE VD

Use this skill to create Verification Design from WPD output.

In PBE v2, VD derives `.pbe/tree/test-tree.json` from Product, Project, and Work Trees. Existing `.pbe/blueprint/verification-design.json` and `.pbe/blueprint/verification-plan.md` remain compatibility views and must be generated from the Test Tree.

VD is deterministic in Autoflow. Run it automatically after WPD succeeds.

VD owns verification design. It must preserve selected, deferred, foundation, blocked, and out-of-scope classifications from WPD and must not turn deferred implementation into current-slice verification failure.

After generating or updating Test Tree or VerificationDesign compatibility artifacts, run:

```bash
pbe vd check
pbe trace check
```

If either command fails, do not generate ACEP.

## Inputs

```text
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/foundation-contract.md
.pbe/control/surface-completion-ledger.json
.pbe/control/legacy-control-inventory.json
.pbe/control/hardware-readiness-ledger.json
.pbe/control/ui-surface-inventory.json
.pbe/control/component-style-inventory.json
.pbe/control/visual-verification-profile.json
.pbe/blueprint/visual-reference.json
.pbe/blueprint/ui-theme-spec.md
.pbe/blueprint/design-tokens.json
.pbe/blueprint/component-style-contract.json
```

## Outputs

```text
.pbe/tree/test-tree.json
.pbe/blueprint/verification-design.json
.pbe/blueprint/verification-plan.md
.pbe/control/visual-verification-profile.json
.pbe/control/hardware-readiness-ledger.json
.pbe/evidence/screenshots/
```

Prefer v2 tree files when present. If Work Tree scope classifications conflict with WorkGraph or WorkDesign compatibility files, stop and report the mismatch before deriving verification.

## Required Actions

1. Verify WPD completion.
2. Verify Product Tree, Project Tree, and Work Tree links when v2 files exist.
3. Create one Test Tree node for each selected and foundation Work Tree node that needs runnable, manual, UI, integration, regression, or acceptance verification.
4. Create one VerificationDesign compatibility entry for each selected and foundation work unit.
5. Record deferred and out-of-scope verification expectations separately.
6. Synthesize parent and integration verification bottom-up.
7. Create a root-level acceptance plan for the current slice.
7a. When the parity/completeness profile applies, add visual/runtime parity checks for relevant surfaces and update `.pbe/control/visual-verification-profile.json`.
7b. For hardware-dependent Work nodes, record readiness verification state in `.pbe/control/hardware-readiness-ledger.json`.
7c. For commands that open dialogs, popups, subdialogs, or secondary workflows, add Test Tree coverage for the opened surface, visible controls, default values, enabled/disabled states, event handlers, repeated/async behavior, error handling, busy state, and cancel/retry behavior.
7d. For hardware-gated dialogs or actions, require substitute evidence such as mock-backed UI validation, fake read/result validation, UI automation with hardware disabled, or an explicit `manual_not_verified` entry that blocks closure.
7e. When visual UI work is selected, derive screenshot/manual visual evidence checks from `ui-surface-inventory.json`, `design-tokens.json`, and `component-style-contract.json`.
7f. Update `visual-verification-profile.json` with Visual Design Contract checks: contract exists, required states have screenshot/manual evidence, component contract compliance, and visual deviation log coverage.
8. Identify validation command candidates.
9. Identify regression risks, including deferred-module foundation risk.
10. Save `.pbe/tree/test-tree.json`.
11. Save `verification-design.json`.
12. Save `verification-plan.md`.
13. Update Source of Truth Matrix verification links from Product/Project/Work nodes to Test Tree and VerificationDesign nodes.
14. Run `pbe vd close`.
15. Let the CLI validate VD/Test Tree, WPD, visual inventory, and state transition rules before it writes `VD_DONE`, the implementation scope gate, completed steps, next step, and state history.
16. Continue automatically to `pbe-dependency-impact-audit` only if `pbe vd close` succeeds.

## VD Rules

- Do not conduct a long user interview in VD.
- Ask only for conditions that make verification impossible.
- Connect every validation item back to a requirement or work unit.
- Include focused validation, broader regression validation, and manual checks where needed.
- Mark uncertain validation commands as candidates rather than pretending they are guaranteed.
- Every verification item must link to a requirement ID and task/work ID.
- Every non-root Test Tree node must link to at least one Product or Work node through `verifiesProductNodeIds` or `verifiesWorkNodeIds`.
- When source Product nodes have structured `acceptanceCriteria`, Test Tree nodes must link the relevant `verifiesAcceptanceCriteriaIds`.
- When a confirmed criterion has `verification.required: true`, VD must create or map Test Tree coverage for it.
- UI-related work must require UI/UX evidence.
- Visual UI work must require Visual Design Contract evidence, not only UI/UX flow confirmation.
- Required selected UI states from `ui-surface-inventory.json` must appear as Test Tree checks or explicit deferral/blockers.
- Screenshot evidence must be linked through Evidence Tree when the cycle is submitted for review.
- Stale screenshot evidence blocks UI closure.
- Visual parity work must not rely only on build or open smoke. Use screenshot review, popup visual review, runtime coordinate check, resize/DPI review, clipped-control audit, or a not-runnable explanation when relevant.
- Legacy parity work must require inventory comparison evidence or an explicit parity gap/deferred reason.
- Command availability is not workflow verification. If a command opens another surface, the opened surface must have child Test Tree nodes or a recorded blocking not-checked item.
- Required legacy event handlers are verification targets. They cannot be inferred from the existence of visible controls.
- Hardware-dependent work must separate `implemented_user_testable`, `hardware_verification_pending`, and `hardware_certified`; certification requires explicit evidence.
- Hardware-gated work may be software-stable only when substitute evidence exists; `manual_not_verified` must prevent final closure.
- Do not allow a task to reach ACEP without verification links or an explicit explanation.
- Convert confirmed UI/UX direction into verification checks.
- Use WorkGraph nodes and edges to identify integration verification and regression checks.
- Verification must not assume RPD nodes are Codex task boundaries.
- Selected and foundation items require runnable verification or an explicit not-runnable reason.
- Deferred items require a deferral note, future verification hint, and dependency impact note.
- Out-of-scope items require no implementation verification, but must be recorded so they are not accidentally changed.

## Test Tree Shape

Use Test Tree nodes for primary verification intent:

- `unit_test`
- `integration_test`
- `component_test`
- `ui_state_test`
- `manual_check`
- `regression_check`
- `acceptance_check`

Every non-root Test Tree node must include:

- `verifiesProductNodeIds`
- `verifiesProjectNodeIds`
- `verifiesWorkNodeIds`
- `validationCommands`
- `manualChecks`
- `passCriteria`
- `evidenceRequired`
- `partialCompletionEffect`

Set Test Tree status to `planned` unless a validation command is known to be runnable now, in which case `runnable` is acceptable. Use `manual_required`, `deferred`, `not_applicable`, or `blocked` when appropriate. Do not mark `passed` before evidence exists.

## VerificationDesign Shape

Each verification item should include:

- `id`
- `workDesignId`
- `taskId`
- `requirementNodeId`
- `requirementIds`
- `title`
- `acceptanceCriteria`
- `validationCommands`
- `manualChecks`
- `uiUxIds`
- `uiUxEvidenceRequired`
- `regressionRisks`
- `evidenceToCapture`

## Verification Plan Sections

`verification-plan.md` must include:

1. Selected Scope Verification
2. Foundation Verification
3. Deferred Scope Notes
4. Automated Tests
5. Manual Checks
6. UI/UX Evidence Checks
7. Regression Checks
8. Acceptance Checks
9. Not Runnable / Environment-limited Checks

Every verification item must state its linked requirement and task.
When available, it must also state the linked acceptance criteria IDs.
Evidence planning must identify whether evidence should prove Test nodes, acceptance criteria, or both.

For UI/UX verification, include checks for confirmed states, required elements, accessibility expectations, and evidence requirements.

For Visual Design Contract verification, include:

- Visual source and Theme Spec checks
- token usage checks
- Component Style Contract compliance
- required UI state screenshots or manual visual notes
- stale screenshot detection
- recorded visual deviations and disposition

When the parity/completeness profile is active, include:

- Legacy Inventory Checks
- Visual/Runtime Parity Checks
- Hardware Readiness Checks
- Not Runnable Parity or Hardware Checks
- Surface Completion Evidence

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that VD completed and that Dependency Impact Audit is the next automatic step. If the engine stops before Dependency Impact Audit, report that as a blocker or explicit manual pause.

Include:

- number of Test Tree nodes
- number of verification items
- selected/foundation/deferred verification split
- validation command candidates
- known manual checks
- visual/runtime profile summary, when active
- hardware readiness verification summary, when active
- created or updated files
- next automatic step: dependency impact audit
- expected human gate after that: implementation scope

Use `[Codex 메모]` only for short verification rationale or risk notes.
