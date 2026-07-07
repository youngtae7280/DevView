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
```

Accepted Evidence, runtime Evidence satisfaction, equivalence proof, and enforcement are separate states. These commands
do not infer one state from another.

### Equivalence And Scope/CI Readiness

```bash
devview graph read-model report-equivalence-proof-readiness \
  --policy <equivalence-policy-boundary.json> \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --output <equivalence-readiness.json> \
  --json

devview graph read-model report-scope-ci-enforcement-readiness \
  --policy <scope-ci-policy-boundary.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --output <scope-ci-readiness.json> \
  --json
```

Both commands are report-only. They do not prove equivalence, enforce scope, configure CI, create required checks,
change branch protection, or reject diffs.

### Baseline And Final Handoff

```bash
devview graph read-model report-devview-baseline \
  --roadmap-audit <roadmap-completion-audit.json> \
  --final-handoff <final-handoff.json> \
  --frontend-chain <frontend-chain.json> \
  --hook-activation-chain <hook-activation-chain.json> \
  --approved-apply-dry-run <approved-apply-dry-run.json> \
  --apply-report <graph-delta-apply-report.json> \
  --evidence-decision <evidence-decision-record.json> \
  --accepted-evidence <accepted-evidence-record.json> \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
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
