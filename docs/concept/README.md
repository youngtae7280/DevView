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

The actual result reviews `Todo Search Adoption + Product Meaning Feedback` against observable docs and selected-slice
demo-support artifacts. Its final feasibility judgment remains `partially demonstrated`, but Project/Contract and
Change/Impact gaps are strengthened with manual evidence snapshots. A supplemental compatibility mismatch slice now
records real ACEP task-card-only wording and maps it through Compatibility Control Node policy. PP-001 confirmation is
now recorded in the selected-slice artifacts. Refreshed runtime Evidence, renewed Acceptance, generated graph output, and
public-doc cleanup judgment remain unresolved before promotion readiness.

## Outline-Only Later-Phase Docs

No `docs/concept` policy file remains outline-only after Representative Runtime Feasibility Demo slice selection.
Further evidence strengthening after the partial actual demo result, rollback mechanics, compatibility artifact
generation, type models, CLI command design, validators, migration scripts, and Graph-source promotion are next-phase
candidates only.

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
