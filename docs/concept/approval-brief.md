# Approval Brief

Status: concept policy

## Document Purpose

Approval Brief is the user-facing judgment surface for a PBE step, gate, review point, or proposed transition.

It helps the user understand:

- what PBE believes the user intended
- what result exists or is being proposed
- what checks and evidence support the result
- what judgment, risk, unknown, or warning remains
- what approval choice is currently available

Approval Brief is not an internal Graph explanation. It must not make Codex look like the approver. Codex and PBE may
submit work for review or present choices, but only the user can accept product results.

## Scope

This policy defines the concept-level shape of Approval Briefs:

- required user-facing sections
- approval state labels
- approval action labels
- evidence and exception handling
- Trace Detail exposure rules
- alignment with Execution Contracts
- compatibility with Acceptance Tree closure

Detailed Check/Evidence meaning, categories, statuses, freshness, and exception rules live in
[check-evidence-policy.md](check-evidence-policy.md). This document defines how those facts appear on the user-facing
Approval Brief surface.

## Non-Goals

This document does not define:

- a CLI command
- a schema
- a validator
- a database model
- a UI
- a template engine
- an acceptance storage format
- a graph artifact
- a migration script

Implementation questions remain open until a later implementation phase.

## Approval Brief Structure

Every Approval Brief uses five user-facing sections.

```text
1. Intent understood
2. Result summary
3. Verification summary
4. Remaining judgment
5. Approval choice
```

### 1. Intent Understood

Purpose:

```text
Show how PBE understood the user's request, feedback, gate response, or change intent.
```

Include:

- interpreted intent
- related Product, Flow, Work, or Change reference
- whether the intent is confirmed, inferred, or needs confirmation

Do not:

- present an unconfirmed interpretation as confirmed Product truth
- hide ambiguity that could change product meaning, scope, UX, risk, acceptance, or verification

### 2. Result Summary

Purpose:

```text
Show what was created, changed, proposed, or placed under judgment.
```

Include:

- actual result or proposed result
- touched scope
- known non-scope
- forbidden scope violation, if any
- downstream stage that may start after approval

Do not:

- imply that a result summary automatically creates approval
- imply that untouched future impact has been ruled out unless impact analysis has actually done so

### 3. Verification Summary

Purpose:

```text
Show which Checks apply and which Evidence exists.
```

Include:

- required Checks, summarized rather than dumped as an internal trace
- performed Checks
- Evidence status: present, missing, stale, partial, not-applicable, or exception
- Evidence categories that matter to the decision
- missing, stale, partial, or scope-mismatched Evidence
- unknown freshness when freshness cannot be established
- Evidence exception with explicit reason, residual risk, user judgment, and later remedy condition

Do not:

- describe AI self-report as Evidence
- describe Evidence exception as proof
- hide missing, stale, scope-mismatched, or unknown-freshness Evidence

Evidence exception is not proof. It is a visible record of why Evidence is absent, omitted, not runnable, or otherwise
incomplete.

Verification Summary does not replace Check/Evidence policy, Execution Contract internals, Evidence Tree records, or
Acceptance Tree state. It gives the user enough verification context to decide what to do now.

### 4. Remaining Judgment

Purpose:

```text
Show what still affects the user's decision.
```

Include:

- visible assumptions
- unresolved unknowns
- risks
- decision conflicts
- human gate reason
- accepted or deferred risk, if any

Do not:

- hide risks that are material to user judgment
- overexpose low-risk record-only internal items that do not affect the user decision

### 5. Approval Choice

Purpose:

```text
Show what the user can do now.
```

Default actions:

- Approve this step
- Request revision
- Resolve required item
- Defer approval

Do not:

- imply that approval guarantees no future impact
- imply that approval means the user reviewed the entire internal Graph
- imply that approval treats AI self-report as Evidence
- imply that approval resolves all Unknowns unless the brief explicitly says so

## Approval Brief State Policy

Approval Brief state labels describe the current approval situation. They are not runtime work-unit lifecycle states.

The Approval Brief states are:

- Ready for approval
- Review with warning
- Decision required
- Blocked

Change lifecycle states remain separate:

```text
Requested
Normalized
Scoped
Contracted
Executing
Verifying
Reviewing
Updating
Closed
```

### Ready For Approval

Use when:

- required Checks have sufficient fresh Evidence, or no required Check applies
- no Human Gate is active
- no Blocked Control Node is active
- no required user judgment remains

User meaning:

```text
The user may approve the interpreted intent, result, evidence sufficiency, and shown remaining judgment for this step.
```

### Review With Warning

Use when the result may still be approvable, but one or more visible low-risk warnings exists:

- Evidence is stale, partial, or exception-level but non-blocking and explicit
- optional Evidence is deferred
- non-blocking Unknown exists
- low-risk accepted Risk exists

Trace Detail remains hidden by default. It appears only when a high-risk trigger is active or the user asks for detail.

User meaning:

```text
The user can approve, request revision, or defer after seeing the warning.
```

### Decision Required

Use when:

- Human Gate is active
- the user must answer, choose, confirm, or accept risk
- confirmed intent or decision may change
- risk acceptance requires explicit human judgment
- missing, stale, partial, or exception-level Evidence requires human acceptance, policy choice, or resolution

User meaning:

```text
Approval or progress cannot continue without user judgment.
```

### Blocked

Use when:

