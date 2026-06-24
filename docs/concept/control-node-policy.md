# Control Node Policy

Status: concept policy

## Document Purpose

This policy defines what Control Nodes are, when they are created, how they move through a common lifecycle, and how
they connect to Approval Brief, Check/Evidence policy, Change Lifecycle, Acceptance Tree, Execution Contracts, and legacy
compatibility records.

Control Node policy is concept-level only. It does not define CLI commands, validators, schemas, TypeScript models,
runtime source-model changes, migration scripts, or Graph-source promotion.

## Core Definition

Control Node:

```text
A control record used to explicitly track user judgment, change control, impact scope,
acceptance closure, stale/reopen/block status, or compatibility gaps in the PBE lifecycle.
```

Control Nodes reveal control points that PBE must not silently skip.

A Control Node is not:

- executable Work
- Evidence
- an Approval Brief
- durable Acceptance Tree state
- a replacement for user approval authority
- a catch-all trace record for every internal detail

Core principles:

- Control Nodes can block, warn, reopen, defer, or require user judgment.
- Control Nodes may affect Product, Work, Test, Evidence, Acceptance, and review flow.
- Only user-relevant Control Nodes appear in Approval Brief.
- Internal trace details should not automatically become Control Nodes.
- Risk, Unknown, and Assumption nodes can trigger Control Nodes, but they are not automatically Control Nodes.

## When Control Nodes Are Needed

Control Nodes are needed when a condition affects lifecycle control, user judgment, closure, or safe progress.

### User Decision Required

Use a Control Node when progress depends on:

- scope selection
- risk acceptance
- intent confirmation
- conflicting decision resolution
- policy choice

### Meaningful Change

Use a Change Control Node when feedback, drift, or discovery changes:

- product meaning
- implementation scope
- UX behavior or wording meaning
- risk profile
- acceptance criteria
- verification strategy

### Impact Analysis

Use an Impact Control Node when:

- completed, verified, or accepted nodes may be affected
- Evidence freshness is uncertain
- affected Product, Work, Test, Evidence, or Acceptance branches must be classified
- a bounded revision or reacceptance path is needed

### Acceptance Closure

Use an Acceptance Control Node when:

- durable acceptance state requires user approval
- approval is deferred, rejected, reopened, or renewed
- Codex/PBE has submitted work for review but cannot accept it

### Block Or Reopen

Use a Control Node when safe progress is blocked or previously closed work must reopen because of:

- missing required information
- missing required Evidence
- invalidated acceptance
- stale Evidence
- unsafe scope
- unresolved high-risk Unknown

### Compatibility Or Parity Gap

Use a Compatibility Control Node candidate when:

- a legacy artifact conflicts with canonical policy
- old terminology remains active in a way that affects user or agent judgment
- a migration caveat or parity gap must be recorded for later cleanup

## Control Node Families

| Family                     | Purpose                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Decision Control Node      | Tracks user choice, policy decision, scope decision, risk acceptance, or conflict resolution.                 |
| Change Control Node        | Tracks feedback, drift, or discovery that changes product meaning, scope, UX, risk, acceptance, or checks.    |
| Impact Control Node        | Tracks which Product, Work, Test, Evidence, or Acceptance nodes are unaffected, stale, invalidated, reopened. |
| Acceptance Control Node    | Tracks user approval, deferral, rejection, review request, and closure status.                                |
| Evidence Control Node      | Tracks missing, stale, partial, or exception Evidence when it affects warning, decision, block, or remedy.    |
| Compatibility Control Node | Tracks legacy/canonical mismatch, parity gap, migration caveat, or accepted compatibility exception.          |

Family boundaries:

- Risk, Unknown, and Assumption are not automatically Control Node families.
- A risk can trigger a Decision Control Node when human risk acceptance is required.
- An unknown can trigger a Control Node when it blocks execution, review, or approval.
- An assumption can trigger a Decision or Change Control Node when user feedback confirms, rejects, or changes it.

## Common Lifecycle States

Control Node lifecycle states describe the control record. They are not Approval Brief states.

