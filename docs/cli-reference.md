# CLI Reference

## Overview

The `pbe` CLI is the deterministic transition and validation layer for Project Blueprint Engine. Skills explain the
workflow, but stage closure, state transitions, file guard checks, and acceptance closure should go through CLI
commands.

Use `pbe status` when unsure. Use `pbe validate` for repository self-validation or initialized `.pbe` project
validation.

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
- `--candidate <file>`: Request IR Candidate JSON file for `pbe graph read-model validate-request-ir` and
  `pbe graph read-model validate-request-ir-graph`.
- `--schema-validation <file>`: schema-only Request IR validation JSON file for
  `pbe graph read-model validate-request-ir-graph`.
- `--boundary <file>`: boundary preview JSON for report-only or prompt-pack commands.
- `--schema <file>`: Request IR Candidate schema preview JSON for
  `pbe graph read-model generate-ai-request-analyzer-pack`.

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

- Purpose: Run repository-level validation in the PBE plugin repo, or adoption-safe `.pbe` project validation in an
  external initialized project.
- Typical state before running: Any time a full health check is needed.
- What it checks: Legacy repository validation, v2 tree system validation, state validator, acceptance actor validator,
  Change Tree, Impact Tree, Product Patch Tree, and visual validator when `.pbe` exists.
- Target behavior: In the plugin repository, repo-only validators remain strict. In an initialized non-plugin project,
  repo-only checks such as plugin README layout, skills inventory, templates/schemas inventory, and examples fixtures
  are skipped; project artifacts that exist still validate.
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

### `pbe graph execution-contract report`

- Purpose: Report the first graph-native execution contract view for a configured read-model slice.
- Typical state before running: After graph-source/read-model projection exists for a configured registry slice.
- What it checks: Configured slice/profile lookup, read-model registry entry, graph-source projection contract, and
  compatibility boundaries.
- What it writes: Nothing. This command is read-only and does not mutate `.pbe` state.
- Success result: JSON/text report with source slice/profile id, Product/Work/Test/Evidence references where available,
  source files, readiness notes, escalation triggers, and an ACEP compatibility note.
- Common failures: unknown slice or missing/corrupted graph-source projection.
- Next command: Continue using ACEP compatibility commands for execution packaging. This report is not a required
  validation gate and does not replace user acceptance.

Example:

```powershell
node dist/cli/index.js graph execution-contract report --slice examples/adoption/todo-search-slice --json
```

For the practical end-to-end sequence, see [Graph Operation Runbook](graph-operation-runbook.md).

### `pbe graph read-model check-scope`

- Purpose: Run the local advisory scope compliance evaluator for explicit Git refs.
- Typical state before running: After building the CLI, when a local DevView runtime slice needs a fast scope summary.
- Options: `--base <baseRef>` and `--head <headRef>` are required. `--output <file>` may write the full advisory JSON
  artifact. `--markdown <file>` may write a compact advisory runtime report.
- What it checks: Git-derived changed-file names/status, current Todo App runtime Evidence-only scope inputs, and the
  non-enforcing scope evaluator. It does not inspect patch hunks or read full file contents.
- What it writes: Nothing by default. It writes only when `--output` or `--markdown` is supplied.
- Success result: Advisory JSON with `nonEnforcing: true`, `enforcementStatus: not-enforced`, finding counts, and result
  state. Advisory findings do not fail the command.
- Common failures: invalid base/head refs, unreadable calibration draft input, malformed internal scope input.
- Next command: Review the advisory output. Do not treat it as approval, rejection, required-check status, runtime
  Evidence satisfaction, equivalence proof, or graph delta apply.

Example:

```powershell
node dist/cli/index.js graph read-model check-scope `
  --base HEAD~1 `
  --head HEAD `
  --markdown .tmp/devview-scope-runtime-report.md `
  --json
```

### `pbe graph read-model propose-graph-delta`

- Purpose: Generate a proposal-only Graph Delta preview from a graph-delta-compatible source artifact.
- Typical state before running: After advisory `check-scope`, compact runtime report, proposal boundary, schema
  alignment, unresolved mapping, compatible source, and generator scope decision artifacts exist.
- Options: `--source <sourceArtifact>` is required. `--output <file>` may write the proposal-only preview. Without
  `--output`, JSON stdout is the only output.
- What it checks: Required proposal-only boundary fields on the source artifact, including
  `compatibleProposalSchema: pbe-graph-update-proposal-v0`, `proposalOnly: true`, `graphSourceMutated: false`,
  `graphDeltaApplied: false`, `requiresHumanReview: true`, and `approvalStatus: not-approved`.
- What it writes: Nothing by default. It writes only to the explicit `--output` path.
- Success result: JSON with `artifactRole: graph-delta-proposal-only-preview`, `proposalGenerated: true`,
  `proposalOnly: true`, `graphSourceMutated: false`, `graphDeltaApplied: false`, `approvalStatus: not-approved`,
  `nonEnforcing: true`, and `enforcementStatus: not-enforced`.
- Common failures: unreadable source artifact, malformed JSON, unsupported schema id, or unsafe boundary fields.
- Next command: Review the preview and human-review questions. Do not treat it as graph-source, graph delta apply,
  approval, runtime Evidence satisfaction, equivalence proof, enforcement, or user acceptance.

Example:

```powershell
node dist/cli/index.js graph read-model propose-graph-delta `
  --source examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json `
  --output .tmp/devview-graph-delta-proposal.preview.json `
  --json
```

### `pbe graph read-model review-graph-delta`

- Purpose: Generate a compact Human Review Packet from a proposal-only Graph Delta preview.
- Typical state before running: After `graph read-model propose-graph-delta` has emitted a
  `graph-delta-proposal-only-preview` JSON object, usually to an explicit `.tmp` path.
- Options: `--proposal <proposalPath>` is required. `--markdown <file>` may write the human-readable packet. Without
  `--markdown`, JSON stdout is the only output.
- What it checks: Proposal-only boundary fields, including `proposalOnly: true`, `graphSourceMutated: false`,
  `graphDeltaApplied: false`, `requiresHumanReview: true`, `approvalStatus: not-approved`, `nonEnforcing: true`, and
  `enforcementStatus: not-enforced`.
- What it writes: Nothing by default. It writes Markdown only to the explicit `--markdown` path.
- Success result: JSON with `reviewPacketStatus: review-required`, review counts, candidate-only items,
  `approvalStatus: not-approved`, `graphSourceMutated: false`, `graphDeltaApplied: false`, and
  `humanDecisionRecorded: false`.
- Common failures: unreadable proposal preview, malformed JSON, non-preview proposal role, or unsafe boundary fields.
- Next command: Use the packet as review input only. Do not treat it as approval, human decision record, graph-source
  apply, runtime Evidence satisfaction, equivalence proof, enforcement, or user acceptance.

Example:

```powershell
node dist/cli/index.js graph read-model review-graph-delta `
  --proposal .tmp/devview-graph-delta-proposal.preview.json `
  --markdown .tmp/devview-graph-delta-review-packet.md `
  --json
```

