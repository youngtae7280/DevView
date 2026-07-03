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
- `advisoryOnly`;
- `runtimeBudgetEnforced`;
- `steps`.

The budget status is advisory. The smoke does not fail because the 5 second target is exceeded. It exits nonzero only
when a measured deterministic command itself fails.

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

The health report does not run the timing smoke, evaluator, generator, or review packet command. It only names the
advisory surfaces and preserves the non-enforcement/non-apply/non-approval boundary.

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
