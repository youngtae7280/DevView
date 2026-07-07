---
name: devview-work-planning
description: Derive Project Tree and Work Tree from completed RPD/Product Tree files while preserving Work Process Design and WorkGraph compatibility artifacts.
---

# DevView WPD

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Use this skill to create Work Process Design from completed RPD output.

Graph-first boundary: WPD, Project Tree, Work Tree, WorkGraph, and WorkDesign artifacts remain tree-control compatibility layers. They do not promote Graph-source authority, retire tree-native artifacts, or replace read-model projection evidence.

In DevView v2, WPD derives `.devview/tree/project-tree.json` and `.devview/tree/work-tree.json` from confirmed Product Tree branches. Existing `.devview/blueprint/work-design.json` and `.devview/blueprint/work-graph.json` remain compatibility views and must be generated from the tree-native output, not the other way around.

During migration, legacy Product status `accepted` may be read as confirmed requirement intent. It must not be confused with final product acceptance.

WPD is the boundary between user requirements and coding work. It must not copy
RPD requirement nodes directly into Codex coding tasks. It converts requirement
intent into a module-aware WorkGraph that can later be planned for sequential,
parallel, integration, and validation execution.

WPD owns module boundary analysis, selected/deferred/foundation classification refinement, and WorkGraph construction. It does not execute tasks and does not approve user-facing UI/UX.

WPD is deterministic in Autoflow. If UI/UX gate is approved or not required, run
WPD automatically without asking the user for a separate command.

After generating or updating Project Tree, Work Tree, WorkGraph, or WorkDesign compatibility artifacts, run:

```bash
devview wpd check
devview trace check
```

If either command fails, do not proceed to VD.

## Inputs

```text
.devview/tree/product-tree.json
.devview/control/decision-queue.json
.devview/blueprint/requirement-tree.json
.devview/blueprint/rpd-summary.md
.devview/blueprint/ui-ux-confirmation.md
.devview/blueprint/visual-reference.json
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
.devview/blueprint/source-of-truth-matrix.md
.devview/blueprint/devview-invariants.md
.devview/control/legacy-control-inventory.json
.devview/control/surface-completion-ledger.json
.devview/control/hardware-readiness-ledger.json
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
```

## Outputs

```text
.devview/tree/project-tree.json
.devview/tree/work-tree.json
.devview/blueprint/work-design.json
.devview/blueprint/work-graph.json
.devview/blueprint/work-roadmap.md
.devview/control/legacy-control-inventory.json
.devview/control/surface-completion-ledger.json
.devview/control/hardware-readiness-ledger.json
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
```

Prefer v2 tree files when present. If `.devview/tree/product-tree.json` and `.devview/blueprint/requirement-tree.json` disagree about selected, deferred, blocked, or out-of-scope scope, stop and report the mismatch instead of deriving work from stale data.

## Required Actions

1. Verify RPD completion before generating WPD. If any Root or leaf requirement still needs confirmation, stop and return to RPD/root confirmation.
2. Verify UI/UX confirmation is complete for UI-required items.
   2a. If selected UI work changes visual appearance, verify the Visual Design Contract source is recorded. If the source is not waived or not_required, verify Theme Spec, Design Tokens, and Component Style Contract exist before creating visual work.
3. Collect confirmed Product Tree branches and their compatibility requirement nodes.
4. Derive Project Tree module, surface, service, contract, data boundary, integration boundary, and foundation nodes from confirmed Product Tree branches.
5. Run the internal `Module Boundary Check` before creating work units.
6. Extract shared foundations, feature candidates, integration points, verification links, and parallelization risks.
7. Derive Work Tree executable nodes from Project Tree nodes and Product Tree branches.
8. Classify every Work Tree and WorkGraph node as `selected`, `deferred`, `foundation`, `blocked`, or `out_of_scope`.
9. Create module-aware WorkGraph nodes and edges as a compatibility/dependency view around Work Tree nodes.
   9a. When parity/completeness profile applies, derive or update surface completion and legacy inventory placeholders from Product/Project surface nodes before any parity claim can exist.
   9b. When hardware-dependent work exists, derive or update hardware readiness entries and keep software implementation state separate from certification state.
   9c. When a command opens a dialog, popup, subdialog, or secondary workflow, create child Project/Work nodes for that opened surface instead of treating the command mapping as surface completion.
   9d. When visual UI work is selected, run `devview-ui-surface-inventory` inside WPD or immediately after WPD. Populate UI surface inventory, component style inventory, required UI states, screenshot requirements, and shared component ownership before VD.