### `pbe graph read-model record-human-decision`

- Purpose: Record an explicit human-authored decision for a proposal under review without creating approved proposal
  state or applying anything.
- Typical state before running: After `graph read-model propose-graph-delta` and `graph read-model review-graph-delta`
  have produced proposal and review-packet inputs.
- Options: `--review-packet <packetPath>`, `--proposal <proposalPath>`, `--decision <value>`, `--reviewer <identity>`,
  and `--rationale <text>` are required. `--boundary <file>` is optional but recommended. `--output <file>` and
  `--markdown <file>` may write explicit decision-record outputs.
- What it checks: proposal-only boundaries, review-packet provenance, decision vocabulary, explicit human reviewer and
  rationale, no Codex/AI reviewer identity, and output authority.
- What it writes: Nothing by default. It writes only to explicit `--output` and `--markdown` paths.
- Success result: JSON with `artifactRole: devview-human-decision-record`, `humanDecisionRecorded: true`, and
  `approvedProposalStateCreated: false`, `graphDeltaApplied: false`, `graphSourceMutated: false`,
  `runtimeEvidenceSatisfied: false`, `equivalenceProven: false`, `scopeEnforced: false`, and
  `ciEnforcementEnabled: false`.
- Common failures: invalid decision value, missing human provenance, proposal/review mismatch, unsafe proposal or review
  packet boundary fields, or output paths that would overwrite source/proposal/review/evidence/graph artifacts.
- Next command: For `approve-proposal`, a separate future approved-proposal-state command may consume the record. This
  command itself never creates approved state, applies graph deltas, mutates graph-source, accepts Evidence, proves
  equivalence, enforces scope, or configures CI.

Example:

```powershell
node dist/cli/index.js graph read-model record-human-decision `
  --boundary examples/valid/todo-app-pbe-run/generated/devview-human-decision-record-boundary.runtime-evidence-only.preview.json `
  --review-packet .tmp/devview-graph-delta-review-packet.json `
  --proposal .tmp/devview-graph-delta-proposal.preview.json `
  --decision defer-decision `
  --reviewer human-reviewer `
  --rationale "Calibration defers approval; no graph-source mutation is authorized." `
  --output .tmp/devview-human-decision-record.json `
  --json
```

### `pbe graph read-model create-approved-proposal-state`

- Purpose: Create or block an Approved Proposal State preview from an explicit Human Decision Record and proposal-only
  Graph Delta preview.
- Typical state before running: After `graph read-model record-human-decision` has created a human decision record.
- Options: `--decision-record <decisionRecordPath>` and `--proposal <proposalPath>` are required.
  `--boundary <boundaryPath>` is optional but recommended. `--output <file>` and `--markdown <file>` may write explicit
  preview outputs.
- What it checks: Approved Proposal State boundary role/status, Human Decision Record role/status/provenance, proposal
  only boundaries, proposal id/path consistency, and output authority.
- What it writes: Nothing by default. It writes only to explicit `--output` and `--markdown` paths.
- Success result: JSON with `artifactRole: devview-approved-proposal-state-preview`. If the decision is
  `approve-proposal` and provenance checks pass, `approvedProposalStateCreated: true`; otherwise the preview is blocked
  with `approvedProposalStateCreated: false`. In both cases `graphDeltaApplied`, `graphSourceMutated`,
  `runtimeEvidenceSatisfied`, `equivalenceProven`, `scopeEnforced`, and `ciEnforcementEnabled` remain false.
- Common failures: malformed boundary, unsafe proposal, unsafe decision record, mismatched proposal provenance, or
  output paths that would overwrite source/proposal/review/evidence/graph artifacts.
- Next command: A separate future graph-delta apply command may consume an approved-state preview after its own checks.
  This command itself never applies graph deltas, mutates graph-source, accepts Evidence, proves equivalence, enforces
  scope, or configures CI.

Example:

```powershell
node dist/cli/index.js graph read-model create-approved-proposal-state `
  --boundary examples/valid/todo-app-pbe-run/generated/devview-approved-proposal-state-boundary.runtime-evidence-only.preview.json `
  --decision-record examples/valid/todo-app-pbe-run/generated/devview-human-decision-record.defer-decision.runtime-evidence-only.preview.json `
  --proposal examples/valid/todo-app-pbe-run/generated/graph-delta-proposal.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/devview-approved-proposal-state.json `
  --json
```

### `pbe graph read-model generate-ai-request-analyzer-pack`

- Purpose: Generate deterministic AI Request Analyzer prompt/input contract JSON, and optionally Markdown, from the
  analyzer boundary and Request IR Candidate schema previews.
- Typical state before running: After the AI Request Analyzer boundary and Request IR Candidate schema preview artifacts
  exist. No analyzer implementation or LLM/API integration is required.
- Options: `--boundary <analyzerBoundaryPath>` and `--schema <requestIrCandidateSchemaPath>` are required.
  `--output <file>` may write the generated prompt pack JSON. `--markdown <file>` may write concise Markdown guidance.
  Without explicit output paths, JSON stdout is the only output.
- What it checks: analyzer boundary role/status, no analyzer implementation, no LLM/network calls, no Request IR
  Candidate generation, candidate-only authority, expected output role, Request IR schema role/status, required fields,
  candidate-only schema flags, and schema id alignment.
- What it writes: Nothing by default. It writes only to explicit `--output` and `--markdown` paths.
- Output authority guard: explicit preview output paths are rejected before writing if they would overwrite the analyzer
  boundary, Request IR Candidate schema, calibration candidate, linked preview/source artifacts, graph-source/read-model
  source authority, or selected frontend/source artifacts. If either output path is unsafe, no output is written.
