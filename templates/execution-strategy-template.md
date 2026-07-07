# Codex Execution Strategy

## Default Mode

Use `staged_parallel` execution only when tasks are independent and explicitly assigned to a parallel group.

If the Codex environment does not support actual parallel execution, run tasks inside a parallel group sequentially while preserving the declared dependencies and integration task.

## Scope

Execute selected and foundation scope only.

Deferred and out-of-scope behavior must not be implemented unless the user changes scope at a human gate.

## Execution Phases

- Foundation: sequential
- Feature implementation: parallel only when safe
- Integration: sequential
- Final validation: sequential
- Result review: sequential

## Parallel Policy

```text
default = sequential
maxInitialParallelGroupSize = 2
maxMatureParallelGroupSize = 3
moreThanMaxRequiresHumanApproval = true
```

## Parallelization Rules

A task may run in parallel only if:

- it has no unresolved dependency
- `expectedFiles` is non-empty and specific
- `unknownFileTouchRisk` is `none` or `low`
- it does not modify the same files as another parallel task
- it does not change shared schema, shared types, build config, auth, permissions, migrations, payment logic, or package configuration
- it has clear scope and non-scope
- it has independent focused validation
- rollback path is available
- it belongs to a declared parallel group
- the parallel group has an integration task
- the parallel group requires integration evidence and integration pass

## Parallelization Forbidden

Do not run tasks in parallel if they involve:

- unknown write set
- database migrations
- auth or permission logic
- payment logic
- secret or API key handling
- shared design system or theme changes
- shared type or schema changes
- global routing
- package or dependency changes
- build or test configuration
- public API contract changes
- same file ownership
- unclear scope
- difficult rollback
- high security, data, or release risk
- foundation work unless documentation/test-fixture only

## Integration Rule

Every parallel group must have an integration task.

The integration task must:

- inspect all changes from the group
- resolve conflicts
- check shared type and API contract consistency
- check routing and navigation connections
- check UI/UX consistency against confirmed direction
- run focused validation
- run broader validation when needed
- update traceability and evidence
- report remaining risks

The group cannot be marked complete without integration evidence and integration pass.

## Stop Conditions

Stop when:

- WorkGraph is missing
- work-planning Module Boundary Check is missing
- boundary blockers are unresolved
- a parallel group lacks an integration task
- a parallel group lacks integration evidence requirement
- a parallel task requires forbidden shared changes
- tasks in the same parallel group may modify the same file
- final validation cannot be planned