10. Add required parallel safety metadata to every Work Tree and WorkGraph node.
11. Create WorkDesign entries from the Work Tree and WorkGraph, not directly from RPD nodes.
12. Create a root-level implementation roadmap that references Project Tree, Work Tree, and WorkGraph phases.
13. Update Source of Truth Matrix links from Product/RPD nodes to Project Tree, Work Tree, and WorkGraph nodes.
14. Save `.devview/tree/project-tree.json`.
15. Save `.devview/tree/work-tree.json`.
16. Save `work-design.json`.
17. Save `work-graph.json` as a standalone copy of the WorkGraph.
18. Save `work-roadmap.md`.
19. Run `devview wpd close`.
20. Let the CLI validate WPD, visual contract prerequisites, UI/UX approval, and state transition rules before it writes `WPD_DONE`, completed steps, next step, and state history.
21. Continue automatically to VD only if `devview wpd close` succeeds.

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
- Do not plan visual UI implementation without a Visual Design Contract source or explicit user waiver.
- Use `design-tokens.json` and `component-style-contract.json` as the source for visual work boundaries.
- Shared visual component changes must be represented in `component-style-inventory.json`; if shared components cannot use tokens, record an exception before planning implementation.
- Do not treat one RPD node as one Codex task.
- Do not treat one Product Tree node as one Work Tree node unless the module boundary check proves that boundary is safe.
- Allow one RPD node to split into multiple WPD tasks.
- Allow several RPD nodes to merge into one shared foundation task.
- Allow a parent RPD node to become an integration task.
- Allow UI/UX nodes to split into UI work and verification/evidence work.
- Identify task boundaries before any parallel execution planning.
- Do not mark work as parallel-safe just because files are different.
- Check source files, DevView artifacts, generated directories, state transitions, test environment, evidence order, and review order before proposing parallel work.
- If parallel safety is unclear, prefer sequential execution.
- Record dependencies and shared resources when proposing parallel work.
- Use `docs/parallel-safety.md` and `templates/parallel-safety-checklist-template.md` for high-risk or non-obvious parallelization decisions.
- Never mark a WorkGraph node parallel-safe when `expectedFiles` is empty or unknown.
- Never place foundation work in parallel unless it is documentation or test-fixture only.
- Never create selected or foundation Work Tree nodes without at least one `derivedFromProductNodeIds` link, except the Work Tree root placeholder.
- Never derive selected or foundation Work Tree nodes from Product nodes with `ambiguity.status` of `partial` or `ambiguous`, or Product status `needs_clarification`.
- Link Work Tree nodes to `satisfiesAcceptanceCriteriaIds` whenever the source Product node has structured acceptance criteria.
- If a selected/foundation Work node cannot link an acceptance criterion, record `acceptanceCriteriaNotLinkedReason`; otherwise the work is not execution-ready.
- Every Project Tree node must list `derivedFromProductNodeIds` or be a root/container node with an explicit root responsibility.
- For legacy migration or parity-critical surfaces, do not allow a surface to be reported as parity complete unless `legacy-control-inventory.json` exists and is linked to Product/Project/Work nodes.
- A command that opens a dialog is not complete at command mapping. Add child work for dialog open, visible controls, default values, enable/disable states, button actions, repeated or async behavior, busy/cancel/error states, and legacy event handlers.
- `command_mapped`, `dialog_surface_complete`, `workflow_behavior_complete`, `mock_verified`, `hardware_user_testable`, and `hardware_certification_pending` are different completion facts. Do not collapse them into `technical_stable`, `parity_reviewed`, or `product_accepted`.
- If legacy source or resource IDs indicate required controls or event handlers, represent them in `legacy-control-inventory.json` before any parity claim.
- If hardware prevents live execution, keep the relevant work open until VD provides substitute evidence or the item is explicitly recorded as not checked and blocking.
- `surface-completion-ledger.json` is a derived view. It must not silently add implementation work outside selected/foundation scope.
- Hardware-dependent work must use `not_implemented`, `implemented_user_testable`, `hardware_verification_pending`, or `hardware_certified`; do not collapse implementation readiness and certification.

