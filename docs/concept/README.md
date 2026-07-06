# PBE Concept Repository

This directory is the concept repository for PBE runtime architecture alignment. It records the current conceptual
baseline before implementation details, CLI behavior, validators, or migration scripts are expanded.

The work instruction names these files as `concept/...`; in this plugin repository, that concept repository lives at
`docs/concept/...` so it remains inside the public documentation tree.

## Authority Rule

The Product Tree remains the source of product truth for projects managed by PBE. For this plugin's own concept
documentation, the source of truth order is:

1. Confirmed decisions in [decision-log.md](decision-log.md).
2. Concept policies in this directory.
3. Canonical and compatibility vocabulary in [glossary.md](glossary.md).
4. Current tree-native operational artifacts and CLI behavior.
5. Existing public docs under `docs/` when they do not conflict with the concept repository.
6. Open questions and active assumptions when no confirmed decision exists.

If a later document conflicts with a confirmed decision, record the conflict instead of silently changing scope.

## Transition Stance

The current plugin now has one explicitly promoted Graph-source scope:

- [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md) promotes
  Maintainability Graph as the limited source model for the Todo Search selected-slice authority surface.

Outside explicitly promoted scopes, the plugin remains tree-native at the operational source level.

The long-term architectural target remains broader Maintainability Graph promotion to the source model.

Until another promotion is explicitly approved, Maintainability Graph remains a canonical read model / alignment model
over current tree-native artifacts outside the promoted scope.

This means Phase 1-2 documents are not rejecting the Graph-source target. They preserve current plugin safety while
documenting the transition path.

Graph-first refinement adds one more separation:

```text
Node = durable target
Edge = durable semantic relationship
Tag = view-scoped role only
```

This refinement clarifies the target architecture. It now applies as source authority only inside the explicitly
promoted Todo Search selected-slice scope; elsewhere it remains the target/read-model taxonomy.

Current operational source:

```text
limited Graph-source promoted for Todo Search selected-slice; tree-native artifacts elsewhere
```

Current transition mechanics:

```text
Todo Search and Todo App configured read-model slices are graph-source-backed, while tree-native artifacts remain
compatibility/fallback/reference. Tree-native retirement readiness is recorded as criteria only:
Todo Search tree-native selected-slice artifacts are deprecated fallback/reference records, not source and not deleted;
Todo App is not-retirement-ready.
```

The retirement approval surface is now prepared in
[tree-native-retirement-approval-package.md](tree-native-retirement-approval-package.md). It keeps retirement unexecuted
and records Todo Search as `retirement-candidate-not-deleted`, Todo App as `not-ready-structure-only`, and repo-wide
retirement as `not-ready`.

Current conceptual alignment model:

```text
Maintainability Graph outside promoted scopes
```

Long-term target source model:

```text
Maintainability Graph
```

Further Graph-source promotion requires a separate phase and explicit user approval after:

1. Approval Brief policy is complete.
2. Check / Evidence policy is complete.
3. Control Node lifecycle policy is complete.
4. Legacy Compatibility Map is complete.
5. Runtime Feasibility Demonstration policy is complete, the representative demo slice is selected, and an actual
   representative demo result has passed with observable Evidence and no hidden partial/blocking gaps.
6. Source Transition Path policy is complete and the source authority matrix is agreed.
7. Rollback / Compatibility Strategy policy is complete.
8. Graph-source Promotion Readiness Review classifies retained warnings, blockers, and remaining decisions.
9. A Maintainability Graph read-model parity artifact resolves any read-model output blocker for the intended promotion
   decision scope.
10. Graph-first Node/Edge/Tag and retrofit bootstrap policies are reflected in the intended pilot or promotion scope.
11. A user-facing decision package is prepared for the intended limited pilot or promotion scope, and the user makes an
    explicit approval decision.
12. Any approved limited pilot decision is recorded in a bounded transition record before later scoped execution is
    considered.
13. Any executed promotion branch is recorded in a scoped execution record with fallback/reference artifacts retained.

## Phase 1 Repository Files

| File                                           | Role                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| [decision-log.md](decision-log.md)             | Source of truth for confirmed architecture decisions and supersede relationships. |
| [glossary.md](glossary.md)                     | Canonical, legacy, compatibility, deprecated, and superseded term classification. |
| [open-questions.md](open-questions.md)         | Active unresolved questions only.                                                 |
| [resolved-questions.md](resolved-questions.md) | Questions that were previously open but are now answered by decisions or docs.    |
| [active-assumptions.md](active-assumptions.md) | Current low-risk assumptions that are not yet decisions.                          |
| [assumption-history.md](assumption-history.md) | Resolved, rejected, superseded, or decision-converted assumptions.                |
| [superseded-items.md](superseded-items.md)     | Old frames, terms, or structures replaced by current decisions.                   |

Resolved questions and assumptions converted into decisions must not remain active.

## Phase 2 Core Architecture Docs

The current canonical candidate docs are:

- [pbe-runtime-architecture.md](pbe-runtime-architecture.md)
- [maintainability-graph.md](maintainability-graph.md)
- [view-tree-pack.md](view-tree-pack.md)
- [change-lifecycle.md](change-lifecycle.md)
- [execution-contract.md](execution-contract.md)

These documents define concept structure only. They do not define TypeScript models, CLI commands, validators, migration
scripts, or implementation tasks.

## Concept Policies

The following concept policies are complete at documentation level:

- [approval-brief.md](approval-brief.md)
- [check-evidence-policy.md](check-evidence-policy.md)
- [control-node-policy.md](control-node-policy.md)
- [legacy-compatibility-map.md](legacy-compatibility-map.md)
- [runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md)
- [source-transition-path.md](source-transition-path.md)
- [rollback-compatibility-strategy.md](rollback-compatibility-strategy.md)
- [graph-node-edge-tag-policy.md](graph-node-edge-tag-policy.md)
- [retrofit-graph-bootstrap.md](retrofit-graph-bootstrap.md)

Concept policy completion does not create CLI commands, schemas, validators, templates, runtime artifacts, or durable
acceptance storage by itself.

## Readiness Artifacts

The current local operation-chain productization package is recorded in:

- [graph-operation-chain-productization.md](graph-operation-chain-productization.md)

It covers native and retrofit dogfood through `graph-source -> instruction pack -> local change -> graph delta -> graph
update proposal`, but remains non-enforcing.

The first real external operation-chain dogfood is recorded in:

- [real-external-operation-chain-dogfood.md](real-external-operation-chain-dogfood.md)

It uses a local `mdn/todo-vue` checkout, applies only a README clarification, captures the resulting graph delta and
graph update proposal, and records the external Node/toolchain build blocker separately from the selected README-only
slice.

The first real external behavior-change dogfood is recorded in:

- [real-external-behavior-change-dogfood.md](real-external-behavior-change-dogfood.md)

It uses a local `component/escape-html` checkout, recovers stringification and escaping intent from README/source/tests,
applies a tiny Symbol input behavior change, passes the project test suite, and records the graph delta plus graph update
proposal without claiming upstream approval.

The first large external formal-design-document retrofit pass is recorded in:

- [large-external-kep-retrofit-dogfood.md](large-external-kep-retrofit-dogfood.md)

It maps Kubernetes KEP-753 Sidecar Containers from KEP goals, non-goals, risks, test-plan, and rollout intent to related
Kubernetes code/test surfaces. This pass is read-only and proves instruction-pack readiness without cloning, mutating,
testing, or claiming maintainer approval for Kubernetes.

The first Compiler Boundary MVP and hardened Contract Fixture Validator are recorded in:

- [pbe-compiler-boundary.md](pbe-compiler-boundary.md)
- [compiler-input-model.md](compiler-input-model.md)
- [contract-compiler-dry-run.md](contract-compiler-dry-run.md)
- [output-requirement-source-authority.md](output-requirement-source-authority.md)
- [contract-source-authority-gap-preview.md](contract-source-authority-gap-preview.md)
- [contract-compiler-equivalence-policy.md](contract-compiler-equivalence-policy.md)
- [contract-compiler-promotion-review-policy.md](contract-compiler-promotion-review-policy.md)
- [contract-compiler-calibration-fixtures.md](contract-compiler-calibration-fixtures.md)
- [contract-compiler-eligibility-status-model.md](contract-compiler-eligibility-status-model.md)
- [devview-compliance-checker-mvp-scope.md](devview-compliance-checker-mvp-scope.md)
- [scope-compliance-checker-implementation-readiness.md](scope-compliance-checker-implementation-readiness.md)

