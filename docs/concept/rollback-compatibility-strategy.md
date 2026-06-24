# Rollback / Compatibility Strategy

Status: concept policy

## Document Purpose

Rollback / Compatibility Strategy defines the concept-level safety policy required before a future Graph-source
promotion can be considered.

It explains how PBE should stop, recover, preserve compatibility, and keep user judgment visible if a future source
authority transition fails, partially succeeds, or creates compatibility mismatch.

This document is not:

- a rollback implementation
- a rollback command design
- a migration plan
- a migration script
- a CLI command design
- a schema, TypeScript model, or validator specification
- a runtime implementation
- a generated artifact design
- a Graph-source promotion declaration

The current operational source remains tree-native artifacts until a separate Graph-source promotion phase receives
explicit user approval. Because tree-native artifacts are already the current operational source in this phase,
`rollback` is not an immediate action. It is a future safety model that must exist before source authority can be
changed.

## Core Definition

Rollback / Compatibility Strategy:

```text
A concept-level safety policy that defines how PBE preserves source authority clarity, traceability, evidence
integrity, user acceptance authority, execution boundaries, and compatibility views during or after a future source
authority transition.
```

The strategy exists to prevent unsafe promotion and unsafe recovery. It does not move source authority, create rollback
mechanics, or retire artifacts by itself.

After any future promotion, these boundaries must still hold:

- only the user can accept product results
- Cycle Contracts and Node Execution Contracts continue to bound execution
- Check/Evidence policy continues to define proof
- Control Nodes continue to expose blockers, decisions, impact, evidence gaps, and compatibility mismatch that affect
  judgment
- compatibility views must keep explicit source-authority boundary and source-reference markings

## Rollback Vs Compatibility Terms

Use these terms narrowly:

| Term                          | Meaning                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| rollback                      | Future user-governed recovery concept that returns source authority to a previous safe point or approved source authority after promotion.                                     |
| fallback                      | Safe judgment or recovery concept that defers to current operational source, or uses an explicitly scoped compatibility view as review/reference rather than source authority. |
| compatibility period          | Future period after explicit promotion when older tree-native artifacts or packages remain for projection, review, rollback, or legacy bridge.                                 |
| maintained compatibility view | Non-authoritative or explicitly scoped view kept for transition, review continuity, rollback reference, trust, or external compatibility.                                      |
| archival snapshot             | Historical state preserved for rollback, reference, audit, or comparison. It is not current source authority by default.                                                       |
| retired artifact              | Artifact no longer used as an active compatibility bridge after explicit cleanup decision and satisfied retirement conditions.                                                 |

Rollback and fallback are not shortcuts around user approval. Compatibility periods and maintained compatibility views
are not proof that older artifacts remain authoritative.

Rollback is also not the same as revision or reopen. Rollback addresses source-authority recovery and compatibility
behavior around a future transition. Change Lifecycle addresses feedback, drift, stale work, bounded revision, refreshed
Evidence, and renewed acceptance for product work. A source rollback can trigger Change/Impact review, but it must not
silently revise product scope or mark affected work fresh.

## Rollback Trigger Categories

A future transition review must treat these as rollback, fallback, blocker, or compatibility-control trigger
candidates:

| Trigger category           | Meaning                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| source authority confusion | Users or agents cannot tell whether graph, tree, or projection is the operational source.                        |
| traceability loss          | Product -> Work -> Test -> Evidence -> Acceptance links are broken, hidden, or no longer reviewable.             |
| evidence integrity failure | Required Evidence is missing, stale, partial, or exception-level and the limitation is hidden.                   |
| acceptance authority risk  | State or language makes Codex/PBE appear to self-approve product results.                                        |
| execution boundary breach  | Execution Contract scope, forbidden scope, or stop conditions are bypassed or buried by the transition.          |
| projection/parity failure  | Future graph source candidate and tree-native projection or compatibility view do not preserve the same meaning. |
| compatibility mismatch     | Legacy/canonical mismatch affects current approval, scope, verification, transition review, or user judgment.    |
| unresolved Control Node    | Active blocker, decision, impact, evidence, acceptance, or compatibility control record blocks review.           |
| user rejection or defer    | The user rejects, defers, or does not approve promotion, rollback, fallback, or compatibility exception.         |

A trigger does not automatically mean rollback must happen. It means the condition must be surfaced, classified, and
reviewed rather than hidden.

## Rollback And Compatibility Status Categories

These status labels are concept labels only. They are not CLI states, schema enums, Autoflow states, validator outputs,
or Acceptance Tree states.

| Status                   | Meaning                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| rollback-not-needed      | Review found no rollback need for the scoped issue, with supporting Evidence or explicit not-applicable reason.                        |
| rollback-ready           | Rollback could be performed if approved because source authority, snapshots, affected views, and risks are clear.                      |
| rollback-required        | Safe progress or approval requires rollback or equivalent user-approved recovery.                                                      |
| rollback-blocked         | Rollback is needed or requested, but required Evidence, authority clarity, snapshot, or user decision is missing.                      |
| rollback-complete        | User-approved rollback/recovery is complete and source authority, projections, Evidence, Acceptance, and Control Nodes are reviewable. |
| compatibility-maintained | A compatibility view remains active as an explicitly marked bridge, projection, review aid, or rollback reference.                     |
| compatibility-expiring   | A compatibility view is planned for retirement but still has active dependency, review, or unresolved condition.                       |
| compatibility-retired    | Artifact is no longer an active bridge after explicit cleanup decision and satisfied retirement conditions.                            |

