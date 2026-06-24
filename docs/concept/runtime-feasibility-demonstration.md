# Runtime Feasibility Demonstration

Status: concept policy

## Document Purpose

Runtime Feasibility Demonstration defines what counts as a representative feasibility check before PBE can consider
Graph-source promotion.

It is a readiness gate. It asks whether a representative PBE lifecycle can be explained, observed, and reviewed while:

- tree-native artifacts remain the current operational source of truth
- Maintainability Graph is used only as a canonical read/alignment model
- Check/Evidence, Approval Brief, Control Node, Change Lifecycle, and Legacy Compatibility policies remain coherent

This document is not:

- a runtime implementation
- a CLI command design
- a schema, TypeScript model, or validator specification
- a migration script
- an implementation roadmap
- an actual demo script
- a Graph-source promotion declaration

## Core Definition

Runtime Feasibility Demonstration:

```text
A representative readiness check showing that PBE's current tree-native lifecycle can be observed and aligned through
the Maintainability Graph model before any source-model promotion is considered.
```

The demonstration is not proof that every feature is implemented. It is proof that the core lifecycle is coherent enough
to inspect with observable Evidence and linked records.

In this policy:

- `runtime` means the current Codex plugin plus `.pbe` artifact workflow, not a daemon, service, or new runtime engine
- `feasibility` means trace-preserving and reviewable enough to consider a future source transition, not complete
  implementation correctness
- `demonstration` means an evidence-bearing representative review, not migration or promotion
- `readiness gate` means a concept-level promotion prerequisite, not a new CLI gate, Autoflow state, or Acceptance Tree
  closure

AI self-report is not feasibility Evidence. A statement such as "the graph can represent this" must be supported by
observable artifacts, generated/read-model output, validation output, linked records, reviewable diffs, logs,
screenshots, or human review notes.

## Feasibility Status Categories

Future demonstration results use these concept statuses:

| Status                 | Meaning                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| demonstrated           | Required claim or scenario has observable Evidence and no unresolved blocker.                   |
| partially demonstrated | Some linked records or Evidence exist, but coverage, freshness, or scenario breadth is limited. |
| blocked                | A required claim or scenario cannot be judged safely with current artifacts or Evidence.        |
| deferred               | The claim or scenario is intentionally postponed with reason, risk, and later remedy condition. |
| not-applicable         | The claim or scenario does not apply to the selected representative slice.                      |

`partially demonstrated`, `blocked`, and `deferred` must not be hidden. They become promotion blockers, warnings, or open
questions depending on severity and remaining judgment.

These labels are scoped to runtime feasibility results. They are not Approval Brief states, Control Node lifecycle
states, Autoflow states, or Acceptance Tree closure states.

## Minimum Feasibility Claims

A representative future demo must be able to support at least these claims:

| Claim                                                                                                                                        | Required Concept Meaning                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maintainability Graph can be constructed or interpreted as a read/alignment model while tree-native artifacts remain the operational source. | Graph reading must not mutate source authority or mark trees superseded.                                                                              |
| Product intent traces through Project, Work, Test, Evidence, and Acceptance without broken meaning.                                          | The demo must show why work exists, what verifies it, what Evidence supports it, and what acceptance state is affected.                               |
| Cycle Contract and Node Execution Contract bound execution scope.                                                                            | The demo must show selected/foundation scope, forbidden/out-of-scope behavior, and stop/change handling without treating task cards as the authority. |
| Check/Evidence policy separates required Checks from observable Evidence.                                                                    | Required Check, Evidence category, Evidence status, freshness, and exception status must be distinguishable.                                          |
| Approval Brief summarizes user judgment without dumping internal trace.                                                                      | Intent, result, verification, remaining judgment, and approval choice must be visible at user-decision level.                                         |
| Control Nodes represent blocker, decision, stale/reopen, evidence gap, and compatibility mismatch when they affect workflow.                 | Control records must not become a catch-all Graph dump, and only user-relevant control points appear in Approval Brief.                               |
| Legacy Compatibility Map resolves legacy/canonical mismatch without runtime source promotion.                                                | Legacy terms or artifacts must be read through compatibility policy unless they affect current judgment and become Control Node candidates.           |
| Change Lifecycle explains stale, invalidated, reopened, unaffected, refreshed, and closed affected nodes.                                    | Change/Impact handling must preserve bounded revision and renewed evidence/acceptance flow.                                                           |