It separates compiler-required work from AI-advisory work, adds a machine-readable task registry and Execution Contract
MVP schema, validates a Todo Search dry-run contract with bucketed registry/schema/contract issues, requires severe risks
to link to explicit human decisions, and exposes the status through `graph read-model report-compiler-boundary --json`,
`graph read-model report-health --json`, and `npm run test:read-model:e2e`. It remains non-enforcing and does not enable
required checks, branch protection, automatic AI execution, acceptance, graph delta application, source-authority
expansion, or tree-native retirement.

The Compiler Input Model MVP defines the machine-readable input surface for a future Actual Contract Compiler:
human request, graph snapshot, pack schema, policy snapshot, evidence index, and target scope candidates. It validates
those inputs and their basic artifact/graph cross-references through `graph read-model report-compiler-input --json`; it
does not compile contracts or execute AI.

Contract Compiler Dry-Run v0.1 consumes that validated input for the current `bug_fix` fixture, deterministically writes
a candidate execution contract, revalidates the candidate through the Contract Fixture Validator, and writes a
generated-vs-hand-written diff report via `graph read-model compile-contract --dry-run --json`. A passing compiler
candidate does not imply equivalence with the hand-written dry-run contract while the diff reports
`compiler-equivalence-not-proven`. The diff report now adds semantic review classifications and
`compilerPromotionReadiness`; the current fixture remains review-only because generated-vs-hand-written review diffs
still exist before any compiler promotion. Those classifications now come from explicit dry-run v0.1 rule ids, and
unmatched differences are counted as `unknown-review-required`. Current v0.2 mapping derives generated
`outputRequirements` from `outputRequirementSources[]`, so the former `output-requirement-loss` is no longer present in
the current diff. The current dry-run diff set has no unknown fields and is marked
`contract-compiler-dry-run-v0.1-classification-complete`, but `equivalenceProven` remains `false` because review-only
diffs remain; it remains local/non-enforcing. The next recommended direction is defining explicit
equivalence/readiness policy before any pack-schema widening, executor automation, or graph delta application.

Output Requirement Source Authority v0.2 adds `outputRequirementSources[]` to the current Compiler Input Model fixture
and writes `output-requirement-source-authority.preview.json`. The preview maps the hand-written changed-file,
command-output Evidence, validation-result, and boundary reporting obligations to source authority entries, and the
compiler now derives generated `outputRequirements` from those entries. The compiler also derives `forbiddenScope[]`
from `policySnapshot.forbiddenScopeRules[]`, `stopConditions[]` from `stopConditionSources[]`, `requiredEvidence[]`
from `evidenceIndex.entries[]` plus `policySnapshot.evidenceCheckMappings[]`, and `requiredContext[]` from
`graphSnapshot.artifacts[]`. It also derives `knownRisks[]` from `riskSources[]` and `allowedScope[]` from
`targetScopeCandidates[]`. It reports `generated-output-requirements-preserved`, required-Evidence preservation,
required-context preservation, risk preservation, and allowed-scope preservation for the current fixture while keeping
whole-contract equivalence unproven.

Contract Source Authority Gap Preview v0.2 writes `contract-source-authority-gap.preview.json` to explain field-level
source-authority status. It now reports zero remaining semantic/policy loss and no field requiring another resolver for
the current fixture; `allowedScope`, `forbiddenScope`, `stopConditions`, `requiredEvidence`, `requiredContext`, and
`knownRisks` are preserved from source authority entries. The next recommended resolver is `none`. This is review
metadata only, not enforcement or compiler promotion.

Contract Compiler Equivalence Policy v0.2 separates source-authority preservation from equivalence proof. The current
diff report marks `sourceAuthorityPreservationStatus: source-authority-preserved`,
`semanticDiffPolicyStatus: semantic-diff-clean`, `reviewOnlyDiffStatus: review-only-diff-detected`,
`equivalenceCandidate: true`, and `equivalenceProven: false`. This keeps the generated candidate reviewable without
making it authoritative or executable.

Contract Compiler Promotion Review Policy v0.2 adds a non-enforcing review packet at
`examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json`. The packet gathers the
candidate, comparison fixture, semantic diff, source-authority previews, validation commands, explicit non-goals, and
human checklist. Its current status is `promotion-review-ready-for-human` with `approvalStatus: not-approved`; it does
not set `equivalenceProven: true`, accept work, enable enforcement, or promote the generated contract to execution
authority.

The packet now narrows the remaining review-only diffs to `source-mode-metadata-only`,
`validation-superset-review-only`, and `boundary-wording-review-required`. Boundary wording remains a human-review item
because it must preserve non-execution, non-approval, non-enforcement, no user-acceptance, and no graph-delta-apply
boundaries.

Contract Compiler Calibration Fixtures and the Eligibility Status Model now summarize three fixture shapes:
local `bug_fix`, external `behavior-change`, and test-only behavior proof. The status model defines lifecycle categories,
canonical status meanings, allowed transitions, and forbidden transitions so `preview-gap-set-complete`,
`policy-recognized`, `contract-candidate-not-run`, `promotion-not-eligible`, `equivalenceCandidate`, and
`equivalenceProven` cannot be confused with support, approval, execution authority, or enforcement.

DevView Compliance Checker MVP Scope selects `scope-compliance-preview` as the first future checker axis. It defines the
purpose, expected future inputs, conceptual violation categories, fixture relevance, and non-enforcement boundary for a
future checker without implementing diff inspection, scope enforcement, CI required checks, branch protection, fixture
approval, user acceptance automation, or equivalence proof.

Scope Compliance Checker Implementation Readiness defines the input authority, path normalization, missing-input
reporting, result artifact, and non-enforcing status criteria that must be settled before a first executable checker
slice. It keeps changed-file collection, diff inspection, rejection, enforcement, fixture approval, and equivalence proof
out of scope. It now decides that fixture-provided changed files remain preview-only, agent-reported changed files are
not authoritative, and git-derived changed files are the first real authoritative candidate for a later implementation
task.

The first advisory scope evaluator is now exposed through `graph read-model check-scope --base <baseRef> --head
<headRef> --json`, with an optional compact report at `--markdown <file>`. The compact report is a readability surface
for the same non-enforcing result; it does not reject diffs, create required checks, approve fixtures, satisfy runtime
Evidence, prove equivalence, apply graph deltas, or replace user acceptance.

The Graph Delta Proposal boundary for advisory scope results is previewed in
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-boundary.runtime-evidence-only.preview.json`. It allows
future proposal candidates to be shaped from advisory results while keeping graph-source mutation, graph delta apply,
approval, enforcement, equivalence proof, runtime Evidence satisfaction, and user acceptance out of scope.

The follow-on candidate schema alignment preview is recorded in
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-candidate-schema.runtime-evidence-only.preview.json`.
It maps advisory `check-scope` categories to existing `pbe-graph-update-proposal-v0` fields where possible and marks
unresolved mappings for review instead of creating approved graph updates.

The unresolved mapping decision preview is recorded in
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-unresolved-mapping-decision.runtime-evidence-only.preview.json`.
It identifies `CH-001` as a structure-only source record candidate, defers `graphDeltaPath` until a graph-delta-compatible
source exists, and keeps advisory JSON/report links candidate-only.

The graph-delta-compatible source preview is recorded in
`examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json`. It defines a
proposal-only generator input shape from advisory runtime outputs, changed-file collection, scope evaluation,
proposal boundary, schema alignment, and mapping decisions. It is not graph-source, not a graph update proposal, not
apply, and not accepted Evidence.

The proposal-only generator scope decision is recorded in
`examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-generator-scope-decision.runtime-evidence-only.preview.json`.
It defines the stdout-or-explicit-output CLI boundary now implemented by
`graph read-model propose-graph-delta --source <sourceArtifact> --json`. The command emits a
`graph-delta-proposal-only-preview` object and writes only when explicit `--output` is supplied. It does not mutate
graph-source, apply graph deltas, approve updates, enforce scope, satisfy runtime Evidence, prove equivalence, or reject
diffs.

The Human Review Packet surface is now implemented by
`graph read-model review-graph-delta --proposal <proposalPath> --json`. It can also write a compact Markdown packet
with explicit `--markdown <file>`. The packet is review input only: it does not record approval, record human decisions,
mutate graph-source, apply graph deltas, satisfy runtime Evidence, enforce scope, prove equivalence, or reject diffs.

The Human Decision Record boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-human-decision-record-boundary.runtime-evidence-only.preview.json`.
It defines the human-authored decision record shape after a Human Review Packet, including decision values such as
`approve-proposal`, `reject-proposal`, `request-revision`, and `defer-decision`.

