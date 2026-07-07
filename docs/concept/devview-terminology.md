# DevView Terminology

DevView is the canonical product identity. The product vocabulary below is the public language for docs, CLI examples,
and handoff reports.

## Canonical Flow

```text
Maintainability Graph
-> View Tree
-> Context Pack
-> AI Work Plan
-> Runtime Evidence
-> Graph Delta
-> Guarded Graph Update
```

## Maintainability Graph

The Maintainability Graph is DevView's canonical source model. It connects product intent, implementation surfaces,
tests, evidence, decisions, risks, and update proposals so AI-assisted maintenance can preserve why a change exists.

## View Tree

A View Tree is a task-specific tree-shaped projection derived from the Maintainability Graph.

The View Tree is not legacy tree-native storage. It is a graph-derived view for one task, review, or execution lane. A
View Tree can narrow context, but it does not replace the Maintainability Graph and does not grant authority to mutate
it.

The canonical CLI transition surface is `graph read-model generate-view-tree`. The transitional compatibility command
`graph read-model select-slice` writes the same preview. Its stored compatibility artifact role remains
`selected-graph-slice`, while generated artifacts carry `viewTreeArtifactRole: devview-view-tree-preview` and should be
treated as View Tree previews.

## Context Pack

A Context Pack is a bounded subgraph package around the View Tree. It contains the selected goal, scope, relevant graph
records, constraints, forbidden scope, evidence requirements, and stop conditions needed by a worker or Codex session.

The current Context Pack surfaces are preview-only. They may package repository guidance or graph-derived View Tree
provenance, but they do not execute work and do not create approval or enforcement authority.

Context Packs are reviewable inputs. They are not approval, runtime Evidence satisfaction, equivalence proof, scope
enforcement, or graph mutation permission.

## AI Work Plan

An AI Work Plan translates the Context Pack into bounded execution instructions. In the CLI this is represented by
Instruction Pack previews and related advisory context reports. It can guide work, but it does not execute Codex and
does not approve work.

## Runtime Evidence

Runtime Evidence is observed or generated evidence such as a report, smoke result, validation output, or checked
artifact. Runtime Evidence by itself is not accepted Evidence and does not satisfy a runtime obligation.

Accepted Evidence requires an explicit human Evidence decision and a separate accepted Evidence record. Runtime
Evidence satisfaction remains a distinct lifecycle after accepted Evidence is linked to a concrete required obligation.

## Graph Delta

A Graph Delta is a proposed Maintainability Graph update. It may summarize changed scope, evidence, risks, or status
updates, but it remains proposal-only until a guarded update command validates concrete operations and all required
boundaries.

## Guarded Graph Update

A Guarded Graph Update is the controlled path that can mutate the Maintainability Graph. It requires explicit human
approval provenance, apply readiness, mutation policy, concrete deterministic operations, backup, rollback readiness,
and post-update validation.

## Legacy Migration Inputs

Legacy tree-native artifacts are migration inputs until retired. They may remain on disk to support validation,
fixtures, rollback, and compatibility audits, but they are not DevView canonical artifacts and should not be promoted in
public product documentation.
