# DevView Runtime Performance Budget

DevView should keep its deterministic runtime path fast enough to run during ordinary local work without becoming a
second full validation suite.

## Target

Target:

```text
deterministic DevView runtime path <= 5000ms
```

Scope:

- graph/read-model projection;
- contract or pack compilation;
- git-derived changed-file collection;
- non-enforcing compliance evaluation;
- result/report artifact generation;
- future graph delta proposal generation.

The target excludes:

- Codex or AI editing time;
- future AI Request Analyzer / LLM inference time;
- full test suite runtime;
- full validation suite runtime;
- CI runtime;
- human review time;
- Markdown documentation authoring;
- DEC authoring.

## Process And Runtime Separation

The product process can remain safe, reviewable, and staged while the runtime compiler/checker path stays fast.

`safe/reviewable/staged` describes how DevView decides what is allowed, what needs review, and what must never be
automated without approval.

`fast/deterministic/runtime` describes the local control-plane pass that reads already-known artifacts, compiles
contracts, collects changed-file names, runs advisory checks, and writes result summaries.

Full validation can take longer than 5 seconds. The runtime budget is not a replacement for full validation, CI
observation, or human review.

## Advisory Timing Smoke

The first timing smoke is:

```text
npm run devview:runtime:smoke
```

It runs:

- `node dist/cli/index.js graph read-model generate-ai-request-analyzer-pack --boundary examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json --schema examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json --output .tmp/devview-runtime-timing-smoke/ai-request-analyzer-pack.json --markdown .tmp/devview-runtime-timing-smoke/ai-request-analyzer-pack.md --json`;
- `node dist/cli/index.js graph read-model validate-request-ir --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json --output .tmp/devview-runtime-timing-smoke/request-ir-validation.json --json`;
- `node dist/cli/index.js graph read-model validate-request-ir-graph --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json --schema-validation .tmp/devview-runtime-timing-smoke/request-ir-validation.json --output .tmp/devview-runtime-timing-smoke/request-ir-graph-validation.json --json`;
- frontend deterministic generation through traversal plan, selected graph slice, Contract Compiler Input, and
  Instruction Pack preview;
- `node dist/cli/index.js graph read-model report-hook-gateway-health --boundary examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json --output .tmp/devview-runtime-timing-smoke/hook-gateway-health-report.json --json`;
- `node dist/cli/index.js graph read-model report-compiler-input --json`;
- `node dist/cli/index.js graph read-model compile-contract --dry-run --json`;
- `node dist/cli/index.js graph read-model collect-changed-files --base HEAD~1 --head HEAD --output .tmp/devview-runtime-timing-smoke/git-derived-changed-file-collection.json --json`.
- `node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --markdown .tmp/devview-runtime-timing-smoke/scope-compliance-runtime-report.md --json`.

The changed-file collection step writes to a `.tmp` smoke artifact so the timing smoke does not refresh the tracked
Todo App preview collection artifact during ordinary measurement.

The scope check step runs the advisory evaluator through the supported CLI surface. It collects changed-file names in
memory, consumes the current Todo App runtime Evidence-only scope inputs, and reports findings as non-enforcing JSON. It
also writes a compact Markdown summary to `.tmp` during the smoke. It does not write a tracked evaluation artifact unless
`--output` is explicitly supplied.

The Hook Gateway health report step is report-only. It reads the preview health boundary and writes a `.tmp` report, but
does not implement hook scripts, install/trust commands, block Codex execution, enable guided or strict behavior,
mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or
configure CI.

The compact scope runtime report can also be requested directly:

```text
node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --markdown .tmp/devview-scope-runtime-report.md --json
```

That report summarizes base/head refs, changed/evaluated file counts, advisory result status, non-enforcement status,
and finding counts. It does not include patch hunks or full file contents.

The smoke reports JSON with:

- `runtimeBudgetTargetMs`;
- `measuredTotalMs`;
- `targetComparison`;
- `budgetStatus`;
- `runtimeLanePolicyStatus`;
- `advisoryOnly`;
- `runtimeBudgetEnforced`;
- `laneBudgetEnforced`;
- `laneDefinitions`;
- `laneTotals`;
- `steps`.

The budget status is advisory. The smoke does not fail because the 5 second target is exceeded. It exits nonzero only
when a measured deterministic command itself fails.