- Success result: JSON with `artifactRole: ai-request-analyzer-pack`, `llmInvoked: false`,
  `requestIrCandidateGenerated: false`, `candidateOnly: true`, required output fields, request type taxonomy, safety
  instructions, forbidden use, and downstream execution/generation/approval/enforcement flags false.
- Next command: A future analyzer may use this prompt pack as input contract context. This command does not call an LLM,
  generate a Request IR Candidate, run traversal, generate selected slices, generate contract input, generate execution
  instruction packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime
  Evidence, prove equivalence, enforce scope, or configure CI.

Example:

```powershell
node dist/cli/index.js graph read-model generate-ai-request-analyzer-pack `
  --boundary examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json `
  --schema examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json `
  --output .tmp/review-ai-request-analyzer-pack.json `
  --markdown .tmp/review-ai-request-analyzer-pack.md `
  --json
```

### `pbe graph read-model analyze-request`

- Purpose: Expose the AI Request Analyzer command surface while provider execution is disabled. The command either
  reports `provider-disabled` or imports an explicit precomputed external Request IR Candidate as candidate-only JSON.
- Typical state before running: After an AI Request Analyzer pack exists. No LLM/API provider is configured in this
  implementation.
- Options: `--request <text>` and `--pack <aiRequestAnalyzerPackPath>` are required. `--external-candidate <path>` may
  import a precomputed candidate. `--output <file>` may write a provider-disabled run-result preview or an imported
  candidate preview, depending on mode.
- Provider-disabled behavior: Without `--external-candidate`, the command exits blocked with
  `analyzerProviderStatus: provider-disabled`, `llmInvoked: false`, `networkCallsAllowed: false`,
  `requestIrCandidateGenerated: false`, and `candidateImportRequired: true`.
- External import behavior: With `--external-candidate`, the command checks request text, schema id, candidate-only
  safety fields, and unsafe authority escalation before writing. Imported candidates are normalized to
  `artifactRole: request-ir-candidate`, `requestIrCandidateStatus: candidate-only`,
  `authorityStatus: not-authoritative-until-validated`, and downstream traversal/contract/instruction authority false.
- Output authority guard: explicit output paths are rejected before writing if they would overwrite the analyzer pack,
  external candidate, linked boundary/schema/intake/clarification artifacts, graph-source/read-model source authority,
  evidence paths, or source-authority-shaped JSON. Blocked external imports write no partial output.
- Next command: Run `graph read-model validate-request-ir` on an imported candidate before graph-aware validation or
  traversal. This command does not call an LLM/API, run validation, run traversal, generate selected slices, generate
  contract input, generate instruction packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve
  work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.

Provider-disabled example:

```powershell
node dist/cli/index.js graph read-model analyze-request `
  --request "Add Todo App runtime evidence for the add button behavior without touching production source." `
  --pack examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-ai-request-analyzer-provider-disabled.json `
  --json
```

External candidate import example:

```powershell
node dist/cli/index.js graph read-model analyze-request `
  --request "Add Todo App runtime evidence for the add button behavior without touching production source." `
  --pack examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.json `
  --external-candidate .tmp/external-request-ir-candidate.json `
  --output .tmp/imported-request-ir-candidate.json `
  --json
```

### `pbe graph read-model generate-clarification-interview-pack`

- Purpose: Generate deterministic Clarification Interview question-plan JSON, and optionally Markdown, from the
  clarification boundary and a Request IR Candidate. The pack is report-only; it does not ask the user questions or
  revise the candidate.
- Typical state before running: After the Clarification Interview boundary exists and a candidate-only Request IR
  artifact is available. The candidate may be a calibration fixture or future analyzer output.
- Options: `--boundary <clarificationBoundaryPath>` and `--candidate <requestIrCandidatePath>` are required.
  `--output <file>` may write the generated question-plan JSON. `--markdown <file>` may write concise Markdown. Without
  explicit output paths, JSON stdout is the only output.
- What it checks: boundary role/status, no interview UI, no LLM/network calls, no candidate revision, candidate-only
  Request IR authority fields, and no direct graph traversal, contract generation, instruction-pack generation, or
  execution authority.
- What it writes: Nothing by default. It writes only to explicit `--output` and `--markdown` paths.
- Output authority guard: explicit preview output paths are rejected before writing if they would overwrite the
  clarification boundary, Request IR Candidate, linked schema/intake/analyzer artifacts, graph-source/read-model source
  authority, evidence/source artifacts, or selected frontend/source artifacts. If either output path is unsafe, no
  output is written.
- Success result: JSON with `artifactRole: clarification-interview-pack`, `questionPlanStatus`, `questionCount`, bounded
  `plannedQuestions` when clarification is required, `requestIrCandidateRevised: false`, `llmInvoked: false`, and
  downstream traversal/slice/contract/input/execution/approval/enforcement flags false.
- Next command: If questions are answered in a future flow, answers may produce only a revised Request IR Candidate,
  which must rerun `validate-request-ir` and `validate-request-ir-graph` before traversal. This command does not call an
  LLM, revise Request IR, run validation, run traversal, generate selected slices, generate contract input, generate
  instruction packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime
  Evidence, prove equivalence, enforce scope, or configure CI.

Example:

```powershell
node dist/cli/index.js graph read-model generate-clarification-interview-pack `
  --boundary examples/valid/todo-app-pbe-run/generated/clarification-interview-boundary.add-todo-runtime-evidence-only.preview.json `
  --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-clarification-interview-pack.json `
  --markdown .tmp/review-clarification-interview-pack.md `
  --json
