---
name: pbe-coverage-audit
description: Audit Product, Project, Work, Test, Cycle, traceability, evidence, impact, acceptance, and compatibility coverage before ACEP generation or completion.
---

# PBE Coverage Audit

Use this skill before ACEP generation and before final completion.

Coverage Audit is deterministic in Autoflow. Run it automatically after Execution Planner succeeds.

## Purpose

Find missing links between Product, Project, Work, Test, Cycle, requirements, tasks, verification, evidence, impact, and acceptance.

Coverage Audit evaluates the current selected slice plus required foundation. Deferred and out-of-scope items must be documented, but they are not current-slice failures unless they are incorrectly implemented or missing required foundation.

In PBE v2, coverage is branch closure:

```text
Product branch -> Project boundary -> Work node -> Test node -> Evidence node -> Acceptance branch
```

## Inputs

Prefer v2 files when present:

```text
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
.pbe/execution/cycle-tree.json
.pbe/execution/cycle-contract.md
.pbe/control/change-tree.json
.pbe/control/impact-tree.json
.pbe/control/acceptance-tree.json
.pbe/evidence/evidence-tree.json
```

Also read compatibility artifacts:

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/verification-design.json
.pbe/blueprint/traceability-matrix.json
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/parallel-safety-contract.md
.pbe/blueprint/execution-strategy.json
.pbe/codex-execution-pack/execution-manifest.json
.pbe/codex-execution-pack/11-task-cards/
.pbe/codex-execution-pack/11-node-execution-contracts/
.pbe/codex-execution-pack/22-cycle-contract.md
```

Read ACEP paths only when they exist.

## Output

```text
.pbe/blueprint/coverage-audit.md
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
14. `.pbe/evidence/evidence-tree.json` links each evidence item to real Product, Work, Test, Change, or review nodes.

When possible, run or mirror:

```bash
npm run validate:pbe:v2
```

Do not allow ACEP generation, result submission, or branch closure while blocking coverage gaps remain.

## Repair Loop

If gaps exist:

```text
Audit -> Missing item -> Repair suggestion -> Update tree/WPD/VD/Task/Traceability/Evidence -> Re-audit
```

Do not allow ACEP generation or final completion while blocking coverage gaps remain.

## Autoflow

When the audit passes:

- Set `pbe-state.json.autoflow.state` to `COVERAGE_AUDITED`.
- Add `coverage_audit` to `autoflow.completedSteps`.
- Set `autoflow.nextStep` to `ux_audit`.
- Continue automatically to UX Audit.

When the audit has blocking issues:

- Set `autoflow.state` to `BLOCKED`.
- Record `autoflow.lastFailure.failedStep` as `coverage_audit`.
- Do not continue to UX Audit.
- Show the Autoflow failure guidance.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether the audit passed and PBE is continuing automatically to UX Audit, or whether blocking coverage issues stopped Autoflow.

Include:

- blocking issues
- non-blocking warnings
- active cycle coverage result
- Product/Project/Work/Test closure result
- Evidence Tree result
- Change/Impact/Reopen result
- Acceptance Tree guard result
- selected/foundation coverage result
- deferred/out-of-scope documentation result
- parallel safety coverage result
- repair suggestions
- files inspected
- pass/fail result
- next automatic step when passed: UX Audit
- user reply examples when blocked

Use `[Codex 메모]` only for short explanation of coverage risk.