## Runtime Smoke Lanes

The runtime smoke lane boundary is previewed in:

```text
examples/valid/todo-app-pbe-run/generated/devview-runtime-smoke-lane-boundary.runtime-evidence-only.preview.json
```

The all-steps smoke remains an advisory snapshot of the deterministic control plane, but each measured step now reports
a `runtimeLane` and the report includes `laneTotals`. Lane totals are informational only; no lane budget is enforced and
no CI behavior changes.

Current lanes:

- `analyzer-preflight-lane`: deterministic analyzer prompt/input setup, currently
  `generate-ai-request-analyzer-pack`. It is not a Request IR Candidate and not automatically part of every request's
  critical path unless the pack is missing or stale.
- `core-critical-lane`: the deterministic request-to-instruction-pack frontend path after a Request IR Candidate exists:
  `validate-request-ir`, `validate-request-ir-graph`, `plan-traversal`, `select-slice`, `generate-contract-input`, and
  `generate-instruction-pack`.
- `activation-readiness-lane`: report-only hook gateway readiness checks, currently `report-hook-gateway-health`.
- `advisory-backend-lane`: advisory backend, post-check, graph delta proposal, and review reporting commands.

New report-only commands must not automatically enter the `core-critical-lane`. They may be included in the all-steps
smoke as advisory coverage, but the lane assignment preserves the meaning of the 5 second core runtime target. This
lane policy does not remove existing smoke coverage and does not introduce hard failure, required checks, branch
protection, scope enforcement, graph-source mutation, graph delta apply, approval, runtime Evidence satisfaction, or
equivalence proof.

The graph delta proposal boundary preview is now recorded at:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-boundary.runtime-evidence-only.preview.json
```

This preview explains how advisory `check-scope` JSON, compact runtime reports, changed-file collection, and
non-enforcing evaluation artifacts may later feed proposal candidates. It is design-only and does not apply graph
deltas.

The candidate schema alignment preview is also design-only:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-candidate-schema.runtime-evidence-only.preview.json
```

It records how future proposal candidates may map to the existing graph update proposal fields. It adds no runtime
command, does not scan files, does not inspect patches, and does not change the timing smoke boundary.

The unresolved mapping decision preview is also outside the measured runtime path:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-unresolved-mapping-decision.runtime-evidence-only.preview.json
```

It records pre-generator decisions for `sourceRecordId`, `graphDeltaPath`, and Evidence/report link handling. It does
not generate proposals, add runtime work, or change the advisory timing budget.

The graph-delta-compatible source preview is also outside the measured runtime path:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json
```

It is the proposal-only generator input shape that references advisory runtime output, changed-file collection, scope
evaluation, proposal boundary, schema alignment, and mapping decisions. It is not graph-source, not a graph delta, not a
graph update proposal, and not apply.

