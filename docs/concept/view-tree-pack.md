# View Tree Pack

Status: canonical candidate

## Document Purpose

View Tree Pack names the conceptual set of task-scoped projections Codex can read when it needs focused context for
planning, execution, review, revision, retrofit onboarding, or promotion readiness.

The pack prevents projections, compatibility views, and task-local context from being mistaken for source authority.

## Scope

This document covers conceptual view roles and source rules.

It does not define a new `.pbe` directory, file format, generator, CLI command, validator, graph schema, or context-pack
schema.

## Current And Target Source Boundary

Current:

```text
View Tree Pack can be projected from tree-native artifacts.
```

Target:

```text
After explicit future Graph-source promotion, View Tree Pack can be projected from Maintainability Graph.
```

Always:

```text
View Tree Pack is a task-scoped projection, not source authority.
```

Current operational source remains:

```text
Product Tree -> Project Tree -> Work Tree -> Test Tree
Cycle Tree -> Change Tree -> Impact Tree -> Evidence Tree -> Acceptance Tree
```

The Graph-first target does not change that current authority until explicit user promotion approval.

[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md) records a later prerequisite
for generated / CLI-backed read-model Evidence before actual scoped source-authority pilot execution. That requirement
may produce stronger projection Evidence in a future task, but it does not make View Tree Pack source authority and does
not implement a generator here.

## Relationship To Node / Edge / Tag Policy

View Tree Pack follows [graph-node-edge-tag-policy.md](graph-node-edge-tag-policy.md):

- Nodes are durable targets.
- Edges are durable semantic relationships.
- Tags are view-scoped roles inside one View Instance.

View Tree Pack may use tags such as `target`, `context`, `guard`, `required`, `stale`, `blocked`, or `output`, but it
must not encode semantic relationships as tags.

For example:

- use an `implements` edge for `code implements behavior`
- use a `verifies` edge for `check verifies behavior`
- use an `evidences` edge for `evidence evidences check`
- use a `target` tag only to show that a node is the local focus of this view

## Core Views

PBE uses seven Core Views.

| Core View                  | Primary question                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------- |
| Intent View                | What product intent, requirement, behavior, or decision is the task about?             |
| Behavior View              | What intended, observed, inferred, or candidate behavior is relevant?                  |
| Structure View             | Which code, data, documents, and dependencies shape the implementation?                |
| Scope / Execution View     | What is selected, foundation, deferred, forbidden, required, or contract-bounded?      |
| Impact View                | What changes, findings, or affected nodes may be stale, invalidated, or reopened?      |
| Verification View          | Which checks verify the relevant behavior, requirement, work, risk, or boundary?       |
| Evidence / Acceptance View | What evidence exists, what is missing/stale/partial, and what user acceptance remains? |

## Intent View

| Field                             | Definition                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Purpose                           | Focus Product intent, requirement, acceptance criteria, user request, and decisions.      |
| Possible node kinds               | `request`, `requirement`, `behavior`, `decision`, `document`, `task`, `view-instance`     |
| Primary edge types                | `targets`, `satisfies`, `approves`, `rejects`, `resolves`, `requires`, `derives-view`     |
| Common view-scoped tags           | `target`, `context`, `candidate`, `required`, `blocked`                                   |
| Approval/evidence/source boundary | Intent cannot be inferred as confirmed product meaning without user decision or Evidence. |

## Behavior View

| Field                             | Definition                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| Purpose                           | Show intended, observed, inferred, candidate, changed, or runtime behavior.                 |
| Possible node kinds               | `behavior`, `requirement`, `code`, `check`, `evidence`, `finding`, `change`, `document`     |
| Primary edge types                | `implements`, `verifies`, `evidences`, `reports-on`, `invalidates`, `preserves`, `resolves` |
| Common view-scoped tags           | `target`, `context`, `candidate`, `stale`, `required`, `blocked`                            |
| Approval/evidence/source boundary | Observed Behavior is not Product Requirement. Inferred behavior needs confidence metadata.  |

## Structure View

| Field                             | Definition                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| Purpose                           | Show code, data, module, document, dependency, and runtime structure relevant to a task. |
| Possible node kinds               | `code`, `data`, `document`, `log`, `check`, `task`, `finding`, `view-instance`           |
| Primary edge types                | `depends-on`, `calls`, `reads`, `writes`, `takes-input`, `returns`, `touches`            |
| Common view-scoped tags           | `target`, `context`, `candidate`, `guard`, `required`                                    |
| Approval/evidence/source boundary | Structural observations may be tool-confirmed, but they do not confirm product meaning.  |

## Scope / Execution View

