# Legacy Compatibility Map

Status: concept policy

## Document Purpose

Legacy Compatibility Map defines how older PBE terms, compatibility artifacts, canonical concepts, and
superseded/deprecated directions should be read during the transition.

It is a bridge document. It lets people read older public docs, examples, task packs, and concept policies together
without reviving superseded product directions or silently changing runtime authority.

This document is not:

- a runtime migration plan
- a validator specification
- a CLI design
- a schema or model change
- a migration script
- a Graph-source promotion declaration

The current operational source is now scoped. Maintainability Graph is the limited source model for the Todo Search
selected-slice authority surface; tree-native artifacts remain operational source outside explicitly promoted scopes.

## Compatibility Status Categories

| Status             | Meaning                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| canonical          | Current preferred concept term or policy term.                                                                  |
| active-operational | Current runtime/file authority for plugin behavior.                                                             |
| compatibility      | Still valid as a bridge, shorthand, view, or package label when read through canonical policy.                  |
| legacy             | Historical or older explanatory language that may remain for context but is not current architecture authority. |
| superseded         | Replaced direction or framing that should not be revived without explicit product direction change.             |
| deprecated         | Discouraged behavior or interpretation that conflicts with current safety/traceability policy.                  |
| future-target      | Long-term architectural target or candidate that is not current operational authority.                          |

The same item can have different readings in different dimensions. For example, Product Tree is canonical and
active-operational today, while it may become a projection candidate in a later Graph-source phase. That future
possibility does not supersede it now.

## Source Authority Rules

When concept docs and older docs differ, read them in this order:

1. Active [decision-log.md](decision-log.md) decisions.
2. Concept policies in `docs/concept`.
3. Canonical and compatibility vocabulary in [glossary.md](glossary.md).
4. Current tree-native operational artifacts and CLI behavior.
5. Older public docs and examples as compatibility explanation only.

Rules:

- Active decision-log entries outrank older wording.
- Concept policy explains the current conceptual direction.
- Concept policy does not change runtime operational source by itself.
- Tree-native artifacts remain the current operational source until Graph-source promotion is separately approved.
- Legacy docs remain useful when they do not conflict with active decisions.
- Product, Project, Work, Test, Evidence, and Acceptance Trees must not be marked superseded in this phase.
- Conflicts should be recorded in [superseded-items.md](superseded-items.md), [open-questions.md](open-questions.md),
  or as a Compatibility Control Node candidate instead of silently overwritten.

## Term And Artifact Mapping

| Legacy / Compatibility Item                                         | Compatibility Status                        | Canonical Reading                                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `5 Layer`                                                           | legacy / superseded as active architecture  | Historical explanatory frame only. Current architecture is tree-native control plus concept policies and future Maintainability Graph target.          |
| `Knowledge Graph` / `Traceability Knowledge Graph`                  | legacy / predecessor expression             | Older or general expression. Use `Maintainability Graph` for the canonical read/alignment model and future source-model candidate.                     |
| `Maintainability Graph`                                             | limited source model / canonical read model | Source model for explicitly promoted scopes; canonical read/alignment model and long-term source-model candidate elsewhere.                            |
| `Product Tree`                                                      | canonical / active-operational              | Current source of product truth. Future Graph-source phase may project it as a view, but it is not superseded now.                                     |
| `Project Tree`                                                      | canonical / active-operational              | Current derived architecture/ownership artifact. Future Graph-source phase may project it as a view, but it is not superseded now.                     |
| `Work Tree`                                                         | canonical / active-operational              | Current executable work artifact derived from Product and Project. Not a direct prompt task list.                                                      |
| `Test Tree`                                                         | canonical / active-operational              | Current verification artifact declaring checks and evidence requirements.                                                                              |
| `Evidence Tree`                                                     | canonical / active-operational              | Current proof/evidence artifact linked to nodes, criteria, and review requirements.                                                                    |
| `Acceptance Tree`                                                   | canonical / active-operational              | Durable user-controlled acceptance state. Approval Brief and Control Nodes do not replace it.                                                          |
| `AI Context Pack`                                                   | compatibility shorthand                     | Shorthand for Execution Contract context. It is not the canonical execution boundary.                                                                  |
| `ACEP`                                                              | compatibility name                          | Packaging name for Cycle Contract and Node Execution Contract plus compatibility execution-pack files. It is not task-card-only authority.             |
| `Task card`                                                         | compatibility view                          | Human-friendly execution view. When a Node Execution Contract exists, the task card must reference it.                                                 |
| `Change Tree`                                                       | canonical / active-operational artifact     | Current recorded change artifact. Conceptually compatible with Change Control Node and change lifecycle flow.                                          |
| `Impact Tree`                                                       | canonical / active-operational artifact     | Current affected-node artifact. Conceptually compatible with Impact Control Node and stale/invalidated/reopened classification.                        |
| `Revision Pack`                                                     | compatibility package/view                  | Bounded revision packaging compatible with Change/Impact Control Nodes, refreshed Evidence, and renewed Acceptance flow.                               |
| `Human Gate`                                                        | canonical control mechanism                 | User judgment point surfaced through Approval Brief and, when needed, Decision/Evidence/Impact/Acceptance Control Nodes.                               |
| `Review` / `Review Result`                                          | compatibility workflow language             | Review surface should be read through Approval Brief: interpreted result, verification summary, remaining judgment, and available user choice.         |
| `Accept` / `Acceptance` / `Closure`                                 | canonical when user-controlled              | Durable state belongs in Acceptance Tree. Codex/PBE may submit for review, but only the user can accept product results.                               |
| `.pbe/blueprint/*`                                                  | compatibility artifact view                 | Backward-compatible view files over tree-native source artifacts. Not independent product truth when conflicting with v2 tree-native artifacts.        |
| `.pbe/codex-execution-pack/*`                                       | compatibility package view                  | ACEP package view for Codex execution. Must be interpreted through Cycle Contract, Node Execution Contract, Check/Evidence, and Control Node policies. |
| GUI / SaaS backend / separate OpenAI API provider direction         | superseded                                  | Do not revive unless the user explicitly changes product direction.                                                                                    |
| Direct prompt-to-code execution from ambiguous or unconfirmed scope | deprecated                                  | Product and work must pass through Product, Project, Work, Test, Cycle, and contract derivation.                                                       |

