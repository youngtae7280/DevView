# Source Transition Path

Status: concept policy

## Document Purpose

Source Transition Path defines the concept-level authority policy for a possible future transition from tree-native
operational source artifacts to Maintainability Graph as the source model.

It explains what must be true before source authority can change, who can approve that change, and how tree-native
artifacts, graph records, projections, contracts, user judgment, and compatibility views must remain separated during
the transition.

This document is not:

- a migration plan
- a migration script
- a CLI command design
- a schema, TypeScript model, or validator specification
- a runtime implementation
- a generated artifact design
- an implementation roadmap
- a Graph-source promotion declaration

The current operational source remains tree-native artifacts until an explicit promotion decision is made by the user.

## Core Definition

Source Transition Path:

```text
A concept-level authority transition policy describing the stages, prerequisites, invariants, and judgment boundaries
required before Maintainability Graph can be considered for source-model promotion.
```

The path exists to prevent accidental promotion. It does not move source authority by itself.

## Term Boundaries

Use these terms narrowly:

| Term                              | Boundary                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source authority change           | A user-approved change to which artifact/model is treated as operational source. This policy describes prerequisites only.                                 |
| promotion readiness               | A state where prerequisites are reviewable. It is not promotion approval.                                                                                  |
| promotion                         | Explicit user-approved source authority change. This document does not declare promotion.                                                                  |
| projection                        | A view derived from a source model. It is not product truth by itself.                                                                                     |
| generated projection              | Future possible projection produced by tooling. This policy does not design that tooling.                                                                  |
| maintained compatibility view     | Future possible compatibility artifact kept for transition, review, or rollback. It is not automatically source.                                           |
| rollback / compatibility strategy | Required policy explaining recovery and compatibility behavior. It is defined in [rollback-compatibility-strategy.md](rollback-compatibility-strategy.md). |
| migration boundary                | The line between conceptual authority change and actual artifact/model migration work. Actual migration mechanics are out of scope.                        |
| non-migration boundary            | A decision that some artifacts may remain views or compatibility records rather than being migrated. The decision is future-phase.                         |

## Transition Stages

These stages are concept labels. They are not CLI commands, migration steps, Autoflow states, schema states, or an
implementation roadmap.

| Stage                                   | Source Authority Meaning                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| current tree-native source              | Product, Project, Work, Test, Evidence, and Acceptance Trees remain the current operational source. Maintainability Graph is only a read/alignment model.                                                                 |
| graph read-model alignment              | Maintainability Graph explains and cross-checks tree-native artifacts. No source authority changes.                                                                                                                       |
| representative feasibility demonstrated | Runtime Feasibility Demonstration criteria are satisfied for a representative lifecycle slice with observable Evidence. No source authority changes.                                                                      |
| transition candidate                    | Graph-source promotion can be evaluated as a candidate only if projection/parity expectations, conflict handling, Rollback / Compatibility Strategy, source authority matrix, and promotion review Evidence are prepared. |
| explicit promotion decision             | The user explicitly approves source promotion through Approval Brief or an equivalent user judgment surface. Codex/PBE cannot self-approve.                                                                               |
| graph-source promoted                   | Future target state where Maintainability Graph is the source model and trees/views may be projected from it. This document describes the state but does not declare it active.                                           |
| post-promotion compatibility period     | Tree-native artifacts may remain as projections, views, compatibility artifacts, or transitional records according to the approved promotion and rollback/compatibility policy.                                           |

Current state:

```text
current tree-native source
```

Current non-state:

```text
graph-source promoted
```

## Source Authority Matrix

This matrix is conceptual. It does not define files, generators, validators, or migration behavior.