The Human Decision Record command boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-human-decision-record-command-boundary.runtime-evidence-only.preview.json`.
The `graph read-model record-human-decision ...` command now records an explicit human decision preview artifact such as
`examples/valid/todo-app-pbe-run/generated/devview-human-decision-record.defer-decision.runtime-evidence-only.preview.json`.
It requires proposal/review provenance, explicit human reviewer identity, and a rationale. It still does not create
approved proposal state, apply graph deltas, mutate graph-source, satisfy Evidence, prove equivalence, or enforce
scope/CI.

The Approved Proposal State boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-approved-proposal-state-boundary.runtime-evidence-only.preview.json`.
The `graph read-model create-approved-proposal-state ...` command now creates or blocks an approved-state preview from a
Human Decision Record and proposal-only Graph Delta preview. The first calibration artifact is blocked because the human
decision record is `defer-decision`:
`examples/valid/todo-app-pbe-run/generated/devview-approved-proposal-state.blocked-defer-decision.runtime-evidence-only.preview.json`.
The command keeps approved state creation separate from graph delta apply and never mutates graph-source, satisfies
runtime Evidence, proves equivalence, enforces scope, or configures CI.

The Graph Delta Apply boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-graph-delta-apply-boundary.runtime-evidence-only.preview.json`. It
now anchors the `graph read-model check-graph-delta-apply ...` readiness command. The first calibration readiness
artifact is blocked because the approved-state preview was not created:
`examples/valid/todo-app-pbe-run/generated/devview-graph-delta-apply-readiness.blocked-defer-decision.runtime-evidence-only.preview.json`.
The command checks approved-state/proposal preconditions only. It does not add an apply command, enable graph delta
apply, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.

The Evidence Acceptance Policy boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-evidence-acceptance-policy-boundary.runtime-evidence-only.preview.json`.
It now anchors the `graph read-model report-evidence-acceptance-readiness ...` command. The first calibration Evidence
acceptance readiness artifact is blocked because graph-source mutation readiness is blocked:
`examples/valid/todo-app-pbe-run/generated/devview-evidence-acceptance-readiness.blocked-defer-decision.runtime-evidence-only.preview.json`.
It separates linked Evidence, accepted Evidence, and `runtimeEvidenceSatisfied` so future tooling cannot treat CI,
validators, Codex output, or review packets as self-acceptance. The command reports readiness only; it does not accept
Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, apply graph deltas, mutate graph-source, or
configure CI.

The Equivalence Proof Policy boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-equivalence-proof-policy-boundary.runtime-evidence-only.preview.json`.
It anchors the `graph read-model report-equivalence-proof-readiness ...` command. The first calibration equivalence
readiness artifact is blocked because Evidence acceptance readiness is blocked:
`examples/valid/todo-app-pbe-run/generated/devview-equivalence-proof-readiness.blocked-defer-decision.runtime-evidence-only.preview.json`.
The command reports readiness only. It does not prove equivalence, set `equivalenceProven: true`, accept Evidence,
satisfy runtime Evidence, apply graph deltas, mutate graph-source, enforce scope, or configure CI.

The Scope/CI Enforcement Policy boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-scope-ci-enforcement-policy-boundary.runtime-evidence-only.preview.json`.
It anchors the `graph read-model report-scope-ci-enforcement-readiness ...` command. The first calibration enforcement
readiness artifact is blocked because Equivalence Proof readiness is blocked:
`examples/valid/todo-app-pbe-run/generated/devview-scope-ci-enforcement-readiness.blocked-defer-decision.runtime-evidence-only.preview.json`.
The command reports disabled readiness only. It does not enforce scope, enable CI enforcement, configure required
checks, change branch protection, reject diffs, activate strict/guided blocking, prove equivalence, accept Evidence,
satisfy runtime Evidence, apply graph deltas, or mutate graph-source.

The Graph-source Mutation Policy boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-graph-source-mutation-policy-boundary.runtime-evidence-only.preview.json`.
It now anchors the `graph read-model report-graph-source-mutation-readiness ...` command. The first calibration mutation
readiness artifact is blocked because apply readiness is blocked:
`examples/valid/todo-app-pbe-run/generated/devview-graph-source-mutation-readiness.blocked-defer-decision.runtime-evidence-only.preview.json`.
The command reports readiness only. It does not allow graph-source writes, apply graph deltas, accept Evidence, satisfy
runtime Evidence, prove equivalence, enforce scope, mutate production source, mutate hook/config files, or configure CI.

The roadmap completion audit preview is recorded in
`examples/valid/todo-app-pbe-run/generated/devview-roadmap-completion-audit.runtime-evidence-only.preview.json`. It
summarizes Phase 1 through Phase 13 evidence, implemented command surfaces, and explicitly future/non-implemented safety
boundaries after the controlled decision/readiness chain through disabled Scope/CI enforcement readiness. It is an audit
summary only and does not add execution, approval automation, apply, Evidence acceptance, graph-source mutation,
equivalence proof, scope enforcement, CI authority, required checks, branch protection, or diff rejection.

The roadmap final handoff preview is recorded in
`examples/valid/todo-app-pbe-run/generated/devview-roadmap-final-handoff.runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/devview-roadmap-final-handoff.runtime-evidence-only.preview.md`. It states the
safe MVP end state for this calibration: compiler frontend, analyzer/clarification candidate-only surfaces, activation
previews, advisory backend/review surfaces, and Phase 13 readiness boundaries are connected, while product-general
fixture coverage, hook install/trust, real LLM analyzer execution, graph apply/mutation, Evidence acceptance,
equivalence proof, and enforcement remain future work. It is a handoff summary only and creates no new authority.

The DevView core baseline freeze report is generated by
`graph read-model report-devview-baseline --roadmap-audit <roadmapAudit> --final-handoff <finalHandoff> --json`. The
Todo App calibration outputs are
`examples/valid/todo-app-pbe-run/generated/devview-core-baseline-freeze.runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/devview-core-baseline-freeze.runtime-evidence-only.preview.md`. The report
freezes completed, advisory, blocked, and future-only classifications for reviewers and workers. Missing optional
chain/readiness artifacts produce warnings rather than traversal, apply, approval, Evidence, equivalence, enforcement,
or Project Memory extension authority.

The DevView Codex Hook Gateway boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json` and
documented in [devview-codex-hook-gateway-boundary.md](devview-codex-hook-gateway-boundary.md). It defines how future
Codex lifecycle hooks may route DevView ON sessions through preflight, contract, post-check, proposal-only preview, and
Human Review Packet expectations. It does not implement hook scripts, add blocking behavior, call an LLM from hooks,
mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, enforce CI, or enable strict mode.

The Hook Gateway health/readiness boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-hook-gateway-health-boundary.runtime-evidence-only.preview.json`. It
defines what a future deterministic health check should inspect before treating hooks as active: mode, strict-disabled
status, hook config/script detection, trust state, observed events, bypass readiness, and frontend artifact
availability. It does not install hooks, trust commands, block Codex execution, enable guided/strict enforcement, mutate
graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, or enforce scope/CI.

The report-only Hook Gateway health command is now exposed as
`graph read-model report-hook-gateway-health --boundary <healthBoundaryPath> --json`. It reads the boundary preview and
summarizes readiness without implementing hook scripts, changing trust/config, blocking Codex execution, enabling
guided/strict behavior, mutating graph-source, applying graph deltas, approving work, satisfying runtime Evidence,
proving equivalence, or enforcing scope/CI.

The advisory `UserPromptSubmit` additionalContext preview command is exposed as
`graph read-model prepare-user-prompt-context --frontend-chain <frontendChainReport> --hook-health <healthReportOrBoundary> --instruction-pack <instructionPackJson> --instruction-markdown <instructionPackMarkdown> --json`.
It wraps the current frontend chain, Hook Gateway health state, and Instruction Pack into compact context for future
hook injection while still not installing hooks, blocking Codex, approving work, satisfying Evidence, proving
equivalence, or enforcing scope/CI.

The Hook Gateway install/trust decision boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-hook-install-trust-boundary.runtime-evidence-only.preview.json`. It
defines future repo-local hook config/script scope candidates, explicit user/repo trust prerequisites, and forbidden
global config/hidden install/auto-trust/CI mutations. It is preview-only and does not install hooks or mutate trust.

The Hook Gateway script scaffold preview command is exposed as
`graph read-model generate-hook-script-scaffold --boundary <gatewayBoundary> --hook-health <healthBoundary> --install-trust <installTrustBoundary> --user-prompt-context <contextPreview> --json`.
It produces preview-only `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop` template records
without writing active hook scripts, mutating trust/config, blocking Codex, approving work, satisfying Evidence, proving
equivalence, or enforcing scope/CI.