| State             | Meaning                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Detected          | PBE found a control point, but family, cause, and links are not normalized yet.                |
| Normalized        | Family, cause, and linked scope are identified.                                                |
| Scoped            | Affected scope or judgment scope is known enough to decide next handling.                      |
| Active            | The control point is unresolved and affects workflow, review, warning, or closure.             |
| Waiting for human | User judgment is required before progress, approval, or closure can continue.                  |
| Blocked           | Safe progress or approval request is not possible in the current state.                        |
| Resolved          | Required decision, fix, Evidence, impact handling, or compatibility disposition is complete.   |
| Deferred          | Explicitly postponed; remaining risk or judgment must stay visible when it affects approval.   |
| Closed            | Durable record is closed; later changes require a new Control Node, Change, Impact, or reopen. |
| Superseded        | Replaced by a newer or more accurate Control Node, decision, policy, or compatibility record.  |

Approval Brief state is the user-facing approval situation:

```text
Ready for approval
Review with warning
Decision required
Blocked
```

Control Node lifecycle state is the internal control-record state. A Control Node can cause an Approval Brief state, but
it is not the same state.

## Family Closure Rules

### Decision Control Node

Closure requires one of:

- explicit user decision
- explicit deferral
- conflict resolution
- superseding decision or policy

It must not close because Codex inferred what the user would choose.

### Change Control Node

Closure requires:

- impact analysis completed or explicitly not applicable
- required revision, Evidence refresh, acceptance renewal, or user decision path identified
- no selected scope drift remains unresolved

### Impact Control Node

Closure requires every affected node to be classified as one of:

- unaffected
- stale
- invalidated
- reopened
- closed after refreshed verification

Unclassified affected scope keeps the Impact Control Node Active, Waiting for human, or Blocked.

### Acceptance Control Node

Closure requires the durable acceptance state to reflect the user outcome:

- approved
- rejected
- deferred
- review requested
- invalidated / renewed / reopened as applicable

Codex/PBE may submit for review, but only the user can close product acceptance.

### Evidence Control Node

Closure requires one of:

- missing Evidence is added
- stale Evidence is refreshed or judged not affected
- partial Evidence is completed or explicitly accepted/deferred
- valid Evidence exception records reason, residual risk, user judgment, and later remedy condition
- blocking Evidence gap is resolved or converted into an explicit user decision

AI self-report is not Evidence and cannot close an Evidence Control Node.

### Compatibility Control Node

Closure requires one of:

- mismatch resolved
- compatibility accepted with explicit caveat
- migration or documentation update completed
- deferred with visible risk or cleanup condition
- superseded by a newer compatibility or policy record

Compatibility closure does not imply migration scripts ran or legacy artifacts were automatically changed.

## Approval Brief Relationship

Approval Brief does not expose every Control Node.

Expose a Control Node in Approval Brief when:

1. user judgment is required
2. Approval Brief state becomes `Decision required` or `Blocked`
3. it explains `Review with warning`
4. approval would accept a risk, exception, or deferral
5. acceptance closure, invalidation, or reopen is affected

Hide a Control Node by default when:

1. it is internal trace only and does not affect user judgment
2. it is Closed and has no effect on the current approval choice
3. it is low-risk record-only
4. no Trace Detail request or high-risk trigger is active

When shown, summarize:

- control reason
- affected scope
- required judgment or blocker
- Evidence, risk, or unknown summary if relevant
- available user action

Approval Brief remains the user-facing judgment surface. Control Node remains the underlying control record.

## Check / Evidence Relationship

Check/Evidence policy defines what must be verified and what counts as proof.

Control Node policy defines when insufficient verification becomes a workflow control issue.

Examples:

```text
missing required Evidence
-> Evidence Control Node
-> Approval Brief: Blocked or Decision required
```

```text
stale but non-blocking Evidence
-> Evidence Control Node or warning record
-> Approval Brief: Review with warning
```

```text
valid Evidence exception
-> Evidence Control Node may be Resolved, Deferred, or Active-with-warning
-> Approval Brief: residual risk and later remedy condition shown
```

AI self-report is not Evidence. It cannot satisfy a Check, close an Evidence Control Node, or remove a warning/blocker.

## Change Lifecycle Relationship

Control Nodes explain why the change lifecycle is active.

Conceptual flow:

