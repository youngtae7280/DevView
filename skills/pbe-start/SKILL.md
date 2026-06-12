---
name: pbe-start
description: Start Project Blueprint Engine in a target repo, enable autoflow, create tree-native .pbe artifacts with backward-compatible blueprint views, and begin RPD/Product Tree growth automatically.
---

# PBE Start

Use this skill when the user asks to start Project Blueprint Engine, for example:

```text
@project-blueprint-engine start
Project: inventory management program
```

or:

```text
@project-blueprint-engine start
Add order cancellation to this existing project.
```

## Purpose

Initialize `.pbe/` in the target repository. PBE is not a GUI and does not call OpenAI APIs from a separate app. It is a Codex skill workflow that writes durable planning, execution, control, evidence, and compatibility artifacts into the repository.

PBE v2 is tree-native. The Product Tree is the source of truth. Existing RPD, WPD, VD, and ACEP names remain valid compatibility terms:

- `RPD`: Product Tree growth plus `.pbe/blueprint/requirement-tree.json` compatibility view.
- `WPD`: Project Tree and Work Tree derivation plus WorkDesign/WorkGraph compatibility views.
- `VD`: Test Tree derivation plus VerificationDesign compatibility view.
- `ACEP`: Cycle Contract and Node Execution Contract packaging plus the existing execution pack views.

`start` enables Autoflow. The user should not need to type each internal step
manually after start.

PBE is optimized for safe, reviewable, staged project construction, not for speed. Default to the `full` execution profile for new projects, large features, UI/UX work, multi-module changes, architecture decisions, parallel work, or future-module impact.

Use `bypass` only when the request is a typo, single-file edit, or clearly bounded small bug fix. Use `lite` only when a blueprint already exists and the user asks for a small slice that does not need full ACEP execution.

## Required Actions

Prefer `pbe init --profile <full|lite|bypass> --brief "<user brief>"` when initializing deterministic PBE artifacts. After creating or updating `.pbe` artifacts, run:

```bash
pbe status
pbe validate
```

If either command fails, do not proceed to RPD until the blocking issue is fixed.

1. Inspect the target repository enough to understand whether this is a new project or a change to an existing project.
2. Run `pbe init --profile <profile> --brief "<user request>"` to create baseline `.pbe` directories, templates, and initial state.
3. If compatibility bootstrap must be done manually, mirror `pbe init` output and then run `pbe status` and `pbe validate`.
4. Create `.pbe/tree/product-tree.json` from `templates/product-tree.template.json` if it does not exist.
5. Create `.pbe/tree/project-tree.json` from `templates/project-tree.template.json` if it does not exist.
6. Create `.pbe/tree/work-tree.json` from `templates/work-tree.template.json` if it does not exist.
7. Create `.pbe/tree/test-tree.json` from `templates/test-tree.template.json` if it does not exist.
8. Create `.pbe/control/decision-queue.json`, `.pbe/control/change-tree.json`, `.pbe/control/impact-tree.json`, `.pbe/control/acceptance-tree.json`, and `.pbe/evidence/evidence-tree.json` from matching templates if they do not exist.
8a. When the brief indicates legacy migration, parity-critical UI, UI-heavy surfaces, hardware-dependent work, or repeated verification misses, initialize the parity/completeness control artifacts from matching templates.
9. Create or update `.pbe/blueprint/project-brief.md`.
10. Create `.pbe/blueprint/requirement-tree.json` with a root node if it does not exist, treating it as the Product Tree compatibility alias.
11. Create `.pbe/blueprint/pbe-routing-contract.md` from the PBE Routing Contract template.
12. Create `.pbe/blueprint/source-of-truth-matrix.md` from the Source of Truth Matrix template.
13. Create `.pbe/blueprint/pbe-invariants.md` from the PBE Invariants template.
14. Create `.pbe/blueprint/foundation-contract.md` and `.pbe/blueprint/parallel-safety-contract.md` placeholders.
15. Create dependency impact placeholders for `.pbe/blueprint/dependency-impact-audit.json` and `.pbe/blueprint/dependency-impact-audit.md`.
16. Create `.pbe/blueprint/requirement-tree.md`, `.pbe/blueprint/rpd-interview-log.md`, and `.pbe/blueprint/rpd-summary.md`.
17. Initialize UI/UX confirmation placeholders when UI work may be involved.
17a. Initialize Visual Design Contract placeholders when visual UI work may be involved: visual reference, theme spec, design tokens, component style contract, UI surface inventory, component style inventory, visual verification profile, and visual audit report path.
18. Confirm `pbe init` initialized `pbe-state.json.autoflow` with:
   - `state`: `INIT`
   - `enabled`: `true`
   - `profile`: `full`, `lite`, or `bypass`
   - `completedSteps`: `["start"]`
   - `nextStep`: `rpd`
