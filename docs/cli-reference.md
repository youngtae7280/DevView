# CLI Reference

## Overview

The `pbe` CLI is the deterministic transition and validation layer for Project Blueprint Engine. Skills explain the
workflow, but stage closure, state transitions, file guard checks, and acceptance closure should go through CLI
commands.

Use `pbe status` when unsure. Use `pbe validate` for full repository and `.pbe` artifact validation.

See also: [Install PBE locally](install.md), [Troubleshooting](troubleshooting.md), and
[PBE Complexity Governance](complexity-governance.md).

For beta readiness and current limits, see [PBE v0.5.0-beta Readiness](beta-readiness.md) and
[Known Limits](known-limits.md).

For beta migration and optional artifact compatibility, see [Migration / Compatibility Policy](migration-policy.md).

For RPD question selection, see [Ambiguity Taxonomy](ambiguity-taxonomy.md).

For verification planning quality, see [VD Quality Rubric](vd-quality-rubric.md).

For evidence reviewability and proof strength, see [Evidence Quality Rubric](evidence-quality-rubric.md).

For parallel execution and validation safety, see [Parallel Safety Policy](parallel-safety.md).

For repeated review rejection and realignment, see [Review Failure Recovery](review-failure-recovery.md).

For adaptive workflow depth expectations and escalation rules, see
[Adaptive Workflow Depth Policy](lite-mode-policy.md).

`pbe status` can read stored compatibility profile metadata and show workflow-depth guidance. This is guidance only; it
does not create a separate `pbe lite` command or reduced artifact initialization.

## App-First Usage

In the Codex app, most users start with:

```text
@project-blueprint-engine start
```

A one-line task description may be added after `start`, but `Brief:` is not required syntax. If no task is provided,
PBE/Codex should inspect the current repo and ask which task or slice to manage when it cannot infer one.

The underlying `pbe` CLI commands are primarily for Codex internals, manual CLI control, debugging, CI, and advanced
users.

## Graph-First Positioning

PBE's current forward direction is graph-source-backed read-model projection and evidence. The RPD/WPD/VD/ACEP command
surface remains supported because existing skills, examples, validators, and initialized projects still depend on it.

Treat these stage commands as the tree-control compatibility layer:

- `pbe rpd ...`
- `pbe wpd ...`
- `pbe vd ...`
- `pbe acep ...`
- `.pbe/blueprint/*`
- `.pbe/codex-execution-pack/*`

They are still valid for deterministic transitions and compatibility closure, but they are not a reversal of the
graph-first direction. Do not interpret a stage command pass as Graph-source promotion, tree-native retirement, CI
enforcement, or user acceptance.

Run local verification commands sequentially, especially on Windows, because validation commands that rebuild the CLI
can touch `clean-dist` / `dist`.

When the user's request is vague, PBE should draft a Product Tree candidate first, ask only the highest-impact question,
and wait for user confirmation before closing RPD.

Most commands follow this pattern:

- read `.pbe` artifacts
- run the command-specific validator or transition guard
- leave artifacts unchanged on failure
- write only the command-owned artifact or state transition on success
- report `suggestedFix` and `nextCommand` when PBE can infer them

## Common Options

- `--root <path>`: target project root. Defaults to the current directory.
- `--json`: print stable JSON for automation.
- `--brief <text>`: task description for recommendation commands.
- `--profile <full|lite|bypass>`: compatibility workflow-depth hint for init and recommendation commands. PBE has one
  public workflow; these values should not be treated as separate user-facing modes.
- `--stage <stage>`: traceability/evidence stage mode for `pbe trace check`, or context stage for
  `pbe context recommend`.
