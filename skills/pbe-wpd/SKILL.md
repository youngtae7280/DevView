---
name: pbe-wpd
description: Generate Work Process Design artifacts from completed RPD requirement-tree files.
---

# PBE WPD

Use this skill to create Work Process Design from completed RPD output.

WPD is the boundary between user requirements and coding work. It must not copy
RPD requirement nodes directly into Codex coding tasks. It converts requirement
intent into a module-aware WorkGraph that can later be planned for sequential,
parallel, integration, and validation execution.

WPD owns module boundary analysis, selected/deferred/foundation classification refinement, and WorkGraph construction. It does not execute tasks and does not approve user-facing UI/UX.

WPD is deterministic in Autoflow. If UI/UX gate is approved or not required, run
WPD automatically without asking the user for a separate command.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/rpd-summary.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/pbe-invariants.md
```

## Outputs

```text
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
```

## Required Actions

1. Verify RPD completion before generating WPD.
2. Verify UI/UX confirmation is complete for UI-required items.
3. Collect confirmed terminal requirement nodes and their parent context.
4. Run the internal `Module Boundary Check` before creating work units.
5. Extract shared foundations, feature candidates, integration points, verification links, and parallelization risks.
6. Classify every WorkGraph node as `selected`, `deferred`, `foundation`, `blocked`, or `out_of_scope`.
7. Create module-aware WorkGraph nodes and edges.
8. Add required parallel safety metadata to every WorkGraph node.
9. Create WorkDesign entries from the WorkGraph, not directly from RPD nodes.
10. Create a root-level implementation roadmap that references WorkGraph phases.
11. Update Source of Truth Matrix links from RPD nodes to WorkGraph nodes.
12. Save `work-design.json`.
13. Save `work-graph.json` as a standalone copy of the WorkGraph.
14. Save `work-roadmap.md`.
15. Update `pbe-state.json` stage to `wpd` or `vd_ready` when complete.
16. Update `pbe-state.json.autoflow.state` to `WPD_DONE`.
17. Add `wpd` to `autoflow.completedSteps`.
18. Set `autoflow.nextStep` to `vd`.
19. Continue automatically to VD unless a blocker exists.

## WPD Rules

- Do not run a long user interview in WPD.
- Ask the user only for blocker-level missing information.
- Preserve scope and non-scope from RPD.
- Convert requirements into implementable work units, not marketing copy.
- Include dependencies, risks, expected files or modules, validation hints, and done criteria.
- Preserve requirement IDs on every work unit.
- Create task-card candidates that can later be linked from ACEP.
- Mark UI-related work units so they can be linked to UI/UX Spec screen IDs.
- Reflect confirmed UI/UX direction in UI-related work units.
- Do not plan UI implementation for unconfirmed UI/UX items.
- Do not treat one RPD node as one Codex task.
- Allow one RPD node to split into multiple WPD tasks.
- Allow several RPD nodes to merge into one shared foundation task.
- Allow a parent RPD node to become an integration task.
- Allow UI/UX nodes to split into UI work and verification/evidence work.
- Identify task boundaries before any parallel execution planning.
- Never mark a WorkGraph node parallel-safe when `expectedFiles` is empty or unknown.
- Never place foundation work in parallel unless it is documentation or test-fixture only.

## Module Boundary Check

Run this check inside WPD. Do not create a separate `pbe-module-boundary-audit`
skill for the MVP.

Check:

1. Whether each requirement module has clear ownership.
2. Whether module responsibilities overlap.
3. Whether shared data models, schemas, or types are needed.
4. Whether shared validation, API contracts, or UI contracts are needed.
5. Which work must be foundation work before feature work.
6. Which work can be an independent feature task.
7. Which work must be an integration task.
8. Which requirements may modify the same files or shared modules.
9. Which work is not safe for parallel execution.
10. Whether blockers prevent safe work boundaries without user input.

Record:

- `boundaryFindings`
- `sharedFoundations`
- `featureCandidates`
- `integrationPoints`
- `parallelizationRisks`
- `boundaryBlockers`

If boundary blockers remain, stop before producing parallelization-ready output.

## Scope Classification

Every WorkGraph node must declare:

- `scopeClass`: `selected`, `deferred`, `foundation`, `blocked`, or `out_of_scope`
- why it has that classification
- whether it belongs to the current slice
- whether it is required foundation for a deferred module
- whether skipping it creates architecture risk

Deferred work must not be implemented in the current slice. Foundation work may create interfaces, models, adapters, stubs, fixtures, or contracts only when needed to keep the selected slice safe for future modules.

## WorkGraph

WPD must produce a WorkGraph:

```text
RPD Requirement Tree -> WPD WorkGraph -> Execution Planner Task DAG -> ACEP Task Cards -> Codex Coding Tasks
```

The WorkGraph is organized by code responsibility and dependencies, not by the
shape of the RPD tree.

WorkGraph nodes use these types:

- `foundation`
- `feature`
- `ui`
- `api`
- `domain`
- `integration`
- `verification`
- `documentation`
- `review`

WorkGraph edges use these types:

- `depends_on`
- `integrates_into`
- `validates`
- `documents`
- `blocks_parallelization`

Every WorkGraph node must list related requirement node IDs, expected outputs,
risk level, and whether it can run in parallel. If it cannot run in parallel,
record the reason.

Every WorkGraph node must also include:

- `expectedFiles`
- `expectedSharedFiles`
- `forbiddenFiles`
- `unknownFileTouchRisk`
- `affectedDomains`

If `expectedFiles` is empty, unknown, or only broadly described, set `canRunInParallel` to `false`.

## WorkDesign Shape

Each work unit should include:

- `id`
- `requirementNodeId`
- `requirementIds`
- `title`
- `goal`
- `taskCandidateId`
- `uiUxCandidateIds`
- `approvedUiUxDirection`
- `uiUxNonScope`
- `uiUxImplementationNotes`
- `scope`
- `nonScope`
- `implementationNotes`
- `dependencies`
- `risks`
- `doneCriteria`
- `validationHints`

No work unit should lose its source requirement. If a confirmed requirement does not produce a work unit, record a deferred/out_of_scope reason.

`work-design.json` should include the WorkGraph or reference `work-graph.json`.
The standalone `work-graph.json` should contain:

- `id`
- `nodes`
- `edges`
- `boundaryFindings`
- `sharedFoundations`
- `featureCandidates`
- `integrationPoints`
- `parallelizationRisks`
- `boundaryBlockers`
- `summary`

## Parallel Safety Output

WPD does not create parallel groups. It only emits the facts the planner needs:

- exact or best-known write set
- shared files and shared contracts
- forbidden files
- dependency edges
- unknown file-touch risk
- rollback and validation hints
- reasons a node must remain sequential

## UI/UX Gate

If a work unit changes UI, include:

```text
Approved UI/UX Direction
UI/UX Non-Scope
UI/UX Implementation Notes
```

If the related UI/UX item is not confirmed, deferred, or out_of_scope, stop and run `pbe-ui-ux-confirm`.

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that WPD completed and whether PBE is automatically continuing to VD or stopped by a blocker.

Include:

- number of leaf work units
- number of synthesized parent units
- number of WorkGraph nodes
- boundary blockers, if any
- shared foundations and integration points identified
- selected/deferred/foundation/blocked/out_of_scope counts
- nodes that cannot be parallelized and why
- major implementation phases
- created or updated files
- next step: VD verification design
- expected downstream path: VD -> Dependency Impact Audit -> Implementation Scope Gate

Use `[Codex 메모]` only for short rationale about module boundaries, foundations, or parallelization risk.