```

### `pbe graph read-model revise-request-ir-candidate`

- Purpose: Generate a revised Request IR Candidate preview from a Clarification Interview Pack and clarification
  answers. The output is candidate-only and must be validated again before graph-aware validation or traversal.
- Typical state before running: After `generate-clarification-interview-pack` has produced a question-plan pack and a
  clarification answers artifact exists. For the current calibration, the pack has zero questions, so the answers
  artifact records a no-op revision.
- Options: `--clarification-pack <packPath>`, `--answers <answersPath>`, and `--output <revisedCandidatePath>` are
  required.
- What it checks: pack role/status, generated pack boundary flags, answer role/status, no approval/source authority in
  answers, known `questionId`, planned-question field matching, allowed Request IR revision fields, original candidate
  schema-only safety, and explicit output authority.
- What it writes: Only the explicit revised candidate output. It writes nothing by default and writes no output when
  revision is blocked.
- Output authority guard: the output path is rejected before writing if it would overwrite the pack, answers, original
  candidate, linked schema/intake/analyzer artifacts, graph-source/read-model source authority, evidence/source paths,
  or source-authority-shaped JSON.
- Success result: a `request-ir-candidate` artifact with `requestIrCandidateStatus: candidate-only`,
  `revisionAuthorityStatus: clarification-derived-candidate-not-validated`,
  `authorityStatus: not-authoritative-until-validated`, `validationRequiredAgain: true`, `graphTraversalAllowed: false`,
  `contractGenerationAllowed: false`, and `instructionPackGenerationAllowed: false`.
- Next command: Run `graph read-model validate-request-ir --candidate <revisedCandidatePath> --json`. Do not treat the
  revised candidate as graph traversal, contract input, instruction pack, approval, runtime Evidence satisfaction,
  equivalence proof, or enforcement authority.

Example:

```powershell
node dist/cli/index.js graph read-model revise-request-ir-candidate `
  --clarification-pack examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.json `
  --answers examples/valid/todo-app-pbe-run/generated/clarification-answers.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-request-ir-candidate.revised.json `
  --json
```

### `pbe graph read-model validate-request-ir`

- Purpose: Validate a Request IR Candidate artifact's schema and candidate-only safety boundaries.
- Typical state before running: After a future natural-language intake path or calibration fixture has produced a
  Request IR Candidate JSON artifact.
- Options: `--candidate <candidatePath>` is required. `--output <file>` may write the schema-only validation result.
  Without `--output`, JSON stdout is the only output.
- What it checks: Required fields, narrow request type enum values, candidate-only boundary fields, authority status,
  confidence policy, ambiguity policy, and the rule that unvalidated candidates cannot drive graph traversal, contract
  generation, or instruction-pack generation.
- What it writes: Nothing by default. It writes only to the explicit `--output` path.
- Success result: JSON with `validationScope: schema-and-boundary-only`,
  `requestIrValidationStatus: schema-valid-graph-validation-not-run`, `graphAuthorityValidationStatus: not-run`,
  `graphTraversalAllowed: false`, `contractGenerationAllowed: false`, and `instructionPackGenerationAllowed: false`.
- Common failures: unreadable candidate artifact, malformed JSON, missing required fields, unsupported schema id, or
  unsafe boundary fields such as `candidateOnly: false` or `graphTraversalAllowed: true`.
- Next command: Proceed only to graph-aware validation. Do not treat a schema-valid candidate as graph traversal
  authority, contract compiler input, instruction-pack input, approval, runtime Evidence satisfaction, equivalence
  proof, or enforcement.

Example:

```powershell
node dist/cli/index.js graph read-model validate-request-ir `
  --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json `
  --json
```

### `pbe graph read-model validate-request-ir-graph`

- Purpose: Validate a schema-valid Request IR Candidate against graph/read-model authority without running traversal.
- Typical state before running: After `graph read-model validate-request-ir` has produced a schema-only validation
  result.
- Options: `--candidate <candidatePath>` and `--schema-validation <schemaValidationPath>` are required.
  `--output <file>` may write the graph-aware validation result. Without `--output`, JSON stdout is the only output.
- What it checks: schema-only validation prerequisite safety, target record existence, target component resolution,
  request type resolution, change type compatibility, scope intent resolution, required Evidence policy resolvability,
  and risk intent resolution.
- What it writes: Nothing by default. It writes only to the explicit `--output` path.
- Success result: JSON with `validationScope: graph-aware-validation-no-traversal`,
  `graphValidationStatus: graph-aware-valid`, and `graphTraversalAllowed: true` when the calibration target resolves.
  This is future-pass permission only; the same result keeps `graphTraversalExecuted: false`,
  `selectedGraphSliceGenerated: false`, `contractGenerationAllowed: false`, and `instructionPackGenerated: false`.
- Common failures: unreadable candidate or schema-only validation artifact, unsafe schema-only validation prerequisite,
  missing graph authority metadata, unresolved target record/component, or incompatible change type.
- Next command: A later graph traversal pass may be attempted only after graph-aware validation succeeds. Do not treat
  this command as traversal, selected graph slice generation, contract compiler input, instruction-pack generation,
  approval, runtime Evidence satisfaction, equivalence proof, graph-source mutation, or enforcement.

Example:

```powershell
node dist/cli/index.js graph read-model validate-request-ir-graph `
  --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json `
  --schema-validation examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json `
  --json
```

### `pbe graph read-model plan-traversal`

- Purpose: Generate a deterministic Graph Traversal Plan from graph-aware Request IR validation.
- Typical state before running: After `graph read-model validate-request-ir-graph` has produced a
  `request-ir-graph-aware-validation` artifact with `graphValidationStatus: graph-aware-valid` and
  `graphTraversalAllowed: true`.
- Options: `--graph-validation <graphAwareValidationPath>` is required. `--output <file>` may write the generated plan.
  Without `--output`, JSON stdout is the only output.
- What it checks: graph-aware validation role/status, traversal permission, resolved target record, resolved target
  component, compatible change type, resolvable required Evidence policy, readable graph source, readable generated read
  model, start node existence, and start node ambiguity.
- What it writes: Nothing by default. It writes only to the explicit `--output` path.
- Success result: JSON with `artifactRole: graph-traversal-plan`, `graphTraversalPlanGenerated: true`,
  `startNodeResolutionStatus: resolved`, taxonomy-backed node/edge type fields, role/intent fields for planner
  semantics, and `selectedGraphSlicePlanningAllowed: true`.
- Common failures: unreadable graph-aware validation artifact, blocked graph-aware validation, missing graph source,
  missing generated read model, unresolved start node, ambiguous start node, or missing taxonomy vocabulary.
- Next command: A later selected graph slice pass may consume the plan. Do not treat it as graph traversal execution,
  final selected nodes/edges, contract compiler input, instruction-pack generation, approval, runtime Evidence
  satisfaction, equivalence proof, graph-source mutation, or enforcement.

Example:

```powershell
node dist/cli/index.js graph read-model plan-traversal `
  --graph-validation examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json `
  --output examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json `
  --json
```