## Representative Scenario Set

A future demo should cover a representative lifecycle slice, not every runtime feature.

### Happy Path

```text
selected Product branch
-> Project / Work derivation
-> Test and Evidence links
-> Approval Brief
-> user-controlled Acceptance closure
```

The claim is demonstrated only if intent, work, verification, Evidence, and acceptance can be traced without replacing
tree-native source artifacts.

### Stale Evidence / Reopen Path

```text
change or drift
-> Change Control Node
-> Impact classification
-> affected nodes stale / invalidated / reopened / unaffected
-> refreshed Evidence
-> renewed Approval Brief
-> renewed Acceptance judgment
```

The demo must show stale or invalidated Evidence as visible status, not silently fresh proof.

### Decision Required Path

```text
user judgment, scope choice, risk acceptance, or intent conflict
-> Decision Control Node
-> Approval Brief: Decision required
-> user choice or explicit deferral
```

The demo must distinguish evidence insufficiency from a human policy or scope decision.

### Evidence Exception Path

```text
missing / stale / partial / exception Evidence
-> Evidence Control Node or visible warning record
-> Approval Brief: Review with warning, Decision required, or Blocked
```

An Evidence exception is not proof. It must state the missing Check, reason, residual risk, required user judgment, and
later remedy condition.

### Compatibility Mismatch Path

```text
legacy term or artifact affects current judgment / scope / verification
-> Legacy Compatibility Map interpretation
-> Compatibility Control Node candidate when judgment is affected
```

Simple historical wording stays in the map or glossary. A mismatch that affects current approval, verification, scope,
or migration judgment becomes a control candidate.

### Scope Boundary Path

```text
finding or change outside Execution Contract
-> stop / Change Node / Decision Control Node
-> bounded revision or user decision
```

The demo must show that out-of-contract discoveries do not silently expand selected work.

## Evidence And Observation Standard

Runtime feasibility must be judged from observable artifacts.

Acceptable future Evidence categories include:

- tree-native artifact snapshot or reviewable diff
- generated or inspected read-model output
- linked Product / Work / Test / Evidence / Acceptance records
- Cycle Contract or Node Execution Contract excerpt
- command output or validation result
- Approval Brief draft or review surface
- Control Node or compatibility record
- screenshot, log, trace excerpt, or manual review note when applicable
- explicit Evidence exception record

Not Evidence:

- "AI checked it."
- "This should work."
- "The graph can represent it."
- "No issue found."

AI summaries may point to Evidence, but they cannot replace Evidence.

Trace Detail remains hidden by default. It should appear only for high-risk triggers or explicit user requests, and then
only for the relevant Check, Evidence, Control Node, or compatibility path.

## Demonstration Result Shape

A future demonstration result should summarize:

1. selected representative slice
2. covered scenario paths
3. feasibility status per minimum claim
4. observable Evidence references
5. partial, blocked, deferred, or not-applicable items
6. remaining user judgment
7. promotion blockers and open questions

This result shape is conceptual only. It does not define a file format, CLI output, schema, validator, or generated
artifact.

The representative slice and Evidence review checklist are selected in
[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md). That readiness artifact prepares
demo execution but does not execute it.

The current manual result is recorded in
[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md). That result is
`partially demonstrated`, so it records useful Evidence, selected-slice demo-support artifacts, and visible gaps but
does not satisfy promotion readiness by itself.

## Promotion Boundary

Runtime Feasibility Demonstration is a Graph-source promotion readiness gate. It is not Graph-source promotion.

Even if a representative demo is `demonstrated`, Maintainability Graph does not become the source model until a later
phase also defines and receives explicit approval for:

- Source Transition Path authority requirements
- Rollback / Compatibility Strategy safety requirements
- required generated or maintained projections
- validator and CLI implications
- migration or non-migration boundary
- human approval to promote source authority

If the demo is `partially demonstrated`, `blocked`, or `deferred`, that result must become a promotion blocker, open
question, or visible risk until resolved.

