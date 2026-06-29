# PBE Documentation Index

## Start Here

- [Install PBE locally](install.md)
- [CLI Reference](cli-reference.md)
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
- [External dogfooding readiness summary](concept/external-dogfooding-readiness-summary.md) - Current Graph-source
  status, non-enforcement boundaries, and remaining approval branches before external dogfooding.
- [First external dogfooding run](concept/first-external-dogfooding-run.md) - `mdn/todo-vue` Lite slice observation,
  verification result, and adoption-safe validation blockers.
- [Second external dogfooding run](concept/second-external-dogfooding-run.md) - `mdn/todo-vue` adoption-safe validation
  smoke showing repo-only validator separation plus remaining v2 visual placeholder blocker.
- [Graph-first cleanup audit and compatibility boundary](concept/graph-first-cleanup-audit-and-compatibility-boundary.md)
  - Cleanup boundary for graph-source core, tree-based compatibility layers, and future retirement candidates.
- [Tree-native artifact retirement candidates](concept/tree-native-artifact-retirement-candidates.md) - Non-destructive
  retirement-candidate boundary for tree-native, blueprint, ACEP, profile, docs, and validator compatibility surfaces.
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