### `pbe graph read-model select-slice`

- Purpose: Generate a deterministic Selected Graph Slice from a ready Graph Traversal Plan.
- Typical state before running: After `graph read-model plan-traversal` has produced a `graph-traversal-plan` artifact
  with `graphTraversalPlanStatus: ready` and `selectedGraphSlicePlanningAllowed: true`.
- Options: `--traversal-plan <planPath>` is required. `--output <file>` may write the selected slice. Without
  `--output`, JSON stdout is the only output.
- What it checks: traversal plan role/status, selected-slice planning permission, exactly one resolved start node,
  readable graph source, readable generated read model, start node existence, and node/edge vocabulary consistency with
  the generated read-model taxonomy.
- What it writes: Nothing by default. It writes only to the explicit `--output` path.
- Success result: JSON with `artifactRole: selected-graph-slice`, `selectedGraphSliceGenerated: true`,
  `graphTraversalExecuted: true`, selected node/edge arrays, category arrays, and a selection trace.
- Common failures: unreadable traversal plan, blocked traversal plan, missing graph source, missing generated read
  model, missing or ambiguous start node, or traversal-plan vocabulary drift.
- Next command: A later contract compiler input pass may consume this selected slice. Do not treat it as contract
  compiler input, instruction-pack generation, approval, runtime Evidence satisfaction, equivalence proof, graph-source
  mutation, graph delta apply, or enforcement.

Example:

```powershell
node dist/cli/index.js graph read-model select-slice `
  --traversal-plan examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json `
  --output examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json `
  --json
```

### `pbe graph read-model generate-contract-input`

- Purpose: Generate deterministic Contract Compiler Input from a generated Selected Graph Slice.
- Typical state before running: After `graph read-model select-slice` has produced a `selected-graph-slice` artifact
  with `selectedGraphSliceStatus: generated`, `selectedGraphSliceGenerated: true`, and `graphTraversalExecuted: true`.
- Options: `--selected-slice <selectedSlicePath>` is required. `--output <file>` may write the generated Contract
  Compiler Input. Without `--output`, JSON stdout is the only output.
- What it checks: selected slice role/status, selected slice generation state, traversal execution state, non-generated
  contract/input-pack flags on the source slice, non-empty selected nodes/edges, target/scope nodes, evidence/check
  nodes, no error findings, and source authority trace fields.
- What it writes: Nothing by default. It writes only to the explicit `--output` path.
- Success result: JSON with `artifactRole: contract-compiler-input`, `contractInputGenerated: true`,
  `instructionPackGenerated: false`, compiler-input group fields, mapping trace, and non-execution boundary fields.
  Broad selected-slice context remains in `targetScopeCandidates`; `allowedScope` is narrowed to selected
  check/evidence/report-oriented artifacts and does not authorize runtime-Evidence-only edits to change-tree or
  work-tree context paths. The output reports frontend field-group compatibility only and does not claim backend dry-run
  validation passed.
- Common failures: unreadable selected slice, blocked/incomplete slice, missing evidence nodes, missing selected edges,
  selected slice already claiming contract input or instruction pack generation, or selected slice error findings.
- Next command: A future frontend pass may consume this Contract Compiler Input. Do not treat it as instruction-pack
  generation, Codex execution, approval, runtime Evidence satisfaction, equivalence proof, graph-source mutation, graph
  delta apply, or enforcement.

Example:

```powershell
node dist/cli/index.js graph read-model generate-contract-input `
  --selected-slice examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json `
  --output examples/valid/todo-app-pbe-run/generated/contract-compiler-input.add-todo-runtime-evidence-only.preview.json `
  --json
```

### `pbe graph read-model generate-instruction-pack`

- Purpose: Generate deterministic frontend Instruction Pack JSON, and optionally Markdown, from generated Contract
  Compiler Input.
- Typical state before running: After `graph read-model generate-contract-input` has produced a
  `contract-compiler-input` artifact with `contractInputGenerated: true`, `instructionPackGenerated: false`, and all
  non-execution safety fields still false/not-approved.
- Options: `--contract-input <contractInputPath>` is required. `--output <file>` may write the generated pack JSON.
  `--markdown <file>` may write a concise Markdown pack. Without explicit output paths, JSON stdout is the only output.
- What it checks: contract input role/status, generated-input flag, non-generated instruction-pack flag, graph/apply
  safety flags, not-approved approval status, no equivalence or runtime Evidence satisfaction, required compiler input
  groups, and absence of error findings.
- What it writes: Nothing by default. It writes only to explicit `--output` and `--markdown` paths.
- Output authority guard: explicit preview output paths are rejected before writing if they would overwrite the source
  Contract Compiler Input, graph/source authority artifacts, selected frontend input artifacts, concrete forbidden-scope
  paths, graph snapshot artifacts, Evidence authority artifacts, selected scope candidate paths, or an existing
  graph-source/source-authority-shaped JSON file.
- Success result: JSON with `artifactRole: instruction-pack`, `instructionPackGenerated: true`,
  `codexExecutionTriggered: false`, narrowed `allowedScope`, preserved `forbiddenScope`, required Evidence, stop
  conditions, known risks, output requirements, execution instructions, non-goals, and non-execution boundaries.
- Common failures: unreadable contract input, unsafe boundary fields, missing required input groups, empty required
  scope/evidence/output groups, or error findings in the source Contract Compiler Input.
- Next command: Human review before any Codex execution. Do not treat this pack as approval, runtime Evidence
  satisfaction, equivalence proof, graph-source mutation, graph delta apply, or enforcement.

Example:

```powershell
node dist/cli/index.js graph read-model generate-instruction-pack `
  --contract-input examples/valid/todo-app-pbe-run/generated/contract-compiler-input.add-todo-runtime-evidence-only.preview.json `
  --output examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json `
  --markdown examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.md `
  --json
```

### `pbe graph read-model report-hook-gateway-health`

- Purpose: Read a DevView Hook Gateway health boundary preview and emit a compact, non-enforcing readiness report.
- Typical state before running: After the Hook Gateway health boundary preview exists at
  `devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json`.
- Options: `--boundary <boundaryPath>` is required. `--output <file>` may write the JSON report. Without explicit
  output, JSON stdout is the only output.
