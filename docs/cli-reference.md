# DevView CLI Reference

The `devview` CLI is the deterministic local command surface for Maintainability Graph projection, advisory context
generation, evidence lifecycle reporting, and guarded graph update readiness.

Use `devview --help` for the current command list. Legacy compatibility aliases may remain internally during migration,
but public examples should use `devview`.

## Common Commands

### Validate DevView

```bash
npm run validate:devview
```

Runs the repository validator and keeps existing safe MVP fixtures valid.

### Runtime Smoke

```bash
npm run devview:runtime:smoke
```

Runs deterministic local timing smoke. The smoke is advisory and does not enforce runtime budgets, scope, CI, proof, or
approval.

### Preflight Session

```bash
devview graph read-model run-preflight-session \
  --candidate <request-ir-candidate.json> \
  --output-dir <preflight-output-dir> \
  --json
```

Runs the deterministic frontend chain from Request IR Candidate through Instruction Pack preview. It never executes
Codex.

### Project-Specific Extension Readiness

```bash
devview extensions report-readiness \
  --project-profile .devview/project-profile.json \
  --extensions-dir .devview/extensions \
  --output <extension-readiness.json> \
  --markdown <extension-readiness.md> \
  --json
```

Discovers Project Profile and Extension Manifest declarations. It validates capabilities and permissions, but does not
execute extension code, call providers, make network calls, mutate the Maintainability Graph, satisfy runtime Evidence,
prove equivalence, or enforce scope/CI.

### Work Journal

```bash
devview work-journal render \
  --run-id <stable-run-id> \
  --title "Human readable work title" \
  --baseline <baseline-freeze.json> \
  --graph-source <maintainability-graph.json> \
  --view-tree <view-tree.json> \
  --contract-input <context-pack.json> \
  --instruction-pack <instruction-pack.json> \
  --extension-readiness <extension-readiness.json> \
  --runtime-evidence-satisfaction-readiness <runtime-readiness.json> \
  --runtime-evidence-satisfaction-record <runtime-satisfaction-record.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --equivalence-proof-record <equivalence-proof-record.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
  --scope-ci-enforcement-record <scope-ci-enforcement-record.json> \
  --proposal <graph-delta-proposal.json> \
  --guarded-graph-update-boundary-record <guarded-graph-update-boundary-record.json> \
  --apply-report <apply-report.json> \
  --output .devview/generated/work-journal/index.html \
  --data-output .devview/generated/work-journal/index.data.json \
  --run-output .devview/generated/work-journal/runs/<stable-run-id>/run.json \
  --json
```

Renders a cumulative static Work Journal preview and per-run data snapshot. If the data output already contains a
DevView Work Journal data artifact, the command preserves prior runs and replaces the current `--run-id`
deterministically. The default HTML view is compact: run status, blocked/ready reason, next action, a pipeline strip,
Evidence and scope counts, and preview-only versus actual-authority source state. Full provenance, raw run JSON, paths,
hashes, and artifact lists stay behind inspector drill-down sections. The journal is report-only: it summarizes DevView
flow and source facts, including a deferred guarded-update boundary when provided, without executing extensions, calling
providers, mutating the Maintainability Graph, applying a Graph Delta, creating runtime Evidence satisfaction, creating
an equivalence proof, mutating external CI, or changing branch protection.

### UserPromptSubmit Advisory

```bash
devview graph read-model report-user-prompt-submit-advisory \
  --prompt "Describe the bounded task" \
  --hook-health <hook-health-boundary.json> \
  --devview-mode advisory \
  --preflight-session <preflight-session-chain.json> \
  --output <user-prompt-advisory.json> \
  --markdown <user-prompt-advisory.md> \
  --json
```

Produces advisory additional context for a UserPromptSubmit boundary. It does not install hooks, block tools, or execute
Codex.

### Stop/Post Run Advisory

```bash
devview graph read-model report-stop-post-run-advisory \
  --user-prompt-advisory <user-prompt-advisory.json> \
  --hook-health <hook-health-boundary.json> \
  --preflight-session <preflight-session-chain.json> \
  --instruction-pack <instruction-pack.json> \
  --output <stop-post-run-advisory.json> \
  --markdown <stop-post-run-advisory.md> \
  --json
```