- `--text <text>`: text to assess for `pbe gate assess`.
- `--transition <transition>`: Human Gate transition context for `pbe gate assess`.
- `--max-chars <number>`: maximum generated bundle length for `pbe context pack`. Defaults to `12000`.
- `--change <id>`: Change node id for Impact, Revision, and Product Patch commands.
- `--product <id>`: Product node id. May be repeated or comma-separated.
- `--work <id>`: Work node id. May be repeated or comma-separated.
- `--test <id>`: Test node id. May be repeated or comma-separated.
- `--evidence <id>`: Evidence node id. May be repeated or comma-separated.
- `--acceptance <id>`: Acceptance branch/node id. May be repeated or comma-separated.
- `--patch <id>`: Product Patch node id for `pbe product patch apply`.
- `--operation <value>`: Product Patch operation, such as `update_acceptance_criteria`.
- `--files <list>`: comma-separated candidate changed/expected files for `pbe profile recommend`.

## Status And Validation Commands

### `pbe status`

- Purpose: Show current PBE state and the likely next CLI command.
- Typical state before running: Any initialized or uninitialized project.
- What it checks: Lightweight project initialization, `pbe-state.json` parse, known state, open blocking decisions,
  recorded `lastFailure`, active revision consistency.
- What it writes: Nothing.
- Success result: Prints current state, current gate, next step, delivery status, active revision, last transition,
  recommended next command, blocking issue summary, and suggested fix.
- Context guidance: `pbe status` is context-aware. In JSON output, `recommendedContext` suggests which `agent-context/`
  cards to read first and which full docs to load only if needed. This is guidance only; status does not read those
  files or mutate PBE state.
- Common failures: `PBE_NOT_INITIALIZED`, invalid state JSON, unknown state issue in JSON output.
- Next command: Follow `recommendedNextCommand`, or run `pbe validate` for full checks.

### `pbe validate`

- Purpose: Run repository-level and `.pbe` validation.
- Typical state before running: Any time a full health check is needed.
- What it checks: Legacy repository validation, v2 tree system validation, state validator, acceptance actor validator,
  Change Tree, Impact Tree, Product Patch Tree, and visual validator when `.pbe` exists.
- What it writes: Nothing.
- Success result: Validation passes with zero error issues.
- Common failures: `LEGACY_PBE_VALIDATOR_FAILED`, `V2_TREE_VALIDATOR_FAILED`, `UNKNOWN_STATE`,
  `PRODUCT_PATCH_OPERATION_INVALID`, acceptance/evidence/visual closure issues.
- Next command: Follow issue `nextCommand`; otherwise fix reported artifacts and rerun `pbe validate`.

### `pbe gate <stage>`

- Purpose: Compatibility gate check for a named stage.
- Positioning: `pbe gate` is retained as a compatibility/helper check. The preferred primary workflow is to use
  stage-specific transition commands such as `pbe rpd close`, `pbe wpd close`, `pbe vd close`, `pbe acep ready`,
  `pbe execution start`, `pbe review submit`, and `pbe accept`.
- Typical state before running: Before entering a stage, especially older workflows that still call gate checks.
- What it checks: Stage-specific readiness and transition guard compatibility.
- What it writes: Nothing.
- Success result: Gate check passes.
- Common failures: transition blocked, missing prerequisite artifacts, incomplete upstream stage.
- Next command: Prefer modern transition commands such as `pbe wpd close`, `pbe execution start`, or
  `pbe review submit`.

### `pbe gate assess`

- Purpose: Assess whether an assumption or transition should stop for a Human Gate using clarity score plus hard
  triggers.
- Positioning: This is advisory and read-only. It does not block transitions, change validator policy, create `.pbe`, or
  modify state/artifacts.
- Typical state before running: Any time a Product, Work, Test, Evidence, ACEP, review, product patch, or acceptance
  decision may be ambiguous.
- Options: `--text <text>` is required. `--transition <transition>` defaults to `product-to-work`. `--profile` defaults
  to `lite`.
- Supported transitions: `product-tree`, `product-to-work`, `work-scope`, `work-to-test`, `test-to-evidence`,
  `acep-preflight`, `review-revision`, `product-patch`, and `acceptance`.
- What it checks: deterministic heuristics for `clarityScore`, `ambiguityLevel`, hard triggers, `requiresHumanGate`,
  reasons, and a concise recommended question.
- What it writes: Nothing.
- Acceptance rule: `--transition acceptance` always requires a Human Gate because final acceptance is user-only.
- JSON output: Includes `transition`, `profile`, `inputText`, `clarity`, `hardTriggers`, `requiresHumanGate`, `reasons`,
  `recommendedQuestion`, and `readOnly: true`.

