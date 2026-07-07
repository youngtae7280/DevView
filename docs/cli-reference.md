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

### Project-Specific Extension Catalog

```bash
devview extensions compile-profile \
  --project-profile .devview/project-profile.json \
  --extensions-dir .devview/extensions \
  --extension-readiness <extension-readiness.json> \
  --output <extension-profile-catalog.json> \
  --markdown <extension-profile-catalog.md> \
  --json
```

Compiles a ready Project Profile and Extension Manifest readiness result into a normalized, report-only capability
catalog for downstream View Tree, Context Pack, Evidence, policy, workflow, and graph-ingestion planning. The catalog is
a source fact only: it does not execute extension code, call providers, make network calls, run shell commands, mutate
the Maintainability Graph, satisfy runtime Evidence, prove equivalence, or enforce scope/CI.

### Project-Specific Extension Context Plan

```bash
devview extensions plan-context \
  --extension-profile-catalog <extension-profile-catalog.json> \
  --view-tree <view-tree.json> \
  --context-pack <context-pack.json> \
  --output <extension-context-plan.json> \
  --markdown <extension-context-plan.md> \
  --json
```

Connects compiled extension catalog hints to View Tree, Context Pack, Evidence, policy, Native/Retrofit, and
protocol-only graph-ingestion planning. `--view-tree` and `--context-pack` are optional; when supplied, they are checked
and summarized without mutation. The report does not execute extension code, run shell commands, install or invoke
Graphify, call providers, make network calls, mutate View Tree or Context Pack artifacts, mutate the Maintainability
Graph, satisfy runtime Evidence, prove equivalence, enforce scope/CI, activate hooks, or automate approval.

### Project-Specific Extension Adapter Compatibility

```bash
devview extensions validate-adapters \
  --extension-profile-catalog <extension-profile-catalog.json> \
  --extension-context-plan <extension-context-plan.json> \
  --runtime-evidence-satisfaction-readiness <runtime-readiness.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
  --output <extension-adapter-compatibility.json> \
  --markdown <extension-adapter-compatibility.md> \
  --json
```

Validates declared Evidence Adapter and Policy Extension compatibility with runtime Evidence, Equivalence Proof, and
Scope/CI readiness artifacts as source facts only. The readiness inputs are optional. The report can identify
compatible, missing, future-only, and not-applicable mappings, but it does not execute adapters, enforce policy, install
or run graph providers, call networks, mutate View Tree or Context Pack artifacts, mutate the Maintainability Graph,
satisfy Evidence, prove equivalence, enforce scope/CI, activate hooks, or automate approval.

### Native/Retrofit Profile Validation

```bash
devview extensions validate-native-retrofit-profile \
  --project-profile <project-profile.json> \
  --extension-profile-catalog <extension-profile-catalog.json> \
  --extension-adapter-compatibility-report <extension-adapter-compatibility.json> \
  --extension-context-plan <extension-context-plan.json> \
  --output <native-retrofit-profile-validation.json> \
  --markdown <native-retrofit-profile-validation.md> \
  --json
```

Validates whether the Project Profile and extension source facts express native, retrofit, or hybrid project mode,
stack/domain/platform hints, source-boundary hints, adapter and policy coverage, protocol-only graph ingestion
candidates, native boundary hints, and retrofit parity hints. This command is report-only: it does not create fixtures,
run external tools, execute extensions, mutate graph-source, satisfy Evidence, prove equivalence, enforce scope/CI,
activate hooks, or automate approval.

### Benchmark Golden-Answer Evaluation

```bash
devview benchmark evaluate-result \
  --benchmark-suite <benchmark-suite.json> \
  --task <benchmark-task.json> \
  --golden-answer <golden-answer.json> \
  --candidate-result <candidate-result.json> \
  --output <benchmark-evaluation-report.json> \
  --markdown <benchmark-evaluation-report.md> \
  --json
```