Audits post-run artifacts and reports missing next deterministic commands. It does not collect Git state, run scope
checks, propose graph deltas, or enforce anything.

### Changed Files And Scope Advisory

```bash
devview graph read-model collect-changed-files --working-tree --output <changed-files.json> --json
devview graph read-model collect-changed-files --staged --output <changed-files.json> --json
devview graph read-model collect-changed-files --untracked --output <changed-files.json> --json
devview graph read-model check-scope --working-tree --output <scope-report.json> --markdown <scope-report.md> --json
```

These commands inspect changed file names/status only. They do not inspect patches, reject diffs, or enforce scope.

### Graph Delta Review

```bash
devview graph read-model propose-graph-delta \
  --source <advisory-source-artifact.json> \
  --output <graph-delta-proposal.json> \
  --json

devview graph read-model review-graph-delta \
  --proposal <graph-delta-proposal.json> \
  --markdown <human-review-packet.md> \
  --json
```

Creates proposal-only Graph Delta and human review packet artifacts. These are not approval and do not mutate the
Maintainability Graph.

### Human Decision And Apply Readiness

```bash
devview graph read-model record-human-decision \
  --boundary <decision-boundary.json> \
  --review-packet <human-review-packet.json> \
  --proposal <graph-delta-proposal.json> \
  --decision approve-proposal \
  --reviewer "human reviewer" \
  --rationale "Human-authored rationale" \
  --decision-actor-type human \
  --decision-source explicit-cli-input \
  --output <human-decision-record.json> \
  --json

devview graph read-model report-approved-apply-dry-run \
  --decision-record <human-decision-record.json> \
  --proposal <graph-delta-proposal.json> \
  --approved-state-boundary <approved-state-boundary.json> \
  --apply-boundary <apply-boundary.json> \
  --mutation-policy <mutation-policy-boundary.json> \
  --output <approved-apply-dry-run.json> \
  --json
```

Human approval and apply readiness remain explicit and preview-only until a guarded update command revalidates all
inputs.

### Guarded Graph Update

```bash
devview graph read-model apply-graph-delta \
  --dry-run-report <approved-apply-dry-run.json> \
  --proposal <graph-delta-proposal.json> \
  --graph-source <maintainability-graph.json> \
  --mutation-policy <mutation-policy-boundary.json> \
  --backup-dir <backup-dir> \
  --read-model-output <read-model-output.json> \
  --validation-output <validation-output.json> \
  --output <apply-report.json> \
  --markdown <apply-report.md> \
  --json
```

Applies only explicit supported Graph Delta operations after backup and validation. Unsupported proposal shapes are
blocked.

### Evidence Lifecycle

```bash
devview graph read-model record-evidence-decision \
  --policy <evidence-policy-boundary.json> \
  --source-evidence <source-evidence-artifact> \
  --decision accept-evidence \
  --reviewer "human reviewer" \
  --rationale "Human-authored rationale" \
  --output <evidence-decision-record.json> \
  --json

devview graph read-model create-accepted-evidence-record \
  --evidence-decision <evidence-decision-record.json> \
  --policy <evidence-policy-boundary.json> \
  --source-evidence <source-evidence-artifact> \
  --output <accepted-evidence-record.json> \
  --json

devview graph read-model report-runtime-evidence-satisfaction-readiness \
  --accepted-evidence <accepted-evidence-record.json> \
  --instruction-pack <instruction-pack.json> \
  --required-evidence-id <required-evidence-id> \
  --output <runtime-satisfaction-readiness.json> \
  --json

devview graph read-model record-runtime-evidence-satisfaction \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --source-evidence <source-evidence-artifact> \
  --output <runtime-satisfaction-record.json> \
  --json
```

Accepted Evidence, runtime Evidence satisfaction, equivalence proof, and enforcement are separate states. These commands
do not infer one state from another. Runtime Evidence satisfaction can be recorded only from a ready binding preview
plus matching source Evidence revalidation; it still does not prove equivalence or enable enforcement.

### Equivalence And Scope/CI Readiness