- What it checks: boundary artifact role/status, preview-only hook status, strict-disabled state, no install/trust
  mutation, no blocking hook behavior, no graph/apply/approval/evidence/equivalence/enforcement flags, frontend artifact
  availability inventory, and future readiness item summaries.
- What it writes: Nothing by default. It writes only to explicit `--output`.
- Output authority guard: explicit report output is rejected before writing if it would overwrite the source health
  boundary, linked boundary/source preview artifacts, or an existing source-authority-shaped JSON artifact.
- Success result: JSON with `artifactRole: devview-hook-gateway-health-report`, `healthCheckImplemented: true` for this
  report command only, `hookScriptsImplemented: false`, `actualBlockingHookBehaviorImplemented: false`,
  `strictModeEnabled: false`, `guidedEnforcementEnabled: false`, `nonEnforcing: true`, and frontend availability
  summary.
- Next command: None automatic. This is readiness context only; it does not install hooks, trust commands, block Codex
  execution, enable guided/strict behavior, mutate graph-source, apply graph deltas, approve work, satisfy runtime
  Evidence, prove equivalence, enforce scope, or configure CI.

Example:

```powershell
node dist/cli/index.js graph read-model report-hook-gateway-health `
  --boundary examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json `
  --output .tmp/review-hook-gateway-health.json `
  --json
```

### `pbe graph read-model report-frontend-chain`

- Purpose: Read the natural-language request intake boundary and linked calibration frontend artifacts, then emit a
  compact DevView frontend artifact chain manifest.
- Typical state before running: After the calibration frontend has produced artifacts from Request IR Candidate schema
  through Instruction Pack preview.
- Options: `--intake <intakeBoundaryPath>` is required. `--output <file>` may write the JSON manifest.
  `--markdown <file>` may write a concise table report. Without explicit output paths, JSON stdout is the only output.
- What it checks: linked artifact readability, artifact roles, statuses, terminal Instruction Pack preview presence, and
  non-execution boundary flags.
- What it writes: Nothing by default. It writes only to explicit `--output` and `--markdown` paths.
- Output authority guard: explicit report output is rejected before writing if it would overwrite the source intake
  boundary, any linked frontend/source artifact in the chain, graph-source/read-model source authority, or selected
  frontend/source artifacts. If either JSON or Markdown output path is unsafe, no output is written.
- Success result: JSON with `artifactRole: devview-frontend-chain-report`, ordered stage summaries from natural-language
  intake through Instruction Pack Markdown, `terminalStage: instruction-pack-preview-generated-no-codex-execution`, and
  all execution/apply/approval/evidence/equivalence/enforcement flags false.
- Next command: Human review of the generated instruction pack. This report does not call an LLM, generate Request IR,
  implement hook sessions, trigger Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy
  runtime Evidence, prove equivalence, enforce scope, or configure CI.

Example:

```powershell
node dist/cli/index.js graph read-model report-frontend-chain `
  --intake examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json `
  --output .tmp/review-frontend-chain.json `
  --markdown .tmp/review-frontend-chain.md `
  --json
```

### `pbe graph read-model prepare-user-prompt-context`

- Purpose: Read a generated frontend chain report, Hook Gateway health report or boundary, Instruction Pack JSON, and
  Instruction Pack Markdown, then emit an advisory `UserPromptSubmit` additionalContext preview.
- Typical state before running: After the frontend chain has reached
  `instruction-pack-preview-generated-no-codex-execution` and the Hook Gateway health boundary/report remains
  non-enforcing with strict/guided blocking disabled.
- Options: `--frontend-chain <file>`, `--hook-health <file>`, `--instruction-pack <file>`, and
  `--instruction-markdown <file>` are required. `--output <file>` may write JSON and `--markdown <file>` may write
  compact Markdown for future hook injection.
- What it checks: source artifact roles/statuses, terminal frontend stage, generated instruction pack status,
  strict/guided/enforcement/approval/Evidence/equivalence safety flags, and output authority before any writes.
- Success result: JSON with `artifactRole: devview-user-prompt-submit-context-preview`,
  `additionalContextInjectionReady: true`, `devviewMode: advisory`, `strictModeEnabled: false`,
  `actualHookScriptsImplemented: false`, and all execution/apply/approval/Evidence/equivalence/enforcement flags false.
- Non-goals: This command does not install hook scripts, mutate trust state, trigger Codex execution, call an LLM,
  mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove
  equivalence, enforce scope, or configure CI.

```powershell
node dist/cli/index.js graph read-model prepare-user-prompt-context `
  --frontend-chain examples/valid/todo-app-pbe-run/generated/devview-frontend-chain.add-todo-runtime-evidence-only.preview.json `
  --hook-health examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json `
  --instruction-pack examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json `
  --instruction-markdown examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.md `
  --output .tmp/review-user-prompt-context.json `
  --markdown .tmp/review-user-prompt-context.md `
  --json
```

### `pbe graph read-model generate-hook-script-scaffold`

- Purpose: Read the Hook Gateway boundary, Hook Gateway health boundary, install/trust boundary, and `UserPromptSubmit`
  context preview, then emit a preview-only hook script scaffold manifest.
- Typical state before running: After install/trust scope has been previewed and the `UserPromptSubmit` context preview
  exists. Hook scripts are still not installed or active.
- Options: `--boundary <file>`, `--hook-health <file>`, `--install-trust <file>`, and `--user-prompt-context <file>` are
  required. `--output <file>` may write JSON and `--markdown <file>` may write a compact scaffold summary.
- What it checks: source artifact roles/statuses, strict/guided/enforcement/approval/Evidence/equivalence safety flags,
  active hook path targets, source artifact overwrite attempts, and output authority before any writes.
- Success result: JSON with `artifactRole: devview-hook-script-scaffold-preview`, preview templates for `SessionStart`,
  `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop`, plus `hookScriptsInstalled: false`,
  `hookGatewayActive: not-checked-preview-only`, `strictModeEnabled: false`, and all execution/apply/approval/Evidence/
  equivalence/enforcement flags false.
- Non-goals: This command does not install hook scripts, write active hook config, mutate trust state, trigger Codex
  execution, call an LLM, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime
  Evidence, prove equivalence, enforce scope, or configure CI.

