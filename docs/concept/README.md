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

The next bounded expansion surface is now candidate-only for Todo App PBE Run:
`examples/valid/todo-app-pbe-run/graph-source-candidate.json`. It is a non-generated structure-only graph-source
candidate that mirrors the current 22-node / 38-edge / 7-Core-View Todo App read-model records for future review.
Focused tests parse it and reject promotion/validate-all-consumption claims. The same explicit projection command now
writes `examples/valid/todo-app-pbe-run/generated/graph-source-candidate-read-model-projection.json` as a candidate
projection with the same 22/38/7 shape and structure-only boundaries. Focused tests now load the committed candidate
projection and reject source-authority creation or validate-all enrollment drift. It is not consumed by `validate --all`,
not in the positive registry, not in CI, and does not promote Todo App beyond `structure-only`.
The local `graph read-model observe-candidates` command now reports this candidate projection contract separately from
positive validate-all semantics.

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