The proposal-only generator scope decision is also outside the measured runtime path:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-generator-scope-decision.runtime-evidence-only.preview.json
```

It records the CLI shape, stdout/explicit-output policy, exit-code policy, and minimum proposal-shaped preview object
that the first implementation now follows.

The proposal-only generator CLI is now part of the measured advisory runtime path:

```text
graph read-model propose-graph-delta --source <sourceArtifact> --json
graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json
```

The command reads a graph-delta-compatible source artifact, validates non-apply boundaries, and emits a
`graph-delta-proposal-only-preview` object. It writes no file by default; timing smoke uses an explicit `.tmp` output.
The preview is unapproved, non-enforcing, human-review-required, and not graph-source apply.

The Human Review Packet CLI is also part of the measured advisory runtime path:

```text
graph read-model review-graph-delta --proposal <proposalPath> --json
graph read-model review-graph-delta --proposal <proposalPath> --markdown <file> --json
```

The command reads a proposal-only preview, validates non-apply/non-approval boundaries, and emits a compact
`review-required` packet. It writes no Markdown by default; timing smoke uses an explicit `.tmp` Markdown output. The
packet is review input only and does not record approval, human decisions, runtime Evidence satisfaction, graph-source
apply, or enforcement.

## Hook Gateway Boundary

The DevView Codex Hook Gateway boundary is previewed in:

```text
examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json
```

It defines future `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop` responsibilities for
routing DevView ON sessions through preflight, contract, post-check, proposal-only preview, and Human Review Packet
expectations. This is not part of the measured runtime path yet because hook scripts and hook health checks are not
implemented. Future hook scripts must remain lightweight, local, deterministic, and compatible with the advisory
5 second budget. They must not call an LLM, make network calls, run full validation, mutate graph-source, apply graph
deltas, approve work, satisfy runtime Evidence, or turn the budget into CI enforcement.

The Hook Gateway health/readiness boundary is previewed in:

```text
examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json
```

It is not part of the measured runtime path yet because no health-check CLI or hook script exists. It defines what a
future deterministic preflight should check before treating hooks as active: mode, strict-disabled status, hook
installation/config detection, trust state, observed hook events, bypass-detection readiness, and frontend artifact
availability. A future actual health check should remain lightweight and fit within the advisory 5 second DevView
runtime budget. It must not call an LLM, install hooks, mutate trust/config, block Codex execution, mutate graph-source,
apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, or enforce scope/CI.

## Natural Language Request Intake Boundary

The natural-language compiler frontend boundary is previewed in:

```text
examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json
```

Natural language is the human request surface. A future AI analyzer may produce a Request IR candidate, but that output
is candidate-only and outside the deterministic runtime compiler path until validated. After Request IR validation,
graph traversal and contract compiler input generation must remain local and deterministic. This task adds no AI runtime
call, graph traversal, contract input generation, instruction pack generation, or measured runtime step.

The AI Request Analyzer boundary preview is:

```text
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json
```

The boundary preview itself is outside the measured runtime path because no analyzer implementation exists and no
LLM/API call is introduced. Future LLM inference time remains outside the 5 second deterministic DevView runtime
budget.

The AI Request Analyzer prompt/input contract pack generator is now measured because it is deterministic and does not
call an LLM/API:

```text
graph read-model generate-ai-request-analyzer-pack --boundary <analyzerBoundaryPath> --schema <requestIrCandidateSchemaPath> --json
```

It writes only `.tmp` prompt-pack preview output during the timing smoke. The pack is not a Request IR Candidate and
does not run analysis, validation, traversal, contract generation, execution instruction pack generation, Codex
execution, graph mutation, graph delta apply, approval, runtime Evidence satisfaction, equivalence proof, enforcement,
or CI configuration. Future LLM inference time remains outside this deterministic runtime budget.

The Request IR Candidate schema and first calibration fixture are:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json
```

The schema-only Request IR Candidate validator is now part of the measured advisory runtime path:

```text
graph read-model validate-request-ir --candidate <candidatePath> --json
graph read-model validate-request-ir --candidate <candidatePath> --output <validationPath> --json
```

The timing smoke writes the validation result only to `.tmp`. The tracked Todo App calibration validation artifact is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json
```

This validator checks candidate schema and safety boundaries only. A schema-valid result still reports
`graphAuthorityValidationStatus: not-run`, `graphTraversalAllowed: false`, `contractGenerationAllowed: false`, and
`instructionPackGenerationAllowed: false`.

The graph-aware Request IR validator is now part of the measured advisory runtime path:

```text
graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json
graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --output <validationPath> --json
```

The tracked Todo App graph-aware validation result is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json
```

The graph-aware boundary remains:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-aware-validation-boundary.runtime-evidence-only.preview.json
```

The validator resolves schema-valid candidate fields such as `CH-001`, `Todo App`, `runtime-evidence-only`, and
`test-only-behavior-proof` against graph/read-model authority. `graphTraversalAllowed: true` is only future-pass
permission. The validator does not run graph traversal, select nodes or edges, generate contract input, generate
instruction packs, call an LLM, or mutate graph-source.

The traversal boundary and selected slice boundary remain boundary preview artifacts:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan-boundary.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/selected-graph-slice-boundary.add-todo-runtime-evidence-only.preview.json
```

The deterministic traversal plan generator is now part of the measured advisory runtime path:

```text
graph read-model plan-traversal --graph-validation <graphAwareValidationPath> --json
```