Scores a stored candidate result against a golden answer for `codex-only`, `codex-graphify`, `codex-devview`, or
`codex-graphify-devview` comparison arms. The evaluator is report-only: it does not perform live Codex, Graphify,
native/retrofit build/test, extension-code, provider, network, graph-source, Evidence, proof, scope/CI, hook, or
approval activity.

### Benchmark Comparison Summary

```bash
devview benchmark summarize-comparison \
  --evaluations <evaluation-a.json,evaluation-b.json> \
  --output <benchmark-comparison-summary.json> \
  --markdown <benchmark-comparison-summary.md> \
  --json
```

Summarizes scored benchmark evaluation reports into task/arm comparison matrices. The summary groups reports by suite,
task, project mode, and arm comparison group, then carries forward per-arm scores, missing arms, pass/fail state,
dimension summaries, and deltas such as DevView versus Codex-only or Graphify versus Codex-only. This command is also
report-only: it consumes stored evaluation reports and does not perform live benchmark-task, Graphify, native/retrofit
build/test, extension-code, provider, network, graph-source, lifecycle-authority, hook, or approval activity.

### Benchmark Suite Lock

```bash
devview benchmark lock-suite \
  --benchmark-suite <benchmark-suite.json> \
  --tasks <task-a.json,task-b.json> \
  --golden-answers <golden-a.json,golden-b.json> \
  --candidate-results <candidate-a.json,candidate-b.json> \
  --evaluations <evaluation-a.json,evaluation-b.json> \
  --comparison-summary <benchmark-comparison-summary.json> \
  --graphify-import-validations <graphify-import-validation.json> \
  --output <benchmark-suite-lock-manifest.json> \
  --markdown <benchmark-suite-lock-manifest.md> \
  --json
```

Hashes the exact benchmark source artifact set into a report-only lock manifest. The manifest records suite, task,
golden-answer, candidate-result, evaluation, optional comparison-summary, and optional static Graphify import validation
digests, plus DevView package version, evaluator/rubric versions, and governance gaps such as missing golden-answer
review metadata or held-out policy. It does not run benchmark tasks, run Graphify, run native/retrofit builds, call
providers, mutate graph-source, approve goldens, or activate enterprise release gates.

### Benchmark Governance Verification

```bash
devview benchmark verify-governance \
  --suite-lock <benchmark-suite-lock-manifest.json> \
  --governance-policy <benchmark-governance-policy.json> \
  --output <benchmark-governance-verification.json> \
  --markdown <benchmark-governance-verification.md> \
  --json
```

Verifies a benchmark suite lock manifest and optional governance policy before any enterprise benchmark claim. The
report checks role/status, false execution flags, evaluator/rubric versions, recorded source digests, golden review
metadata, held-out policy, Graphify import governance, and required comparison arms or project modes. Without a policy,
verification is partial. With a minimal policy, it can verify static benchmark governance only; it still does not run
benchmark tasks, run Graphify, run native/retrofit builds, call providers, mutate graph-source, approve goldens, or
activate release gates.

### Enterprise Readiness Report

```bash
devview security report-enterprise-readiness \
  --benchmark-governance-verification <benchmark-governance-verification.json> \
  --release-surface-validation <release-surface-validation.json> \
  --provider-network-policy-report <provider-network-policy-report.json> \
  --record-envelope-preview <record-envelope-preview.json> \
  --record-envelope-verification <record-envelope-verification.json> \
  --signing-readiness <signing-readiness.json> \
  --output <enterprise-readiness.json> \
  --markdown <enterprise-readiness.md> \
  --json
```

