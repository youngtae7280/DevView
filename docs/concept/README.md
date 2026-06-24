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
5. Representative runtime feasibility demonstration is complete.
6. Tree-native artifacts to Graph-source transition path is defined.
7. Rollback or compatibility strategy is defined.

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

Concept policy completion does not create CLI commands, schemas, validators, templates, runtime artifacts, or durable
acceptance storage by itself.

## Outline-Only Later-Phase Docs

No `docs/concept` policy file remains outline-only after Legacy Compatibility Map promotion. Runtime feasibility
demonstration, source transition path, rollback strategy, type models, CLI command design, validators, and migration
scripts are next-phase candidates only.

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