The tracked Todo App generated traversal plan is:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json
```

It generates a plan only. It does not produce final selected nodes/edges, generate contract input, or generate
instruction packs.

The deterministic selected graph slice generator is also part of the measured advisory runtime path:

```text
graph read-model select-slice --traversal-plan <planPath> --json
```

The tracked Todo App generated selected slice is:

```text
examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json
```

It selects a bounded graph-source/read-model slice from a ready traversal plan and records selection trace. It does not
generate contract compiler input, generate instruction packs, mutate graph-source, apply graph deltas, approve work,
satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.

The deterministic selected-slice-to-contract-input generator is now part of the measured advisory runtime path:

```text
graph read-model generate-contract-input --selected-slice <selectedSlicePath> --json
```

The tracked Todo App generated Contract Compiler Input is:

```text
examples/valid/todo-app-pbe-run/generated/contract-compiler-input.add-todo-runtime-evidence-only.preview.json
```

It maps the selected graph slice into existing Contract Compiler Input groups and trace fields. For the
runtime-Evidence-only calibration, broad selected-slice context can remain in `targetScopeCandidates`, but `allowedScope`
is narrowed to check/evidence/report-oriented artifacts and does not authorize change-tree or work-tree edits. The
frontend artifact reports field-group compatibility only; backend dry-run validation is not run because this is not the
legacy dry-run artifact role. The command does not generate instruction packs, trigger Codex execution, mutate
graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure
CI.

The deterministic Contract-Input-to-Instruction-Pack generator is now part of the measured advisory runtime path:

```text
graph read-model generate-instruction-pack --contract-input <contractInputPath> --json
```

The tracked Todo App generated Instruction Pack outputs are:

```text
examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.md
```

It turns frontend Contract Compiler Input into deterministic JSON/Markdown pack surfaces while preserving non-execution
boundaries. It does not trigger Codex execution, mutate graph-source, apply graph deltas, approve work, record human
decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.
Its explicit output paths are checked before writing so preview JSON/Markdown cannot overwrite source authority,
selected frontend inputs, concrete forbidden-scope paths, graph snapshot artifacts, Evidence authority artifacts,
selected scope candidate paths, or existing graph-source/source-authority-shaped JSON artifacts.

The traversal boundary keeps graph vocabulary separate from planner semantics: `requiredNodeTypes` and
`requiredEdgeTypes` use only the current graph-source taxonomy, while target/scope/evidence/output meanings are recorded
as roles and selection intents.

## Health Report Boundary

`graph read-model report-health --json` exposes a small runtime budget summary:

```text
runtimeBudgetTargetMs: 5000
lastTimingSmokeStatus: not-run-by-report-health
advisoryOnly: true
runtimeBudgetEnforced: false
```

It also names the advisory scope evaluator CLI:

```text
scopeComplianceEvaluatorStatus: advisory-cli-available
command: graph read-model check-scope --base <baseRef> --head <headRef> --json
compactReportCommand: graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json
enforcementStatus: not-enforced
```

It also names the proposal-only Graph Delta generator CLI:

```text
graphDeltaProposalGeneratorStatus: proposal-only-cli-available
command: graph read-model propose-graph-delta --source <sourceArtifact> --json
approvalStatus: not-approved
graphDeltaApplied: false
```

It also names the Human Review Packet CLI:

```text
graphDeltaHumanReviewPacketStatus: review-packet-cli-available
command: graph read-model review-graph-delta --proposal <proposalPath> --json
approvalStatus: not-approved
humanDecisionRecorded: false
```

It also names the Request IR graph-aware validator CLI:

```text
requestIrGraphValidatorStatus: graph-aware-cli-available
command: graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json
graphValidationStatus: not-run-by-report-health
graphTraversalAllowed: false
selectedGraphSliceGenerated: false
contractGenerationAllowed: false
```

The health report does not run the timing smoke, evaluator, generator, review packet command, or Request IR graph-aware
validator. It only names the advisory surfaces and preserves the non-enforcement/non-apply/non-approval boundary.

## Non-Goals

This budget does not:

- enforce the 5 second target;
- fail CI based on runtime timing;
- add required checks;
- add branch protection;
- reject diffs;
- enforce scope compliance;
- make the evaluator blocking;
- approve fixtures;
- mark calibration fixtures as supported;
- set `equivalenceProven: true`;
- inspect patch contents;
- implement graph delta apply;
- automate user acceptance;
- introduce executor automation.