The Hook Gateway script template preview command is exposed as
`graph read-model generate-hook-script-templates --scaffold <hookScriptScaffold> --json`. It materializes review-only
PowerShell body previews from the scaffold without writing `.codex/hooks` files, installing hooks, activating hooks,
blocking Codex, approving work, satisfying Evidence, proving equivalence, or enforcing scope/CI.

The Hook Gateway session manifest preview command is exposed as
`graph read-model generate-hook-session-manifest --hook-health <healthReportOrBoundary> --user-prompt-context <contextPreview> --script-scaffold <scaffoldPreview> --script-templates <templatePreview> --json`.
It bundles the health/context/script previews into a not-started session manifest without starting a session, installing
or activating hooks, mutating trust/config, blocking Codex, approving work, satisfying Evidence, proving equivalence, or
enforcing scope/CI.

The Hook Gateway script bundle materializer is exposed as
`graph read-model materialize-hook-script-bundle --script-templates <templatePreview> --session-manifest <sessionManifestPreview> --bundle-dir <dir> --json`.
It writes repo-local advisory `.ps1` preview scripts under a dedicated bundle directory such as `.tmp/...` while still
rejecting `.codex/hooks`, source artifacts, generated authority artifacts, and unsafe output targets. It does not
install hooks, start a session, mutate trust/config, block Codex, approve work, accept or satisfy Evidence, prove
equivalence, or enforce scope/CI.

The Hook Gateway activation preview chain report is exposed as
`graph read-model report-hook-activation-chain --hook-health <healthReportOrBoundary> --user-prompt-context <contextPreview> --script-scaffold <scaffoldPreview> --script-templates <templatePreview> --session-manifest <sessionManifestPreview> --json`.
It checks preview artifact continuity and hook event readiness without installing or activating hooks, mutating
trust/config, blocking Codex, approving work, satisfying Evidence, proving equivalence, or enforcing scope/CI.

The runtime smoke lane boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/devview-runtime-smoke-lane-boundary.runtime-evidence-only.preview.json`. It
keeps the all-steps smoke as an advisory snapshot while reporting lane totals for analyzer preflight, core critical
request-to-pack frontend work, hook activation readiness, and advisory backend/post-check/reporting work. Lane budgets
are not enforced and no CI behavior changes.

The Natural Language Request Intake compiler frontend boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json`
and documented in [natural-language-request-intake-boundary.md](natural-language-request-intake-boundary.md). It defines
how a human request may become an AI Request IR candidate and then require deterministic validation before graph
traversal, selected node/edge slice generation, contract compiler input generation, or instruction pack generation. AI
output remains candidate-only and cannot become source authority without validation.

The AI Request Analyzer boundary preview is recorded in
`examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json`. It
defines the future analyzer as a candidate-only producer of Request IR Candidate JSON from raw natural language plus
optional repo/session context. It does not implement an analyzer, call an LLM/API, generate a candidate, drive traversal,
generate contract input or instruction packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve
work, satisfy runtime Evidence, prove equivalence, or enforce scope.

The deterministic analyzer prompt/input contract pack is generated by
`graph read-model generate-ai-request-analyzer-pack --boundary <analyzerBoundaryPath> --schema <requestIrCandidateSchemaPath> --json`.
Its Todo App calibration outputs are
`examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.md`. The pack
is future analyzer guidance only; it does not call an LLM/API or generate a Request IR Candidate.

The analyzer command surface is exposed by
`graph read-model analyze-request --request <text> --pack <aiRequestAnalyzerPackPath> --json`, but provider execution is
disabled. Without an explicit `--external-candidate`, it reports `provider-disabled` and generates no candidate. With an
external candidate, it imports only candidate-only Request IR JSON and still requires deterministic validation before
traversal.

The clarification interview boundary and question-plan pack cover the alternate branch for ambiguous candidates. The
pack is generated by
`graph read-model generate-clarification-interview-pack --boundary <clarificationBoundaryPath> --candidate <candidatePath> --json`.
Its Todo App calibration outputs are
`examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.md`. The
pack is a question-plan preview only; it does not implement an interview UI, call an LLM/API, revise Request IR, run
validation, run traversal, generate selected slices, generate compiler input, generate instruction packs, or execute
Codex.

Clarification answers can produce a revised Request IR Candidate preview through
`graph read-model revise-request-ir-candidate --clarification-pack <packPath> --answers <answersPath> --output <revisedCandidatePath> --json`.
The current no-op calibration answer and revised candidate artifacts are
`examples/valid/todo-app-pbe-run/generated/clarification-answers.add-todo-runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/request-ir-candidate.revised.add-todo-runtime-evidence-only.preview.json`.
The revised candidate is still candidate-only and must rerun deterministic validation before graph-aware validation or
traversal.

The Request IR Candidate schema and first calibration fixture are recorded in
`examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json`. They
define the future AI analyzer output shape and the first Todo App runtime-Evidence-only candidate, but they are not
validated Request IR, graph traversal input, contract compiler input, or instruction packs.

The first schema-only Request IR Candidate validator is now exposed through
`graph read-model validate-request-ir --candidate <candidatePath> --json`. Its Todo App calibration result is
`examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json`. The
validator checks required fields, enum values, candidate-only boundaries, confidence, and ambiguity policy only. It does
not inspect graph-source, validate node/edge existence, run graph traversal, generate contract input, generate
instruction packs, or call an LLM.

The graph-aware validation boundary is previewed in
`examples/valid/todo-app-pbe-run/generated/request-ir-graph-aware-validation-boundary.runtime-evidence-only.preview.json`.
The first non-traversing graph-aware validator is exposed through
`graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json`.
Its Todo App calibration result is
`examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json`.
It resolves `CH-001`, `Todo App`, `runtime-evidence-only`, and `test-only-behavior-proof` against graph/read-model
authority after schema-only validation. It is not graph traversal, not selected graph slice generation, not contract
compiler input generation, and not instruction pack generation.

The Graph Traversal Plan and Selected Graph Slice boundaries are previewed in
`examples/valid/todo-app-pbe-run/generated/graph-traversal-plan-boundary.add-todo-runtime-evidence-only.preview.json`
and
`examples/valid/todo-app-pbe-run/generated/selected-graph-slice-boundary.add-todo-runtime-evidence-only.preview.json`.
The first deterministic traversal plan generator is exposed through
`graph read-model plan-traversal --graph-validation <graphAwareValidationPath> --json`. Its Todo App calibration output
is `examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json`.
It generates a plan only; it does not select nodes or edges as final scope, generate contract input, generate
instruction packs, mutate graph-source, apply graph deltas, approve work, or enforce scope.

The first deterministic selected graph slice generator is exposed through
`graph read-model select-slice --traversal-plan <planPath> --json`. Its Todo App calibration output is
`examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json`. It selects
the bounded direct graph-source/read-model slice for `CH-001` and records a trace. The selected slice itself is still
not contract compiler input and not an instruction pack.

The first selected-slice-to-contract-input generator is exposed through
`graph read-model generate-contract-input --selected-slice <selectedSlicePath> --json`. Its Todo App calibration output
is `examples/valid/todo-app-pbe-run/generated/contract-compiler-input.add-todo-runtime-evidence-only.preview.json`. It
maps selected nodes and edges into existing compiler input model groups. For the runtime-Evidence-only calibration,
`targetScopeCandidates` may include broad selected context, while `allowedScope` is narrowed to selected
check/evidence/report artifacts and does not authorize change-tree or work-tree edits. The artifact reports frontend
field-group compatibility only; backend dry-run validation is not run. It does not generate instruction packs, trigger
Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, or
enforce scope.

The first Contract-Input-to-Instruction-Pack frontend generator is exposed through
`graph read-model generate-instruction-pack --contract-input <contractInputPath> --json`. Its Todo App calibration
outputs are `examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json` and
`examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.md`. The generated
pack preserves the narrowed allowed scope and forbidden production/graph/approval boundaries, but it does not trigger
Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, or
enforce scope.

The first DevViewGraph HTML inspector boundary is recorded in
`examples/valid/todo-app-pbe-run/generated/devview-graph-html-boundary.runtime-evidence-only.preview.json`. The
implemented command is:

```text
graph read-model render-devview-graph --graph-source <graphSource> --record <recordId> --instruction-pack <pack> --project-memory <memory> --output <html> --data-output <json> --json
```

