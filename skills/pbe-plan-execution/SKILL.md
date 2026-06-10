---
name: pbe-plan-execution
description: Plan staged parallel Codex execution from WPD WorkGraph, VD, traceability, and UI/UX confirmation artifacts.
---

# PBE Plan Execution

Use this skill after WPD and VD, and before ACEP generation.

Execution planning is deterministic in Autoflow. Run it automatically after VD
succeeds, dependency impact is audited, implementation scope is selected, and architecture runway is approved when required.

The execution planner does not reinterpret RPD nodes as coding tasks. It reads
the WPD WorkGraph and creates a staged execution strategy with sequential
foundation work, safe parallel groups, required integration tasks, and final
validation.

## Inputs

```text
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/verification-design.json
.pbe/blueprint/traceability-matrix.json
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/parallel-safety-contract.md
```

Use `work-design.json.workGraph` if a standalone `work-graph.json` is not
present.

## Outputs

```text
.pbe/blueprint/execution-strategy.md
.pbe/blueprint/execution-strategy.json
```

These outputs are later copied or rendered into:

```text
.pbe/codex-execution-pack/18-execution-strategy.md
.pbe/codex-execution-pack/execution-manifest.json
```

## Required Actions

1. Read the WorkGraph from `work-graph.json` or `work-design.json`.
2. Read `verification-design.json`.
3. Read `traceability-matrix.json` when present.
4. Read UI/UX confirmation status.
5. Verify WPD Module Boundary Check has been performed.
6. Verify all boundary blockers are resolved or explicitly block execution planning.
7. Verify implementation scope classification is explicit: selected, deferred, foundation, blocked, and out_of_scope.
8. Verify dependency impact and architecture runway decisions are recorded.
9. Classify WorkGraph nodes into foundation, feature, integration, verification, documentation, and review work.
10. Build a Task DAG from WorkGraph dependencies.
11. Create sequential foundation phases.
12. Create safe parallel groups only for independent selected feature nodes.
13. Create or confirm one integration task for every parallel group.
14. Create final validation and review phases.
15. Save `execution-strategy.md`.
16. Save `execution-strategy.json`.
17. Update `pbe-state.json` artifact references when available.
18. Update `pbe-state.json.autoflow.state` to `PLAN_EXECUTED`.
19. Add `plan_execution` to `autoflow.completedSteps`.
20. Set `autoflow.nextStep` to `coverage_audit`.
21. Continue automatically to Coverage Audit unless a blocker exists.

## Execution Modes

Use these modes:

```text
sequential
parallel_group
integration
review_only
```

Mode meanings:

- `sequential`: must run in order.
- `parallel_group`: may run in parallel with other tasks in the same declared group.
- `integration`: combines and validates results from a parallel group.
- `review_only`: audits, evidence updates, final coverage checks, or reporting.

## Default Strategy

The default strategy is `staged_parallel`:

1. Foundation phase: sequential.
2. Independent feature phase: parallel when safe.
3. Integration task after every parallel group.
4. Final validation phase: sequential.
5. Result review phase: sequential.

If actual parallel execution is not available in the Codex environment, execute
parallel-group tasks sequentially while preserving declared dependencies and the
integration task.

Parallel policy defaults:

```text
default = sequential
maxInitialParallelGroupSize = 2
maxMatureParallelGroupSize = 3
moreThanMaxRequiresHumanApproval = true
```

Groups larger than the initial maximum require an explicit `humanApprovalReference`.

## Scope Rules

- Selected nodes can become implementation tasks.
- Foundation nodes can become sequential foundation tasks.
- Deferred nodes must not become implementation tasks in this ACEP.
- Blocked nodes stop execution planning.
- Out-of-scope nodes must appear only as forbidden or watch-list items.

## Parallel Eligibility

A task may enter a parallel group only when:

- all dependencies are resolved before group start
- shared foundation tasks are planned first
- `expectedFiles` is non-empty and specific
- `unknownFileTouchRisk` is `none` or `low`
- expected files do not overlap with another task in the group
- expected shared files do not overlap with another task in the group
- it does not modify shared types, schemas, build config, auth, permissions, migrations, payment logic, or package configuration
- scope and non-scope are clear
- focused validation is possible
- conflict risk is `low` or controlled `medium`
- the task belongs to an explicit parallel group
- the group has an integration task
- rollback path is available

Do not parallelize when write sets are unknown.

## Parallel Forbidden

Do not place these tasks in a parallel group:

- database schema changes
- migrations
- auth or permission changes
- payment logic changes
- secret or API key handling
- shared type or schema changes
- shared component, design system, or theme changes
- global routing changes
- `package.json` or dependency changes
- build or test configuration changes
- public API contract changes
- work likely to modify the same file as another task
- unclear scope
- difficult rollback
- high security, data, or release risk

These tasks must be `sequential` or `integration`.

## Integration Task Rules

Every parallel group must have one integration task.

The integration task must:

1. Inspect all task results from the group.
2. Resolve file conflicts or duplicated implementation.
3. Check shared type and API contract consistency.
4. Check routing and navigation connections.
5. Check UI/UX consistency against confirmation artifacts.
6. Run focused validation.
7. Run broader validation when needed.
8. Update traceability and evidence notes.
9. Report remaining risks and known issues.

Every parallel group must set:

```text
integrationEvidenceRequired: true
groupCannotCompleteWithoutIntegrationPass: true
status: planned
```

Every task inside a parallel group must set:

```text
dependencyResolved: true
writeSetKnown: true
rollbackPathAvailable: true
```

## Stop Conditions

Stop before producing an executable strategy when:

- WorkGraph is missing.
- WPD Module Boundary Check is missing.
- boundary blockers are unresolved.
- a parallel group has no integration task.
- a parallel candidate would change shared schema, shared type, build config, auth, permissions, migration, package configuration, or the same files as another parallel task.
- `expectedFiles` is empty for a parallel candidate.
- `unknownFileTouchRisk` is medium or high for a parallel candidate.
- a foundation task is proposed for parallel execution outside documentation/test-fixture work.
- parallel group size exceeds policy without human approval.
- final validation cannot be planned.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether PBE is continuing automatically to Coverage Audit or stopping because execution planning found a blocker.

Include:

- phases created
- parallel groups created
- integration tasks created
- selected/deferred/foundation/blocked/out_of_scope task counts
- parallel policy applied
- tasks forced to sequential execution and why
- stop conditions or blockers
- created or updated files
- next automatic step: coverage audit
- expected downstream path: Coverage Audit -> UX Audit -> Generate ACEP -> Run ACEP

Use `[Codex 메모]` only for short explanation of staged parallel choices.