## Conflict Resolution Policy

When a legacy phrase appears to conflict with current concept policy:

1. Check whether an active decision already resolves it.
2. If resolved, read the old phrase as compatibility, legacy, deprecated, or superseded according to this map.
3. If the phrase affects current user judgment, approval, verification, migration, or scope safety, record a
   Compatibility Control Node candidate.
4. If it is only historical or term cleanup, record it in `superseded-items.md` or a later public-doc cleanup task.
5. If the correct reading is unknown, record an open question.

Do not silently edit product meaning, runtime authority, or accepted scope while resolving terminology.

## Relationship To Other Concept Docs

### Glossary

[glossary.md](glossary.md) holds short term definitions and status labels. This map provides the longer interpretation
policy and examples.

### Decision Log

[decision-log.md](decision-log.md) is the authority for confirmed decisions. This map explains how those decisions affect
legacy wording.

### Superseded Items

[superseded-items.md](superseded-items.md) records replaced or retired directions. It should not be used for active
compatibility terms that are still valid as bridge language.

### Open Questions

[open-questions.md](open-questions.md) records future cleanup, automation, generated-artifact, and promotion questions.
Compatibility uncertainty should stay open instead of being silently resolved.

### Resolved Questions

[resolved-questions.md](resolved-questions.md) records questions closed by this policy, such as whether legacy terms must
be deleted immediately or whether this map performs runtime migration.

### Control Node Policy

[control-node-policy.md](control-node-policy.md) defines Compatibility Control Nodes. This map defines when a mismatch is
only a term mapping versus when it may need lifecycle control.

## Compatibility Control Node Boundary

Use this boundary:

| Situation                                                                 | Record In                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------- |
| Simple term mapping or historical explanation                             | Legacy Compatibility Map or Glossary           |
| Replaced product direction or deprecated behavior                         | Superseded Items                               |
| Legacy/canonical mismatch affecting current approval, verification, scope | Compatibility Control Node candidate           |
| Unclear public-doc cleanup priority                                       | Open Questions or later cleanup plan           |
| Accepted temporary compatibility caveat                                   | Compatibility Control Node or future map entry |

Examples:

```text
old doc says "Knowledge Graph" generally
-> Legacy Compatibility Map / Glossary
```

```text
old doc presents GUI/SaaS as active direction
-> Superseded Items or public-doc cleanup
```

```text
old ACEP/task-card wording could change current execution authority
-> Compatibility Control Node candidate
```

```text
old evidence wording could affect approval readiness
-> Check/Evidence policy + possible Compatibility or Evidence Control Node
```

## Graph-Source Transition Safety

Maintainability Graph remains the canonical read/alignment model and long-term source-model candidate.

This map does not promote Graph-source. Before promotion, later review must account for:

- source authority change
- generated or maintained projections
- compatibility behavior
- migration path
- Rollback / Compatibility Strategy policy
- validator and CLI implications
- explicit user approval

Until then:

```text
promoted scope = Maintainability Graph source model
unpromoted scope = tree-native artifacts as current operational source of truth
Maintainability Graph = canonical read/alignment model and future-target candidate
```

## Scope Boundaries

This policy does not implement:

- migration scripts
- validators
- CLI/UI display
- generated compatibility artifacts
- public docs cleanup
- Graph-source promotion
- source model conversion

Those remain later implementation or cleanup questions.

## Remaining Open Questions

- Which public docs should be cleaned up first?
- Should this compatibility map later become a generated artifact?
- When and how should validators detect legacy/canonical mismatch?
- How should CLI/UI display compatibility status?
- Which compatibility terms should retire after Graph-source promotion?

## Related Gate

This policy satisfies the Legacy Compatibility Map completion condition for Graph-source promotion readiness at concept
level.

It does not complete actual runtime feasibility demo execution, rollback mechanics, compatibility artifact generation,
or Graph-source promotion itself.