The WindowsUtility retrofit demo output is tracked at `outputs/devview-graph/windowsutility.devviewgraph.html` and
`outputs/devview-graph/windowsutility.devviewgraph.data.json`. DevViewGraph renders one full portfolio graph with the
`deterministic-network-orbit` layout, highlights the selected CardPrinterConfig Instruction Pack subgraph and viewpoint
trees in-place, and keeps only the current request, needed viewpoint buttons, and inspect actions visible before any
click. Mouse wheel and buttons use semantic zoom: graph distances change, but node boxes, labels, and edge strokes keep
stable screen size.
The center workspace now includes a linked-list style Current Work Flow stepper (`1 Request -> 2 Domain Tree -> 3
Change Tree -> 4 Risk Tree -> 5 SubGraph -> 6 Pack`) so a reviewer can replay how one request narrows the graph before
it becomes the final Instruction Pack preview. Node, edge, tree, subgraph, and workflow-step clicks update both the
inspector and the graph selection banner. Detailed Project Memory, SubGraph, Instruction Source, node, edge, and tree
data is deferred to the right click inspector. Trees are not rendered as separate tree layouts; they are compact
clickable graph viewpoints whose node/edge chip lists appear only after click. The top history controls
`<`, `>`, and the numeric index input navigate only graph-source retrofit records, so older recorded work can be
inspected without implying git-history scraping or scope expansion. It is visualization/report-only: no Codex execution,
graph-source mutation, graph delta apply, approval, runtime Evidence satisfaction, equivalence proof, scope enforcement,
or CI enforcement is introduced.

The DevView Project Memory boundary is recorded in
`examples/valid/todo-app-pbe-run/generated/devview-project-memory-boundary.runtime-evidence-only.preview.json`.
It defines the persistent project profile layer that stores project identity, DevView mode, project direction,
preservation policy, improvement policy, source authority policy, taxonomy profile refs, view tree profile refs, and
revision policy before project-specific vocabulary can become reviewable extension authority. The companion previews
are:

```text
examples/valid/todo-app-pbe-run/generated/devview-project-profile-schema-boundary.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-taxonomy-profile-extension-boundary.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-project-direction-change-boundary.runtime-evidence-only.preview.json
examples/retrofit/windowsutility/devview-project-memory.preview.json
```

The WindowsUtility Project Memory preview classifies the portfolio as `devviewMode: retrofit` with
`projectDirection.current: legacy-preserving-retrofit`. It keeps the whole WindowsUtility / Utility_Windows portfolio as
observed inventory and CardPrinterConfig as the current detailed retrofit slice. Project Memory connects to extension
decisions through `Project Memory -> Taxonomy Profile -> Extension Proposal -> Human Review`; unapproved extension kinds
are not traversal authority, contract authority, instruction-pack authority, or source mutation authority.

The first Project Memory diagnostics are exposed through
`graph read-model report-project-memory-extension-gaps --project-memory <memory> --graph-source <graphSource> --json`
and `graph read-model report-project-memory-impact --project-memory <memory> --direction-change <candidate> --json`.
The WindowsUtility calibration reports are
`examples/retrofit/windowsutility/project-memory-extension-gaps.preview.json` and
`examples/retrofit/windowsutility/project-memory-impact.behavior-preserving-refactor.preview.json`. These reports remain
read-only and do not approve extensions, apply Project Memory revisions, change traversal, generate contracts, or
mutate graph-source. DevViewGraph may display Project Memory through optional `--project-memory`, but this is
visualization context only.

The traversal boundary separates graph vocabulary from planner semantics: `*NodeTypes` and `*EdgeTypes` contain only
actual graph taxonomy values, while target/scope/evidence/output meanings are represented as roles and selection
intents.

The following readiness artifact is complete at documentation level:

- [representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md)

This artifact selects the recommended representative slice and demo Evidence review criteria before actual runtime
feasibility demo execution. It does not execute the demo, create fixtures, define generated output, or promote
Maintainability Graph.

The following manual demo result is recorded:

- [actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md)

The actual result reviews `Todo Search Adoption + Product Meaning Feedback` against observable docs, selected-slice
demo-support artifacts, supplemental compatibility evidence, a bounded runtime fixture, and user-renewed Acceptance. Its
final feasibility judgment is now `demonstrated` for the representative demo slice with retained warnings. Generated
graph output, full-product/runtime scope judgment, and public-doc cleanup judgment remain visible before any positive
promotion approval.

The following readiness review is recorded:

- [graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md)

The readiness review now records the history and current status separately. Under the earlier baseline it treated the
limited pilot decision surface as reviewable with warnings. After the Graph-first Node/Edge/Tag refinement, the Todo
Search read-model parity artifact was refreshed with `nodeKind`, `edgeType`, `viewScopedTags`, confidence/freshness
separation, and 7 Core View coverage. The current recommendation is `ready for renewed limited pilot user decision with
warnings`; promotion state remains `Decision required`. The review does not approve Graph-source promotion or change
source authority.

The following decision package records the user-facing judgment surface:

- [limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md)

The package was refreshed for the Node/Edge/Tag baseline and the user selected `Approve limited pilot promotion
decision` for the bounded Todo Search scope. The approval does not approve full Graph-source promotion, broad source
authority change, public doc cleanup, generated builder implementation, or tree-native artifact retirement.

The following bounded transition record is now recorded:

- [limited-pilot-transition-record.md](limited-pilot-transition-record.md)

The record limits the approval to `examples/adoption/todo-search-slice`, keeps
`examples/adoption/compatibility-mismatch-slice` as supplemental Evidence only, carries retained warnings, and preserves
tree-native selected-slice artifacts as current operational source.

The following execution plan is prepared for the next user mode decision:

- [scoped-limited-pilot-transition-execution-plan.md](scoped-limited-pilot-transition-execution-plan.md)

The plan recommends a dry-run / review-only scoped pilot first. It separates dry-run review from any scoped
source-authority pilot and from full Graph-source promotion. The user selected the dry-run / review-only option on
2026-06-25.

The following dry-run observation is recorded:

- [dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md)

The observation result is `usable-with-warnings`. It shows that the manual Maintainability Graph read-model, View
Instance Manifest, 7 Core Views, Approval Brief, Check/Evidence records, and Control Node summary are usable for
review-only workflow observation. It does not execute scoped source-authority transition, does not approve full
Graph-source promotion, and does not change current operational source. The next step remains a user decision about
whether to prepare scoped source-authority pilot execution, require generated builder output, require public-doc cleanup,
strengthen evidence, defer, or reject the scoped pilot.

The following scoped source-authority pilot preparation package is recorded:

- [scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md)

The user approved preparation only. The package keeps actual scoped source-authority execution unapproved, recommends
generated builder / CLI-backed read-model output before authority-bearing execution, and preserves tree-native
selected-slice artifacts as current operational source.

The following generated read-model Evidence requirement is recorded:

- [generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md)

The user selected generated builder / CLI-backed read-model Evidence as a prerequisite before actual scoped
source-authority pilot execution. This is a requirement decision only. It does not approve builder implementation, CLI
implementation, generated output, source authority change, or Graph-source promotion.

The following CLI-backed read-model Evidence output design is recorded:

- [cli-backed-read-model-evidence-output-design.md](cli-backed-read-model-evidence-output-design.md)

The user selected design-first work. The design defines conceptual command surfaces, output artifacts, comparison
reports, mismatch categories, status labels, and gate relationships. It does not implement a CLI, builder, parser,
validator, CI workflow, generated output, source authority change, or Graph-source promotion.

The bounded generated read-model Evidence builder is now implemented for the Todo Search selected slice only:

- command: `pbe graph read-model generate --slice examples/adoption/todo-search-slice`
- command: `pbe graph read-model compare --generated <file> --manual <file>`
- output directory: `examples/adoption/todo-search-slice/generated/`

The generated output is Evidence only. The first generated/manual comparison warnings were reviewed in
`examples/adoption/todo-search-slice/generated/parity-warning-resolution.md`; the current parity report is
`comparison-pass` with zero blocking or decision-required mismatches. This still does not approve scoped source-authority
execution, change source authority, retire tree-native artifacts, enforce validator/CI gates, clean up public docs, or
promote Maintainability Graph.

The user then approved actual scoped source-authority pilot execution for the Todo Search selected slice only. The
execution record is:

- [scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md)

The scoped pilot status is `scoped-pilot-executed-with-fallback-ready`. The generated read-model Evidence is accepted as
the bounded Graph-first interpretation record for Todo Search Node/Edge/Tag review and 7 Core View traversal only.
Tree-native selected-slice artifacts remain fallback/reference and are not retired. This record is not full
Graph-source promotion, repository-wide source authority change, public-doc cleanup, or validator/CI enforcement.

The scoped pilot review is:

- [scoped-source-authority-pilot-review.md](scoped-source-authority-pilot-review.md)

The review outcome is `scoped-pilot-review-pass-with-retained-warnings`. The pilot remains safe to keep active inside
the Todo Search selected slice because parity stays `comparison-pass`, fallback/reference artifacts remain usable,
retained warnings remain visible, and user acceptance authority remains user-controlled. Broader use still requires a
separate decision surface.