- PBE cannot safely continue
- PBE cannot present the result as approvable
- required information is missing
- required verification cannot be satisfied
- required Evidence is missing and no valid exception or human decision can make the result approvable
- scope or authority is unsafe
- the blocker cannot yet be converted into a clear Human Gate decision

User meaning:

```text
The blocker must be resolved, revised, narrowed, or converted into a separate decision before approval can proceed.
```

## Approval Action Policy

Approval actions describe what the user can do. They are separate from the state labels.

### Approve This Step

Means:

```text
The user accepts the interpreted intent, presented result, shown remaining judgment, and evidence sufficiency for this step.
```

Does not mean:

- all future impact is impossible
- the user reviewed the full internal Graph
- AI self-report counts as Evidence
- every Unknown is resolved

### Request Revision

Means:

```text
The user does not accept one or more parts of the result, interpretation, evidence, wording, scope, or risk handling.
```

Change lifecycle relationship:

```text
Reviewing -> Revision requested
```

### Resolve Required Item

Means:

```text
The user provides the choice, confirmation, answer, or risk acceptance needed to resolve a Human Gate or blocking item.
```

Examples:

- confirm intent
- choose option
- accept high-risk Risk
- accept low-risk Evidence omission when allowed
- provide missing information
- resolve decision conflict

### Defer Approval

Means:

```text
The user neither approves nor rejects now and postpones judgment.
```

Change lifecycle relationship:

```text
Reviewing -> Deferred
```

## Execution Contract Alignment

Approval Brief does not expose Execution Contract internals by default. It presents the user-facing judgment summary
derived from contract-relevant facts.

| Execution Contract field                   | Approval Brief section                                     |
| ------------------------------------------ | ---------------------------------------------------------- |
| Task intent                                | Intent understood                                          |
| Allowed scope                              | Result summary                                             |
| Actual touched scope                       | Result summary                                             |
| Forbidden scope                            | Result summary or Remaining judgment                       |
| Required Checks                            | Verification summary                                       |
| Required Evidence                          | Verification summary                                       |
| Evidence exceptions                        | Verification summary or Remaining judgment                 |
| Risks / Unknowns / Assumptions / Decisions | Remaining judgment                                         |
| Human Gate conditions                      | Approval choice / Resolve required item                    |
| Stop conditions                            | State label: Decision required or Blocked                  |
| Output obligations                         | Result summary / Verification summary / Remaining judgment |
| Graph update hints                         | Hidden by default; Trace Detail only when justified        |

## Acceptance Tree Relationship

Approval Brief does not replace Acceptance Tree.

```text
Approval Brief = user-facing judgment surface
Acceptance Tree = durable acceptance state / closure record
```

Approval Brief may support an Acceptance Tree update, but it is not itself the source of all acceptance truth unless a
later phase explicitly defines that mapping.

Approval Brief must preserve these rules:

- Codex may submit for review, not accept product results.
- The user remains the acceptance authority.
- A brief explains what decision may be recorded; it does not silently mutate durable acceptance state.
- Approval of one step does not imply approval of all future impact, hidden Graph state, or unrelated scope.

## Trace Detail Policy

Trace Detail is hidden by default.

Show Trace Detail only when:

1. a high-risk trigger is active
2. the user explicitly asks for detail

High-risk triggers:

1. Intent or decision conflict
2. Broad impact range
3. Weak or missing verification
4. Unresolved control dependency
5. Irreversible or hard-to-recover consequence
6. Sensitive boundary
7. Human gate required

Trace Detail must be scoped to the trigger:

| Trigger                      | Trace Detail Scope                                 |
| ---------------------------- | -------------------------------------------------- |
| Broad impact range           | Affected Product / Flow / Work / Check path        |
| Weak or missing verification | Check / Evidence trace                             |
| Decision conflict            | Related Decision and affected Product / Work scope |
| Sensitive boundary           | Why human judgment or approval is required         |

Trace Detail must not:

- appear on every low-risk report
- become a full Graph dump
- expose unrelated internal graph details
- obscure the user-facing approval choice

## Conceptual Scenarios

### Ready For Approval

A selected documentation change has required checks, fresh validation output, no scope mismatch, and no unresolved
judgment. The brief shows the interpreted intent, changed docs, successful checks, no remaining required decision, and
the `Approve this step` action.

### Review With Warning

A non-blocking optional screenshot is deferred with an explicit low-risk reason. Required checks pass and the result is
otherwise in scope. The brief shows the warning and allows approval, revision, or deferral.

### Decision Required

A proposed UI wording change could alter product meaning. The brief shows the interpreted intent as needing
confirmation, explains the Human Gate reason, and asks the user to `Resolve required item`.

### Blocked

Required Evidence is missing and no valid exception or human decision can make the result approvable yet. The brief
marks the state as `Blocked` and explains the blocker instead of offering approval.

## Remaining Open Questions

- How much CLI support should Approval Brief generation receive in a later implementation phase?
- Should each Human Gate type have a specialized brief template, or should one adaptive structure remain enough?
- Should Approval Brief to Acceptance Tree mapping become a formal generated artifact in a later phase?

## Related Gates

This policy satisfies the Approval Brief policy completion condition for Graph-source promotion readiness at concept
level.

It does not complete Control Node lifecycle policy, Legacy Compatibility Map, runtime feasibility demonstration, or
Graph-source promotion itself.
