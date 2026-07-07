# Workflow

Project Blueprint Engine has an integrated Autoflow planning, execution, review, and revision loop:

```text
Start -> RPD -> UI/UX Confirmation Gate -> Visual Reference Intake -> Design System Derive -> WPD -> UI Surface Inventory -> VD -> Dependency Impact Audit -> Implementation Scope Gate -> Execution Planner -> Coverage Auditor -> UX Auditor -> ACEP Generator -> ACEP Runner -> Visual Implementation Audit -> Result Review Gate
```

After `start`, deterministic stages continue automatically. Human judgment gates stop and explain what the user should
review next.

## RPD

RPD uses Tree Walk Mode. Codex traverses the requirement tree breadth-first, asks exactly one open-ended question at a
time, extracts facts, and asks for confirmation before decomposing or confirming a node.

RPD owns user intent, not coding task boundaries.

## UI/UX Confirmation

UI/UX work must be confirmed before implementation. Codex presents one screen or flow at a time as a text wireframe,
Markdown mockup, or prototype. Unconfirmed UI/UX items block WPD, ACEP, and UI implementation unless they are deferred
or out of scope.

## Visual Design Contract

When selected UI work changes visual appearance, UI/UX approval hands off to Visual Reference Intake and Design System
Derive before implementation planning. PBE records the visual source, theme spec, design tokens, component style
contract, allowed/forbidden changes, waiver/not-required status, and visual evidence requirements.

The visual source can be a reference screenshot, reference app/site, existing project screen, interview-derived
direction, default PBE Clean Theme, explicit waiver, or not-required decision. Vague visual words such as clean or
modern must be converted into concrete tokens, component rules, states, and verification checks before execution.

## WPD

WPD converts confirmed requirements into a module-aware WorkGraph and work roadmap. It does not copy RPD nodes directly
into Codex coding tasks.

WPD runs Module Boundary Check internally, identifies shared foundations, feature candidates, integration points,
parallelization risks, and boundary blockers, then creates work units from the WorkGraph.

## VD

VD converts selected and foundation work units into verification items and an acceptance plan. Deferred and out-of-scope
items are recorded separately so they are not treated as current-slice failures.

When the parity/completeness profile is active, VD also derives or updates visual/runtime verification requirements.
Build and open smoke are minimum checks; they do not close visual parity by themselves.

For visual UI work, VD must include required UI states, screenshot/manual evidence requirements, and links back to the
Visual Design Contract and UI Surface Inventory.

## Dependency Impact And Scope

Dependency Impact Audit checks whether deferred or future modules affect the current architecture.

Implementation Scope Gate lets the user decide:

- selected scope
- deferred scope
- required foundation
- blocked scope
- out-of-scope items

Required foundation, blocking dependency, or high-impact future module risk is resolved through the implementation scope
gate and recorded in `lastFailure` if it blocks downstream work.

## Execution Planner

Execution Planner reads the WPD WorkGraph, VD, traceability, Source of Truth Matrix, Foundation Contract, and UI/UX
confirmation files. It creates `staged_parallel` execution strategy artifacts with sequential foundation work, safe
parallel groups, required integration tasks, final validation, and single-session fallback rules.

## ACEP Generator

ACEP Generator writes `.pbe/codex-execution-pack/` with task-card views, traceability matrix, UI/UX spec, evidence
rules, validation guidance, final coverage check, completion criteria, execution strategy, source-of-truth references,
foundation contract, parallel safety contract, and an execution manifest.

Task-card views are compatibility/execution projections under Cycle Contract and Node Execution Contract authority. They
help Codex execute the pack, but they do not become source authority or replace Product, Work, Test, Evidence,
Acceptance, or execution-contract records.

## ACEP Runner

ACEP Runner reads the pack and executes manifest phases. It executes selected and foundation scope only, using task-card
views as execution aids under the manifest and execution contracts. It does not implement deferred or out-of-scope
behavior.

It follows sequential phases in order, handles parallel phases by parallel group, runs every integration task before
moving forward, and falls back to sequential execution of parallel-capable tasks when actual parallel execution is not
available.

It submits work as `submitted_for_review`, not `accepted`.

For visual UI work, ACEP Runner must capture or reference required screenshot/manual evidence, then Visual
Implementation Audit checks visual contract compliance before Review Result.

## Result Review And Revision

Result Review prepares `.pbe/review/` for the user. If the user approves, Autoflow can use `DONE` for the approved
branch or slice. Starting another slice moves back to `WAITING_IMPLEMENTATION_SCOPE`.

If the user is dissatisfied, Codex collects feedback, maps it to affected requirement/task/UI/verification items,
creates a bounded Revision Pack, runs only affected selected/foundation revision tasks, performs regression checks, and
submits for review again.

When feedback exposes a missed verification dimension, PBE records why the previous verification missed it. Repeated
misses can promote new Test Tree, Evidence, or visual verification requirements, but implementation scope still changes
only through normal Change/Impact and human-gate rules.

## Stage Gates

RPD must be complete before WPD.

UI/UX confirmation must be complete, deferred, out_of_scope, or not_required before WPD.

Visual Design Contract must be ready, waived, out_of_scope, or not_required before WPD/ACEP/UI implementation for
selected visual UI work.

WPD must be complete before VD.

VD and Dependency Impact Audit must be complete before implementation scope is selected.

Execution planning must be complete before ACEP generation.

ACEP generation must be complete before ACEP running.

Visual Implementation Audit must pass, be explicitly waived, or have all blocking issues resolved before Review Result
can close visual UI work.

If any automatic stage fails, Autoflow keeps the last valid canonical state, records `lastFailure`, and reports the
failed step, reason, what the user should inspect, and downstream retry steps.
