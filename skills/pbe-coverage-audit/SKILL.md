---
name: pbe-coverage-audit
description: Audit requirement, work, verification, task, traceability, and evidence coverage before ACEP generation or completion.
---

# PBE Coverage Audit

Use this skill before ACEP generation and before final completion.

Coverage Audit is deterministic in Autoflow. Run it automatically after
Execution Planner succeeds.

## Purpose

Find missing links between requirements, work tasks, verification, and evidence.

Coverage Audit evaluates the current selected slice plus required foundation. Deferred and out-of-scope items must be documented, but they are not current-slice failures unless they are incorrectly implemented or missing required foundation.

## Inputs

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
```

Read ACEP paths only when they exist.

## Output

```text
.pbe/blueprint/coverage-audit.md
```

## Audit Rules

Check:

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

## Repair Loop

If gaps exist:

```text
Audit -> Missing item -> Repair suggestion -> Update WPD/VD/Task/Traceability -> Re-audit
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
- selected/foundation coverage result
- deferred/out-of-scope documentation result
- parallel safety coverage result
- repair suggestions
- files inspected
- pass/fail result
- next automatic step when passed: UX Audit
- user reply examples when blocked

Use `[Codex 메모]` only for short explanation of coverage risk.
