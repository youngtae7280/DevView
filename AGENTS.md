# AGENTS.md

## Project Blueprint Engine

If `.pbe/` exists, inspect it before planning work.

PBE is a Codex Plugin workflow and is evolving into a tree-based development control system. Do not revive the deprecated GUI/API-provider/SaaS direction unless the user explicitly changes the product direction.

PBE is optimized for safe, reviewable, staged project construction, not for speed.

PBE is not an execution engine that tries to do everything. PBE is a requirements-based execution control layer for AI-assisted development.

After future PBE plugin changes, run the relevant validation, commit the finished work, and push to `origin/main` unless the user explicitly asks not to push.

## Tree Control Direction

The Product Tree is the source of product truth. Lower trees and execution artifacts must derive from it.

```text
Product Tree -> Project Tree -> Work Tree -> Test Tree
Cycle Tree -> Change Tree -> Impact Tree -> Evidence Tree -> Acceptance Tree
```

Compatibility terms stay valid during migration:

- `RPD`: Product Tree growth
- `WPD`: Project Tree and Work Tree derivation
- `VD`: Test Tree derivation
- `ACEP`: Cycle Contract and Node Execution Contract packaging
- `Revision`: Change Tree, Impact Tree, and Reopen protocol

Never implement work that cannot be traced to Product/Project/Work nodes. Never close work without Test/Evidence links. Never silently edit accepted blueprint scope during execution.
Never derive executable work from ambiguous Product nodes. A confirmed executable Product node must have structured acceptance criteria or an explicit non-executable reason.

## Important Files

Prefer v2 files when present:

- `.pbe/tree/product-tree.json`
- `.pbe/tree/project-tree.json`
- `.pbe/tree/work-tree.json`
- `.pbe/tree/test-tree.json`
- `.pbe/execution/cycle-tree.json`
- `.pbe/execution/cycle-contract.md`
- `.pbe/execution/node-execution-contracts/`
- `.pbe/control/decision-queue.json`
- `.pbe/control/change-tree.json`
- `.pbe/control/impact-tree.json`
- `.pbe/control/acceptance-tree.json`
- `.pbe/control/legacy-control-inventory.json`
- `.pbe/control/surface-completion-ledger.json`
- `.pbe/control/hardware-readiness-ledger.json`
- `.pbe/control/visual-verification-profile.json`
- `.pbe/control/verification-miss-log.json`
- `.pbe/evidence/evidence-tree.json`

Backward-compatible v1 views may also exist:

- `.pbe/blueprint/pbe-state.json`
- `.pbe/blueprint/source-of-truth-matrix.md`
- `.pbe/blueprint/pbe-invariants.md`
- `.pbe/blueprint/foundation-contract.md`
- `.pbe/blueprint/parallel-safety-contract.md`
- `.pbe/blueprint/requirement-tree.json`
- `.pbe/blueprint/ui-ux-confirmation.md`
- `.pbe/blueprint/work-design.json`
- `.pbe/blueprint/work-graph.json`
- `.pbe/blueprint/verification-design.json`
- `.pbe/blueprint/traceability-matrix.json`
- `.pbe/blueprint/execution-strategy.json`
- `.pbe/codex-execution-pack/04-traceability-matrix.json`
- `.pbe/codex-execution-pack/05-ui-ux-spec.json`
- `.pbe/codex-execution-pack/18-execution-strategy.md`
- `.pbe/codex-execution-pack/execution-manifest.json`

## Human Questioning Rule

Ask the user only when the answer changes product meaning, scope, UX, risk, acceptance criteria, verification strategy, or already implemented/verified/accepted work.

Use:

- `auto_derived` for obvious lower-tree nodes
- `assumed` for plausible low-risk defaults
- `needs_human_decision` for decisions that alter the tree
- `blocked` for decisions that must stop execution

## Execution Profiles

- `bypass`: typo, single-file edit, or clearly bounded small bug fix.
- `lite`: existing blueprint and small slice with limited risk.
- `full`: project construction, new feature, multi-module work, UI/UX, architecture runway, parallel work, or future-module impact.

Default to `full` for PBE project construction.

## Autoflow