## Module Boundary Check

Run this check inside WPD. Do not create a separate `module-boundary audit`
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

## Project Tree

Project Tree nodes express module ownership and boundaries. Use:

- `module`
- `surface`
- `service`
- `contract`
- `data_boundary`
- `integration_boundary`
- `foundation`

Every non-root Project Tree node must include:

- `derivedFromProductNodeIds`
- `responsibility`
- `boundaries`
- `risks`

## Work Tree

Work Tree nodes express executable implementation and support work. Use:

- `foundation_task`
- `feature_task`
- `ui_task`
- `api_task`
- `domain_task`
- `integration_task`
- `verification_support_task`
- `documentation_task`
- `review_task`

Every non-root Work Tree node must include:

- `derivedFromProductNodeIds`
- `derivedFromProjectNodeIds`
- `scopeClass`
- `expectedFiles`
- `expectedSharedFiles`
- `forbiddenFiles`
- `unknownFileTouchRisk`
- `dependencies`
- `doneCriteria`
- `validationHints`

If a Work Tree node has unknown write scope, set `unknownFileTouchRisk` to `true` and ensure the compatibility WorkGraph marks it not parallel-safe.

File Change Guard uses Work and Revision scope to explain source file changes before review and accept transitions. WPD must keep `expectedFiles`, `expectedSharedFiles`, `forbiddenFiles`, and `unknownFileTouchRisk` accurate enough for `devview files check`, `devview review submit`, and `devview accept`. If implementation later touches files outside Work scope, do not widen WPD silently; open Change/Impact/Revision with `devview change create`, `devview impact analyze`, and `devview revision start`.

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
RPD/Product compatibility input -> WPD WorkGraph -> Execution planning -> Cycle/Node Execution Contract -> ACEP task-card compatibility views
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
- `treeRefs` or equivalent links to Project Tree and Work Tree nodes
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

If the related UI/UX item is not confirmed, deferred, or out_of_scope, stop and run `devview-ui-ux-confirm`.

## Parity And Completion Profile

When the profile is active, WPD should classify surface work at two levels:

- the selected/foundation implementation slice
- the broader surface inventory and completion picture

Missing inventory items are not automatically current-slice work. Classify them as `selected`, `foundation`, `deferred`, `blocked`, or `out_of_scope` through normal DevView scope rules. If a missing legacy control changes product meaning or selected scope, create or request a Change Node instead of silently adding implementation work.

## Completion Report

Report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say that WPD completed and whether DevView is automatically continuing to VD or stopped by a blocker.

Include:

- Project Tree node count
- Work Tree node count
- number of leaf work units
- number of synthesized parent units
- number of WorkGraph nodes
- boundary blockers, if any
- shared foundations and integration points identified
- selected/deferred/foundation/blocked/out_of_scope counts
- parity/completeness profile artifacts updated, when active
- surface completion, legacy inventory, and hardware readiness gaps, when active
- nodes that cannot be parallelized and why
- major implementation phases
- created or updated files
- next step: VD verification design
- expected downstream path: VD -> Dependency Impact Audit -> Implementation Scope Gate

Use `[Codex 硫붾え]` only for short rationale about module boundaries, foundations, or parallelization risk.