Aggregates enterprise hardening posture into a report-only readiness assessment. The report carries benchmark governance
release-surface validation, provider/network default-deny policy reports, unsigned record envelope previews, record
envelope verification reports, and signing/key governance readiness reports as source facts, then lists remaining
enterprise gaps for extension execution policy, guarded graph update governance, Scope/CI activation governance, RBAC,
signing, audit, and tamper-evidence. `--record-envelope-preview`, `--record-envelope-verification`, and
`--signing-readiness` may be repeated or comma-separated. Envelope previews record unsigned payload/source digest
intent; envelope verification reports show those digests were independently recomputed; signing readiness reports
summarize key registry, trust root, signature policy, and RBAC prerequisites. The report still does not claim
cryptographic signing, key management, or RBAC enforcement. It does not activate enterprise gates, execute extensions,
call providers, make network calls, mutate graph-source, configure CI, activate hooks, or automate approval.

### Provider/Network Default-Deny Policy

```bash
devview security report-provider-network-policy \
  --policy <provider-network-policy.json> \
  --enterprise-readiness <enterprise-readiness.json> \
  --output <provider-network-policy-report.json> \
  --markdown <provider-network-policy-report.md> \
  --json
```

Records provider and network policy posture as a report-only default-deny artifact. Without `--policy`, the command
emits the canonical default-deny policy report. With `--policy`, the source must be a strict
`devview-provider-network-policy` configured with provider and network defaults set to `deny`, empty allowlists, and all
provider/network/API/execution flags false. Explicit allow policies remain future-only until signed policy, actor
identity/RBAC, project-level grants, audit records, no-network defaults, and sandbox/provider isolation are designed.
The command never invokes providers, makes network/API calls, executes extensions, runs Graphify, mutates graph-source,
configures CI, activates hooks, or automates approval.

### RBAC Role Assignment Policy Validation

```bash
devview security validate-rbac-policy \
  --policy <rbac-policy.json> \
  --rbac-readiness <rbac-readiness.json> \
  --signing-readiness <signing-readiness.json> \
  --output <rbac-policy-validation.json> \
  --markdown <rbac-policy-validation.md> \
  --json
```

Validates a declarative `devview-rbac-policy` role-assignment policy as a report-only readiness artifact. The policy
must use `defaultAuthorityPolicy: deny` and can declare actors, role assignments, permission grants, automation
restrictions, and extension-author restrictions. Optional RBAC readiness and signing readiness reports are summarized as
source facts. Validation detects unknown actors, roles, permissions, duplicate actor IDs, artifact-role coverage, and
overgrant risks. It blocks default-allow policy, key/private material, provider/network/API allowlists or grants,
automation overgrants, extension-author overgrants, unsafe authority flags, and real signing/RBAC claims with zero-write
behavior. The command does not enforce RBAC, verify permissions, sign records, generate/store keys, call providers,
execute extensions, mutate graph-source, configure CI/hooks, activate enterprise gates, or automate approval.

### RBAC / Actor Identity Readiness

```bash
devview security report-rbac-readiness \
  --enterprise-readiness <enterprise-readiness.json> \
  --provider-network-policy-report <provider-network-policy-report.json> \
  --benchmark-governance-verification <benchmark-governance-verification.json> \
  --output <rbac-readiness.json> \
  --markdown <rbac-readiness.md> \
  --json
```

Records the report-only RBAC and actor identity model before signed record envelopes or enforcement exist. The report
defines actors, proposed actor identity fields, role-permission mappings, artifact-permission mappings, default-deny
authority posture, missing signed-policy and key-management gaps, and future-only signing/enforcement requirements.
Optional enterprise readiness, provider/network policy, and benchmark governance reports are summarized as source facts
only. The command does not perform cryptographic signing, generate or store keys, enforce RBAC, call providers, make
network/API calls, execute extensions, mutate graph-source, create lifecycle authority records, configure CI, activate
hooks, or automate approval.

### Signing / Key Governance Readiness

```bash
devview security report-signing-readiness \
  --rbac-readiness <rbac-readiness.json> \
  --record-envelope-preview <record-envelope-preview.json> \
  --record-envelope-verification <record-envelope-verification.json> \
  --enterprise-readiness <enterprise-readiness.json> \
  --output <signing-readiness.json> \
  --markdown <signing-readiness.md> \
  --json
```