`rollback-complete` does not erase the history of the transition, Evidence exceptions, Control Nodes, or user decisions.
It means the scoped recovery result is visible and reviewable.

## Safety Principles

The following principles apply before, during, and after any future source authority transition:

- No silent rollback and no silent promotion.
- Rollback, fallback, and compatibility retirement require visible user judgment when they affect authority, evidence,
  acceptance, or current scope.
- Codex/PBE cannot self-approve rollback, fallback, promotion, compatibility exceptions, or artifact retirement.
- A rollback decision must be visible through Approval Brief or an equivalent user judgment surface.
- AI self-report is not rollback Evidence.
- Rollback must preserve or explicitly restore Product -> Work -> Test -> Evidence -> Acceptance traceability.
- Rollback must not erase Evidence exceptions, Control Nodes, accepted/deferred user decisions, or compatibility caveats.
- Rollback must not silently delete compatibility artifacts.
- Compatibility views must not be mistaken for source authority.
- Current tree-native artifacts must not be marked superseded before explicit Graph-source promotion.
- Execution Contract boundaries remain binding through transition, fallback, rollback, and compatibility review.

## Compatibility View Policy

Compatibility views may remain after a future promotion only when their role is explicit.

### Why A Compatibility View May Remain

A maintained compatibility view may be useful for:

- review continuity
- rollback reference
- user trust
- legacy documentation bridge
- external package or workflow compatibility
- comparison between source and projection
- bounded transition review

### Required Marking

A maintained compatibility view must make these facts visible enough for safe judgment:

- compatibility status
- source reference it is projected from or compares against
- freshness or known stale status
- projection relation
- known mismatch, exception, caveat, or deferred cleanup condition
- whether it is review aid, rollback reference, legacy bridge, or external compatibility view

The view must not claim product truth independently when a canonical source or promoted source says otherwise. If an
artifact is later promoted to source authority, it must be reclassified under the approved source policy rather than
quietly left under the compatibility-view category.

### Retirement Conditions

A compatibility view may be retired only when all of these are true:

1. no active review, execution, rollback, or external reference depends on it
2. no unresolved rollback need depends on it
3. no user-facing dependency remains
4. no unresolved Compatibility Control Node depends on it
5. Evidence and acceptance state remain traceable without it
6. cleanup is explicitly decided by the user or an approved policy decision

Retirement is not deletion by drift. It is an explicit cleanup outcome.

### Compatibility Artifact Examples

Future promotion may leave these as maintained compatibility views, projection views, rollback references, or retired
artifacts depending on the approved transition:

- `.pbe/blueprint/*`
- `.pbe/codex-execution-pack/*`
- ACEP package views
- task-card views
- legacy public-doc examples

This policy does not decide which artifacts retire. It defines the safety boundary for deciding later.

## Rollback Evidence And Control Records

Rollback readiness and rollback completion require observable Evidence and linked records.

Possible Evidence includes:

- source authority matrix excerpt
- archival snapshot or reviewable diff
- tree/graph/projection comparison note
- Check/Evidence status summary
- Evidence freshness review
- Acceptance Tree status summary
- Approval Brief or equivalent user judgment record
- Control Node summary for blockers, decisions, impact, evidence gaps, or compatibility mismatch
- manual review note when a human judgment is the evidence category
- explicit Evidence exception record

Not Evidence:

- "AI checked rollback readiness."
- "The graph and trees are aligned."
- "No compatibility issue found."
- "This should be safe."

AI summaries may point to Evidence, but they cannot replace the Evidence itself.

Rollback triggers may create or update:

- Evidence Control Node when proof is missing, stale, partial, or exception-level
- Impact Control Node when completed, verified, or accepted nodes may be affected
- Decision Control Node when source authority, risk, scope, or cleanup requires user judgment
- Compatibility Control Node when legacy/canonical or projection/source mismatch affects approval, scope, verification,
  transition, or rollback
- Acceptance Control Node when acceptance state is opened, invalidated, deferred, renewed, or closed

For a result to be described as `rollback-complete`, PBE must make these reviewable:

1. current source authority after rollback or fallback
2. affected projections and maintained compatibility views
3. Evidence freshness and remaining Evidence exceptions
4. Acceptance state impact
5. open, resolved, deferred, or superseded Control Nodes
6. remaining user judgment or explicit no-remaining-judgment statement

An Evidence exception is not proof. It is a visible exception record that may allow review, warning, deferral, or
decision, depending on risk and user judgment.

## Relationship To Existing Concept Policies

### Source Transition Path

