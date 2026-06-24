# Check And Evidence Policy

Status: concept policy

## Document Purpose

This policy defines how PBE separates Checks from Evidence, how evidence status affects approval readiness, and how
Verification Summary in an Approval Brief should summarize the result without exposing all internal trace detail.

The policy is concept-level only. It does not define a CLI command, validator, schema, TypeScript model, runtime source
model, or migration behavior.

## Core Distinction

Check:

```text
A condition, question, criterion, or judgment item that must be verified.
```

Evidence:

```text
An observable artifact showing that a Check was actually performed or satisfied.
```

Examples of Evidence include test results, command output, screenshots, logs, trace excerpts, review notes, static
inspection notes, and exception records.

Core rules:

- A Check is a verification obligation linked to requirement, work, risk, acceptance, or review scope.
- Evidence is the observable support for that obligation.
- A Check without Evidence is not complete.
- Evidence without a linked Check may be useful context, but may not be sufficient for user judgment.
- AI self-report is not Evidence.
- AI summary may point to Evidence, but it cannot replace Evidence.

## Check Categories

| Check Type               | Meaning                                                                                        | Typical Links                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Behavior check           | Confirms that the user-expected behavior is actually correct.                                  | Product, Flow, Work, Test, acceptance criteria  |
| Regression check         | Confirms that existing behavior was not broken by the change.                                  | Work, impacted Product, Test, Impact            |
| Integration check        | Confirms that multiple components, files, flows, or responsibilities work together.            | Project, Work, Flow, Cycle, Execution Contract  |
| Visual check             | Confirms that UI/UX, layout, visual state, or screen behavior matches the intended direction.  | Product UX, Visual Design Contract, Test        |
| Risk check               | Confirms that high-risk or uncertain areas were handled safely or surfaced for human judgment. | Risk, Unknown, Work, Human Gate                 |
| Evidence freshness check | Confirms that previous Evidence remains valid after current changes.                           | Evidence, Impact, Test, Acceptance              |
| Acceptance check         | Confirms that user approval criteria are satisfied or that remaining judgment is explicit.     | Acceptance Tree, Approval Brief, Product branch |

A Check is not automatically executable. Some Checks are verified by automated commands, some by manual inspection, some
by human review, and some by explicit exception records.

## Evidence Categories

| Evidence Type                | Meaning                                                                         | Examples                                               |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Test result                  | Automated, manual, smoke, characterization, or regression test result.          | Unit test output, manual smoke checklist               |
| Command output               | Build, lint, typecheck, validate, or CLI execution output.                      | `npm run validate:pbe`, `tsc`, `pbe validate` output   |
| Screenshot / visual artifact | UI/UX or visual-state artifact.                                                 | Screenshot, rendered page image, visual review capture |
| Log / trace excerpt          | Runtime, error, state transition, or execution-flow excerpt.                    | Stack trace, runtime log, state transition log         |
| Static inspection note       | Code, document, configuration, schema, or policy inspection result.             | "Reviewed only docs/concept files" with file list      |
| Human review note            | Human judgment, review, approval, or risk-acceptance note.                      | User approval, explicit waiver, manual review result   |
| Exception record             | Visible record that required Evidence could not be produced or is insufficient. | Not runnable reason, missing hardware note             |

Evidence must be observable. A sentence such as "AI checked this and it works" is not Evidence unless it points to an
observable artifact or human review note.

## Evidence Status Policy

Evidence status describes whether the Evidence can support the linked Check now.

| Status         | Meaning                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| present        | Evidence exists and is linked to the Check.                             |
| missing        | Required Evidence is absent.                                            |
| stale          | Evidence exists but may no longer be valid after current changes.       |
| partial        | Evidence covers only part of the Check.                                 |
| not-applicable | The Check does not require Evidence, or the Check does not apply.       |
| exception      | Evidence is absent or insufficient, but the reason and risk are stated. |

`missing`, `stale`, `partial`, and `exception` must not be hidden. They must appear in the Approval Brief at the level
needed for user judgment.

Trace Detail remains hidden by default. It is shown only when a high-risk trigger is active or the user asks for detail,
and then only for the relevant Check/Evidence path.

## Evidence Freshness

Evidence freshness answers this question:

```text
Does the Evidence still support the Check after the current change?
```

Evidence may become stale when:

- source files changed after the Evidence was captured
- Work, Test, acceptance criteria, or risk scope changed
- a Change or Impact node invalidates previous proof
- visual UI changed after screenshot/manual visual Evidence was captured
- a command output belongs to a previous execution context

Freshness policy is conceptually required, but automatic freshness detection criteria remain a later implementation
question.

## Approval Brief Relationship

Approval Brief Verification Summary consumes Check/Evidence status but does not expose the full internal structure.

It summarizes:

- which Checks were required
- which Checks were performed
- which Evidence exists
- which Evidence is `missing`, `stale`, `partial`, or `exception`
- what remaining judgment the user must make

Approval Brief must not:

- present AI self-report as Evidence
- treat an exception as proof
- hide missing/stale/partial/exception status
- expose unrelated Trace Detail by default
- replace durable Acceptance Tree state

Approval Brief state labels map to Check/Evidence status as follows:

| Approval Brief State | Check / Evidence Meaning                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ready for approval   | Required Checks have sufficient Evidence, or no required Check applies; remaining judgment is approval-level.    |
| Review with warning  | Most Evidence exists, but non-blocking `stale`, `partial`, or `exception` status must be visible to the user.    |
| Decision required    | The issue is not only Evidence sufficiency; user policy, scope, risk acceptance, or approval judgment is needed. |
| Blocked              | Required Check or Evidence is insufficient, so presenting the result as approvable would be unsafe.              |

## Acceptance Tree Relationship

Acceptance Tree stores durable acceptance state. Approval Brief, Verification Summary, Check summaries, and Evidence
summaries do not replace it.

Check/Evidence policy supports Acceptance Tree closure by explaining what verification obligations and proof exist for a
branch, slice, or step. A later implementation may map Approval Brief data into Acceptance Tree updates, but the concept
policy does not define that artifact or mutation.

Durable acceptance still requires:

- user authority
- explicit accepted scope
- known remaining judgment
- current or explicitly handled Evidence status

## Execution Contract Relationship

Execution Contracts may declare required Checks and required Evidence for a Cycle or Node Execution Contract.

The contract can include:

- behavior, regression, integration, visual, risk, freshness, and acceptance Checks
- expected Evidence types
- required commands or manual checks
- stop conditions
- Evidence exceptions allowed or forbidden for the selected scope

Approval Brief does not expose Execution Contract internals by default. It turns contract-relevant facts into the
user-facing Verification Summary and Remaining Judgment sections.

Check/Evidence policy sits between Execution Contract and Acceptance Tree:

```text
Execution Contract -> required Checks / Evidence obligations
Check / Evidence Policy -> what counts as verification and proof
Approval Brief -> user-facing summary
Acceptance Tree -> durable user-controlled acceptance state
```

## Evidence Exception Policy

An Evidence exception is a transparent record that a required Check could not be fully evidenced.

An exception record must include:

1. the Check that could not be performed or fully evidenced
2. why the Check or Evidence could not be completed
3. remaining risk
4. what the user must judge
5. what condition would allow Evidence to be added later

Exception is different from failure. It records the absence or limitation of proof. It does not automatically make work
approvable.

Exception handling:

- Low-risk explicit exception may result in `Review with warning`.
- Human risk acceptance may result in `Decision required`.
- Missing required proof with no acceptable exception results in `Blocked`.
- Exception must remain visible until resolved, accepted, deferred, or replaced by Evidence.

When an Evidence gap affects workflow control, it may create or update an Evidence Control Node:

```text
missing required Evidence -> Evidence Control Node -> Blocked or Decision required
stale non-blocking Evidence -> Evidence Control Node or warning record -> Review with warning
valid Evidence exception -> Evidence Control Node -> Resolved, Deferred, or Active-with-warning
```

Not every Evidence exception must become a separate Control Node in this concept phase. The exact threshold remains a
later implementation question, but hiding material exceptions is not allowed.

## AI Self-Report Limitation

AI statements are not Evidence by themselves.

Not Evidence:

- "I checked it."
- "It works."
- "No issue found."
- "The behavior is correct."

May point to Evidence:

- "The typecheck output is attached."
- "The screenshot artifact shows the confirmed visual state."
- "The static inspection note lists the inspected files and finding."
- "The user review note confirms the manual judgment."

Evidence must be observable. AI summary can organize evidence, but it cannot substitute for the artifact, output, or
human judgment record.

Because AI self-report is not Evidence, it cannot close an Evidence Control Node or remove a Check/Evidence warning.

## Scope Boundaries

This policy does not implement:

- CLI evidence collection
- validator rules
- schema or model changes
- runtime source-model changes
- Graph-source promotion
- generated Approval Brief artifacts
- generated Check/Evidence mapping files

Those remain later implementation or architecture questions.

## Conceptual Scenarios

### Ready For Approval

A docs-only change requires static inspection and repository validation. The static inspection note lists the modified
concept files, `npm run validate:pbe` output is present, and no unresolved judgment remains.

### Review With Warning

A visual check is relevant but the environment cannot capture a screenshot. The exception record says why, states the
remaining risk, and explains what condition would allow screenshot Evidence later. The user may approve with warning,
request revision, or defer.

### Decision Required

A Risk check finds that skipping a hardware-backed manual test may be acceptable only if the user accepts the residual
risk. The issue is a human risk decision, not merely missing command output.

### Blocked

A behavior check is required for selected work, but no test result, command output, manual note, or valid exception
exists. The Approval Brief must not offer the result as ready for approval.

## Remaining Open Questions

- Should Check/Evidence mapping become a separate artifact or remain embedded in existing trees/contracts?
- How much CLI support should collect and display Evidence exceptions?
- What automatic freshness criteria are safe enough for Evidence status?
- Under what conditions should Human review notes count as Evidence?
- Do high-risk areas need required Evidence templates by risk type?

## Related Gate

This policy satisfies the Check / Evidence policy completion condition for Graph-source promotion readiness at concept
level.

It does not complete Legacy Compatibility Map, runtime feasibility demonstration, or Graph-source promotion itself.
