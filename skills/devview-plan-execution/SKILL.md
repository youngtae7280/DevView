---
name: devview-plan-execution
description: Select a safe Cycle Slice from Product, Project, Work, and Test Trees, then plan staged parallel Codex execution from work-planning WorkGraph, verification-design, traceability, and UI/UX confirmation artifacts.
---

# DevView Plan Execution

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill after work-planning and verification-design, and before execution-pack generation.

Execution planning is deterministic in Autoflow. Run it automatically after verification-design succeeds, dependency impact is audited, implementation scope is selected, and architecture runway is approved when required.

Graph-first boundary: Plan Execution, Cycle Tree, Cycle Contract, execution strategy, and execution-pack packaging remain
tree-control compatibility/execution layers. They do not promote Graph-source authority, retire tree-native artifacts,
or replace read-model projection evidence.

In DevView v2, Plan Execution selects the active Cycle Slice. It must write `.devview/execution/cycle-tree.json` and `.devview/execution/cycle-contract.md` before execution-pack generation. Existing `.devview/blueprint/execution-strategy.json` and `.devview/blueprint/execution-strategy.md` remain compatibility strategy views for execution-pack and older workflows.

The execution planner does not reinterpret product-intake/Product Tree nodes as coding tasks. It reads Product, Project, Work, and Test Trees plus the work-planning WorkGraph, then creates a staged execution strategy with sequential foundation work, safe parallel groups, required integration tasks, and final validation.

## Inputs

Prefer v2 tree files when present:

```text
.devview/tree/product-tree.json
.devview/tree/project-tree.json
.devview/tree/work-tree.json
.devview/tree/test-tree.json
.devview/control/decision-queue.json
```

Also read compatibility and audit artifacts:

```text
.devview/blueprint/work-design.json
.devview/blueprint/work-graph.json
.devview/blueprint/verification-design.json
.devview/blueprint/traceability-matrix.json
.devview/blueprint/ui-ux-confirmation.md
.devview/blueprint/source-of-truth-matrix.md
.devview/blueprint/foundation-contract.md
.devview/blueprint/parallel-safety-contract.md
.devview/blueprint/dependency-impact-audit.json
.devview/blueprint/dependency-impact-audit.md
```

Use `work-design.json.workGraph` if a standalone `work-graph.json` is not present.

## Outputs

Primary v2 execution artifacts:

```text
.devview/execution/cycle-tree.json
.devview/execution/cycle-contract.md
```

Compatibility execution strategy artifacts:

```text
.devview/blueprint/execution-strategy.md
.devview/blueprint/execution-strategy.json
```

These outputs are later copied or rendered into:

```text
.devview/codex-execution-pack/18-execution-strategy.md
.devview/codex-execution-pack/22-cycle-contract.md
.devview/codex-execution-pack/execution-manifest.json
```

## Required Actions

1. Read Product, Project, Work, and Test Trees when present.
2. Read the WorkGraph from `work-graph.json` or `work-design.json`.
3. Read `verification-design.json`.
4. Read `traceability-matrix.json` when present.
5. Read UI/UX confirmation status.
6. Verify work-planning Module Boundary Check has been performed.
7. Verify all boundary blockers are resolved or explicitly block execution planning.
8. Verify implementation scope classification is explicit: selected, deferred, foundation, blocked, and out_of_scope.
9. Verify `dependency-impact-audit.json` exists and dependency impact decisions are recorded.
10. Verify architecture runway decisions are recorded when required by Dependency Impact Audit.
11. Select the smallest safe Cycle Slice from selected/foundation Product, Project, Work, and Test nodes.
12. Explicitly list deferred, blocked, and out-of-scope nodes as excluded from the Cycle Slice.
13. Classify WorkGraph nodes into foundation, feature, integration, verification, documentation, and review work.
14. Build a Task DAG from WorkGraph dependencies.
15. Create sequential foundation phases.
16. Create safe parallel groups only for independent selected feature nodes inside the active Cycle Slice.
17. Create or confirm one integration task for every parallel group.
18. Create final validation and review phases.
19. Save `.devview/execution/cycle-tree.json`.
20. Save `.devview/execution/cycle-contract.md`.
21. Save `execution-strategy.md`.
22. Save `execution-strategy.json`.
23. Ensure generated artifact paths are referenced by the relevant tree, blueprint, and execution artifacts.
24. Run `devview plan execution complete`.
25. Let the CLI keep state on the current valid workflow point, record the execution-planning checkpoint, and report the next command; do not edit `.devview/blueprint/devview-state.json` directly.
26. Continue automatically to Coverage Audit only if the CLI command succeeds.

## Cycle Slice Rules

The active Cycle Slice must include only nodes that can be safely implemented and verified now.

Every cycle entry in `.devview/execution/cycle-tree.json` must include:

- `id`
- `goal`
- `status`
- `includedProductNodeIds`
- `includedProjectNodeIds`
- `includedWorkNodeIds`
- `includedTestNodeIds`
- `explicitlyExcludedNodeIds`
- `requiresChangeNode`
- `requiredEvidence`
- `closeCriteria`

The Cycle Contract must include:

- cycle ID and goal
- included Product, Project, Work, and Test nodes
- explicitly excluded deferred, blocked, and out-of-scope nodes
- allowed local changes
- changes that require a Change Node
- required evidence
- close criteria
- rollback plan
- parallel safety summary

Do not select a Work node without linked Product/Project scope. Do not select a Test node that verifies excluded Work/Product nodes unless it is an explicitly required regression check.

Partial implementation is allowed. DevView must mark only included Product nodes as eligible for satisfaction. Excluded nodes remain untouched, deferred, blocked, or out_of_scope.

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

If actual parallel execution is not available in the Codex environment, execute parallel-group tasks sequentially while preserving declared dependencies and the integration task.

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
- Deferred nodes must not become implementation tasks in this execution-pack.
- Blocked nodes stop execution planning.
- Out-of-scope nodes must appear only as forbidden or watch-list items.
- Only Work and Test nodes included in the active Cycle Slice can become current execution-pack tasks.
- Excluded nodes are protected scope; touching them requires a Change Node or a new scope decision.

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

- Product, Work, or Test Tree is missing when v2 mode is active.
- WorkGraph is missing.
- work-planning Module Boundary Check is missing.
- Dependency Impact Audit artifact is missing.
- selected Cycle Slice has no included Work node or no included Test node without an explicit not-runnable reason.
- selected Work/Test node lacks Product or Project derivation.
- boundary blockers are unresolved.
- a parallel group has no integration task.
- a parallel candidate would change shared schema, shared type, build config, auth, permissions, migration, package configuration, or the same files as another parallel task.
- `expectedFiles` is empty for a parallel candidate.
- `unknownFileTouchRisk` is medium or high for a parallel candidate.
- a foundation task is proposed for parallel execution outside documentation/test-fixture work.
- parallel group size exceeds policy without human approval.
- final validation cannot be planned.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether DevView is continuing automatically to Coverage Audit or stopping because execution planning found a blocker.

Include:

- active cycle ID
- included/excluded Product, Project, Work, and Test node counts
- phases created
- parallel groups created
- integration tasks created
- selected/deferred/foundation/blocked/out_of_scope task counts
- parallel policy applied
- tasks forced to sequential execution and why
- stop conditions or blockers
- created or updated files
- cycle contract path
- next automatic step: coverage audit
- expected downstream path: Coverage Audit -> UX Audit -> Generate execution-pack -> Run execution-pack

Use `[Codex 硫붾え]` only for short explanation of staged parallel choices.