The active observation plan is:

- [scoped-source-authority-pilot-active-observation.md](scoped-source-authority-pilot-active-observation.md)

The active observation status is `keep-active-with-retained-warnings`. It keeps the scoped pilot bounded to Todo Search
and defines re-review, fallback/defer, validator/CI, public-doc cleanup, and broader promotion-review triggers without
performing any of those next-phase actions.

The validator/CI-backed Evidence design is:

- [validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md)

This design separates CLI command success, validator-backed Evidence, and CI-backed Evidence. It defines future checks,
report artifacts, status labels, and scope levels for broader execution/enforcement review.

The bounded scoped validator-backed Evidence command is now implemented for the Todo Search selected slice only:

- command: `pbe graph read-model validate --slice examples/adoption/todo-search-slice`
- output:
  `examples/adoption/todo-search-slice/generated/read-model-validation-report.json`
- output:
  `examples/adoption/todo-search-slice/generated/read-model-validation-report.md`
- current status: `validation-pass`
- evidence level: `validator-backed`

This validator-backed Evidence is local and scoped. It does not add CI enforcement, expand pilot scope, approve broader
execution, change source authority, retire tree-native artifacts, or approve full Graph-source promotion.

The CI-backed read-model Evidence workflow design is now recorded:

- [ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md)

This design defines manual dispatch, informational PR, future enforcement, post-merge, and scheduled CI modes; proposed
commands; report artifacts; status semantics; waiver boundaries; and scope strategy. The design/implementation path does
not introduce CI enforcement, change source authority, expand pilot scope, or approve full Graph-source promotion.

The non-enforcing manual CI workflow is now implemented:

- workflow: `.github/workflows/read-model-evidence.yml`
- workflow name: `PBE Read-Model Evidence`
- trigger: `workflow_dispatch`
- scope: Todo Search read-model Evidence, Todo App PBE Run structure-only Evidence, and the cross-slice aggregate
  summary

The workflow can create a CI-backed Evidence artifact bundle and GitHub step summary when manually run. It now runs the
Todo Search generate/compare/validate sequence, the Todo App PBE Run structure-only generate/validate sequence, and the
aggregate summarize command over existing per-slice validation reports. It is not a required check, does not run on
PR/push by default, does not introduce branch protection, and does not change source authority.

The first CI run review is recorded:

- [ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md)

Run `28151296796` completed successfully on `workflow_dispatch` for `main` as the first Todo Search-only CI-backed
Evidence review. Run `28156403793` later reviewed the aggregate-enabled workflow bundle, including Todo Search, Todo App
PBE Run, and the aggregate summary. Its CI manifest records `ci-backed` / `ci-evidence-pass`, Todo Search
`validation-pass` and `comparison-pass`, Todo App PBE Run `validation-pass`, aggregate `aggregate-pass`, and retained
warning visibility. The workflow then moved to Node 24 action/runtime settings, and post-update run `28157938343`
reviewed the same aggregate-enabled bundle successfully without the prior Node.js 20 deprecation annotation. This
remains non-enforcing Evidence only and does not change source authority.

The multi-slice validation design is recorded:

- [multi-slice-read-model-validation-design.md](multi-slice-read-model-validation-design.md)

This design selects `examples/valid/todo-app-pbe-run` as the next structural validation candidate, records Todo
Search hardcoding risks, proposes a future `SliceReadModelConfig` / profile strategy, and defines Evidence-only
aggregation rules. It does not implement multi-slice validation, change CI workflows, expand source authority, or approve
full Graph-source promotion.

The first implementation step after that design is complete for Todo Search only: `cli/src/core/read-model-evidence.ts`
now exposes an explicit Todo Search `SliceReadModelConfig` profile. Generated output, parity, validation, and CI workflow
semantics remain bounded to `examples/adoption/todo-search-slice`; no second slice, aggregate validation, CI enforcement,
source authority expansion, or full promotion is implemented.

The second profile/fixture is now implemented at structure-only level:

- slice: `examples/valid/todo-app-pbe-run`
- profile: `todo-app-pbe-run-structure-only`
- command: `pbe graph read-model generate --slice examples/valid/todo-app-pbe-run`
- command: `pbe graph read-model validate --slice examples/valid/todo-app-pbe-run`
- generated output: 22 nodes / 38 edges
- validation status: `validation-pass` with 16 checks

This second fixture reads the canonical `.pbe` layout and creates reviewable structure-only Evidence. It is not
parity-backed, pilot-marker-backed, CI-backed, source-authority bearing, or a scoped pilot. Todo Search remains the only
active scoped source-authority pilot. The manual workflow now has a reviewed aggregate-enabled run that includes Todo
App structure-only Evidence, but that does not promote the fixture beyond structure-only. Local `validate --all` is
implemented as non-enforcing Evidence; CI enforcement, public-doc cleanup, and full Graph-source promotion remain
unimplemented.

The per-slice validation report independence contract is now implemented for both generated slices. Each validation
report carries self-contained profile, source layout, policy level, expected counts, parity requirement, pilot marker
requirement, runtime fixture requirement, retained-warning, fallback/reference, source-authority, and non-promotion
metadata. This prepared future aggregation inputs and now supports the implemented aggregate summary and local
`validate --all` path.

The first aggregate read-model Evidence summary contract is now implemented:

- [read-model-aggregate-summary-contract.md](read-model-aggregate-summary-contract.md)
- command:
  `pbe graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run`
- output:
  `examples/read-model-aggregate/generated/read-model-aggregate-summary.json`
- output:
  `examples/read-model-aggregate/generated/read-model-aggregate-summary.md`
- current status: `aggregate-pass`

The aggregate command reads existing per-slice validation reports only. It does not run generation, comparison,
validation, `validate --all`, CI enforcement, source authority expansion, public-doc cleanup, or full Graph-source
promotion.

The non-enforcing manual CI workflow now runs this aggregate command after generating and validating both included
slices. Run `28156403793` reviewed the aggregate-enabled artifact bundle as CI-backed Evidence, and post-update run
`28157938343` reviewed the same aggregate-enabled workflow after the Node 24 CI hygiene update. It remains
manual-dispatch, non-enforcing Evidence only.

The PR informational read-model Evidence design is now recorded:

- [pr-informational-read-model-evidence-design.md](pr-informational-read-model-evidence-design.md)

The workflow now implements `workflow_dispatch` and a non-enforcing `pull_request` informational trigger with path
filters. The PR mode records `pull_request-informational` trigger metadata, PR head/base fields, artifact/manifest
fields, GitHub Step Summary wording, and conservative failure semantics. Required checks, branch protection, CI
enforcement, source authority expansion, public-doc cleanup, and full Graph-source promotion remain unimplemented in the
workflow. PR #1 triggered run `28207822252`, and PR #2 triggered run `28210904900` after the workflow switched to local
`validate --all`; both are reviewed as `pull_request-informational` / `ci-evidence-pass`. Both temporary PRs were closed
without merge and their remote branches were deleted.

The PR informational observation policy is now recorded:

- [pr-informational-observation-policy.md](pr-informational-observation-policy.md)

The policy defines what to observe across future PR informational runs, the recommended observation window, path-filter
refinement criteria, failure classification, and escalation criteria. It does not change workflow triggers, create PRs,
dispatch GitHub Actions, add required checks, introduce enforcement, expand source authority, or approve promotion.

The append-only observation log and review runbook is now recorded:

- [pr-informational-observation-log.md](pr-informational-observation-log.md)

The log records the manual baseline run `28207696557`, first PR informational run `28207822252` / PR `#1`, validate-all
PR informational run `28210904900` / PR `#2`, third PR informational observation run `28213236499` / PR `#3`,
projection-status PR run `28218854329` / PR `#4`, a reusable future-entry template, review checklist, observation
counters, and decision thresholds. The three-real-PR run-count threshold is already satisfied, so path-filter or
failure-semantics refinement can be considered as a separate decision surface. The log is a recording surface only; it
does not change workflow triggers, dispatch Actions, add enforcement, expand source authority, or approve promotion.

The PR informational path-filter and failure-semantics refinement surface is now recorded:

- [pr-informational-path-filter-refinement.md](pr-informational-path-filter-refinement.md)

The refinement design reviews PR #1, PR #2, and PR #3, records that all three were `ci-evidence-pass` without blocker or
confirmed noise, and recommends keeping the current broad informational filters and current failure semantics unchanged
for now. Actual workflow path-filter changes, failure-semantics changes, invalid-fixture CI, required checks,
enforcement, source authority expansion, and promotion remain separate decisions.

The broader Graph-source promotion review input package is now recorded:

- [broader-graph-source-promotion-review-inputs.md](broader-graph-source-promotion-review-inputs.md)

