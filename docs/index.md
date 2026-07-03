# PBE Documentation Index

## Start Here

- [Install PBE locally](install.md)
- [CLI Reference](cli-reference.md)
- [Graph Operation Runbook](graph-operation-runbook.md)
- [Troubleshooting](troubleshooting.md)
- [PBE v0.5.0-beta Readiness](beta-readiness.md)
- [Known Limits](known-limits.md)

## Core Concepts

- [Core Concepts](core-concepts.md)
- [Tree Model](tree-model.md)
- [State Machine](state-machine.md)
- [PBE Philosophy](pbe-philosophy.md)
- [Runtime Architecture Concept Repository](concept/README.md)
- [Current Graph-source transition mechanics](concept/repo-wide-graph-source-transition-mechanics.md) ??Status entry for
  `graph read-model report-health --json`, `npm run test:read-model:e2e`, transition status, retirement approval, and
  edgeIntent projection/report surfaces.
- [First bounded maintenance dogfood](concept/first-bounded-maintenance-dogfood.md) ??Report-only Graph-source PBE
  maintenance pass showing how edgeIntent blocks accidental compatibility-export cleanup without enforcement changes.
- [Second bounded maintenance dogfood](concept/second-bounded-maintenance-dogfood.md) ??Small retrofit edgeIntent claim
  wording change with regenerated projection and unchanged non-enforcement boundaries.
- [Third bounded maintenance dogfood](concept/third-bounded-maintenance-dogfood.md) ??Todo Search README consistency fix
  verified by the Graph-source read-model health chain.
- [Fourth bounded maintenance dogfood](concept/fourth-bounded-maintenance-dogfood.md) ??Native clear-search edgeIntent
  wording clarification with regenerated projection.
- [Fifth bounded maintenance dogfood](concept/fifth-bounded-maintenance-dogfood.md) ??Retrofit fallback anchor wording
  clarification with regenerated projection.
- [Bounded maintenance dogfood rollup](concept/bounded-maintenance-dogfood-rollup.md) ??Summary of native, retrofit, and
  Todo Search dogfood coverage plus remaining policy decisions.
- [Tiny behavior-change dogfood](concept/tiny-behavior-change-dogfood.md) ??Bounded Todo Search runtime fixture behavior
  change proving whitespace-normalized query matching through the Graph-source validation chain.
- [Graph-source required-check readiness](concept/graph-source-required-check-readiness.md) - Policy and status package
  for possible required-check promotion without enabling enforcement or branch protection.
- [PBE Compiler Boundary](concept/pbe-compiler-boundary.md) - Compiler-required vs AI-advisory boundary, hardened
  Contract Fixture Validator, and non-enforcing report-health/E2E observation.
- [Compiler Input Model](concept/compiler-input-model.md) - Machine-readable input surface for a future Actual Contract
  Compiler, validated through a non-executing dry-run fixture.
- [Contract Compiler Dry-Run v0.1](concept/contract-compiler-dry-run.md) - Deterministic non-executing contract
  candidate compilation plus generated-vs-hand-written diff from the validated Compiler Input Model.
- [Output Requirement Source Authority](concept/output-requirement-source-authority.md) - v0.2 preview surface for
  tracing output reporting obligations to graph, policy, Evidence, check, and diff source authority without execution.
- [Contract Source Authority Gap Preview](concept/contract-source-authority-gap-preview.md) - v0.2 preview surface for
  field-level remaining semantic/policy loss triage and next resolver selection.
- [Contract Compiler Equivalence Policy](concept/contract-compiler-equivalence-policy.md) - Review-only policy that
  separates source-authority preservation, equivalence candidate status, and equivalence proof.
- [Contract Compiler Promotion Review Policy](concept/contract-compiler-promotion-review-policy.md) - Human review
  packet boundary for equivalence candidates without approving promotion, execution, or enforcement.
- [Contract Compiler Promotion Decision: Current Fixture](concept/contract-compiler-promotion-decision-current-fixture.md)
  - Docs-only human decision accepting the current Todo Search dry-run fixture's promotion review packet without
    granting execution authority, enforcement, user acceptance, or broad equivalence proof.
