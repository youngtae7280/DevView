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

The current plugin remains tree-native at the operational source level.

The long-term architectural target is to promote Maintainability Graph to the source model.

Until that promotion is explicitly approved, Maintainability Graph is a canonical read model / alignment model over
current tree-native artifacts.

This means Phase 1-2 documents are not rejecting the Graph-source target. They preserve current plugin safety while
documenting the transition path.

Graph-first refinement adds one more separation:

```text
Node = durable target
Edge = durable semantic relationship
Tag = view-scoped role only
```

This refinement clarifies the target architecture. It does not change current operational source authority.

Current operational source:

```text
tree-native artifacts
```

Current conceptual alignment model:

```text
Maintainability Graph
```

Long-term target source model:

```text
Maintainability Graph
```

Graph-source promotion requires a separate phase and explicit user approval after:

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