Records signing and key governance readiness as a report-only source fact before real cryptographic signatures, key
registries, trust roots, or RBAC enforcement exist. Optional RBAC readiness, unsigned envelope previews, envelope
verification reports, and enterprise readiness reports are validated by exact role/status and summarized. Envelope
preview and verification inputs may be repeated or comma-separated. The report keeps signing, key generation/storage,
key management, RBAC enforcement, permission verification, provider/network/API calls, extension/shell execution, graph
mutation/apply, lifecycle authority, CI/hooks, enterprise gates, and approval automation false.

### Unsigned Record Envelope Preview

```bash
devview security preview-record-envelope \
  --payload <artifact.json> \
  --source-artifacts <source-a.json,source-b.json> \
  --previous-envelope <record-envelope-preview.json> \
  --required-permission <permission> \
  --actor-id <actor-id> \
  --actor-type <human|automation|service|extension-author> \
  --actor-role <role> \
  --authorization-rationale "Human rationale" \
  --output <record-envelope-preview.json> \
  --markdown <record-envelope-preview.md> \
  --json
```

Creates a deterministic, unsigned envelope preview for an existing JSON artifact. The preview records raw payload bytes
hashes, optional source artifact digests, explicit CLI actor identity claims, required permission claims, and an
optional previous envelope link. It uses `signatureMode: unsigned-deterministic-preview` and records that RBAC
permission verification and cryptographic signature verification are not performed. The command mutates no
payload/source artifact, does not generate keys, does not sign records, does not enforce RBAC, and keeps
provider/network/execution/graph/lifecycle authority flags false.

### Record Envelope Verification

```bash
devview security verify-record-envelope \
  --record-envelope-preview <record-envelope-preview.json> \
  --payload <artifact.json> \
  --source-artifacts <source-a.json,source-b.json> \
  --previous-envelope <record-envelope-preview.json> \
  --output <record-envelope-verification.json> \
  --markdown <record-envelope-verification.md> \
  --json
```

Verifies an unsigned envelope preview by recomputing raw byte digests from explicit CLI-supplied payload, source
artifact, and previous-envelope files. The command checks preview role/status/signature mode, payload path/hash/length,
source digest coverage, and previous envelope chain hash when present. It emits
`devview-record-envelope-verification-report` and keeps
`signatureVerificationMode: not-performed-unsigned-preview-only`, `cryptographicSignatureVerified:false`,
`rbacPermissionVerified:false`, and `rbacEnforced:false`. It does not sign records, generate or store keys, enforce
RBAC, mutate payload/source artifacts, call providers/network/API, execute extensions, mutate graph-source, configure
CI/hooks, or automate approval.

### Graphify Import Validation

```bash
devview benchmark validate-graphify-import \
  --graphify-export <graphify-export.fixture.json> \
  --mapping <graphify-to-devview-mapping.json> \
  --benchmark-task <benchmark-task.json> \
  --golden-answer <golden-answer.json> \
  --output <graphify-import-validation.json> \
  --markdown <graphify-import-validation.md> \
  --json
```