- [Contract Compiler Calibration Fixtures](concept/contract-compiler-calibration-fixtures.md) - Second/calibration
  fixture selection for observing whether source-authority reconstruction generalizes beyond the current Todo Search
  dry-run fixture without claiming support or enforcement.
- [Contract Compiler Eligibility Status Model](concept/contract-compiler-eligibility-status-model.md) - Conceptual
  lifecycle model for calibration fixture selection, preview completion, compile eligibility, candidate generation,
  promotion review, approval, equivalence, and non-enforcement status.
- [DevView Compliance Checker MVP Scope](concept/devview-compliance-checker-mvp-scope.md) - Planning-only scope decision
  selecting `scope-compliance-preview` as the first checker axis and recording the Graph Delta Proposal boundary plus
  candidate schema/mapping/source/generator-scope alignment plus the proposal-only preview CLI without implementing
  enforcement, required checks, diff rejection, fixture approval, graph-source mutation, apply, or equivalence proof.
- [DevView Runtime Performance Budget](concept/devview-runtime-performance-budget.md) - Advisory 5 second target for
  deterministic local runtime passes plus compact advisory `check-scope` reporting, proposal-only `propose-graph-delta`
  preview generation, `review-graph-delta` Human Review Packet generation, and frontend instruction-pack generation from
  Contract Compiler Input, excluding AI editing time, full validation, CI runtime, and human review.
- [DevView Codex Hook Gateway Boundary](concept/devview-codex-hook-gateway-boundary.md) - Preview-only DevView ON/OFF
  and future advisory/guided Codex hook routing boundary across request intake, contract checks, edit-capable tool
  checks, post-checks, proposal-only previews, Human Review Packets, hook gateway health/readiness checks, and advisory
  `UserPromptSubmit` additionalContext preview generation plus install/trust scope, hook script scaffold preview, and
  hook script template preview boundaries without implementing hooks, approval, apply, CI enforcement, or strict mode.
- [Natural Language Request Intake Boundary](concept/natural-language-request-intake-boundary.md) - DevView compiler
  frontend boundary for natural language request intake, AI Request Analyzer candidate-only boundaries, Request IR
  Candidate schema/calibration fixtures, schema-only validation, non-traversing graph-aware validation, deterministic
  Graph Traversal Plan generation, Selected Graph Slice generation, selected-slice-to-contract-input generation, and
  Contract-Input-to-Instruction-Pack generation without implementing an AI classifier, runtime LLM calls, Codex
  execution, graph-source mutation, apply, or approval.
- [Scope Compliance Checker Implementation Readiness](concept/scope-compliance-checker-implementation-readiness.md) -
  Readiness criteria for future scope-compliance checker inputs, missing-input states, result preview status, and
  authoritative changed-file input boundaries before executable checker logic exists.
- [Graph operation-chain productization](concept/graph-operation-chain-productization.md) - Local native/retrofit
  dogfood package for `graph-source -> instruction pack -> local change -> graph delta -> graph update proposal`.
- [Candidate C full read-model gate evaluation](concept/candidate-c-full-read-model-gate-evaluation.md) - Evaluation
  keeping the broader validate-all/health/E2E/CI read-model gate non-enforcing until promotion prerequisites are met.
- [External dogfooding readiness summary](concept/external-dogfooding-readiness-summary.md) - Current Graph-source
  status, non-enforcement boundaries, and remaining approval branches before external dogfooding.
- [First external dogfooding run](concept/first-external-dogfooding-run.md) - `mdn/todo-vue` Lite slice observation,
  verification result, and adoption-safe validation blockers.
- [Second external dogfooding run](concept/second-external-dogfooding-run.md) - `mdn/todo-vue` adoption-safe validation
  smoke showing repo-only validator separation plus remaining v2 visual placeholder blocker.
- [Third external dogfooding run](concept/third-external-dogfooding-run.md) - `mdn/todo-vue` validation smoke showing
  profile recommend/init/status/validate pass after adoption-safe and fresh-init visual fixes.
- [Real external feature dogfooding 1](concept/real-external-feature-dogfooding-1.md) - `mdn/todo-vue` title-search
  implementation observation showing adoption-safe validation works while Work scope authoring remains the next gap.
