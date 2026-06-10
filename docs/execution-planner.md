# Execution Planner

Execution Planner is the PBE step after VD, Dependency Impact Audit, Implementation Scope selection, and Architecture Runway approval when required.

It reads WPD's WorkGraph and creates the execution contract that Codex will
follow during ACEP execution.

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

## Outputs

```text
.pbe/blueprint/execution-strategy.md
.pbe/blueprint/execution-strategy.json
```

ACEP generation copies the strategy into:

```text
.pbe/codex-execution-pack/18-execution-strategy.md
.pbe/codex-execution-pack/execution-manifest.json
```

## Responsibility

Execution Planner creates a Task DAG from WorkGraph nodes and dependencies. It
decides which tasks are sequential, which tasks are safe parallel candidates,
which integration tasks are required, and which validation/review tasks close
the pack.

It does not use RPD requirement nodes as direct coding tasks.

It plans selected and foundation scope only. Deferred scope is recorded and protected, not implemented.

## Execution Modes

```text
sequential
parallel_group
integration
review_only
```

## Default Strategy

The default strategy is `staged_parallel`:

1. Foundation phase: sequential.
2. Independent feature implementation: parallel only when safe.
3. Integration phase: sequential and required after every parallel group.
4. Final validation: sequential.
5. Result review: sequential.

## Planner Checks

Execution Planner must verify:

- WorkGraph exists.
- WPD Module Boundary Check was performed.
- implementation scope is selected.
- dependency impact is audited.
- architecture runway approval exists when required foundation or high-impact future module risk exists.
- boundary blockers are resolved or explicitly stop execution planning.
- every parallel group has an integration task.
- every parallel group requires integration evidence and integration pass.
- `expectedFiles` is non-empty for parallel candidates.
- `unknownFileTouchRisk` is not medium/high for parallel candidates.
- group size follows policy or has human approval.
- forbidden shared-risk tasks are not placed in parallel groups.
- final validation and review phases exist.

## Single-Session Fallback

If Codex cannot actually run tasks at the same time, it executes parallel-group
tasks sequentially while preserving the declared dependencies and integration
step. The manifest still records that the tasks are parallel-capable.
