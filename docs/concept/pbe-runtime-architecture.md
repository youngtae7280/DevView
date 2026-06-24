# PBE Runtime Architecture

Status: canonical candidate

## Document Purpose

This document defines the active runtime architecture concept for Project Blueprint Engine before lower-level design work
begins.

PBE runtime architecture describes how Codex, human gates, `.pbe` artifacts, and deterministic CLI gates cooperate. It
does not describe a standalone runtime service.

## Scope

This document covers:

- the active runtime responsibilities
- the source-of-truth chain
- the boundary between planning, execution, review, and revision
- what PBE explicitly is not

This document does not cover TypeScript data models, CLI command design, validators, migration scripts, or detailed
policy implementation.

## Active Runtime Responsibilities

PBE runs through these responsibilities:

| Responsibility           | Role                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Human judgment gates     | Approve or revise product meaning, UI/UX, scope, architecture runway, review result, and acceptance. |
| Codex skill protocol     | Guides RPD, WPD, VD, ACEP, review, revision, visual work, and stop conditions.                       |
| Durable `.pbe` artifacts | Store Product, Project, Work, Test, Cycle, Change, Impact, Evidence, and Acceptance state.           |
| Deterministic CLI gates  | Validate file-judgable conditions and perform supported state transitions.                           |
| Execution contracts      | Bound what Codex may change and what evidence must be produced in the current cycle.                 |

The old "5 Layer" explanation is not the active architecture. It may be used only as a historical or explanatory frame.

## Source-Of-Truth Chain

The active conceptual chain is:

```text
Product Tree
-> Project Tree
-> Work Tree
-> Test Tree
-> Cycle Tree
-> Cycle Contract
-> Node Execution Contract
-> Evidence Tree
-> Acceptance Tree
```

Change handling uses:

```text
Change Tree -> Impact Tree -> reopened or invalidated nodes -> refreshed evidence -> user review
```

Compatibility views such as `.pbe/blueprint/*` and `.pbe/codex-execution-pack/*` can support older workflows, but they
do not replace the tree-native source artifacts.

## Transition Position

Current operational architecture:

```text
tree-native source artifacts plus skills, contracts, evidence, acceptance, and CLI gates
```

Target architecture:

```text
Maintainability Graph as source model, with Trees and Views projected from it
```

This document describes the current operational architecture and the transition stance. It does not perform source-model
promotion.

In this document, "Product Tree is the source of product truth" describes the current operational architecture. It does
not reject the long-term Graph-source target, and it does not make Maintainability Graph the operational source now.

[runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md) defines the representative readiness policy
that a future demo must satisfy before Graph-source promotion can be considered. That policy does not change this
document's current operational architecture.

[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md) selects the recommended slice
for future demo execution. It does not execute the demo or create runtime authority.

[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md) records the current manual demo
result for that slice. It is now `demonstrated` for the representative demo slice with retained warnings, while still
preserving source authority. A supplemental compatibility mismatch slice demonstrates a real ACEP task-card-only wording
mismatch as a bounded warning, PP-001 confirmation is recorded for the Todo Search slice, bounded runtime fixture Evidence
is present for title + note/content search, and renewed Acceptance is user-approved. None of this is public-doc cleanup or
source promotion.

[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) defines the recovery and compatibility safety
policy required before any future promotion review. That policy does not change current source authority or implement
rollback behavior.

[graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md) records the later readiness
review. It now recommends `ready for limited pilot promotion decision with warnings` after manual equivalent parity
artifacts were added. It does not promote Maintainability Graph or change current runtime authority.

Manual equivalent read-model parity artifacts now exist under `examples/adoption/todo-search-slice/`, so the readiness
recommendation can move to `ready for limited pilot promotion decision with warnings`. Generated builder or CLI-backed
output remains a later full-promotion/repeatability question rather than current runtime authority.

## Runtime Boundaries

PBE is not:

- a GUI product
- a SaaS backend
- a separate OpenAI API provider
- a daemon
- an execution engine that tries to do everything
- a validator that infers product meaning without recorded artifacts

PBE is a requirements-based execution control layer for AI-assisted development.

## Confirmed Decisions

- Product Tree is the source of product truth.
- Tree-native artifacts remain the current operational source artifacts.
- Maintainability Graph is the long-term target source model, pending separate approval.
- Lower trees derive from Product Tree branches.
- Work is executable only through selected or foundation Work nodes.
- Cycle and Node Execution Contracts bound implementation.
- Feedback or drift becomes Change and Impact work before revision.
- Codex submits for review; the user accepts.

## Remaining Open Questions

- Whether Maintainability Graph later gains generated/read-model artifact support.
- Whether View Tree Pack remains a conceptual projection or becomes a concrete artifact pack.
- Which older public docs still need terminology cleanup after this concept baseline is reviewed.
- Whether the next decision surface should be a limited pilot promotion decision or a full promotion decision.
- Whether the user will accept ACEP task-card public-doc cleanup as deferred cleanup, or require cleanup before
  promotion approval.
- Whether full Graph-source promotion requires an actual generated graph builder or CLI-backed read-model output.
- Which compatibility views must remain maintained after a future promotion.

## Related Gate

This document supports Phase 1-2 architecture alignment. It is not an approval to design CLI behavior, schemas, or
validators.
