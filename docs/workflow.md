# Workflow

Project Blueprint Engine has an integrated Autoflow planning, execution, review, and revision loop:

```text
Start -> RPD -> UI/UX Confirmation Gate -> WPD -> VD -> Dependency Impact Audit -> Implementation Scope Gate -> Architecture Runway Gate -> Execution Planner -> Coverage Auditor -> UX Auditor -> ACEP Generator -> ACEP Runner -> Result Review Gate -> Next Slice Decision
```

After `start`, deterministic stages continue automatically. Human judgment gates stop and explain what the user should review next.

## RPD

RPD uses Tree Walk Mode. Codex traverses the requirement tree breadth-first, asks exactly one open-ended question at a time, extracts facts, and asks for confirmation before decomposing or confirming a node.

RPD owns user intent, not coding task boundaries.

## UI/UX Confirmation

UI/UX work must be confirmed before implementation. Codex presents one screen or flow at a time as a text wireframe, Markdown mockup, or prototype. Unconfirmed UI/UX items block WPD, ACEP, and UI implementation unless they are deferred or out of scope.

## WPD

WPD converts confirmed requirements into a module-aware WorkGraph and work roadmap. It does not copy RPD nodes directly into Codex coding tasks.

WPD runs Module Boundary Check internally, identifies shared foundations, feature candidates, integration points, parallelization risks, and boundary blockers, then creates work units from the WorkGraph.

## VD

VD converts selected and foundation work units into verification items and an acceptance plan. Deferred and out-of-scope items are recorded separately so they are not treated as current-slice failures.

## Dependency Impact And Scope

Dependency Impact Audit checks whether deferred or future modules affect the current architecture.

Implementation Scope Gate lets the user decide:

- selected scope
- deferred scope
- required foundation
- blocked scope
- out-of-scope items

Architecture Runway Gate appears when required foundation, blocking dependency, or high-impact future module risk exists.

## Execution Planner

Execution Planner reads the WPD WorkGraph, VD, traceability, Source of Truth Matrix, Foundation Contract, and UI/UX confirmation files. It creates `staged_parallel` execution strategy artifacts with sequential foundation work, safe parallel groups, required integration tasks, final validation, and single-session fallback rules.

## ACEP Generator

ACEP Generator writes `.pbe/codex-execution-pack/` with task cards, traceability matrix, UI/UX spec, evidence rules, validation guidance, final coverage check, completion criteria, execution strategy, source-of-truth references, foundation contract, parallel safety contract, and an execution manifest.

## ACEP Runner

ACEP Runner reads the pack and executes manifest phases. It executes selected and foundation scope only. It does not implement deferred or out-of-scope behavior.

It follows sequential phases in order, handles parallel phases by parallel group, runs every integration task before moving forward, and falls back to sequential execution of parallel-capable tasks when actual parallel execution is not available.

It submits work as `submitted_for_review`, not `accepted`.

## Result Review And Revision

Result Review prepares `.pbe/review/` for the user. If the user approves, Autoflow moves to Next Slice Decision rather than whole-project completion.

If the user is dissatisfied, Codex collects feedback, maps it to affected requirement/task/UI/verification items, creates a bounded Revision Pack, runs only affected selected/foundation revision tasks, performs regression checks, and submits for review again.

## Stage Gates

RPD must be complete before WPD.

UI/UX confirmation must be complete, deferred, out_of_scope, or not_required before WPD.

WPD must be complete before VD.

VD and Dependency Impact Audit must be complete before implementation scope is selected.

Architecture runway approval is required when foundation or future-impact risk exists.

Execution planning must be complete before ACEP generation.

ACEP generation must be complete before ACEP running.

If any automatic stage fails, Autoflow stops in `BLOCKED` state and reports the failed step, reason, what the user should inspect, and downstream retry steps.
