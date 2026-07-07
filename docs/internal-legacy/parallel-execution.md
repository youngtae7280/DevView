# Parallel Execution

PBE supports a staged parallel execution strategy for Codex, but only after WPD has converted requirements into a
module-aware WorkGraph.

## RPD Nodes Are Not Coding Tasks

An RPD requirement node is a user-intent unit, not a Codex coding task.

Examples:

- One RPD node may split into domain, UI, validation, persistence, and evidence tasks.
- Several RPD nodes may share one foundation task.
- A parent RPD node may become an integration task.
- A UI/UX node may produce both implementation and verification tasks.

The transformation is:

```text
RPD Requirement Tree
-> WPD WorkGraph
-> Execution Planner Task DAG
-> ACEP Task Cards
-> Codex Coding Tasks
```

## Module Boundary Check

Module Boundary Check is part of WPD. It is not a separate MVP skill.

It identifies:

- shared foundations
- feature candidates
- integration points
- same-file or shared-module risks
- unclear ownership
- sequential-only work
- blockers that require user input

Parallel planning must not happen without this check.

## Default Strategy

The default strategy is `staged_parallel`:

1. Foundation work runs sequentially.
2. Independent feature work may run in parallel groups.
3. Every parallel group has an integration task.
4. Final validation runs sequentially.
5. Result review runs sequentially.

## Parallel Eligibility

A task can be placed in a parallel group only when:

- dependencies are resolved before the group starts
- shared foundation tasks finish first
- `expectedFiles` is non-empty and specific
- `unknownFileTouchRisk` is `none` or `low`
- expected files do not overlap with another task in the group
- expected shared files do not overlap with another task in the group
- shared types, schemas, build config, auth, permissions, migrations, payment logic, and package configuration are not
  modified
- scope and non-scope are clear
- focused validation is possible
- conflict risk is low or controlled medium
- the group has an integration task
- rollback path is available

`npm run validate:pbe` normalizes path strings before checking conflicts, so `src/a.ts` and `./src/a.ts` are treated as
the same file.

Default policy:

```text
default = sequential
maxInitialParallelGroupSize = 2
maxMatureParallelGroupSize = 3
moreThanMaxRequiresHumanApproval = true
```

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
- package or dependency changes
- build or test configuration changes
- public API contract changes
- same-file ownership conflicts
- unknown write set
- medium/high unknown file-touch risk
- unclear scope
- difficult rollback
- high security, data, or release risk
- foundation work unless documentation/test-fixture only

## Integration Task Requirement

Every parallel group must have one integration task.

Every parallel group must also set:

```text
integrationEvidenceRequired: true
groupCannotCompleteWithoutIntegrationPass: true
```

The integration task:

- inspects all changes from the group
- resolves conflicts
- checks shared contracts
- checks routing and navigation connections
- checks UI/UX consistency
- runs focused validation
- runs broader validation when needed
- updates traceability and evidence
- reports remaining risks

## Single-Session Fallback

In a single Codex session, actual simultaneous execution may not be available. In that case, Codex runs parallel-group
tasks sequentially while preserving the declared dependencies and integration step.
