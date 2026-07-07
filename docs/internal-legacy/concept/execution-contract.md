# Execution Contract

Status: canonical candidate

## Document Purpose

This document defines the concept role of Execution Contracts in the PBE runtime architecture.

Execution Contracts are the boundary between planning and implementation. They tell Codex what it may change, what it
must not change, and what evidence must be produced.

They may declare required Checks and required Evidence, but the meaning of Check, Evidence, Evidence status, freshness,
and exception handling is defined by [check-evidence-policy.md](check-evidence-policy.md).

They may also declare stop conditions, forbidden scope, risks, unknowns, assumptions, and output obligations whose
control implications are defined by [control-node-policy.md](control-node-policy.md).

## Scope

This document covers the conceptual contract boundary.

It does not replace [../execution-contracts.md](../execution-contracts.md), define new schemas, or design CLI commands.

## Contract Types

| Contract                | Role                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle Contract          | Defines one selected implementation slice, including included scope, foundation scope, deferred and out-of-scope nodes, validation commands, evidence requirements, and stop conditions. |
| Node Execution Contract | Defines one executable Work node, including source Product and Project nodes, expected and forbidden files, dependencies, tests, evidence, UI/UX constraints, and change rules.          |

Task cards may remain human-friendly compatibility views, but they must reference the corresponding Node Execution
Contract when one exists.

## Execution Rules

Codex may execute:

- selected Work nodes
- foundation Work nodes required by the selected slice
- tests and evidence required by included Test nodes
- integration tasks declared by the execution strategy or contract
- Checks and Evidence obligations declared by the selected Cycle or Node Execution Contract

Codex must not execute:

- deferred behavior
- blocked behavior
- out-of-scope behavior
- unconfirmed UI/UX changes
- visual UI changes without a Visual Design Contract source, waiver, out-of-scope decision, or not-required decision
- product, risk, acceptance, or verification changes without Change and Impact handling

## Check And Evidence Relationship

Execution Contracts can name what must be checked and what Evidence is required for the selected scope.

Typical contract-level obligations include:

- behavior checks
- regression checks
- integration checks
- visual checks
- risk checks
- evidence freshness checks
- acceptance checks
- expected Evidence type
- allowed or forbidden Evidence exception
- validation commands or manual review obligations

The contract is not the user-facing approval surface. Approval Brief summarizes contract-relevant Check/Evidence status
in Verification Summary and Remaining Judgment. Acceptance Tree remains the durable acceptance record.

Rollback / Compatibility Strategy does not loosen contract obligations. Future promotion, fallback, rollback, or
compatibility review must still preserve selected/foundation scope, forbidden scope, required Checks, and required
Evidence.

## Control Node Relationship

Execution Contract facts become Control Nodes when they affect workflow control, user judgment, warning, block, reopen,
or acceptance closure.

Examples:

- forbidden scope touched -> Control Node: Blocked or Decision required
- required Evidence missing -> Evidence Control Node
- risk boundary touched -> Decision Control Node or risk-triggered Control Node
- unknown blocks execution -> Control Node: Waiting for human or Blocked
- output obligation not satisfied -> Evidence or Decision Control Node, depending on risk and judgment needed

## Confirmed Decisions

- ACEP is the compatibility name for packaging Cycle and Node Execution Contracts.
- Contract execution ends as submitted for review, not accepted.
- Missing scope, design drift, unsafe dependency impact, or technical impossibility is a stop/change condition.
- Evidence must attach back to Product, Work, Test, criteria, or review requirements as applicable.
- Approval Brief maps contract-relevant facts into user-facing sections without exposing Execution Contract internals by
  default.
- Check/Evidence policy defines what the contract means by required Check, required Evidence, Evidence status, Evidence
  exception, and freshness.
- Control Node policy defines when contract facts become active control records.

## Remaining Open Questions

- Which contract fields should become mandatory in the next schema refinement?
- Which validation commands are required for concept-only, docs-only, UI, and code implementation cycles?
- How should execution contracts reference View Tree Pack projections if that concept becomes an artifact later?
- How should contract-level Check/Evidence obligations map to future generated artifacts, if such artifacts are added?

## Related Gate

This concept document supports Phase 1-2 architecture alignment. Detailed CLI behavior and validator implementation are
later-phase work.
