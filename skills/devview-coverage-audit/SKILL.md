---
name: devview-coverage-audit
description: Audit Product, Project, Work, Test, Cycle, traceability, evidence, impact, acceptance, and compatibility coverage before execution-pack generation or completion.
---

# DevView Coverage Audit

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill before execution-pack generation and before final completion.

Coverage Audit is deterministic in Autoflow. Run it automatically after Execution Planner succeeds.

## Purpose

Find missing links between Product, Project, Work, Test, Cycle, requirements, tasks, verification, evidence, impact, and acceptance.

Coverage Audit evaluates the current selected slice plus required foundation. Deferred and out-of-scope items must be documented, but they are not current-slice failures unless they are incorrectly implemented or missing required foundation.

In DevView v2, coverage is branch closure:

```text
Product branch -> Project boundary -> Work node -> Test node -> Evidence node -> Acceptance branch
```

## Inputs

Prefer v2 files when present:

```text
.devview/tree/product-tree.json
.devview/tree/project-tree.json
.devview/tree/work-tree.json
.devview/tree/test-tree.json
.devview/execution/cycle-tree.json
.devview/execution/cycle-contract.md
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

Also read compatibility artifacts:

```text
.devview/blueprint/requirement-tree.json
.devview/blueprint/work-design.json
.devview/blueprint/work-graph.json
.devview/blueprint/verification-design.json
.devview/blueprint/traceability-matrix.json
.devview/blueprint/source-of-truth-matrix.md
.devview/blueprint/foundation-contract.md
.devview/blueprint/parallel-safety-contract.md
.devview/blueprint/execution-strategy.json
.devview/codex-execution-pack/execution-manifest.json
.devview/codex-execution-pack/11-task-cards/
.devview/codex-execution-pack/11-node-execution-contracts/
.devview/codex-execution-pack/22-cycle-contract.md
```

Read execution-pack paths only when they exist.

## Output

```text
.devview/blueprint/coverage-audit.md
```

## Audit Rules

Check compatibility coverage:

1. Every selected requirement has a linked work task.
2. Every foundation item has a linked foundation task or explicit approved not-needed reason.
3. Every deferred requirement has a deferral reason and future verification note.
4. Every out-of-scope item is marked so execution cannot change it accidentally.
5. Every selected/foundation work task has linked verification or an explicit explanation.
6. Every selected/foundation verification item has evidenceRequired or not-runnable explanation.
7. Every task card has Requirement Links.
8. Every task card has Verification Links or explanation.
9. Every task in `execution-manifest.json` has `requirementIds`, `verificationIds` or `verificationExplanation`, and `evidenceRequired`.
10. Traceability matrix has no unresolved pending item without explanation.
11. WorkGraph exists and includes Module Boundary Check output before parallel planning.
12. Every WorkGraph node includes `expectedFiles`, `expectedSharedFiles`, `forbiddenFiles`, `unknownFileTouchRisk`, and `affectedDomains`.
13. Every parallel group in `execution-manifest.json` has an integration task.
14. Every parallel group requires integration evidence and cannot complete without integration pass.
15. Parallel group tasks do not include forbidden shared-risk work.
16. Integration tasks have verification and evidence requirements.

Check v2 tree closure:

1. Every selected/foundation Product node in the active cycle has derived Project or Work coverage.
2. Every selected/foundation Work node derives from Product nodes and, when applicable, Project nodes.
3. Every included Work node in the active cycle has included Test Tree coverage.
4. Every included Test node verifies Product or Work nodes.
5. Every included Test node requires evidence.
6. Submitted-for-review or accepted cycles have no included Test nodes in `planned`, `runnable`, `failed`, `blocked`, `stale`, or `invalidated` state.
7. Submitted-for-review or accepted cycles have attached or replaced Evidence Tree evidence for every included Test node.
8. Evidence with `stale_evidence`, `required`, or `not_available` status does not close Product or Test nodes.
9. Acceptance Tree branches with `accepted_done` have user acceptance metadata and current evidence.
10. No accepted Product branch has unresolved Impact Tree entries.
11. Reopened Product branches are not reported as accepted or complete.
12. Change Tree entries that affect selected/foundation scope are either resolved, approved with Impact Tree coverage, or blocking.
13. Impact Tree entries with `reopened`, `invalidated`, `requires_retest`, `requires_new_evidence`, or `requiredAction: human_decision` block completion until handled.
14. `.devview/evidence/evidence-tree.json` links each evidence item to real Product, Work, Test, Change, or review nodes.

Check parity/completeness controls when present:

1. Surface completion ledger links each selected/foundation surface to Product, Work, Test, and Evidence nodes or records an explicit gap.
2. `technical_stable`, `parity_reviewed`, and `product_accepted` are not collapsed into one completion state.
3. Parity cannot be claimed without a linked legacy inventory for legacy migration or parity-critical surfaces.
4. Legacy inventory controls with `visible_enabled` and `requiredForParity: true` are not left `missing` or `unverified` while the surface claims `parity_reviewed`.
5. Legacy event handlers with `requiredForParity: true` are not left `missing` or `unverified` while the surface claims `technical_stable`, `parity_reviewed`, or `product_accepted`.
6. Commands that open dialogs, popups, subdialogs, or secondary workflows have child surface inventory, child Work/Test nodes, and evidence for opened controls and behavior.
7. `command_mapped` items do not close workflow parity without `dialog_surface_complete`, `workflow_behavior_complete`, `mock_verified`, or `hardware_user_testable` evidence.
8. Hardware-gated surfaces have mock-backed UI, fake result, UI automation with hardware disabled, or explicit `manual_not_verified` blocking entries.
9. Any `notChecked` item with `blocksCompletion: true` blocks `technical_stable`, `parity_reviewed`, and `product_accepted`.
10. Hardware features marked `hardware_certified` have certification evidence.
11. Visual verification profiles marked `required` have passed checks or explicit not-runnable evidence/reasons.
12. Verification miss log entries with repeated occurrences or `legacy_subdialog_control_miss` are promoted, blocked, or waiting on a human decision; they are not ignored as ordinary warnings.
13. Ledger findings may expand audit and verification scope, but implementation scope still requires Product/Project/Work nodes and approved Change/Impact flow.

When possible, run or mirror:

```bash
npm run validate:devview:legacy-tree
```

Do not allow execution-pack generation, result submission, or branch closure while blocking coverage gaps remain.

## Repair Loop

If gaps exist:

```text
Audit -> Missing item -> Repair suggestion -> Update tree/work-planning/verification-design/Task/Traceability/Evidence -> Re-audit
```

Do not allow execution-pack generation or final completion while blocking coverage gaps remain.

## Autoflow

When the audit passes:

- Run `devview coverage audit complete`.
- Let the CLI keep state on the current valid workflow point, record the coverage-audit checkpoint, and report the next command.
- Continue automatically to UX Audit.

When the audit has blocking issues:

- Keep the workflow on the last valid canonical state reported by the CLI.
- Do not write `autoflow.lastFailure` by hand; follow the CLI issue output, `suggestedFix`, and `nextCommand`.
- Do not continue to UX Audit.
- Show the Autoflow failure guidance.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether the audit passed and DevView is continuing automatically to UX Audit, or whether blocking coverage issues stopped Autoflow.

Include:

- blocking issues
- non-blocking warnings
- active cycle coverage result
- Product/Project/Work/Test closure result
- Evidence Tree result
- Change/Impact/Reopen result
- Acceptance Tree guard result
- parity/completeness ledger result, when active
- dialog/subdialog inventory and event-handler result, when active
- not-checked blocking items, when active
- hardware readiness result, when active
- verification miss promotion result, when active
- selected/foundation coverage result
- deferred/out-of-scope documentation result
- parallel safety coverage result
- repair suggestions
- files inspected
- pass/fail result
- next automatic step when passed: UX Audit
- user reply examples when blocked

Use `[Codex 硫붾え]` only for short explanation of coverage risk.
