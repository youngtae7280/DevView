# Change Lifecycle

Status: canonical candidate

## Document Purpose

This document defines the concept lifecycle for product, scope, UX, risk, acceptance, and verification changes after
work has been planned, executed, reviewed, or accepted.

## Scope

This document covers conceptual states and responsibilities.

It does not define CLI command syntax, file schemas, migration scripts, or implementation logic.

## Current Lifecycle

Changes move through this conceptual flow:

```text
Feedback or drift
-> Change Control Node
-> Change Tree input / compatibility artifact view
-> Impact Control Node
-> affected nodes marked stale / invalidated / reopened / unaffected
-> bounded revision or decision
-> refreshed tests and evidence if needed
-> Approval Brief for review
-> Acceptance Control Node update
```

## Change Inputs

A Change node is required when feedback, discovery, or drift alters:

- product meaning
- implementation scope
- UX behavior or wording
- risk profile
- acceptance criteria
- verification strategy
- already implemented, verified, or accepted work

Small typo fixes or clearly bounded non-product edits may stay outside this lifecycle only when they do not alter those
dimensions.

## Impact Responsibilities

Impact analysis maps affected:

- Product nodes
- Project nodes
- Work nodes
- Test nodes
- Evidence nodes
- Cycle nodes
- Acceptance branches
- acceptance criteria

Affected completed nodes must be marked stale, invalidated, or reopened before revision work claims completion.

## Control Node Relationship

Change Control Node is the conceptual control record explaining why the change lifecycle is active.

Change Tree remains the current tree-native artifact or compatibility view for recorded changes. The two are related but
not identical:

```text
Change Tree / Change artifact = operational or compatibility view
Change Control Node = conceptual control record
```

Impact Control Nodes explain which affected nodes are unaffected, stale, invalidated, reopened, or closed after refreshed
verification. Acceptance Control Nodes explain whether user-controlled closure is open, deferred, invalidated, renewed,
or closed.

## Confirmed Decisions

- Codex does not silently edit accepted or completed work when feedback changes meaning or verification.
- Change and Impact records bound revision scope.
- Revisions rerun impacted tests and refresh stale evidence.
- User acceptance must be renewed when acceptance was invalidated.
- Control Nodes explain the control reason behind change, impact, reopen, and acceptance flows without replacing
  tree-native artifacts.

## Remaining Open Questions

- Which change classes should become CLI-assisted first?
- How much impact analysis can be file-judged without semantic inference?
- How should compatibility views show stale or reopened status without becoming the source of truth?

## Related Gate

This document establishes the change lifecycle concept. Detailed Control Node lifecycle rules live in
[control-node-policy.md](control-node-policy.md).