```text
Feedback or drift
-> Change Control Node
-> Impact Control Node
-> affected nodes marked stale / invalidated / reopened / unaffected
-> bounded revision or decision
-> refreshed Evidence if needed
-> Approval Brief for review
-> Acceptance Control Node update
```

Change Control Node is not the same as Change Tree.

```text
Change Tree = current canonical / active-operational change artifact
older change artifact or view = compatibility artifact only
Change Control Node = conceptual control record explaining why change lifecycle is active
```

The transition stance remains unchanged: tree-native artifacts are the current operational source of truth until
Graph-source promotion receives separate approval.

## Acceptance Tree Relationship

Acceptance Control Node does not replace Acceptance Tree.

```text
Acceptance Tree = durable acceptance state
Acceptance Control Node = conceptual control record for acceptance judgment, blocker, deferral, invalidation, or closure
```

Rules:

- Codex/PBE may submit for review.
- Only the user can accept product results.
- Control Nodes can require user judgment but cannot self-approve.
- Approval Brief can explain what acceptance update may happen, but does not silently mutate durable acceptance state.

## Execution Contract Relationship

Execution Contracts may include:

- stop conditions
- required Checks
- required Evidence
- forbidden scope
- risks
- unknowns
- assumptions
- output obligations

Control Node policy explains when those contract facts become active control records.

Examples:

```text
forbidden scope touched
-> Control Node: Blocked or Decision required
```

```text
required Evidence missing
-> Evidence Control Node
```

```text
risk boundary touched
-> Decision Control Node or risk-triggered Control Node
```

```text
unknown blocks execution
-> Control Node: Waiting for human or Blocked
```

Execution Contract remains the planning/execution boundary. Control Node records the control implication.

## Compatibility / Parity Control

Compatibility Control Node is conceptual in this phase.

It is not:

- a migration script
- an automatic legacy artifact editor
- a validator
- a replacement for Legacy Compatibility Map

It records mismatch, parity gap, accepted compatibility caveat, or migration concern so a user or later phase can judge
it.

Examples:

```text
legacy term still appears as active architecture
-> Compatibility Control Node candidate
```

```text
old ACEP/task-card-only wording conflicts with Execution Contract policy
-> Compatibility Control Node or superseded item record
```

Legacy Compatibility Map defines the compatibility interpretation policy. Compatibility Control Nodes are needed only
when legacy/canonical mismatch affects current approval, verification, scope, migration judgment, or user decision.

## Scope Boundaries

This policy does not implement:

- CLI Control Node commands
- validator transition checks
- schema or model changes
- runtime source-model changes
- Graph-source promotion
- generated Control Node summary artifacts
- migration scripts

Those remain later implementation or architecture questions.

## Conceptual Scenarios

### Decision Required

The user must choose whether a risky shortcut is acceptable. PBE records a Decision Control Node in `Waiting for human`.
Approval Brief shows the control reason, affected scope, residual risk, and `Resolve required item`.

### Review With Warning

A non-blocking Evidence exception remains after a docs-only change. PBE records an Evidence Control Node as Deferred or
Active-with-warning. Approval Brief summarizes the exception and available approval/revision/deferral choices.

### Blocked

Required Evidence for selected behavior is missing and no valid exception exists. PBE records an Evidence Control Node
as Blocked. Approval Brief must not present the result as ready for approval.

### Reopen

User feedback changes acceptance criteria after a branch was accepted. PBE records a Change Control Node and Impact
Control Node, marks affected acceptance/evidence stale or invalidated, and requires bounded revision plus renewed user
acceptance.

## Remaining Open Questions

- Should Control Node summaries become a separate artifact or remain represented through existing trees and control
  files?
- Which Control Node family should receive CLI support first?
- Should every Evidence exception create an Evidence Control Node, or only high-risk/blocking exceptions?
- When should validators check Control Node state transitions?

The boundary between Compatibility Control Node, Legacy Compatibility Map, and `superseded-items.md` is defined in
[legacy-compatibility-map.md](legacy-compatibility-map.md).

## Related Gate

This policy satisfies the Control Node lifecycle policy completion condition for Graph-source promotion readiness at
concept level.

It does not complete runtime feasibility demonstration, source transition path, rollback/compatibility strategy, or
Graph-source promotion itself.