Examples:

```bash
pbe gate assess --text "choices should be displayed" --transition product-to-work --profile lite
pbe gate assess --text "make the UI clean" --transition product-tree --profile lite --json
```

### `pbe profile recommend`

- Purpose: Recommend workflow depth from a task brief and optional expected file list. The command keeps
  `recommendedProfile` for compatibility with existing artifacts and tests.
- Typical state before running: Before `pbe init`, or when deciding whether a small request needs PBE tracking.
- Options: `--brief <text>` is required. `--files <comma-separated paths>` is optional and is treated conservatively.
- What it checks: Deterministic keyword and file-path heuristics. It does not perform semantic product analysis.
- What it writes: Nothing. It does not run `pbe init`.
- Success result: Prints workflow depth, compatibility profile value, confidence, reasons, escalation triggers, notes,
  and a suggested `pbe init --profile ...` command.
- JSON output: Includes `recommendedProfile`, `workflowDepth`, `confidence`, `reasons`, `escalationTriggers`,
  `suggestedInitCommand`, and `notes`.
- Common failures: missing or empty `--brief`.
- Next command: User or Codex confirms the target task, then runs `pbe init --profile <profile> --brief "..."` if PBE
  tracking is desired. App users do not need to choose a public mode.
- Conservative rule: if the brief or files indicate uncertainty, product meaning, UI/UX, CLI/validator/schema/state,
  CI/package, fixture, or broad implementation risk, use full planning depth.

### `pbe context recommend`

- Purpose: Recommend the smallest useful set of skills, `agent-context/` cards, and optional full docs from a brief,
  stage, and profile.
- Typical state before running: Before broad docs scanning, before choosing which PBE skill or reference to load.
- Options: `--brief <text>` and/or `--stage <stage>`. At least one is required. `--profile <full|lite|bypass>` is
  optional.
- Supported context stages: `start`, `rpd`, `wpd`, `vd`, `execution`, `review`, `revision`, `product-patch`, `parallel`,
  and `documentation`. `docs` is an alias for `documentation`.
- Documentation maintenance requests such as `docs/troubleshooting`, install guide, README, `npm.cmd`, PowerShell
  execution policy, or usage docs are routed to the `documentation` context category.
- What it checks: Deterministic keyword and stage mapping only. It does not perform semantic product analysis.
- What it writes: Nothing. It is read-only, does not create `.pbe`, does not run `pbe init`, and does not modify state
  or artifacts.
- Success result: Prints detected stage, profile, recommended skills, cards to read first, full docs to read only if
  needed, docs not to read by default, reasons, and notes.
- JSON output: Includes `detectedStage`, `profile`, `skills`, `readFirst`, `readOnlyIfNeeded`, `doNotReadByDefault`,
  `reasons`, and `notes`.
- Common failures: missing both `--brief` and `--stage`; unsupported context stage.
- Next command: Read the `readFirst` cards first. Load full docs only when a card says they are needed.
- Judgment rule: The command helps route context. It does not replace user judgment, Product Tree confirmation, or stage
  closure gates.

Examples:

```bash
pbe context recommend --brief "검색 기능 검증 설계"
pbe context recommend --stage rpd
pbe context recommend --stage documentation
pbe context recommend --stage docs
pbe context recommend --stage vd --profile lite
pbe context recommend --brief "리뷰했는데 아직도 별로야" --profile full --json
```

Example JSON shape:

```json
{
  "detectedStage": "vd",
  "profile": "lite",
  "skills": ["pbe-vd"],
  "readFirst": ["agent-context/vd.md", "agent-context/evidence.md", "agent-context/lite.md"],
  "readOnlyIfNeeded": ["docs/vd-quality-rubric.md", "docs/evidence-quality-rubric.md", "docs/lite-mode-policy.md"],
  "doNotReadByDefault": ["docs/review-failure-recovery.md", "docs/parallel-safety.md"],
  "reasons": ["brief appears to ask for verification design", "VD work requires Test/Evidence guidance"],
  "notes": [
    "Read readFirst before broad docs scanning.",
    "Load full docs only when the context card says they are needed.",
    "This command is read-only and does not modify PBE state."
  ]
}
```