Validates a static Graphify export fixture and Graphify-to-DevView mapping before any future live integration. The
report summarizes node/edge mapping coverage, unmapped items, mapping conflicts, optional benchmark task/golden-answer
alignment, and expected context coverage hints for future `codex-graphify` and `codex-graphify-devview` candidate
fixtures. The command is report-only and blocks executable/provider/network instructions or unsafe authority flags
before output is written.

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
  --extension-profile-catalog <extension-profile-catalog.json> \
  --extension-context-plan <extension-context-plan.json> \
  --extension-adapter-compatibility-report <extension-adapter-compatibility.json> \
  --native-retrofit-profile-validation-report <native-retrofit-profile-validation.json> \
  --runtime-evidence-satisfaction-readiness <runtime-readiness.json> \
  --runtime-evidence-satisfaction-record <runtime-satisfaction-record.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --equivalence-proof-record <equivalence-proof-record.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
  --scope-ci-enforcement-record <scope-ci-enforcement-record.json> \
  --proposal <graph-delta-proposal.json> \
  --guarded-graph-update-boundary-record <guarded-graph-update-boundary-record.json> \
  --guarded-graph-update-apply-plan <guarded-graph-update-apply-plan.json> \
  --guarded-graph-update-apply-report <guarded-graph-update-apply-report.json> \
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
flow and source facts, including compiled extension catalogs, extension context plans, adapter compatibility reports,
Native/Retrofit profile validation reports, deferred guarded-update boundaries, and apply-plan previews when provided,
without executing extensions, granting traversal authority, running native/retrofit builds or benchmarks, calling
providers, mutating the Maintainability Graph, applying a Graph Delta, creating runtime Evidence satisfaction, creating
an equivalence proof, mutating external CI, or changing branch protection. A ready apply plan means the next action is
explicit policy-gated apply authorization; it does not mean the graph was updated.

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

devview graph read-model apply-guarded-graph-update \
  --graph-source <maintainability-graph.json> \
  --proposal <graph-delta-proposal.json> \
  --apply-plan <guarded-graph-update-apply-plan.json> \
  --guarded-graph-update-boundary-record <guarded-graph-update-boundary-record.json> \
  --backup-dir <backup-dir> \
  --read-model-output <read-model-output.json> \
  --validation-output <post-apply-validation.json> \
  --output <guarded-graph-update-apply-report.json> \
  --operator <operator-id> \
  --authorization-rationale <human-authored-rationale> \
  --authorize-graph-source-mutation \
  --markdown <guarded-graph-update-apply-report.md> \
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
non-mutating and produces `graphDeltaApplied:false`, `graphSourceMutated:false`, and `applyPlanOnly:true`. The Guarded
Graph Update apply command is the first policy-gated graph-source mutation surface: it requires a ready apply plan,
matching boundary record and proposal, an exact graph-source hash match, an exclusive backup, and explicit operator
authorization. It mutates only the named `--graph-source` JSON and writes only the requested backup, read-model,
validation, JSON report, and optional Markdown report. It does not mutate external CI, branch protection, required
checks, hooks, providers, networks, approval automation, or user acceptance.

### Baseline And Final Handoff

```bash
devview graph read-model report-devview-baseline \
  --roadmap-audit <roadmap-completion-audit.json> \
  --final-handoff <final-handoff.json> \
  --frontend-chain <frontend-chain.json> \
  --hook-activation-chain <hook-activation-chain.json> \
  --extension-readiness <extension-readiness.json> \
  --extension-profile-catalog <extension-profile-catalog.json> \
  --extension-context-plan <extension-context-plan.json> \
  --extension-adapter-compatibility-report <extension-adapter-compatibility.json> \
  --native-retrofit-profile-validation-report <native-retrofit-profile-validation.json> \
  --approved-apply-dry-run <approved-apply-dry-run.json> \
  --apply-report <graph-delta-apply-report.json> \
  --evidence-decision <evidence-decision-record.json> \
  --accepted-evidence <accepted-evidence-record.json> \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
  --scope-ci-enforcement-record <scope-ci-enforcement-record.json> \
  --guarded-graph-update-boundary-record <guarded-graph-update-boundary-record.json> \
  --guarded-graph-update-apply-plan <guarded-graph-update-apply-plan.json> \
  --guarded-graph-update-apply-report <guarded-graph-update-apply-report.json> \
  --output <devview-baseline.json> \
  --markdown <devview-baseline.md> \
  --json
```

Summarizes existing artifacts only, including optional Native/Retrofit profile validation source facts when provided. It
does not create authority, accept Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI,
activate hooks, run native/retrofit builds or benchmarks, or execute Codex.

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