Use `pbe-state.json.autoflow` to track:

- `profile`
- `state`
- `completedSteps`
- `currentGate`
- `nextStep`
- `lastFailure`

Automatic steps:

- `rpd`
- `wpd`
- `vd`
- `dependency_impact_audit`
- `plan_execution`
- `coverage_audit`
- `ux_audit`
- `generate_acep`
- `run_acep`

Human gates:

- `ui_ux_confirm`
- `root_confirmation`
- `implementation_scope`
- `architecture_runway`
- `review_result`
- `next_slice_decision`

At human gates, do not say only "waiting". Explain why PBE stopped, what risk exists, what the user should inspect, and give natural-language examples.

## Response Format

For PBE stage completion, human gate arrival, failures, and status requests, always use:

```text
[PBE 상태 보고]
```

first.

Use optional:

```text
[Codex 메모]
```

for explanation, recommendations, tradeoffs, and risk notes.

Rules:

- Keep `[PBE 상태 보고]` factual and structured.
- Put free-form reasoning only in `[Codex 메모]`.
- Always include `추천 답변` when a human gate is active.
- Do not use the status card for ordinary AI answers that do not report or change PBE workflow state.

Natural-language examples:

- "approve", "looks good", "continue" -> approve / continue
- "confirm this root", "use this structure" -> approve_root_confirmation
- "select scope: ..." -> select_scope
- "full scope" -> select_full_scope
- "defer ..." -> mark_deferred
- "foundation first", "interface only" -> mark_foundation
- "what is the dependency impact?" -> ask_dependency_impact
- "fix ...", "add ...", "change ..." -> revise
- "review ...", "what is risky?" -> ask
- "current status" -> status
- "stop" -> stop
- "complete current slice" -> complete_current_slice
- "start next slice" -> start_next_slice
- "complete project" -> complete_project

If an automatic step fails, set Autoflow to `BLOCKED`, record `lastFailure`, and do not continue downstream.

## Scope Classification

Every requirement, WorkGraph node, task, and coverage entry should distinguish:

- `selected`: implemented and verified in this slice
- `foundation`: structural work required now
- `deferred`: explicitly postponed
- `blocked`: cannot proceed safely
- `out_of_scope`: must not be changed

Deferred items are not current-slice failures. Missing selected or foundation items are failures.

## Parity And Completeness Profile

Use the optional parity/completeness profile for legacy migration, parity-critical UI, UI-heavy surfaces, hardware-dependent capabilities, or repeated review failures.

The profile adds derived control artifacts only. It does not replace Product, Project, Work, Test, Evidence, or Acceptance trees.

When active:

1. Create or update `legacy-control-inventory.json` before claiming parity for a legacy surface.
2. Create or update `surface-completion-ledger.json` before reporting a surface as complete.
3. Track hardware-dependent features in `hardware-readiness-ledger.json`.
4. Add visual/runtime checks in `visual-verification-profile.json` when visual parity matters.
5. Record why previous verification missed a feedback item in `verification-miss-log.json`.
6. Do not treat build/open smoke as visual parity evidence.
7. Do not silently expand implementation scope from a ledger finding. Use Change Tree, Impact Tree, and the relevant human gate when product meaning, UX, acceptance, verification, or selected scope changes.
8. Separate `technical_stable`, `parity_reviewed`, and user-controlled `product_accepted`.
9. Do not treat command mapping as workflow completion. If a command opens a dialog, popup, subdialog, or secondary workflow, create child surface inventory plus Work/Test/Evidence coverage for the opened surface.
10. Required legacy controls and event handlers must be matched or explicitly deferred, blocked, out of scope, or listed as blocking not-checked items before any technical stability or parity claim.
11. Hardware-gated surfaces need mock-backed, fake-result, UI-automation, or explicit blocking manual-not-verified evidence before closure.
12. Final reports must separate completed, partially verified, skipped, and not checked items. Not checked items with `blocksCompletion: true` block `technical_stable`, `parity_reviewed`, and `product_accepted`.

## RPD Tree Walk

When running RPD:

1. Process one current node at a time.
2. Traverse breadth-first by default.
3. Ask exactly one open-ended question at a time.
4. Extract facts after each answer.
5. Ask before decomposing a node.
6. Ask before confirming a node.
6a. If the request is clear, propose the Root summary and child structure, then ask the user to confirm, revise, or decompose further. Do not ask a vague "should I interview more?" question.
6b. Run Ambiguity Gate before confirmation. Abstract quality expressions are not executable until target, condition, expected behavior, completion criteria, exception handling, and verification method are clear enough to write acceptance criteria.
6c. Confirmed executable Product nodes must include `acceptanceCriteria` or `acceptanceNotRequiredReason`.
7. Update `.pbe/tree/product-tree.json` after every confirmed decision when v2 files exist.
8. Update `.pbe/blueprint/requirement-tree.json` as the compatibility view after every confirmed decision.
9. Update `.pbe/control/decision-queue.json` when a decision is opened or resolved.
10. Update `.pbe/blueprint/rpd-interview-log.md` after every interview turn.
11. Update Source of Truth Matrix links when requirements change.

RPD owns user intent, not coding task boundaries.

RPD completion is a hard gate for every downstream stage and every deliverable-producing action. Code, documents, slide decks, spreadsheets, images, generated assets, tests, and review reports must not be created from unconfirmed Root or leaf requirements except as explicitly labeled assumption drafts with `deliveryStatus: draft_created_from_assumptions` or `waiting_root_confirmation`.

## WPD And WorkGraph

WPD must run Module Boundary Check internally. Do not create a separate Module Boundary Auditor skill.

WPD must not treat RPD/Product Tree nodes as direct Codex tasks. It must produce `.pbe/tree/project-tree.json`, `.pbe/tree/work-tree.json`, and a module-aware WorkGraph compatibility view with:

- `expectedFiles`
- `expectedSharedFiles`
- `forbiddenFiles`
- `unknownFileTouchRisk`
- `affectedDomains`
- dependency edges
- selected/foundation/deferred/blocked/out_of_scope classification

If `expectedFiles` is empty or unknown, the node is not parallel-safe.

Every selected or foundation Work Tree node must derive from Product/Project nodes unless it is the Work Tree root placeholder.
Every selected or foundation Work Tree node must not derive from Product nodes with `status: needs_clarification` or `ambiguity.status` of `partial` or `ambiguous`.
When Product nodes have `acceptanceCriteria`, selected/foundation Work Tree nodes should link `satisfiesAcceptanceCriteriaIds`.

## VD And Test Tree

VD must derive `.pbe/tree/test-tree.json` from Product, Project, and Work Trees when v2 files exist. It must keep `.pbe/blueprint/verification-design.json` and `.pbe/blueprint/verification-plan.md` as compatibility views.

Every non-root Test Tree node must verify at least one Product or Work node and declare required evidence.
When acceptance criteria exist, Test Tree nodes should link `verifiesAcceptanceCriteriaIds`, and Evidence Tree nodes should link `evidenceForAcceptanceCriteriaIds`.

## UI/UX Confirmation

For UI tasks:

1. Show a text wireframe, Markdown mockup, or prototype before implementation.
2. Get user confirmation before WPD, ACEP, or UI implementation proceeds.
3. Follow approved UI/UX direction.
4. Respect UI/UX non-scope.
5. Do not redesign confirmed flows unless a stop condition is reached.
6. Provide UI/UX evidence after implementation.
7. If screenshot is unavailable, write manual verification notes.

## Parallel Execution

Default policy:

```text
default = sequential
maxInitialParallelGroupSize = 2
maxMatureParallelGroupSize = 3
moreThanMaxRequiresHumanApproval = true
```

When executing ACEP:

1. Read `.pbe/execution/cycle-tree.json`, `.pbe/execution/cycle-contract.md`, and `.pbe/codex-execution-pack/22-cycle-contract.md` when present.
2. Read `.pbe/codex-execution-pack/18-execution-strategy.md`.
3. Follow `execution-manifest.json` phases.
4. Run foundation tasks before feature tasks.
5. Execute only included Work/Test nodes from the active Cycle Slice.
6. Only tasks explicitly assigned to a parallel group may run in parallel.
7. Do not parallelize unknown write sets.
8. Do not parallelize shared schemas, shared types, build config, auth, permissions, migrations, package configuration, or same-file changes.
9. Every parallel group must have an integration task.
10. Every parallel group must require integration evidence and integration pass.
11. If actual parallel execution is unavailable, execute parallel-capable tasks sequentially and still run the integration task.