### `pbe context pack`

- Purpose: Create a compact prompt-ready Markdown bundle from the `readFirst` files recommended by
  `pbe context recommend`.
- Typical state before running: Before broad docs scanning, especially when Codex needs a small context bundle for a
  brief, stage, or profile.
- Options: `--brief <text>` and/or `--stage <stage>`. At least one is required. `--profile <full|lite|bypass>` is
  optional. `--max-chars <number>` limits the generated bundle and defaults to `12000`.
- What it reads: Only recommended `readFirst` files from `agent-context/`, resolved from the plugin root.
- What it does not read: `readOnlyIfNeeded` and `doNotReadByDefault` file contents are not included. They are listed as
  paths only.
- What it writes: Nothing. It is read-only, does not create `.pbe`, does not run `pbe init`, and does not modify state,
  artifacts, source files, or docs.
- Success result: Prints a Markdown context pack with recommendation summary, operating rules, included context,
  read-only-if-needed paths, do-not-read-by-default paths, and warnings.
- Suggested gate assessment: When a brief is available, context pack also suggests a follow-up `pbe gate assess`
  command. This is advisory and read-only; it does not run the assessment automatically or block state transitions.
- JSON output: Includes `recommendation`, `includedFiles`, `suggestedGateAssessment`, `bundle`, `warnings`, and
  `readOnly: true`.
- Missing files: Missing recommended `readFirst` files are reported as warnings instead of failing the command.
- Truncation: If the generated bundle exceeds `--max-chars`, the bundle is truncated and a warning is recorded.

Examples:

```bash
pbe context pack --brief "검색 기능 검증 설계" --profile lite
pbe context pack --stage vd --profile lite --json
pbe context pack --brief "choices should be displayed" --profile lite
pbe gate assess --text "choices should be displayed" --transition product-to-work --profile lite
pbe context pack --brief "docs/known-limits.md 한 줄 수정" --profile lite --max-chars 8000
```

## Requirement/Product Commands

### `pbe rpd check`

- Purpose: Check Product Tree/RPD readiness without closing the stage.
- Typical state before running: `INIT`, `WAITING_ROOT_CONFIRMATION`, or `RPD_IN_PROGRESS`.
- What it checks: Product Tree structure, root/user confirmation, acceptance criteria, ambiguity, blocking decisions.
- What it writes: Nothing.
- Success result: RPD/Product Tree is ready or reports remaining issues.
- Common failures: `ROOT_NOT_CONFIRMED_BY_USER`, `ACCEPTANCE_CRITERIA_MISSING`, `AC_ABSTRACT_TERM`,
  `BLOCKING_DECISION_OPEN`.
- Next command: `pbe rpd close`.

### `pbe rpd close`

- Purpose: Close RPD/Product Tree growth and transition to `RPD_DONE`.
- Typical state before running: `INIT`, `WAITING_ROOT_CONFIRMATION`, or RPD-ready state.
- What it checks: RPD validator, Product Tree acceptance readiness, user confirmation, allowed transition.
- What it writes: `.pbe/blueprint/pbe-state.json` state/history.
- Success result: State becomes `RPD_DONE`.
- Common failures: incomplete Product Tree, unresolved ambiguity, missing user confirmation, invalid transition.
- Next command: `pbe ui approve` when UI/UX confirmation is required, or `pbe wpd close`.

### `pbe product patch propose`

- Purpose: Create a Product Patch Proposal from an existing Change node and target Product node.
- Typical state before running: After `pbe change create`; before directly editing product meaning.
- What it checks: `--change`, `--product`, `--operation`, `--summary`; Change node exists; Product node exists;
  operation is allowed.
- What it writes: `.pbe/control/product-patch-tree.json`.
- Success result: Creates `PP-*` with `status: proposed`, `requiresUserConfirmation: true`, `userConfirmed: false`,
  `beforeSnapshot`, and `afterProposal`. Product Tree is not changed.