- [Real external operation-chain dogfood](concept/real-external-operation-chain-dogfood.md) - `mdn/todo-vue` README-only
  operation-chain pass proving external graph delta capture and baseline-tooling blocker separation.
- [Real external behavior-change dogfood](concept/real-external-behavior-change-dogfood.md) - `component/escape-html`
  behavior-change pass proving recovered intent can drive a bounded code/test change.
- [Large external KEP retrofit dogfood](concept/large-external-kep-retrofit-dogfood.md) - Kubernetes KEP-753 read-only
  intent recovery proving formal design docs can be mapped to graph-source before target mutation.
- [External graph-source enrollment design](concept/external-graph-source-enrollment-design.md) - Design-only path for
  enrolling bounded external feature slices without registering external repos or expanding source authority.
- [Lite artifact initialization decision](concept/lite-artifact-initialization-decision.md) - Decision to retain broad
  `lite` initialization until lightweight slice authoring and external enrollment are ready.
- [Graph-first cleanup audit and compatibility boundary](concept/graph-first-cleanup-audit-and-compatibility-boundary.md)
  - Cleanup boundary for graph-source core, tree-based compatibility layers, and future retirement candidates.
- [Tree-native artifact retirement candidates](concept/tree-native-artifact-retirement-candidates.md) - Non-destructive
  retirement-candidate boundary for tree-native, blueprint, ACEP, profile, docs, and validator compatibility surfaces.
- [Todo App limited source-authority pilot](concept/todo-app-limited-source-authority-pilot.md) - Evaluation showing why
  Todo App remains `structure-only` until pilot evidence is explicitly added or waived.
- [Todo App source-authority evidence package](concept/todo-app-source-authority-evidence-package.md) - Missing-evidence
  checklist for a future Todo App limited pilot while keeping the current profile structure-only.
- [Graph-first primary workflow](concept/graph-first-primary-workflow.md) - Current source-authority, projection,
  Evidence, validation, compatibility, and user-acceptance boundaries for Graph-first PBE.
- [Adoption-safe validation path design](concept/adoption-safe-validation-path-design.md) - Design package for
  separating PBE plugin repository self-validation from initialized/external project validation without behavior
  changes.
- [Graph-native execution contract design](concept/graph-native-execution-contract-design.md) - Design package for a
  future graph-source execution handoff while ACEP and task-card views remain compatibility/execution views.

## Workflow Guides

- [PBE Policies](policies.md) — Compact policy index for adaptive depth, workload cap, complexity, parallel safety,
  migration, and review recovery.
- [RPD Interview Mode](rpd-interview-mode.md)
- [Ambiguity Taxonomy](ambiguity-taxonomy.md)
- [Product Patch Proposals](product-patch-proposals.md)
- [Review Failure Recovery](review-failure-recovery.md)
- [Parallel Safety Policy](parallel-safety.md)
- [Adaptive Workflow Depth Policy](lite-mode-policy.md)
- [Workload Cap and Artifact Minimalism](workload-cap-and-artifact-minimalism.md)
- [Migration / Compatibility Policy](migration-policy.md)
- [Dogfooding PBE on an Existing Project](dogfooding-existing-project.md)

## CLI / Reference

- [Agent Context Router](../agent-context/README.md)
- [CLI Reference](cli-reference.md)
- [CLI Output](cli-output.md)
- [Validator Design](validator-design.md)
- [File Format](file-format.md)

## Quality Rubrics

- [VD Quality Rubric](vd-quality-rubric.md)
- [Evidence Quality Rubric](evidence-quality-rubric.md)

## Governance / Release

- [PBE Complexity Governance](complexity-governance.md)
- [PBE v0.5.0-beta Readiness](beta-readiness.md)
- [PBE v0.5.0-beta Readiness Snapshot](v0.5.0-beta-readiness-snapshot.md)
- [Known Limits](known-limits.md)

## Examples

- [Examples Index](../examples/README.md)
- [Todo search adoption example](../examples/adoption/todo-search-slice/README.md)
- [Self-dogfooding: Windows sequential validation guidance](../examples/dogfooding/windows-validation-sequential-run/README.md)
- [Native graph operation examples](../examples/native/README.md)
- [Retrofit graph operation examples](../examples/retrofit/README.md)