A successful demo may support a future Approval Brief for Graph-source promotion readiness. It does not mutate runtime
authority, close Acceptance Tree state, retire compatibility terms, resolve source transition, or perform rollback by
itself.

## Relationship To Other Concept Docs

### Maintainability Graph

[maintainability-graph.md](maintainability-graph.md) names the canonical read/alignment model and future source-model
candidate. This policy defines the representative feasibility condition that must be satisfied before source promotion
can be considered.

### PBE Runtime Architecture

[pbe-runtime-architecture.md](pbe-runtime-architecture.md) defines the current operational architecture. The
demonstration must show feasibility without replacing tree-native artifacts, contracts, skills, evidence, acceptance, or
CLI gates.

### Check / Evidence Policy

[check-evidence-policy.md](check-evidence-policy.md) defines what counts as Check and Evidence. This policy reuses that
standard for demo Evidence and does not allow AI self-report as proof.

### Approval Brief

[approval-brief.md](approval-brief.md) defines the user-facing judgment surface. A future demo should show how feasibility
results become intent, result, verification, remaining judgment, and approval choice summaries without exposing full
trace by default.

### Control Node Policy

[control-node-policy.md](control-node-policy.md) defines blocker, decision, stale/reopen, evidence, acceptance, and
compatibility control records. A future demo should show only user-relevant Control Nodes in Approval Brief.

### Legacy Compatibility Map

[legacy-compatibility-map.md](legacy-compatibility-map.md) defines how legacy terminology and artifacts are interpreted.
The compatibility mismatch scenario must reuse that boundary instead of treating every legacy phrase as a control
record.

### Change Lifecycle

[change-lifecycle.md](change-lifecycle.md) defines feedback, drift, impact, stale/reopen, refreshed Evidence, review, and
renewed acceptance flow. A future demo must include at least one stale/reopen path.

### Open Questions

[open-questions.md](open-questions.md) records remaining unknowns such as fallback or supplemental slice selection,
generated demo result artifact, CI/validator connection, projection/parity detail, rollback readiness automation, and
compatibility period rules.

### Source Transition Path

[source-transition-path.md](source-transition-path.md) defines the authority transition path that remains required after
representative feasibility is demonstrated.

### Representative Runtime Feasibility Demo

[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md) selects the recommended
representative slice and defines the demo Evidence review checklist. It does not provide demo Evidence by itself.

### Actual Runtime Feasibility Demo Result

[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md) records the current manual
Evidence pack for the selected slice. Its strengthened `partially demonstrated` result now includes Project/Contract,
Change/Impact, Approval Brief, Compatibility Review, and Evidence Exception support artifacts, while keeping Product
Patch confirmation, refreshed revision Evidence, generated graph output, and real compatibility mismatch coverage
visible as remaining gaps.

### Rollback / Compatibility Strategy

[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) defines recovery, fallback, compatibility view,
and retirement safety rules. A partial, blocked, or deferred feasibility result can become a rollback readiness blocker,
compatibility exception, or promotion blocker under that policy.

## Scope Boundaries

This policy does not implement:

- actual demo execution
- a concrete demo fixture artifact
- a CLI command
- a validator
- a schema or TypeScript model
- a generated artifact
- a migration script
- rollback mechanics
- compatibility artifact generation
- Graph-source promotion

Those remain later concept or implementation questions.

## Remaining Open Questions

- Should future demo results become a generated artifact?
- How should future demo results connect to CI or validators?
- Does Product Patch `PP-001` need actual user confirmation plus refreshed revision Evidence before the stale/reopen path
  can be called `demonstrated`?
- Is no real selected-slice compatibility mismatch sufficient for promotion readiness, or is a supplemental
  compatibility mismatch slice required?
- What fallback slice should be used if the Todo Search slice cannot produce Project/Contract, compatibility, or
  stale/reopen Evidence during actual execution?

## Related Gate

This policy satisfies the Runtime Feasibility Demonstration concept-policy completion condition for Graph-source
promotion readiness.

The separate actual demo result records a partial manual Evidence pack. It does not complete rollback mechanics,
compatibility artifact generation, or Graph-source promotion itself.