- Common failures: `PRODUCT_PATCH_CHANGE_REQUIRED`, `PRODUCT_PATCH_CHANGE_MISSING`, `PRODUCT_PATCH_TARGET_REQUIRED`,
  `PRODUCT_PATCH_TARGET_MISSING`, `PRODUCT_PATCH_OPERATION_INVALID`.
- Next command: Record explicit user confirmation on the patch, then run `pbe product patch apply --patch PP-001`.

### `pbe product patch apply`

- Purpose: Apply a confirmed Product Patch Proposal to Product Tree.
- Typical state before running: A proposed/confirmed Product Patch has explicit user confirmation.
- What it checks: Patch exists, status is `proposed` or `confirmed`, `userConfirmed: true`,
  `confirmation.actor: "user"`, `beforeSnapshot` still matches the target Product node, operation can be applied.
- What it writes: `.pbe/tree/product-tree.json` and `.pbe/control/product-patch-tree.json`.
- Success result: Product Tree changes, patch status becomes `applied`, `appliedAt` is recorded.
- Common failures: `PRODUCT_PATCH_CONFIRMATION_REQUIRED`, `PRODUCT_PATCH_SNAPSHOT_MISMATCH`,
  `PRODUCT_PATCH_ALREADY_APPLIED`, `PRODUCT_PATCH_OPERATION_INVALID`.
- Next command: `pbe impact analyze`, then re-enter Change/Impact/Revision and downstream closure.

## Planning Commands

### `pbe ui approve`

- Purpose: Record user UI/UX approval and transition to `UI_UX_APPROVED`.
- Typical state before running: `RPD_DONE` or `WAITING_UI_UX_CONFIRM`.
- What it checks: UI/UX confirmation artifact and allowed transition.
- What it writes: confirmation metadata and `pbe-state.json`.
- Success result: State becomes `UI_UX_APPROVED`.
- Common failures: missing UI/UX confirmation, invalid transition, approval not from user.
- Next command: `pbe wpd close`.

### `pbe wpd check`

- Purpose: Check Work Tree/WorkGraph readiness without closing WPD.
- Typical state before running: `UI_UX_APPROVED`, `VISUAL_CONTRACT_READY`, or `WPD_IN_PROGRESS`.
- What it checks: Work derivation, Product-to-Work coverage, inactive scope leaks, dependency graph.
- What it writes: Nothing.
- Success result: WPD readiness report.
- Common failures: `PRODUCT_WORK_LINK_MISSING`, `WORK_WITHOUT_PRODUCT`, `DEFERRED_SCOPE_LEAK`, dependency cycle.
- Next command: `pbe wpd close`.

### `pbe wpd close`

- Purpose: Validate WPD and transition to `WPD_DONE`.
- Typical state before running: `UI_UX_APPROVED`, `VISUAL_CONTRACT_READY`, or `WPD_IN_PROGRESS`.
- What it checks: WPD validator, traceability at WPD stage, allowed transition.
- What it writes: `pbe-state.json`.
- Success result: State becomes `WPD_DONE`.
- Common failures: missing Work Tree/WorkGraph, missing Product-to-Work links, inactive scope leaks.
- Next command: `pbe vd close`.

### `pbe vd check`

- Purpose: Check Test Tree and verification coverage without closing VD.
- Typical state before running: `WPD_DONE` or `VD_IN_PROGRESS`.
- What it checks: Work-to-Test coverage, acceptance criteria coverage, evidence declarations, UI evidence requirements.
- What it writes: Nothing.
- Success result: VD readiness report.
- Common failures: `WORK_TEST_LINK_MISSING`, `ACCEPTANCE_NOT_COVERED`, `TEST_EVIDENCE_DECLARATION_MISSING`.
- Next command: `pbe vd close`.

### `pbe vd close`

- Purpose: Validate VD/Test Tree and transition to `VD_DONE`.
- Typical state before running: `WPD_DONE` or `VD_IN_PROGRESS`.
- What it checks: VD validator, traceability at VD stage, allowed transition.
- What it writes: `pbe-state.json`.
- Success result: State becomes `VD_DONE`.
- Common failures: missing Test Tree, missing test coverage, incomplete verification design.
- Next command: `pbe scope select`.