19. Confirm tree-native artifact paths exist in `pbe-state.json.artifacts` so later stages can discover Product, Project, Work, Test, Cycle, Decision, Change, Impact, Evidence, and Acceptance trees without guessing paths.
20. Immediately begin RPD/Product Tree growth unless the selected profile is `bypass`.
21. If the provided project brief is clear, propose the Root requirement summary and child structure, then stop at the `root_confirmation` gate.
22. If RPD needs more information before a safe proposal, ask exactly one RPD question. The user should answer naturally; do not require `@project-blueprint-engine rpd`.
23. Do not create code, documents, slide decks, spreadsheets, images, generated assets, or review reports until the Root requirement and decomposition decision are user-confirmed.

## File Contract

Use these primary tree-native paths:

```text
.pbe/tree/product-tree.json
.pbe/tree/project-tree.json
.pbe/tree/work-tree.json
.pbe/tree/test-tree.json
.pbe/execution/cycle-tree.json
.pbe/execution/cycle-contract.md
.pbe/execution/node-execution-contracts/
.pbe/control/decision-queue.json
.pbe/control/change-tree.json
.pbe/control/impact-tree.json
.pbe/control/acceptance-tree.json
.pbe/control/legacy-control-inventory.json
.pbe/control/surface-completion-ledger.json
.pbe/control/hardware-readiness-ledger.json
.pbe/control/ui-surface-inventory.json
.pbe/control/component-style-inventory.json
.pbe/control/visual-verification-profile.json
.pbe/control/verification-miss-log.json
.pbe/evidence/evidence-tree.json
.pbe/evidence/screenshots/
.pbe/evidence/review-reports/
.pbe/evidence/test-results/
.pbe/evidence/logs/
```

Also keep these backward-compatible blueprint paths:

```text
.pbe/blueprint/pbe-state.json
.pbe/blueprint/project-brief.md
.pbe/blueprint/pbe-routing-contract.md
.pbe/blueprint/source-of-truth-matrix.md
.pbe/blueprint/pbe-invariants.md
.pbe/blueprint/foundation-contract.md
.pbe/blueprint/parallel-safety-contract.md
.pbe/blueprint/dependency-impact-audit.json
.pbe/blueprint/dependency-impact-audit.md
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/requirement-tree.md
.pbe/blueprint/rpd-interview-log.md
.pbe/blueprint/rpd-summary.md
.pbe/blueprint/ui-ux-preview.json
.pbe/blueprint/ui-ux-preview.md
.pbe/blueprint/ui-ux-confirmation.md
.pbe/blueprint/ui-ux-confirmation-log.md
.pbe/blueprint/visual-reference.json
.pbe/blueprint/visual-reference.md
.pbe/blueprint/ui-theme-spec.md
.pbe/blueprint/design-tokens.json
.pbe/blueprint/component-style-contract.json
```

When both v2 and v1 files exist, prefer the v2 tree file as the source of truth and update the v1 blueprint file as a compatibility view.

The initial root node status is `pending_interview` unless the user already provided enough detail to begin as `interviewing`.

If the user already provided enough detail, clear enough means "ready to propose", not "confirmed". In that case:

- keep the requirement root unconfirmed as `interviewing` or `ready_to_confirm`
- set the Product root to `proposed`
- keep the initial Autoflow state at `INIT` through `pbe init`
- record `root_confirmation` as the current gate through the initialized PBE state
- record `root_confirmation` as the next step through the initialized PBE state
- keep delivery status as `waiting_root_confirmation`
- ask the user to confirm, revise, or decompose the proposed Root structure

## Startup State

Prefer `pbe init --profile <profile> --brief "<user request>"` for initial `.pbe` bootstrap. If bootstrapping manually for compatibility, create the same artifacts and then run `pbe status` and `pbe validate`.

`pbe init` should create `pbe-state.json` with stage `rpd` and mode `rpd_tree_walk`.

Use `pbe init` so `pbe-state.json.autoflow.state` starts as `INIT`.

`pbe init` should set `pbe-state.json.autoflow.profile` to the chosen profile. If no profile is explicitly requested, use `full`.

`pbe init` should set `pbe-state.json.artifacts` to include at least:

```text
productTree: .pbe/tree/product-tree.json
projectTree: .pbe/tree/project-tree.json
workTree: .pbe/tree/work-tree.json
testTree: .pbe/tree/test-tree.json
cycleTree: .pbe/execution/cycle-tree.json
cycleContract: .pbe/execution/cycle-contract.md
nodeExecutionContracts: .pbe/execution/node-execution-contracts/
decisionQueue: .pbe/control/decision-queue.json
changeTree: .pbe/control/change-tree.json
impactTree: .pbe/control/impact-tree.json
acceptanceTree: .pbe/control/acceptance-tree.json
evidenceTree: .pbe/evidence/evidence-tree.json
legacyControlInventory: .pbe/control/legacy-control-inventory.json
surfaceCompletionLedger: .pbe/control/surface-completion-ledger.json
hardwareReadinessLedger: .pbe/control/hardware-readiness-ledger.json
visualVerificationProfile: .pbe/control/visual-verification-profile.json
uiSurfaceInventory: .pbe/control/ui-surface-inventory.json
componentStyleInventory: .pbe/control/component-style-inventory.json
verificationMissLog: .pbe/control/verification-miss-log.json
visualReference: .pbe/blueprint/visual-reference.json
uiThemeSpec: .pbe/blueprint/ui-theme-spec.md
designTokens: .pbe/blueprint/design-tokens.json
componentStyleContract: .pbe/blueprint/component-style-contract.json
requirementTree: .pbe/blueprint/requirement-tree.json
workDesign: .pbe/blueprint/work-design.json
workGraph: .pbe/blueprint/work-graph.json
verificationDesign: .pbe/blueprint/verification-design.json
```

Do not force parity/completeness artifacts for small non-UI or non-parity tasks. When they are initialized, treat them as derived controls that may expand audit and verification coverage, not implementation scope.

Do not generate WPD, VD, ACEP, review, feedback, or revision files during start unless RPD is already complete and the next deterministic step can safely continue. Stop at UI/UX confirmation when UI/UX judgment is required.

## Profile Decision

Report the chosen profile and why:

- `bypass`: PBE not needed; tell the user the direct coding path is safer and faster.
- `lite`: small slice with known blueprint and limited dependency impact.
- `full`: project construction, multi-module scope, UI/UX, parallel work, architecture runway, or future-impact risk.

If profile is `bypass`, do not manufacture `.pbe` artifacts unless the user explicitly wants them.

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

After initialization, report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must include:

- created or updated files
- current stage
- execution profile
- current node id and title
- autoflow state
- next action
- the single next RPD question, if RPD needs more input
- UI/UX confirmation guidance, if RPD completed and UI/UX confirmation is required
- whether PBE will continue automatically or is stopped at a human gate
- user reply examples and one recommended reply when a human response is needed

Use `[Codex 메모]` only for short rationale, such as why the selected execution profile was chosen.

Ask only one open-ended question.