The package inventories the matured scoped pilot, generated/parity/validation reports, registry-backed `validate --all`,
manual and PR CI-backed Evidence, local negative fixture coverage, and path-filter/failure-semantics policy. Its
recommended status is `promotion-review-inputs-ready-with-caveats`; it is not promotion approval, source authority
expansion, enforcement approval, public-doc cleanup, tree-native retirement, or user acceptance.

The source-authority expansion design package is now recorded:

- [source-authority-expansion-design-package.md](source-authority-expansion-design-package.md)

The package defines the authority matrix, artifact roles, staged expansion path, and caveats used for the limited
promotion branch and for any later broader Graph-source promotion review. It does not approve repo-wide promotion,
retire artifacts, add enforcement, or replace user acceptance.

The source-authority rollback/fallback plan is now recorded:

- [source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md)

The plan defines fallback precedence, rollback triggers, trigger-specific actions, snapshot/reference requirements, and
compatibility-retirement guardrails for the authority matrix. It is active for the limited Todo Search promotion, but it
does not execute rollback, approve repo-wide promotion, or retire artifacts.

The broader Graph-source promotion decision package is now recorded:

- [broader-graph-source-promotion-decision-package.md](broader-graph-source-promotion-decision-package.md)

The package collects the matured Evidence stack, public-doc cleanup status, candidate authority matrix, and
rollback/fallback plan into a single user decision surface. Its readiness label is
`promotion-decision-package-ready / preparation-complete-with-user-decision-required`. It was used for the limited
promotion branch; by itself it still does not approve repo-wide promotion, tree-native retirement, enforcement, or user
acceptance replacement.

The broader limited Graph-source promotion execution record is now recorded:

- [broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md)

The record executes the limited promotion branch for the Todo Search selected-slice authority surface. Maintainability
Graph is now the source model for that bounded scope, while tree-native selected-slice artifacts remain maintained
compatibility / fallback / reference artifacts. Repo-wide promotion, tree-native retirement, CI enforcement, invalid
fixture CI inclusion, and Todo App promotion beyond `structure-only` remain out of scope.

The post-promotion observation runbook is now recorded:

- [post-promotion-observation-runbook.md](post-promotion-observation-runbook.md)

The runbook defines health criteria, observation log fields, escalation triggers, and the initial observation window for
the executed limited Todo Search Graph-source promoted scope.

The next implementation branch decision surface is now recorded:

- [graph-source-artifact-storage-projection-design.md](graph-source-artifact-storage-projection-design.md)

It records the first Graph source artifact/storage step for the promoted Todo Search scope:
`examples/adoption/todo-search-slice/graph-source.json`, parser/projection tests, and the minimal
`graph read-model project` CLI projection path. Todo Search `graph read-model generate --slice` now uses that bounded
graph source for generated nodes, edges, and Core View coverage while preserving 40/59/7 shape, parity, validation,
fallback boundaries, and generated Evidence role. It does not change workflow behavior, validate-all registry behavior,
fallback artifacts, Todo App structure-only status, or source authority beyond the limited Todo Search promoted scope.
Manual CI run `28219396764` and PR #5 run `28219583619` reviewed this graph-source-backed generation path as
`ci-evidence-pass`.

The next bounded expansion surface is now confirmed for Todo App PBE Run:
`examples/valid/todo-app-pbe-run/graph-source.json`. It is a non-generated structure-only graph-source artifact that
mirrors the current 22-node / 38-edge / 7-Core-View Todo App read-model records. Focused tests parse it and reject
promotion or broader-authority claims. The same explicit projection command now writes
`examples/valid/todo-app-pbe-run/generated/graph-source-read-model-projection.json` with the same 22/38/7 shape and
structure-only boundaries. It is consumed by local positive `validate --all` as a confirmed structure-only
projection-contract check, and does not promote Todo App beyond `structure-only`.
The local `graph read-model observe-candidates` command now reports this candidate projection contract separately from
positive validate-all semantics. The non-enforcing read-model Evidence workflow now captures that observation output as
separate CI artifact metadata without enrolling the Todo App candidate in positive validate-all, source authority, or
promotion scope. Manual CI run `28221088498` and PR #6 run `28221326457` reviewed that capture path as
`ci-evidence-pass`, including `candidateObservationStatus: candidate-observation-pass`, Todo App
`candidate-projection-contract-pass`, the uploaded candidate observation output, and the uploaded candidate projection
artifact.

The Todo App graph-source enrollment decision package is now recorded:

- [todo-app-graph-source-enrollment-decision-package.md](todo-app-graph-source-enrollment-decision-package.md)

It compares keeping Todo App candidate-only, bounded enrollment in positive validate-all, later promotion beyond
structure-only, and deferral. The bounded enrollment is now implemented locally and confirmed as graph-source-backed:
Todo App positive validate-all reports `projection-contract-pass` while preserving `structure-only` and no promotion
beyond that profile. Manual and PR CI review of this confirmed label remains next.

The main README now includes a short current-state note for the mixed Graph-source transition: Todo Search selected scope
is limited promoted and graph-source-backed, Todo App PBE Run is confirmed graph-source-backed for its `structure-only`
slice, tree-native artifacts remain fallback/reference/compatibility where applicable, and repo-wide promotion, tree
retirement, enforcement, and required checks are still incomplete.

The repo-wide transition mechanics status is now recorded:

- [repo-wide-graph-source-transition-mechanics.md](repo-wide-graph-source-transition-mechanics.md)

`examples/read-model-aggregate/graph-source-transition-status.json` records Graph-source as the confirmed direction for
the configured read-model slices: Todo Search is limited graph-source-promoted, Todo App is confirmed graph-source-backed
for `structure-only`, and tree-native artifacts remain compatibility/fallback/reference. The local E2E smoke now checks
that status artifact while preserving no tree retirement, no enforcement, no required checks, no invalid-fixture CI, and
no Todo App promotion beyond `structure-only`.

The current health/status entry points are:

- `graph read-model report-health --json` for a local non-enforcing health summary.
- `npm run test:read-model:e2e` for local dogfood coverage of validate-all, projection contracts, transition status, and
  edgeIntent `report-intent`.
- `examples/read-model-aggregate/graph-source-transition-status.json` for machine-readable source role and retirement
  readiness status.
- [tree-native-retirement-approval-package.md](tree-native-retirement-approval-package.md) for retirement approval
  candidates and missing approvals.
- [edge-level-intent-vocabulary-design.md](edge-level-intent-vocabulary-design.md) and
  [intent-critical-maintenance-examples.md](intent-critical-maintenance-examples.md) for edgeIntent projection/report
  details.

Manual and PR CI observations now show validate-all, E2E smoke, health reporting, and edgeIntent visibility passing.
The workflow remains non-enforcing; no required check, branch protection, or tree-native retirement is configured.

The intent-critical maintenance examples are now recorded:

- [intent-critical-maintenance-examples.md](intent-critical-maintenance-examples.md)
- [edge-level-intent-vocabulary-design.md](edge-level-intent-vocabulary-design.md)

`examples/intent-critical/native-pbe-maintenance` and `examples/intent-critical/retrofit-pbe-maintenance` show why
Graph-source records must preserve development-time intent, not just generated shape. Focused tests check UX/non-goal,
fallback, evidence, compatibility, and user-approval intent fields so AI-assisted maintenance cannot silently erase
critical context. The edge-level design keeps Graph-source as the single source direction: concrete intent is preserved
as short project-specific edge `claim` text, while vocabulary/table values stay limited to repeatable classifications
such as type, intent kind, risk kind, signal kind, confidence, enforcement, source role, and lifecycle status.
The first native/retrofit fixture projections now expose that edgeIntent in
`generated/edge-intent-read-model-projection.json` without integrating it into broad validate-all semantics. The
projection can be regenerated through `graph read-model project-intent --graph-source <path> --output <path> --json`.
The read-model Evidence workflow observes the same native/retrofit projection command as report-only CI metadata through
`edgeIntentProjectionObservationStatus`.

Manual workflow run `28222731063` reviewed the Todo App bounded non-authority positive validate-all projection status:
Todo App reports `candidate-projection-contract-pass`, Todo Search remains `projection-contract-pass`, aggregate remains
`aggregate-pass`, and candidate observation stays separate.
PR #7 run `28223010185` reviewed the same fields in `pull_request-informational` mode, then the temporary PR was closed
without merge and the smoke branch was deleted.