```bash
devview graph read-model report-equivalence-proof-readiness \
  --policy <equivalence-policy-boundary.json> \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --output <equivalence-readiness.json> \
  --json

devview graph read-model record-equivalence-proof \
  --policy <equivalence-policy-boundary.json> \
  --runtime-evidence-satisfaction-record <runtime-satisfaction-record.json> \
  --output <equivalence-proof-record.json> \
  --json

devview graph read-model report-scope-ci-enforcement-readiness \
  --policy <scope-ci-policy-boundary.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --output <scope-ci-readiness.json> \
  --json

devview graph read-model record-scope-ci-enforcement \
  --scope-ci-enforcement-readiness <scope-ci-readiness-ready.json> \
  --equivalence-proof-record <equivalence-proof-record.json> \
  --output <scope-ci-enforcement-record.json> \
  --json

devview graph read-model record-guarded-graph-update-boundary \
  --proposal <graph-delta-proposal.json> \
  --runtime-evidence-satisfaction-record <runtime-satisfaction-record.json> \
  --equivalence-proof-record <equivalence-proof-record.json> \
  --scope-ci-enforcement-record <scope-ci-enforcement-record.json> \
  --output <guarded-graph-update-boundary-record.json> \
  --json

devview graph read-model plan-guarded-graph-update \
  --graph-source <maintainability-graph.json> \
  --proposal <graph-delta-proposal.json> \
  --guarded-graph-update-boundary-record <guarded-graph-update-boundary-record.json> \
  --output <guarded-graph-update-apply-plan.json> \
  --markdown <guarded-graph-update-apply-plan.md> \
  --json
```

Readiness commands are report-only. The Equivalence Proof record command can prove only one explicit runtime Evidence
obligation from an actual runtime satisfaction record. The Scope/CI Enforcement record command can record deterministic
DevView Scope/CI lifecycle authority only from ready Scope/CI readiness plus an actual Equivalence Proof record. It
still does not mutate external CI, configure required checks, change branch protection, activate hooks, reject diffs,
apply a Graph Delta, or mutate graph-source. The Guarded Graph Update boundary record validates the actual runtime,
proof, Scope/CI, and Graph Delta proposal inputs as future-apply preconditions while explicitly deferring the apply
command and leaving graph-source unchanged. The Guarded Graph Update apply plan command consumes that boundary record,
the current graph-source, and the Graph Delta proposal to preview concrete before/after field changes. It is
non-mutating and produces `graphDeltaApplied:false`, `graphSourceMutated:false`, and `applyPlanOnly:true`.

### Baseline And Final Handoff

```bash
devview graph read-model report-devview-baseline \
  --roadmap-audit <roadmap-completion-audit.json> \
  --final-handoff <final-handoff.json> \
  --frontend-chain <frontend-chain.json> \
  --hook-activation-chain <hook-activation-chain.json> \
  --extension-readiness <extension-readiness.json> \
  --approved-apply-dry-run <approved-apply-dry-run.json> \
  --apply-report <graph-delta-apply-report.json> \
  --evidence-decision <evidence-decision-record.json> \
  --accepted-evidence <accepted-evidence-record.json> \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
  --scope-ci-enforcement-record <scope-ci-enforcement-record.json> \
  --guarded-graph-update-boundary-record <guarded-graph-update-boundary-record.json> \
  --output <devview-baseline.json> \
  --markdown <devview-baseline.md> \
  --json
```

Summarizes existing artifacts only. It does not create authority, accept Evidence, satisfy runtime Evidence, prove
equivalence, enforce scope, configure CI, activate hooks, or execute Codex.

### Legacy Audit

```bash
devview report-legacy-artifacts --json
```

Reports remaining legacy names and migration inputs without changing files. Findings are classified as
`canonical-devview`, `needs-devview-rename`, `migration-fixture-only`, `delete-candidate`, or
`internal-hidden-compatibility`.

### Release Surface Validation

```bash
npm run check:release-surface
```

Checks the local package dry-run file list and text contents before release packaging. The check is local-only and fails
if internal archives, tests, output folders, work folders, source-only internals, or retired vocabulary are included in
the package surface.

### Legacy Cleanup Dry Run

```bash
devview cleanup-legacy \
  --dry-run \
  --scope examples \
  --output <legacy-cleanup-plan.json> \
  --markdown <legacy-cleanup-plan.md> \
  --json
```

Turns legacy audit findings into planned rename, rewrite, move, delete, and hidden-compatibility operations. The command
requires `--dry-run` and never renames, deletes, moves, rewrites, migrates storage, or changes source authority.