### `pbe scope select`

- Purpose: Record implementation scope selection.
- Typical state before running: `VD_DONE` or `WAITING_IMPLEMENTATION_SCOPE`.
- What it checks: Scope readiness and allowed transition.
- What it writes: `pbe-state.json`.
- Success result: State becomes `SCOPE_SELECTED`.
- Common failures: invalid transition, unresolved scope/blocking decision.
- Next command: `pbe acep ready` after required pre-ACEP checkpoints.

## Execution Commands

### `pbe acep check`

- Purpose: Check ACEP execution pack readiness.
- Typical state before running: After planning artifacts exist, before `pbe acep ready`.
- What it checks: ACEP manifest, Cycle/Node Execution Contract projections, task-card compatibility views, traceability,
  selected/foundation scope constraints.
- What it writes: Nothing.
- Success result: ACEP readiness report.
- Common failures: missing manifest, inactive scope tasks, incomplete task/evidence metadata.
- Next command: `pbe acep ready`.

### `pbe acep ready`

- Purpose: Validate ACEP compatibility/execution packaging and transition to `ACEP_READY`.
- Typical state before running: `SCOPE_SELECTED` plus required pre-ACEP checkpoints.
- What it checks: ACEP validator, pre-ACEP checkpoints, allowed transition. This does not promote Graph-source
  authority, retire tree-native artifacts, or replace read-model projection evidence.
- What it writes: `pbe-state.json`.
- Success result: State becomes `ACEP_READY`.
- Common failures: missing checkpoint artifact, missing ACEP manifest, invalid transition.
- Next command: `pbe execution start`.

### `pbe execution start`

- Purpose: Start implementation execution.
- Typical state before running: `ACEP_READY`.
- What it checks: allowed transition.
- What it writes: `pbe-state.json`.
- Success result: State becomes `EXECUTION_IN_PROGRESS`.
- Common failures: invalid transition.
- Next command: perform bounded implementation work, then `pbe execution complete`.

### `pbe execution complete`

- Purpose: Validate execution evidence and close execution.
- Typical state before running: `EXECUTION_IN_PROGRESS`.
- What it checks: execution traceability, evidence coverage, evidence file presence/freshness policy for execution.
- What it writes: `pbe-state.json`.
- Success result: State becomes `ACEP_RUN_DONE`.
- Common failures: `TEST_EVIDENCE_LINK_MISSING`, `REQUIRED_TEST_NO_EVIDENCE`, `EVIDENCE_FILE_MISSING`.
- Next command: `pbe review submit`.

### `pbe review submit`

- Purpose: Submit verified work to the Review Result gate.
- Typical state before running: `ACEP_RUN_DONE` or `VISUAL_AUDIT_DONE`.
- What it checks: review-stage traceability, evidence readiness, visual audit when required, File Change Guard.
- What it writes: `pbe-state.json`.
- Success result: State becomes `WAITING_REVIEW_RESULT`.
- Common failures: stale evidence, missing visual audit, unexplained source file changes, invalid transition.
- Next command: user review; then `pbe accept` or `pbe change create`.

### `pbe accept`

- Purpose: Close work as accepted only with explicit user acceptance metadata.
- Typical state before running: `WAITING_REVIEW_RESULT` or `ACCEPTED`.
- What it checks: user Acceptance Tree closure, accept-stage traceability, evidence freshness, File Change Guard.
- What it writes: `pbe-state.json`.
- Success result: State moves through `ACCEPTED` to `DONE` when closure is complete.
- Common failures: `USER_ACCEPTANCE_REQUIRED`, `ASSISTANT_ACCEPTED_STATUS`, `ACCEPTANCE_CLOSURE_MISSING`,
  stale/unexplained evidence or file changes.
- Next command: no next command when complete; for new feedback run `pbe change create`.

## Change/Revision Commands

### `pbe change create`

