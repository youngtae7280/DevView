---
name: devview-start
description: Start DevView in a target repo, enable autoflow, create tree-native .devview artifacts with backward-compatible blueprint views, and begin RPD/Product Tree growth automatically.
---

# DevView Start

## CLI Transition Rule

Use DevView CLI transition commands for workflow state changes. Do not edit `.devview/blueprint/devview-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

## Agent Context Rule

Do not read all DevView docs by default.

Read `agent-context/README.md` first. Then read only the smallest matching context card. Load full docs only when the card says they are needed.

If the task is unclear, ask one concise question instead of broad repository or documentation scanning.

Do not start broad workflow adaptation or repo-wide conversion before user confirmation.

For start specifically:

- `start` alone is valid.
- Do not require a `Brief:` label.
- If no task is provided, inspect minimal repo signals and ask what task or slice to manage if unclear.
- `start` alone must not imply repo-wide workflow adoption.
- Do not create or modify AGENTS.md, workflow docs, reports, or broad project process docs during start unless explicitly requested.
- First identify the target task/slice.
- Before any broad adoption or process-doc change, ask for explicit confirmation.

Use this skill when the user asks to start DevView, for example:

```text
@project-blueprint-engine start
```

or:

```text
@project-blueprint-engine start
Add order cancellation to this existing project.
```

## Purpose

Initialize `.devview/` in the target repository. DevView is not a GUI and does not call external model services from a separate app. It is a Codex skill workflow that writes durable planning, execution, control, evidence, and compatibility artifacts into the repository.

DevView v2 is tree-native. The Product Tree is the source of truth. Existing RPD, WPD, VD, and ACEP names remain valid compatibility terms:

- `RPD`: Product Tree growth plus `.devview/blueprint/requirement-tree.json` compatibility view.
- `WPD`: Project Tree and Work Tree derivation plus WorkDesign/WorkGraph compatibility views.
- `VD`: Test Tree derivation plus VerificationDesign compatibility view.
- `ACEP`: Cycle Contract and Node Execution Contract packaging plus the existing execution pack views.

`start` enables Autoflow. The user should not need to type each internal step
manually after start.

DevView is optimized for safe, reviewable, staged project construction, not for speed. DevView has one public workflow. Use
the smallest planning depth that preserves traceability, and increase to full planning depth for new projects, large
features, UI/UX work, multi-module changes, architecture decisions, parallel work, or future-module impact.

The CLI still stores `full`, `lite`, and `bypass` as compatibility profile metadata. Do not present them as separate
public modes that the user must understand.

## App-First Start UX

`start` alone is valid. Do not require the user to provide a `Brief:` label or any other fixed brief syntax.

If no brief or target task is provided, inspect the current repository before initializing. Check for README, project
briefs, work boards, package metadata, existing `.devview`, and current conversation context. If the task or slice still
cannot be inferred, ask one concise question before initializing.

When possible, use `devview profile recommend --brief "<brief>"` after a target task is clear. Treat the result as a
workflow-depth hint and compatibility profile value, not as a separate public mode. Report the proposed depth and
reason before initialization. The user may override the recommendation.

Do not silently initialize with an arbitrary brief when the task is unclear.

## Start / RPD Clarity Scoring

During start and RPD, assess ambiguity before creating or confirming Product Tree nodes.

- Compute a compact `clarityScore`.
- Identify `hardTriggers`.
- Set `requiresHumanGate`.
- Ask one concise Human Gate question when the score is low or a hard trigger exists.
- Do not convert vague product intent into implementation decisions.
- Record the assumption and rationale if proceeding without a gate.

Do not turn "choices should be displayed" into "implement a list" unless the UI control is specified, follows an
existing pattern, or the assumption is recorded and safe.

## Required Actions

Prefer `devview init --profile <full|lite|bypass> --brief "<user brief>"` when initializing deterministic DevView artifacts.
The `--profile` value is compatibility metadata for workflow depth. After creating or updating `.devview` artifacts, run:

```bash
devview status
devview validate
```

If either command fails, do not proceed to RPD until the blocking issue is fixed.

1. Inspect the target repository enough to understand whether this is a new project or a change to an existing project.
2. Check whether `.devview` already exists and whether there is an active run to resume.
3. If no active run exists, infer or ask for the target task or slice.
4. Run or emulate depth recommendation once the target task is clear.
5. Report the recommended workflow depth, compatibility profile value, and reason.
6. Ask for confirmation if the task or slice is still unclear.
7. Run `devview init --profile <profile> --brief "<brief>"` only after the target is clear.
8. Run `devview status` and `devview validate`.
9. If compatibility bootstrap must be done manually, mirror `devview init` output and then run `devview status` and `devview validate`.
10. Create `.devview/tree/product-tree.json` from `templates/product-tree.template.json` if it does not exist.
11. Create `.devview/tree/project-tree.json` from `templates/project-tree.template.json` if it does not exist.
12. Create `.devview/tree/work-tree.json` from `templates/work-tree.template.json` if it does not exist.
13. Create `.devview/tree/test-tree.json` from `templates/test-tree.template.json` if it does not exist.
14. Create `.devview/control/decision-queue.json`, `.devview/control/change-tree.json`, `.devview/control/impact-tree.json`, `.devview/control/acceptance-tree.json`, and `.devview/evidence/evidence-tree.json` from matching templates if they do not exist.
    14a. When the brief indicates legacy migration, parity-critical UI, UI-heavy surfaces, hardware-dependent work, or repeated verification misses, initialize the parity/completeness control artifacts from matching templates.
15. Create or update `.devview/blueprint/project-brief.md`.
16. Create `.devview/blueprint/requirement-tree.json` with a root node if it does not exist, treating it as the Product Tree compatibility alias.
17. Create `.devview/blueprint/devview-routing-contract.md` from the DevView Routing Contract template.
18. Create `.devview/blueprint/source-of-truth-matrix.md` from the Source of Truth Matrix template.
19. Create `.devview/blueprint/devview-invariants.md` from the DevView Invariants template.
20. Create `.devview/blueprint/foundation-contract.md` and `.devview/blueprint/parallel-safety-contract.md` placeholders.
21. Create dependency impact placeholders for `.devview/blueprint/dependency-impact-audit.json` and `.devview/blueprint/dependency-impact-audit.md`.
22. Create `.devview/blueprint/requirement-tree.md`, `.devview/blueprint/rpd-interview-log.md`, and `.devview/blueprint/rpd-summary.md`.
23. Initialize UI/UX confirmation placeholders when UI work may be involved.
    23a. Initialize Visual Design Contract placeholders when visual UI work may be involved: visual reference, theme spec, design tokens, component style contract, UI surface inventory, component style inventory, visual verification profile, and visual audit report path.
24. Confirm `devview init` initialized Autoflow with the chosen compatibility profile metadata and a CLI-reported first next action.

25. Confirm tree-native artifact paths are discoverable through the initialized DevView state so later stages can find Product, Project, Work, Test, Cycle, Decision, Change, Impact, Evidence, and Acceptance trees without guessing paths.
26. Immediately begin RPD/Product Tree growth unless the user explicitly opts out of DevView tracking.
27. If the provided project brief is clear, propose the Root requirement summary and child structure, then stop at the `root_confirmation` gate.
28. If RPD needs more information before a safe proposal, ask exactly one RPD question. The user should answer naturally; do not require `@project-blueprint-engine rpd`.
29. Do not create code, documents, slide decks, spreadsheets, images, generated assets, or review reports until the Root requirement and decomposition decision are user-confirmed.

## File Contract

Use these primary tree-native paths:

```text
.devview/tree/product-tree.json
.devview/tree/project-tree.json
.devview/tree/work-tree.json
.devview/tree/test-tree.json
.devview/execution/cycle-tree.json
.devview/execution/cycle-contract.md
.devview/execution/node-execution-contracts/
.devview/control/decision-queue.json
.devview/control/change-tree.json
.devview/control/impact-tree.json
.devview/control/acceptance-tree.json
.devview/control/legacy-control-inventory.json
.devview/control/surface-completion-ledger.json
.devview/control/hardware-readiness-ledger.json
.devview/control/ui-surface-inventory.json
.devview/control/component-style-inventory.json
.devview/control/visual-verification-profile.json
.devview/control/verification-miss-log.json
.devview/evidence/evidence-tree.json
.devview/evidence/screenshots/
.devview/evidence/review-reports/
.devview/evidence/test-results/
.devview/evidence/logs/
```

Also keep these backward-compatible blueprint paths:

```text
.devview/blueprint/devview-state.json
.devview/blueprint/project-brief.md
.devview/blueprint/devview-routing-contract.md
.devview/blueprint/source-of-truth-matrix.md
.devview/blueprint/devview-invariants.md
.devview/blueprint/foundation-contract.md
.devview/blueprint/parallel-safety-contract.md
.devview/blueprint/dependency-impact-audit.json
.devview/blueprint/dependency-impact-audit.md
.devview/blueprint/requirement-tree.json
.devview/blueprint/requirement-tree.md
.devview/blueprint/rpd-interview-log.md
.devview/blueprint/rpd-summary.md
.devview/blueprint/ui-ux-preview.json
.devview/blueprint/ui-ux-preview.md
.devview/blueprint/ui-ux-confirmation.md
.devview/blueprint/ui-ux-confirmation-log.md
.devview/blueprint/visual-reference.json
.devview/blueprint/visual-reference.md
.devview/blueprint/ui-theme-spec.md
.devview/blueprint/design-tokens.json
.devview/blueprint/component-style-contract.json
```

When both v2 and v1 files exist, prefer the v2 tree file as the source of truth and update the v1 blueprint file as a compatibility view.

The initial root node status is `pending_interview` unless the user already provided enough detail to begin as `interviewing`.

If the user already provided enough detail, clear enough means "ready to propose", not "confirmed". In that case:

- keep the requirement root unconfirmed as `interviewing` or `ready_to_confirm`
- set the Product root to `proposed`
- keep the initial workflow at the Root confirmation gate through `devview init` output and the Decision Queue
- keep delivery status as `waiting_root_confirmation`
- ask the user to confirm, revise, or decompose the proposed Root structure

## Startup State

Prefer `devview init --profile <profile> --brief "<user request>"` for initial `.devview` bootstrap. If bootstrapping manually for compatibility, create the same artifacts and then run `devview status` and `devview validate`.

`devview init` should create the initial DevView state for the RPD tree-walk workflow.

Use `devview init` so the CLI creates the initial Autoflow state.

`devview init` should use the chosen compatibility profile metadata. If no value is explicitly requested, use `full`.

`devview init` should make these artifact paths discoverable:

```text
productTree: .devview/tree/product-tree.json
projectTree: .devview/tree/project-tree.json
workTree: .devview/tree/work-tree.json
testTree: .devview/tree/test-tree.json
cycleTree: .devview/execution/cycle-tree.json
cycleContract: .devview/execution/cycle-contract.md
nodeExecutionContracts: .devview/execution/node-execution-contracts/
decisionQueue: .devview/control/decision-queue.json
changeTree: .devview/control/change-tree.json
impactTree: .devview/control/impact-tree.json
acceptanceTree: .devview/control/acceptance-tree.json
evidenceTree: .devview/evidence/evidence-tree.json
legacyControlInventory: .devview/control/legacy-control-inventory.json
surfaceCompletionLedger: .devview/control/surface-completion-ledger.json
hardwareReadinessLedger: .devview/control/hardware-readiness-ledger.json
visualVerificationProfile: .devview/control/visual-verification-profile.json
uiSurfaceInventory: .devview/control/ui-surface-inventory.json
componentStyleInventory: .devview/control/component-style-inventory.json
verificationMissLog: .devview/control/verification-miss-log.json
visualReference: .devview/blueprint/visual-reference.json
uiThemeSpec: .devview/blueprint/ui-theme-spec.md
designTokens: .devview/blueprint/design-tokens.json
componentStyleContract: .devview/blueprint/component-style-contract.json
requirementTree: .devview/blueprint/requirement-tree.json
workDesign: .devview/blueprint/work-design.json
workGraph: .devview/blueprint/work-graph.json
verificationDesign: .devview/blueprint/verification-design.json
```

Do not force parity/completeness artifacts for small non-UI or non-parity tasks. When they are initialized, treat them as derived controls that may expand audit and verification coverage, not implementation scope.

Do not generate WPD, VD, ACEP, review, feedback, or revision files during start unless RPD is already complete and the next deterministic step can safely continue. Stop at UI/UX confirmation when UI/UX judgment is required.

## Workflow Depth Decision

Report the proposed workflow depth and why:

- no tracking / `bypass`: DevView is not needed; tell the user the direct path is safer and faster.
- compact / `lite`: small bounded slice with limited dependency impact.
- full depth / `full`: project construction, multi-module scope, UI/UX, parallel work, architecture runway, or future-impact risk.

If the recommendation is no tracking / `bypass`, do not manufacture `.devview` artifacts unless the user explicitly wants
them.

Compact depth is not a bypass. Use compact depth only for small, bounded, low-risk slices. If unsure, use full planning
depth.

Compact depth should still produce or confirm:

- mini Acceptance Criteria
- expectedFiles
- minimal Test/Evidence plan
- review submission
- explicit user acceptance

Increase compact work to full planning depth when product meaning, UI/UX taste or visual design, permission,
DB/schema, API/hardware, concurrency, repeated rejection, or high ambiguity appears. If compact depth cannot preserve
request -> AC -> Work -> Test/Evidence -> user review traceability, use full planning depth.

## Autoflow Behavior

After initialization:

```text
start -> rpd
```

When RPD completes:

```text
rpd -> ui ux confirm gate
```

At the UI/UX gate, stop and show the friendly UI/UX confirmation guidance. Do
not tell the user only to run another command.

## Response Format

After initialization, report with `[DevView ?곹깭 蹂닿퀬]` first, following `templates/stage-completion-status-card-template.md`.

The state card must include:

- created or updated files
- current stage
- execution profile
- current node id and title
- workflow state
- next action
- the single next RPD question, if RPD needs more input
- UI/UX confirmation guidance, if RPD completed and UI/UX confirmation is required
- whether DevView will continue automatically or is stopped at a human gate
- user reply examples and one recommended reply when a human response is needed

Use `[Codex 硫붾え]` only for short rationale, such as why the selected execution profile was chosen.

Ask only one open-ended question.