[source-transition-path.md](source-transition-path.md) names Rollback / Compatibility Strategy as a promotion
prerequisite.
This policy satisfies that concept-policy prerequisite, but it does not implement rollback mechanics or promote source
authority.

### Runtime Feasibility Demonstration

[runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md) defines representative feasibility Evidence.
`partially demonstrated`, `blocked`, or `deferred` demo results may become rollback readiness blockers, compatibility
exceptions, or promotion blockers.

### Representative Runtime Feasibility Demo

[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md) selects the demo slice and
requires rollback/compatibility readiness notes in future demo output. Those notes use concept labels only and do not
implement rollback mechanics.

[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md) records the current manual demo
result. Its rollback/compatibility notes use concept labels only: no rollback action, fallback action, compatibility
retirement, migration, or source-authority change is performed. The demonstrated representative result now includes
renewed Acceptance with retained warnings, but keeps rollback/promotion readiness blocked until generated/parity
expectations are supported by observable output and source-transition prerequisites are resolved. PP-001 confirmation,
supplemental compatibility mismatch Evidence, bounded runtime fixture Evidence, and renewed Acceptance do not perform
cleanup, recovery, or source promotion.

[graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md) records the readiness review and
warning classification. It now treats manual equivalent read-model parity output as sufficient for limited pilot
decision preparation with warnings, while generated builder output remains a full-promotion/repeatability question.

Manual equivalent read-model parity artifacts now resolve that read-model output blocker for limited pilot decision
preparation while keeping generated builder output as a later full-promotion or repeatability question. The artifacts do
not perform rollback, fallback, compatibility retirement, migration, or source promotion.

### Maintainability Graph

[maintainability-graph.md](maintainability-graph.md) remains the canonical read/alignment model and long-term
source-model candidate. This policy does not make it the current source.

### Legacy Compatibility Map

[legacy-compatibility-map.md](legacy-compatibility-map.md) defines how legacy terms and compatibility artifacts are read.
This policy reuses that map when deciding whether an older artifact is simple compatibility, a maintained compatibility
view, a rollback reference, a retirement candidate, or a Compatibility Control Node trigger.

### View Tree Pack

[view-tree-pack.md](view-tree-pack.md) defines projection/read views. A View Tree Pack may become a maintained
compatibility view or projection aid only when its source relation, freshness, and authority boundary are explicit.

### Execution Contract

[execution-contract.md](execution-contract.md) remains the execution boundary. Transition, fallback, rollback, and
compatibility views do not authorize work outside selected/foundation scope or without required Checks and Evidence.

### Check / Evidence Policy

[check-evidence-policy.md](check-evidence-policy.md) defines rollback proof rules. Rollback readiness requires observable
Evidence, not AI self-report, and Evidence exceptions remain visible rather than treated as proof.

### Control Node Policy

[control-node-policy.md](control-node-policy.md) defines the control records used when rollback triggers affect workflow
or user judgment. Rollback should use Decision, Impact, Evidence, Acceptance, and Compatibility Control Nodes rather than
hiding mismatch in prose.

### Change Lifecycle

[change-lifecycle.md](change-lifecycle.md) defines feedback, drift, impact, reopen, refreshed Evidence, and renewed
acceptance for product work. Rollback / Compatibility Strategy does not replace that lifecycle; it can require Change or
Impact handling when source-authority recovery affects completed, verified, or accepted nodes.

### Approval Brief

[approval-brief.md](approval-brief.md) defines the user-facing judgment surface. Promotion, rollback, fallback, and
compatibility retirement decisions must be surfaced there or through an equivalent review mechanism when they affect
authority, evidence, acceptance, scope, or user trust.

### PBE Runtime Architecture

[pbe-runtime-architecture.md](pbe-runtime-architecture.md) defines current runtime authority as tree-native artifacts
plus contracts, evidence, acceptance, skills, and CLI gates. This policy preserves that current authority.

## Scope Boundaries

This policy does not implement:

- rollback commands
- migration commands
- source-model conversion
- schemas or TypeScript models
- validators
- runtime behavior
- generated compatibility artifacts
- generated rollback reports
- Graph-source promotion

Those remain later concept or implementation questions.

## Remaining Open Questions

- How long should a post-promotion compatibility period last, and what default exit criteria should it use?
- Which compatibility views must remain maintained after promotion?
- How should a future validator or CI check rollback readiness without over-automating source authority decisions?
- Does rollback review need a specialized Approval Brief template?
- Who approves compatibility retirement, and at what review point?
- Should the next decision surface be limited pilot promotion or full promotion?
- Will the user accept ACEP task-card public-doc cleanup as deferred cleanup, or require cleanup before promotion
  approval?
- Does full Graph-source promotion require an actual generated graph builder or CLI-backed read-model output?

## Related Gate

This policy satisfies the Rollback / Compatibility Strategy concept-policy completion condition for Graph-source
promotion readiness.

It does not complete actual rollback mechanics, compatibility artifact generation, migration mechanics, actual runtime
feasibility evidence strengthening, projection/parity implementation, or Graph-source promotion itself.