| Item                                                 | Current Tree-Native Source                                                                      | Transition Candidate                                                                                                                                      | Post-Promotion Compatibility Period                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Product Tree                                         | Current product truth and operational source for product meaning.                               | Must be mapped to graph Product/Intent records with no loss of acceptance criteria, UX decisions, or non-scope.                                           | May become projection/view/compatibility artifact only after explicit promotion; user-approved product meaning must remain traceable. |
| Project Tree                                         | Current operational architecture/ownership source derived from Product Tree.                    | Must map architecture boundaries, surfaces, dependencies, and ownership into graph records or projections.                                                | May become projected architecture view if parity and rollback expectations are defined.                                               |
| Work Tree                                            | Current executable work source after Project derivation.                                        | Must map selected/foundation/deferred/blocked/out-of-scope Work scope and dependency boundaries.                                                          | May become projected Work View; executable scope must still be bounded by contracts.                                                  |
| Test Tree                                            | Current verification source declaring Checks and required Evidence.                             | Must map Test, Check, criteria, and required Evidence links without weakening Check/Evidence policy.                                                      | May become projected Test/Verification View; required verification obligations must remain explicit.                                  |
| Evidence Tree                                        | Current operational proof/evidence record.                                                      | Must preserve Evidence category, status, freshness, exception, and linked Check scope.                                                                    | May become projected Evidence View or compatibility record; Evidence gaps must not be hidden.                                         |
| Acceptance Tree                                      | Current durable user-controlled acceptance state.                                               | Must preserve accepted, deferred, rejected, reopened, and invalidated acceptance state.                                                                   | User acceptance authority remains durable and cannot be replaced by Codex/PBE or graph automation.                                    |
| Maintainability Graph                                | Canonical read/alignment model and future source-model candidate.                               | Candidate source model only after feasibility Evidence, authority matrix, projection/parity, conflict, and rollback/compatibility expectations are ready. | Future source model only after explicit promotion decision; still must preserve Product-to-Acceptance traceability.                   |
| View Tree Pack                                       | Conceptual projection over tree-native artifacts; not source.                                   | Helps inspect candidate projections and context boundaries.                                                                                               | May become projection pack from graph source if approved; still not product truth by itself.                                          |
| Cycle Contract / Node Execution Contract             | Current execution boundary for selected/foundation scope and required Evidence.                 | Must remain the execution boundary regardless of source-model candidate.                                                                                  | Remains the bounded execution contract concept after promotion; source model change does not authorize silent scope expansion.        |
| Approval Brief                                       | User-facing judgment surface, not source artifact.                                              | Must summarize promotion readiness, Evidence, blockers, remaining judgment, and approval choice.                                                          | Remains user judgment surface; does not replace acceptance or source records.                                                         |
| Control Nodes                                        | Conceptual control records for decisions, impact, evidence gaps, acceptance, and compatibility. | Must surface blocker, decision, stale/reopen, evidence exception, and compatibility mismatch relevant to promotion.                                       | Remain control records, not authority source; closure still requires proper Evidence, decision, or compatibility disposition.         |
| `.pbe/blueprint/*` and `.pbe/codex-execution-pack/*` | Compatibility views/packages over tree-native source artifacts.                                 | Must be interpreted through Legacy Compatibility Map when conflicts or promotion judgments arise.                                                         | May remain compatibility artifacts or be retired only under approved compatibility policy; not silently deleted or treated as source. |

## Promotion Prerequisites

Graph-source promotion may not be requested as ready unless all of these are true:

1. Concept policies through Rollback / Compatibility Strategy are complete.
2. Representative Runtime Feasibility Demo slice selection is complete and actual Runtime Feasibility Demonstration has
   passed with observable Evidence and no hidden partial/blocking gaps.
3. No `partially demonstrated`, `blocked`, or `deferred` feasibility result is hidden from promotion review.
4. Active decisions have no unresolved conflict with the proposed authority change.
5. Rollback/fallback triggers, compatibility-retirement conditions, Evidence obligations, and control-record handling
   are reviewable under Rollback / Compatibility Strategy.
6. Source authority matrix is agreed for current, transition candidate, and post-promotion roles.
7. Projection/parity expectations are defined at the level needed for promotion review.
8. Conflict resolution rules are defined for tree-native/graph mismatch.
9. Check/Evidence obligations for promotion review are defined.
10. Approval Brief or equivalent user judgment surface is prepared for the promotion decision.
11. Explicit user approval is obtained.

None of these prerequisites may be replaced by AI self-report.

## Transition Invariants

These invariants apply before, during, and after any approved source transition:

- No silent source authority switch.
- No Codex/PBE self-approval.
- No AI self-report as Evidence.
- No loss of Product -> Work -> Test -> Evidence -> Acceptance traceability.
- No hidden stale, reopened, invalidated, partial, missing, or exception Evidence state.
- No legacy/canonical mismatch silently ignored.
- No tree-native artifact marked superseded before explicit promotion.
- No loss of user-controlled Acceptance Tree authority.
- No accepted or verified branch silently revalidated by source transition alone.
- No deferred, blocked, or out-of-scope work promoted into selected scope by transition alone.
- Source transition must preserve bounded execution through Cycle Contract and Node Execution Contract.
- Source transition must preserve Control Node visibility for blockers, decisions, impact, Evidence gaps, and
  compatibility concerns that affect user judgment.

## Conflict And Drift Handling

### Current Phase

When a tree-native artifact and Maintainability Graph read/alignment model disagree in the current phase:

```text
tree-native artifact = operational source
Maintainability Graph = alignment signal
```

The mismatch must not be silently fixed by graph interpretation.

If the mismatch affects current approval, scope, verification, or user judgment, record the appropriate control or
policy item:

- Compatibility Control Node candidate for legacy/canonical mismatch
- Evidence Control Node for missing, stale, partial, or exception Evidence
- Impact Control Node for affected completed, verified, or accepted nodes
- Decision Control Node for source, scope, risk, or policy judgment
- Open Question when the correct interpretation is not yet known
- Superseded Items only for replaced directions, not active compatibility terms