- Purpose: Record user feedback or change request as a Change node.
- Typical state before running: User requests changes, often at review or after done.
- What it checks: `--summary` and valid Change Tree.
- What it writes: `.pbe/control/change-tree.json`.
- Success result: Creates `CH-*` with `status: proposed`.
- Common failures: `CHANGE_SUMMARY_MISSING`, invalid or missing Change Tree.
- Next command: `pbe impact analyze --change CH-001`.

### `pbe impact analyze`

- Purpose: Create Impact node links for an existing Change node.
- Typical state before running: After `pbe change create`.
- What it checks: Change exists, Impact Tree exists, affected ids are provided or derivable.
- What it writes: `.pbe/control/impact-tree.json` and updates Change node status to `impact_analyzed`.
- Success result: Creates `IM-*` linked to the Change node.
- Common failures: `IMPACT_CHANGE_NOT_FOUND`, `IMPACT_AFFECTED_IDS_MISSING`.
- Next command: `pbe revision start --change CH-001`.

### `pbe revision start`

- Purpose: Enter `REVISION_REQUESTED` after Impact analysis and invalidate affected proof.
- Typical state before running: `WAITING_REVIEW_RESULT`, `ACCEPTED`, or `DONE` with analyzed impact.
- What it checks: Change exists, Impact exists, affected ids exist, allowed transition, affected Evidence/Acceptance
  artifacts are parseable.
- What it writes: `pbe-state.json`, activeRevision, affected Evidence/Acceptance invalidation metadata.
- Success result: State becomes `REVISION_REQUESTED`; activeRevision is recorded.
- Common failures: `REVISION_IMPACT_MISSING`, `REVISION_IMPACT_AFFECTED_IDS_MISSING`, `REVISION_CHANGE_NOT_FOUND`,
  invalid Evidence/Acceptance JSON.
- Next command: perform bounded revision work, then `pbe revision complete`.

### `pbe revision complete`

- Purpose: Finish bounded revision work and return to the required closure path.
- Typical state before running: `REVISION_REQUESTED` with matching activeRevision.
- What it checks: activeRevision exists and matches `--change`, revision context is valid.
- What it writes: `pbe-state.json`, revision history/checkpoint state.
- Success result: Workflow returns to WPD/VD/ACEP/Execution/Review/Accept closure as required.
- Common failures: `REVISION_CONTEXT_MISSING`, `REVISION_CHANGE_MISMATCH`, `REVISION_CONTEXT_NOT_IN_PROGRESS`.
- Next command: `pbe wpd close`, `pbe vd close`, `pbe acep ready`, or the next command reported by status.

## Guard/Check Commands

### `pbe trace check`

- Purpose: Check Product/Work/Test/Evidence/Acceptance traceability.
- Typical state before running: Any time, especially before WPD/VD/execution/review/accept closure.
- What it checks: Stage-aware traceability with `--stage`.
- What it writes: Nothing.
- Success result: Traceability passes for the selected stage.
- Common failures: `PRODUCT_WORK_LINK_MISSING`, `WORK_TEST_LINK_MISSING`, `TEST_EVIDENCE_LINK_MISSING`,
  `ACCEPTANCE_CLOSURE_MISSING`.
- Next command: Follow the stage-specific issue `nextCommand`.

### `pbe files check`

- Purpose: Check changed source files against Work/Revision scope.
- Typical state before running: Before `pbe review submit` or `pbe accept`, or when unsure about source changes.
- What it checks: git diff, expected/forbidden files, unknown file risk, activeRevision affected scope.
- What it writes: Nothing.
- Success result: File Change Guard passes.
- Common failures: `FILE_CHANGE_OUTSIDE_WORK_SCOPE`, `FILE_CHANGE_FORBIDDEN`, `FILE_CHANGE_REQUIRES_REVISION`,
  `GIT_DIFF_UNAVAILABLE`.
- Next command: Fix scope, run `pbe change create`, or rerun `pbe files check`.

### `pbe evidence check`