Todo App PBE Run generation is now confirmed graph-source-backed for the structure-only profile: `graph read-model
generate --slice examples/valid/todo-app-pbe-run` reads `graph-source.json` and emits `readModelSourceMode:
graph-source-backed` with `graphSourceAuthorityStatus: confirmed-structure-only-graph-source`. This remains bounded to
structure-only and does not add parity, pilot-marker backing, enforcement, or tree retirement. Earlier manual/PR CI
reviews covered the generated metadata while it was candidate-labeled; a fresh CI review of the confirmed label remains a
next observation step.

The local read-model E2E smoke is now recorded:

- [read-model-e2e-smoke.md](read-model-e2e-smoke.md)

`npm run test:read-model:e2e` dogfoods the current mixed Graph-source flow in a temporary workspace: Todo Search
graph-source-backed generation/parity/validation/projection, Todo App confirmed structure-only graph-source-backed
generation/validation/projection contract, validate-all aggregate pass, separate candidate observation, and the local
edgeIntent `report-intent` summary.
The non-enforcing read-model Evidence workflow now runs the same smoke and uploads
`read-model-e2e-smoke-output.json` as observation metadata; manual run `28223860233` reviewed
`e2eSmokeStatus: e2e-smoke-pass`, and PR #8 run `28224088829` reviewed the same status through
`pull_request-informational`.

The public-doc cleanup or waiver decision package is now recorded:

- [public-doc-cleanup-waiver-decision-package.md](public-doc-cleanup-waiver-decision-package.md)

The package inventories public/user-facing docs for task-card authority, source-authority, compatibility-view, and
generated-Evidence wording risks. Batch A cleanup is implemented in `docs/source-of-truth-matrix.md`, Batch B cleanup is
implemented in `README.md`, `docs/acep.md`, and `docs/workflow.md`, Batch C cleanup is implemented in examples, usage,
traceability, and audit docs, and Batch D review is implemented only where needed. Any waiver approval stays separate.

The public-doc cleanup implementation plan is now recorded:

- [public-doc-cleanup-implementation-plan.md](public-doc-cleanup-implementation-plan.md)

The plan records Batch A, Batch B, and Batch C as implemented and ready for review, records Batch D as reviewed and
implemented only where needed, and preserves the `no-waiver-approved` state. It does not approve promotion, source
authority expansion, tree-native retirement, or additional public cleanup beyond Batch D.

The future all-slice read-model validation contract is now recorded:

- [read-model-validate-all-contract.md](read-model-validate-all-contract.md)

The contract defines current slice profiles, an explicit slice registry, execution modes, aggregate relation, failure
semantics, and boundaries for `pbe graph read-model validate --all`. The local command is now implemented as
non-enforcing Evidence; no workflow change, GitHub Action run, enforcement, source-authority expansion, public-doc
cleanup, or promotion is implemented by the contract.

The slice registry fixture and test strategy is now recorded:

- [read-model-slice-registry-test-strategy.md](read-model-slice-registry-test-strategy.md)

The strategy defines the proposed registry fixture shape, positive fixtures, negative fixture categories, parser/planner
tests, per-policy tests, independence tests, aggregate tests, non-mutation tests, boundary tests, and implementation
readiness criteria. The later local `validate --all` implementation uses this test surface while preserving
non-enforcement boundaries.

The negative fixture storage decision surface is now recorded:

- [read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md)

The decision surface compares inline/temp fixtures, durable `examples/invalid/read-model-*` fixtures,
`examples/read-model-aggregate/invalid-fixtures`, docs-only examples, and inline JSON objects. It recommends keeping
parser-shape failures inline/temp, using temp workspace copies for mutation and cross-slice leakage cases, and creating
durable invalid fixtures only for stable behavior-level validate-all failures. No invalid fixtures, parser changes,
test changes, workflow changes, generated artifacts, enforcement, or source-authority changes are introduced.

The first durable negative fixture candidate plan is now recorded:

- [read-model-negative-fixture-candidate-plan.md](read-model-negative-fixture-candidate-plan.md)

The plan narrows first durable candidates to `examples/invalid/read-model-invalid-view-scoped-tags` and
`examples/invalid/read-model-core-view-missing`, then records the missing pilot marker authority-boundary fixture and
inline/temp structure-only policy conflict coverage.

The first three durable negative fixtures are now present:

- `examples/invalid/read-model-invalid-view-scoped-tags`
- `examples/invalid/read-model-core-view-missing`
- `examples/invalid/read-model-pilot-marker-missing`

They store local invalid read-model fixtures or absence metadata outside `generated/`. Focused tests prove that invalid
`viewScopedTags`, missing required Core View coverage, and missing scoped pilot marker each produce blocking validation
results. The fixtures are not in the validate-all registry, are not run by CI, are not generated Evidence, and do not
change source authority or promotion state.

Structure-only policy conflict coverage is now inline/temp rather than durable fixture based: focused registry tests
reject a `structure-only` profile that requires compare/parity/pilot marker artifacts.

The invalid fixture CI inclusion policy is now recorded:

- [read-model-invalid-fixture-ci-policy.md](read-model-invalid-fixture-ci-policy.md)

The policy recommends keeping invalid read-model fixtures local-only for now. It compares optional manual CI,
PR-informational CI, and future required/enforcing modes, but does not change workflows, `validate --all`, the positive
registry, generated artifacts, source authority, or promotion state.

The registry storage/location decision surface is now recorded:

- [read-model-slice-registry-storage-decision.md](read-model-slice-registry-storage-decision.md)

The decision surface selected the non-generated JSON registry fixture at
`examples/read-model-aggregate/read-model-slices.json`, compares alternatives, defines artifact role and mutation
boundaries, and keeps CI/workflow consumption as a later decision.

The candidate registry fixture is now present:

- `examples/read-model-aggregate/read-model-slices.json`

It includes only the current Todo Search `pilot-marker-backed` profile and Todo App PBE Run `structure-only` profile.
The file is strict JSON and non-generated execution metadata. It is consumed by the local `validate --all` command only;
registry inclusion does not expand source authority, change CI enforcement, promote Todo App PBE Run, or approve full
Graph-source promotion.

The registry parser/normalization and focused comparison tests are now implemented internally. They prove the candidate
registry can be parsed, normalized, compared to the current in-code profiles, and converted into a command plan without
mutating the registry file. That test step did not make existing commands registry-driven; the later local
`validate --all` command is the first registry-consuming CLI surface.

The local non-enforcing registry-backed validate-all command is now implemented:

- command: `pbe graph read-model validate --all`
- registry: `examples/read-model-aggregate/read-model-slices.json`
- included profiles: Todo Search `pilot-marker-backed`, Todo App PBE Run `structure-only`
- current status: `aggregate-pass`

This command reads the candidate registry, runs each included profile's declared generate/compare/validate commands,
then writes the aggregate summary. It is local Evidence only. It does not change the PR/manual CI workflow, introduce
required checks, expand source authority, promote Todo App PBE Run, or approve full Graph-source promotion.

The CI validate-all integration design is now recorded:

- [ci-validate-all-integration-design.md](ci-validate-all-integration-design.md)

The record explains how the non-enforcing manual/PR informational workflow now replaces its explicit read-model command
sequence with local registry-backed `validate --all`. It compares command coverage, artifact bundle requirements,
manifest and Step Summary fields, failure semantics, and migration review expectations. Manual run `28210541509`, PR
informational run `28210904900`, and third PR informational observation run `28213236499` reviewed the switched workflow
as `ci-evidence-pass` with `validateAllStatus: aggregate-pass`; PR #4 run `28218854329` later reviewed captured
projection-contract status. No required check, enforcement, source authority, public-doc cleanup, or promotion change is
made.

The workflow now captures Todo Search graph-source `projectionContractStatus` from validate-all output into the CI
manifest, Step Summary, and uploaded artifact bundle. Manual run `28218687289` and PR #4 run `28218854329` reviewed that
capture path as `ci-evidence-pass`.

## Outline-Only Later-Phase Docs

No `docs/concept` policy file remains outline-only after Representative Runtime Feasibility Demo slice selection.
Further scoped transition execution, rollback mechanics, compatibility artifact generation, type models, broader CLI
command design, validators, migration scripts, and full Graph-source promotion are next-phase candidates only.

If a later outline-only concept file is added, use the outline gate criteria below until it is promoted.

## Outline Gate Common Criteria

Remaining outline-only docs use these criteria until promoted. Passing an outline gate does not mean detailed design is
complete. It means the outline clearly states:

1. The topic purpose.
2. The currently confirmed decisions.
3. That this phase does not detail-design the topic.
4. The items to write in the next phase.
5. The remaining open questions.

Outline gates do not require detailed policies, implementation structure, CLI behavior, or data models.

## Scope Limit

This work stabilizes what PBE is before implementation details are expanded. A good result is a small set of clear
canonical candidate documents and well-separated open questions, not a large amount of premature detail.