### Transition Candidate Phase

In a transition candidate phase, mismatch may become:

- promotion blocker
- partial readiness finding
- deferred issue with reason and risk
- explicit compatibility exception
- required projection/parity fix
- user decision item

The mismatch still must not be hidden. A candidate graph-source transition must explain what is affected, what Evidence
exists, what remains uncertain, and who must decide.

### Post-Promotion Compatibility Period

If a future explicit promotion occurs, remaining tree-native artifacts, compatibility views, and older packages must be
handled according to the approved Rollback / Compatibility Strategy. They must not be silently deleted, silently treated
as source, or silently ignored when they affect user judgment.

## Promotion Review Surface

Promotion requires an Approval Brief or equivalent user judgment surface.

That surface must show:

- intended source authority change
- source authority matrix summary
- feasibility Evidence summary
- projection/parity status
- conflict and mismatch summary
- Rollback / Compatibility Strategy summary
- remaining risks, Unknowns, and deferred issues
- explicit approval choice

Approval of promotion must not imply approval of unrelated product work, hidden graph state, or unreviewed compatibility
cleanup.

## Relationship To Existing Concept Policies

### Maintainability Graph

[maintainability-graph.md](maintainability-graph.md) names the long-term source candidate. This policy defines the
authority path required before that candidate can be promoted.

### Runtime Feasibility Demonstration

[runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md) defines the observable readiness gate. A
successful feasibility demo is required before promotion review, but it is not sufficient by itself.

### Representative Runtime Feasibility Demo

[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md) selects the recommended slice
for future demo execution. It is a readiness artifact and does not count as observable demo Evidence by itself.

[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md) records the current manual demo
Evidence result. Its strengthened `partially demonstrated` status means the feasibility prerequisite remains unmet until
refreshed title + note/content Evidence, renewed Acceptance, generated/parity expectations, and compatibility
cleanup/defer judgment are resolved or explicitly accepted for promotion review. PP-001 confirmation and supplemental
compatibility mismatch Evidence now exist, but they do not clean up public docs or change source authority.

### Rollback / Compatibility Strategy

[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) defines the recovery and compatibility safety
policy required before promotion review. Source transition uses that policy for rollback/fallback triggers,
compatibility views, retirement boundaries, Evidence requirements, and user judgment.

### Legacy Compatibility Map

[legacy-compatibility-map.md](legacy-compatibility-map.md) defines how legacy terms, compatibility artifacts, and
superseded/deprecated directions are interpreted. Source transition must reuse that interpretation instead of silently
rewriting compatibility meaning.

### View Tree Pack

[view-tree-pack.md](view-tree-pack.md) defines projection/read views. Source transition may change where views are
projected from only after explicit promotion; the views themselves do not become product truth.

### Execution Contract

[execution-contract.md](execution-contract.md) remains the planning/execution boundary. Source transition does not permit
execution outside selected/foundation scope or without required Checks and Evidence.

### Check / Evidence Policy

[check-evidence-policy.md](check-evidence-policy.md) defines promotion review proof rules. Promotion readiness requires
observable Evidence, not AI self-report.

### Control Node Policy

[control-node-policy.md](control-node-policy.md) defines blockers, decisions, impact, Evidence gaps, acceptance, and
compatibility control records. Source transition mismatches use those control records when they affect workflow or user
judgment.

### Approval Brief

[approval-brief.md](approval-brief.md) defines the user-facing judgment surface. Source promotion requires explicit user
approval through that surface or an equivalent review mechanism.

### PBE Runtime Architecture

[pbe-runtime-architecture.md](pbe-runtime-architecture.md) defines current runtime authority. This policy does not change
that authority; it defines the conceptual path that would be required before a future change.

## Scope Boundaries

This policy does not implement:

- migration scripts
- CLI commands
- schemas or TypeScript models
- validators
- runtime source-model conversion
- generated graph or projection artifacts
- rollback mechanics
- actual Graph-source promotion

Those remain later concept or implementation questions.

## Remaining Open Questions

- How formal should projection/parity expectations be before promotion review?
- Does promotion review need a specialized Approval Brief template?
- Should actual implementation/test Evidence for title + note/content search be created before promotion readiness
  review?
- Must the observed ACEP task-card-only wording be cleaned up before promotion readiness review, or is warning plus
  deferred cleanup sufficient?
- How long should a post-promotion compatibility period last?
- Where is the boundary between automatic recovery and manual judgment when tree-native artifacts and graph records
  conflict?

## Related Gate

This policy satisfies the Source Transition Path concept-policy completion condition for Graph-source promotion
readiness.

It does not complete rollback mechanics, compatibility artifact generation, projection/parity implementation, migration
mechanics, evidence strengthening after a partial actual demo result, or Graph-source promotion itself.