| Field                             | Definition                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose                           | Make execution boundaries explicit so AI knows what may be changed, what is required, and what is forbidden.                            |
| Possible node kinds               | `task`, `requirement`, `code`, `check`, `evidence`, `decision`, `document`, `view-instance`                                             |
| Primary edge types                | `targets`, `requires`, `touches`, `depends-on`, `verifies`, `evidences`, `derives-view`                                                 |
| Common view-scoped tags           | `target`, `guard`, `required`, `blocked`, `output`, `context`                                                                           |
| Approval/evidence/source boundary | Selected/foundation/deferred/out-of-scope/forbidden scope and Cycle/Node Execution Contracts must not be buried in Structure or Impact. |

Scope / Execution View is required because PBE is a development control system, not only a knowledge model. It should
show:

- selected scope
- foundation scope
- deferred scope
- out-of-scope behavior
- forbidden files or surfaces
- Cycle Contract / Node Execution Contract boundaries
- required commands, checks, evidence, and stop conditions

## Impact View

| Field                             | Definition                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Purpose                           | Show change, drift, affected nodes, stale state, invalidation, reopen, and risk.                                  |
| Possible node kinds               | `change`, `finding`, `requirement`, `behavior`, `code`, `check`, `evidence`, `decision`                           |
| Primary edge types                | `invalidates`, `preserves`, `reports-on`, `touches`, `requires`, `resolves`, `depends-on`                         |
| Common view-scoped tags           | `target`, `context`, `stale`, `blocked`, `candidate`, `required`                                                  |
| Approval/evidence/source boundary | Impact must not silently reopen or close accepted work without refreshed Evidence and user-controlled acceptance. |

## Verification View

| Field                             | Definition                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| Purpose                           | Show Checks, required Evidence, risk checks, regression checks, visual checks, and coverage. |
| Possible node kinds               | `check`, `requirement`, `behavior`, `code`, `evidence`, `finding`, `decision`, `document`    |
| Primary edge types                | `verifies`, `evidences`, `requires`, `reports-on`, `resolves`, `preserves`, `invalidates`    |
| Common view-scoped tags           | `target`, `required`, `stale`, `blocked`, `context`, `output`                                |
| Approval/evidence/source boundary | A Check is an obligation; Evidence is observable proof. AI self-report is not Evidence.      |

## Evidence / Acceptance View

| Field                             | Definition                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Purpose                           | Show Evidence status, freshness, exceptions, retained warnings, acceptance state, and remaining judgment. |
| Possible node kinds               | `evidence`, `check`, `decision`, `finding`, `requirement`, `behavior`, `document`, `log`                  |
| Primary edge types                | `evidences`, `verifies`, `approves`, `rejects`, `requires`, `resolves`, `reports-on`                      |
| Common view-scoped tags           | `target`, `output`, `required`, `stale`, `blocked`, `context`                                             |
| Approval/evidence/source boundary | Acceptance remains user-controlled. Approval Brief and Evidence summaries do not replace Acceptance Tree. |

## View Instance Manifest

A View Tree Pack may be represented later as one or more View Instance Manifests. A manifest should record:

- view type
- request or task target
- source nodes
- traversal rules and edge types
- included and excluded node kinds
- view-scoped tags
- confidence/freshness caveats
- required checks and evidence
- source-authority boundary

The manifest is a durable record candidate, not an execution engine.

The Todo Search representative slice now includes a manual example:

- `examples/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.md`

That example is review evidence only. It does not define a schema, generator, renderer, CLI output, or source authority.

## Legacy Term Mapping

Older uses of `Product Tree` as a UI or analysis view should be read as an Intent View unless they refer to the actual
Product Tree artifact.

Older uses of `Work Tree` as a task grouping should be read as a Work View unless they refer to the actual Work Tree
artifact.

`AI Context Pack` is compatibility shorthand for the context portion of execution contract packaging. In Graph-first
language, it is closest to a task-scoped View Tree Pack / View Instance output.

## Rollback / Compatibility Relationship

[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) defines when a projected view may remain as a
maintained compatibility view, rollback reference, or retirement candidate after a future promotion. A View Tree Pack
remains a projection/read view with explicit source references. If an artifact is ever promoted as source, it must be
reclassified by the approved source policy rather than left under the compatibility-view category.

## Remaining Open Questions

- Should View Tree Pack stay a documentation concept or later become a generated pack?
- Which Core Views are required for each PBE workflow stage?
- What is the smallest useful projection that avoids context bloat?
- Should `view-instance` be a first-class Node kind or a separate durable record kind?
- Should View Instance Manifest become a first-class generated artifact in a later implementation phase?

## Related Gate

This document is limited to concept alignment. Concrete artifacts, generators, schemas, validators, CLI commands, and
source promotion belong to a later phase.
