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

- Whether Maintainability Graph becomes only a conceptual view or later gains generated artifact support.
- Whether View Tree Pack remains a conceptual projection or becomes a concrete artifact pack.
- Which older public docs still need terminology cleanup after this concept baseline is reviewed.

## Related Gate

This document supports Phase 1-2 architecture alignment. It is not an approval to design CLI behavior, schemas, or
validators.