## Cycle Execution

When v2 cycle files exist:

1. Read `.pbe/execution/cycle-tree.json` and `.pbe/execution/cycle-contract.md` before implementation.
2. Implement only included Work nodes.
3. Run only included Test nodes unless broader regression is explicitly required.
4. Do not touch excluded, deferred, or out-of-scope nodes.
5. If missing scope, design drift, new UX behavior, or technical impossibility is discovered, create or request a Change Node instead of silently coding it.
6. Attach evidence to `.pbe/evidence/evidence-tree.json` when available.
7. End as `submitted_for_review`, not accepted.

## ACEP Execution

When running ACEP:

1. Read `.pbe/codex-execution-pack/00-readme.md`.
2. Follow `.pbe/codex-execution-pack/execution-manifest.json`.
3. Read `.pbe/codex-execution-pack/04-traceability-matrix.json`.
4. Read `.pbe/codex-execution-pack/05-ui-ux-spec.json`.
5. Follow `.pbe/codex-execution-pack/10-codex-operating-loop.md`.
6. Read `.pbe/codex-execution-pack/22-cycle-contract.md` and linked Node Execution Contracts when present.
7. Execute selected and foundation scope only.
8. Do not implement deferred, excluded, blocked, or out-of-scope behavior.
9. Create or request a Change Node for product/scope/UX/risk/acceptance/verification drift.
10. Run validation commands listed in `.pbe/codex-execution-pack/12-validation-commands.md`.
11. Complete `.pbe/codex-execution-pack/15-ui-ux-evidence-checklist.md` for UI work.
12. Complete `.pbe/codex-execution-pack/16-final-coverage-check.md` before final report.
13. End as `submitted_for_review`, not `accepted`.

## Result Review And Revision

Codex may report:

- implemented
- verified
- submitted_for_review
- revision_requested
- revision_in_progress
- revision_verified

Only the user can mark work as:

- accepted

If the user is dissatisfied:

1. Record feedback in `.pbe/review/user-feedback.md`.
2. Classify feedback in `.pbe/review/feedback-items.json`.
3. Map feedback to affected Product/Project/Work/Test/Evidence nodes plus compatibility requirement/task/UI/verification items.
4. Create or update Change Tree entries when feedback changes product meaning, scope, UX, risk, acceptance, verification, or accepted work.
5. If feedback is ambiguous or changes acceptance meaning, run Revision RPD for the affected Change Node only. Do not restart full RPD.
6. Update criteria deltas before revision tasks are created when feedback changes acceptance criteria.
7. Build or update Impact Tree before revision tasks are created.
8. Mark affected completed nodes as `stale`, `invalidated`, or `reopened` when needed.
9. Create a revision pack under `.pbe/revisions/`.
10. Run revision tasks only within affected selected/foundation scope.
11. Re-run relevant impacted tests and regression checks.
12. Refresh stale evidence and submit for review again.

When v2 change/impact files exist:

1. Record feedback as Change Tree input.
2. Map affected Product/Project/Work/Test/Evidence/Cycle/Acceptance nodes.
3. Build or update Impact Tree.
4. Mark affected completed nodes as `stale`, `invalidated`, or `reopened` when needed.
5. Run only affected or reopened revision tasks.
6. Do not clear stale/reopened state without refreshed validation and evidence.

After review approval, move to `WAITING_NEXT_SLICE_DECISION`. Do not mark `COMPLETED` unless the user explicitly completes the whole project.

## Stop Conditions

Stop and ask the user when work requires credentials, deployment, billing, destructive migration, out-of-scope changes, unresolved traceability/UI evidence gaps, UI implementation without confirmation, missing WorkGraph, missing Module Boundary Check, missing foundation approval, parallel group without integration task, forbidden shared-risk work inside a parallel group, revision outside affected scope, unclear feedback scope, or when the same validation failure repeats three times.