```powershell
node dist/cli/index.js graph read-model generate-hook-script-scaffold `
  --boundary examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json `
  --hook-health examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json `
  --install-trust examples/valid/todo-app-pbe-run/generated/devview-hook-install-trust-boundary.runtime-evidence-only.preview.json `
  --user-prompt-context examples/valid/todo-app-pbe-run/generated/devview-user-prompt-submit-context.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-hook-script-scaffold.json `
  --markdown .tmp/review-hook-script-scaffold.md `
  --json
```

### `pbe graph read-model generate-hook-script-templates`

- Purpose: Read a Hook script scaffold preview and materialize review-only PowerShell script body previews for future
  Hook Gateway events.
- Typical state before running: After `generate-hook-script-scaffold` has produced a preview scaffold. Hook scripts are
  still not installed, active, trusted, or enforcing.
- Options: `--scaffold <file>` is required. `--output <file>` may write JSON and `--markdown <file>` may write a compact
  script preview.
- What it checks: scaffold role/status, required hook events, strict/guided/enforcement/approval/Evidence/equivalence
  safety flags, active hook path targets, source artifact overwrite attempts, and output authority before any writes.
- Success result: JSON with `artifactRole: devview-hook-script-template-preview`, one `powershell-preview` body each for
  `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop`, plus all install/active/execution/apply/
  approval/Evidence/equivalence/enforcement flags false.
- Non-goals: This command does not write `.codex/hooks` files, install hooks, trust repositories, configure Codex, block
  Codex execution, call an LLM, run validation/traversal, mutate graph-source, apply graph deltas, approve work, record
  human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.

```powershell
node dist/cli/index.js graph read-model generate-hook-script-templates `
  --scaffold examples/valid/todo-app-pbe-run/generated/devview-hook-script-scaffold.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-hook-script-template.json `
  --markdown .tmp/review-hook-script-template.md `
  --json
```

### `pbe graph read-model generate-hook-session-manifest`

- Purpose: Bundle Hook Gateway health, `UserPromptSubmit` context, script scaffold, and script template previews into a
  session manifest preview for future hook runtime review.
- Typical state before running: After context, scaffold, and template previews exist. No hook session has started and no
  hooks are active.
- Options: `--hook-health <file>`, `--user-prompt-context <file>`, `--script-scaffold <file>`, and
  `--script-templates <file>` are required. `--output <file>` may write JSON and `--markdown <file>` may write a compact
  manifest summary.
- What it checks: input roles/statuses, five hook event readiness, strict/guided/enforcement/approval/Evidence/
  equivalence safety flags, active hook path targets, source artifact overwrite attempts, and output authority before
  any writes.
- Success result: JSON with `artifactRole: devview-hook-session-manifest-preview`,
  `sessionStatus: not-started-preview-only`, `hooksActive: false`, `hookScriptsInstalled: false`, and
  `bypassDetectionStatus: preview-only-non-enforcing`.
- Non-goals: This command does not start hook sessions, install or activate hooks, write `.codex/hooks` files, trust
  repositories, configure Codex, block Codex execution, call an LLM, run validation/traversal, mutate graph-source,
  apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope,
  or configure CI.

```powershell
node dist/cli/index.js graph read-model generate-hook-session-manifest `
  --hook-health examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json `
  --user-prompt-context examples/valid/todo-app-pbe-run/generated/devview-user-prompt-submit-context.add-todo-runtime-evidence-only.preview.json `
  --script-scaffold examples/valid/todo-app-pbe-run/generated/devview-hook-script-scaffold.add-todo-runtime-evidence-only.preview.json `
  --script-templates examples/valid/todo-app-pbe-run/generated/devview-hook-script-template.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-hook-session-manifest.json `
  --markdown .tmp/review-hook-session-manifest.md `
  --json
```

### `pbe graph read-model report-hook-activation-chain`

- Purpose: Read Hook Gateway health, `UserPromptSubmit` context, hook script scaffold/template, and session manifest
  previews, then emit a report-only activation chain summary.
- Typical state before running: After `generate-hook-session-manifest` has produced a preview. Hooks are still not
  installed, active, trusted, or enforcing.
- Options: `--hook-health <file>`, `--user-prompt-context <file>`, `--script-scaffold <file>`,
  `--script-templates <file>`, and `--session-manifest <file>` are required. `--output <file>` may write JSON and
  `--markdown <file>` may write compact Markdown.
- Output: `artifactRole: devview-hook-activation-chain-report` with
  `terminalActivationStage: session-manifest-preview-generated-no-hook-activation`.
- Boundary: validates preview chain continuity and hook event readiness only. It does not install hooks, activate hooks,
  configure trust, block Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime
  Evidence, prove equivalence, enforce scope, or configure CI.

```powershell
node dist/cli/index.js graph read-model report-hook-activation-chain `
  --hook-health examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json `
  --user-prompt-context examples/valid/todo-app-pbe-run/generated/devview-user-prompt-submit-context.add-todo-runtime-evidence-only.preview.json `
  --script-scaffold examples/valid/todo-app-pbe-run/generated/devview-hook-script-scaffold.add-todo-runtime-evidence-only.preview.json `
  --script-templates examples/valid/todo-app-pbe-run/generated/devview-hook-script-template.add-todo-runtime-evidence-only.preview.json `
  --session-manifest examples/valid/todo-app-pbe-run/generated/devview-hook-session-manifest.add-todo-runtime-evidence-only.preview.json `
  --output .tmp/review-hook-activation-chain.json `
  --markdown .tmp/review-hook-activation-chain.md `
  --json
```

### `pbe graph operation apply-proposal`

- Purpose: Preview or apply a generated graph update proposal to its graph-source.
- Typical state before running: After a graph delta and graph update proposal have been generated from a bounded local
  change.
- Options: `--proposal <file>` is required. Without `--apply`, the command is a dry-run preview. With `--apply`, it
  updates graph-source node/record status fields only. `--output <file>` and `--markdown <file>` may write review
  reports.
- What it checks: proposal shape, graph delta link, graph-source link, source record id alignment, stale current-state
  protection, and non-upstream/non-patch boundaries.
- What it writes: Nothing in preview mode. With `--apply`, writes only the referenced graph-source when there are
  planned graph-source changes.
- Success result: Preview/apply report with changed files, planned graph-source changes, and boundary flags.
- Common failures: stale proposal, missing graph-source node/record, malformed proposal, BOM/JSON read errors, unsafe
  boundary flags.
- Next command: Review the graph-source diff and run the relevant graph-source/read-model validation command.

Examples:

```powershell
node dist/cli/index.js graph operation apply-proposal `
  --proposal outputs/retrofit/open-source/escape-html/graph-update-proposals/symbol-stringification.graph-update-proposal.json `
  --json