- Purpose: Check evidence coverage and freshness.
- Typical state before running: After tests/evidence are captured, before execution/review/accept closure.
- What it checks: Evidence Tree links, file existence, timestamp/freshness policy.
- What it writes: Nothing.
- Success result: Evidence validation passes.
- Common failures: `EVIDENCE_FILE_MISSING`, `EVIDENCE_TIMESTAMP_MISSING`, `EVIDENCE_STALE`, `EVIDENCE_NOT_CURRENT`.
- Next command: Attach or refresh evidence, then rerun the closure command.

### `pbe visual check`

- Purpose: Check Visual Design Contract and UI evidence.
- Typical state before running: For selected visual UI work, before WPD/ACEP/review/accept closure.
- What it checks: visual reference, design tokens, component contract, UI surface inventory, visual evidence, visual
  audit.
- What it writes: Nothing.
- Success result: Visual validation passes.
- Common failures: visual source missing, missing UI screenshot evidence, stale visual evidence, unresolved visual audit
  blocking issues.
- Next command: Fix visual artifacts/evidence, then rerun the blocked stage command.

## Compatibility Closure Workflow

This workflow is the supported tree-control compatibility closure path. It remains useful for initialized `.pbe`
projects and existing skills, but it is not a repo-wide Graph-source promotion path.

```text
pbe status
pbe rpd check
pbe rpd close
pbe ui approve
pbe wpd close
pbe vd close
pbe scope select
pbe acep check
pbe acep ready
pbe execution start
# bounded implementation work
pbe files check
pbe execution complete
pbe review submit
# user reviews result
pbe accept
```

For user feedback or product meaning changes:

```text
pbe change create --summary "..."
pbe impact analyze --change CH-001 --product PT-1
pbe product patch propose --change CH-001 --product PT-1 --operation update_acceptance_criteria --summary "..."
# record explicit user confirmation on PP-001
pbe product patch apply --patch PP-001
pbe revision start --change CH-001
# bounded revision work
pbe revision complete --change CH-001
pbe status
```

## Common Failure Codes And Next Command Examples

| Failure code                          | Meaning                                                  | Likely next command                                |
| ------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `ROOT_NOT_CONFIRMED_BY_USER`          | Product root lacks explicit user confirmation.           | `pbe rpd check`                                    |
| `AC_ABSTRACT_TERM`                    | Acceptance criteria contain subjective language.         | `pbe rpd check`                                    |
| `PRODUCT_WORK_LINK_MISSING`           | Product scope lacks Work coverage.                       | `pbe wpd close`                                    |
| `WORK_TEST_LINK_MISSING`              | Work lacks Test coverage.                                | `pbe vd close`                                     |
| `TEST_EVIDENCE_LINK_MISSING`          | Test lacks Evidence coverage.                            | `pbe execution complete`                           |
| `EVIDENCE_STALE`                      | Evidence is older than linked work/test/product context. | refresh evidence, then rerun closure               |
| `ACCEPTANCE_CLOSURE_MISSING`          | User Acceptance closure is incomplete.                   | `pbe accept`                                       |
| `USER_ACCEPTANCE_REQUIRED`            | Acceptance must come from the user.                      | `pbe accept`                                       |
| `FILE_CHANGE_REQUIRES_REVISION`       | Source file changes are not explained by current scope.  | `pbe change create`                                |
| `IMPACT_AFFECTED_IDS_MISSING`         | Impact analysis has no affected nodes.                   | `pbe impact analyze`                               |
| `REVISION_IMPACT_MISSING`             | Revision was requested without analyzed impact.          | `pbe impact analyze`                               |
| `REVISION_CONTEXT_MISSING`            | Active revision context is missing.                      | `pbe revision start`                               |
| `PRODUCT_PATCH_CONFIRMATION_REQUIRED` | Product Patch lacks explicit user confirmation.          | `pbe product patch apply` after confirmation       |
| `PRODUCT_PATCH_SNAPSHOT_MISMATCH`     | Product node changed after patch proposal.               | recreate proposal with `pbe product patch propose` |
| `PRODUCT_PATCH_OPERATION_INVALID`     | Product Patch operation is unsupported.                  | `pbe product patch propose`                        |
| `UNKNOWN_STATE`                       | `autoflow.state` is not a known PBE state.               | `pbe status` or `pbe validate`                     |