```

```powershell
node dist/cli/index.js graph operation apply-proposal `
  --proposal outputs/retrofit/open-source/escape-html/graph-update-proposals/symbol-stringification.graph-update-proposal.json `
  --apply `
  --output outputs/retrofit/open-source/escape-html/proposal-apply-report.json `
  --markdown outputs/retrofit/open-source/escape-html/proposal-apply-report.md
```

### `pbe graph operation generate-pack`

- Purpose: Generate a graph instruction pack for one selected graph-source record.
- Typical state before running: After `pbe graph retrofit plan` identifies an implementation-ready record.
- Options: `--graph-source <file>` and `--record <id>` are required. `--output <file>` and `--markdown <file>` may write
  review artifacts.
- What it checks: graph-source shape, selected record reference, record status/active-code-state alignment, related
  node/edge context, allowed files, forbidden flows, and verification state.
- What it writes: Nothing unless `--output` or `--markdown` is provided.
- Success result: instruction pack with user intent, allowed scope, forbidden scope, graph context, verification, and
  execution boundary.
- Common failures: missing record, record status drift, missing record file, malformed graph-source.
- Next command: Use the pack for the bounded local change, then run `pbe graph operation capture-delta`.

Example:

```powershell
node dist/cli/index.js graph operation generate-pack `
  --graph-source examples/retrofit/cardprinterconfig/graph-source.json `
  --record change.laminator-tag-layout `
  --output outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json `
  --markdown outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.md
```

### `pbe graph operation capture-delta`

- Purpose: Capture a graph delta from the target repository's current git diff.
- Typical state before running: After the bounded local target change has been made under the instruction pack.
- Options: `--graph-source <file>`, `--instruction-pack <file>`, and `--target-repo <path>` are required.
  `--output <file>` and `--markdown <file>` may write review artifacts.
- What it checks: instruction-pack ownership, target git diff, and dirty files staying inside allowed files.
- What it writes: Nothing unless `--output` or `--markdown` is provided. It never patches the target repo.
- Success result: graph delta with changed files, related graph context, final state, and boundary flags.
- Common failures: target repo missing, dirty file outside allowed scope, instruction-pack graph-source mismatch.
- Next command: Review changed files, then run `pbe graph operation propose-update`.

Example:

```powershell
node dist/cli/index.js graph operation capture-delta `
  --graph-source examples/retrofit/cardprinterconfig/graph-source.json `
  --instruction-pack outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json `
  --target-repo C:/path/to/target `
  --output outputs/retrofit/graph-deltas/laminator-tag-layout.graph-delta.json `
  --markdown outputs/retrofit/graph-deltas/laminator-tag-layout.graph-delta.md
```

### `pbe graph operation propose-update`

- Purpose: Generate a graph update proposal from a graph delta.
- Typical state before running: After a graph delta has been captured from an allowed target diff.
- Options: `--graph-delta <file>` is required. `--output <file>` and `--markdown <file>` may write review artifacts.
- What it checks: graph delta JSON readability.
- What it writes: Nothing unless `--output` or `--markdown` is provided.
- Success result: proposal with changed files, proposed node/record state, edgeIntent summary, and review-required
  boundary flags.
- Common failures: missing or malformed graph delta.
- Next command: Review the proposal, then run `pbe graph operation apply-proposal` in preview mode.

Example:

```powershell
node dist/cli/index.js graph operation propose-update `
  --graph-delta outputs/retrofit/graph-deltas/laminator-tag-layout.graph-delta.json `
  --output outputs/retrofit/graph-update-proposals/laminator-tag-layout.graph-update-proposal.json `
  --markdown outputs/retrofit/graph-update-proposals/laminator-tag-layout.graph-update-proposal.md
```

### `pbe graph operation run-chain`

- Purpose: Run the local PBE operation-chain wrapper without requiring users to know the underlying PowerShell script
  path.
- Typical state before running: After building the CLI, when you want to run or inspect the plugin-local graph operation
  chain.
- Options: `--dry-run` returns the planned wrapped command without running PowerShell. `--chain-command <name>` selects
  a supported wrapper command and defaults to `operation-chain`. `--output <file>` writes the JSON report.
- Supported chain commands: `operation-chain`, `artifact-inventory`, `core-schemas`, `retrofit-smoke`,
  `evaluate-dogfood`.
- What it checks: command allow-list and wrapped script execution result.
- What it writes: Nothing in `--dry-run` mode. Without `--dry-run`, the wrapped script may refresh existing operation
  outputs under `outputs/`, matching the previous script behavior.
- Success result: command plan or execution report with boundary flags.
- Common failures: unsupported chain command, missing PowerShell runtime, wrapped script failure.
- Next command: Review generated outputs, then use `pbe graph operation apply-proposal` for any approved graph update
  proposal.

Example:

```powershell
node dist/cli/index.js graph operation run-chain --dry-run --json
```

### `pbe graph retrofit plan`

- Purpose: Summarize a retrofit graph-source before implementation without touching the target project.
- Typical state before running: After a retrofit graph-source exists and before generating an instruction pack or making
  local target-code changes.
- Options: `--graph-source <file>` is required. `--output <file>` and `--markdown <file>` may write review reports.
- What it checks: active retrofit graph-source shape, record/node/edge arrays, implementation-ready records, retained
  reference records, forbidden-flow boundaries, and edgeIntent claim/classification presence.
- What it writes: Nothing unless `--output` or `--markdown` is provided. It never mutates the target repo.
- Success result: retrofit plan with target summary, counts, implementation-ready records, retained references,
  forbidden boundaries, edgeIntent summary, next inputs, and boundary flags.
- Common failures: non-retrofit graph-source, malformed records/nodes/edges, unreadable JSON.
- Next command: Select one implementation-ready record, generate an instruction pack, make the bounded local change,
  then capture graph delta/proposal.

Example:

```powershell
node dist/cli/index.js graph retrofit plan `
  --graph-source examples/retrofit/cardprinterconfig/graph-source.json `
  --json
```

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
