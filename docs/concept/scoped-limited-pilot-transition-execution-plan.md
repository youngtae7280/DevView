# Scoped Limited Pilot Transition Execution Plan

Status: scoped-limited-pilot-transition-execution-plan / dry-run-selected / source-authority-unchanged

## Document Purpose

This plan defines how PBE should decide the next execution mode for the approved Todo Search limited pilot transition.

It is an execution planning and judgment surface. It is not:

- actual source authority transition execution
- full Graph-source promotion
- broad source authority change
- Maintainability Graph promotion to current operational source
- tree-native artifact retirement, deletion, or supersession
- public-doc cleanup
- generated graph builder, CLI, schema, runtime, model, validator, migration, or rollback implementation
- Codex/PBE self-approval

The prior [limited-pilot-transition-record.md](limited-pilot-transition-record.md) records that the user approved the
bounded limited pilot option. This document defines the execution-mode choices, evidence standards, and approval gates
that must stay separate before anything authority-bearing is executed.

The user selected Option 1, `Run dry-run / review-only scoped pilot first`, on 2026-06-25. The resulting review-only
observation is recorded in
[dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md). That record
does not execute scoped source-authority transition and does not approve full Graph-source promotion.

The user then approved scoped source-authority pilot preparation. The preparation package is recorded in
[scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md). It does
not approve actual scoped source-authority execution.

The user then required generated builder / CLI-backed read-model Evidence before actual scoped execution. That
requirement is recorded in [generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md)
and does not approve implementation.

## Scope

### Primary Scope

```text
examples/adoption/todo-search-slice
```

The plan applies only to the Todo Search representative demo-support slice and its bounded Graph-first read/alignment
artifacts.

### Supplemental Evidence Only

```text
examples/adoption/compatibility-mismatch-slice
```

The compatibility mismatch slice remains supporting Evidence for compatibility handling. It is not pilot source scope.

### Explicit Non-Scope

This plan does not include:

- full PBE source transition
- full Graph-source promotion
- public-doc cleanup
- CLI/schema/runtime/model/validator/generator implementation unless later selected as a prerequisite
- migration or rollback command implementation
- tree-native artifact retirement
- full Todo app implementation

## Current Source Boundary

| Item                                             | Current role                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Tree-native selected-slice artifacts             | Current operational source for the Todo Search pilot scope.                       |
| Manual Maintainability Graph read-model artifact | Read/alignment Evidence for review; not source authority.                         |
| View Instance Manifest                           | Projection Evidence for 7 Core Views; not source authority.                       |
| Limited Pilot Transition Record                  | Records the user's approved bounded decision; does not execute source transition. |
| Compatibility mismatch supplemental slice        | Supporting Evidence for a retained compatibility warning; not source authority.   |

Source authority remains unchanged until the user explicitly approves an execution mode that changes a scoped boundary.

## Execution Mode Options

### Option 1: Run Dry-Run / Review-Only Scoped Pilot First

Recommended.

Current selection:

```text
selected by user on 2026-06-25; observation recorded
```

Meaning:

- no source authority change
- no tree-native retirement
- no full promotion
- exercise the Graph-first read-model, View Instance Manifest, 7 Core Views, Approval Brief, and Control Node summary as
  a review workflow only
- produce an execution observation record

Expected output:

- dry-run observation record
- view coverage observation
- Check/Evidence observation summary
- Approval Brief observation summary
- Control Node observation summary
- retained warning carry-forward
- non-promotion statement

This option tests workflow clarity without risking authority confusion.

### Option 2: Approve Scoped Source-Authority Pilot Execution

Meaning:

- Todo Search slice only
- potential scoped source-authority boundary change inside the pilot scope
- requires separate explicit user approval before execution
- must define source boundary, fallback, rollback, compatibility marking, and acceptance impact

Required before execution:

- explicit user approval for this mode
- scoped source authority matrix
- rollback/fallback Evidence
- compatibility marking
- affected artifact list
- Approval Brief or equivalent user judgment surface
- Control Node summary for source authority impact

This option must not be inferred from the existing limited pilot transition record.

### Option 3: Require Generated Builder / CLI-Backed Read-Model First

Meaning:

- block dry-run or scoped source-authority execution until repeatable generated output exists
- create or require a later implementation task for generated graph/read-model output

This option is stricter than the current manual Evidence standard. It may be appropriate if repeatability is required
before any pilot execution.

### Option 4: Require Public-Doc Cleanup First

Meaning:

- block or defer pilot execution until ACEP task-card wording cleanup is done
- resolve or reduce the retained Compatibility Control Node warning before execution

This option is not required for review-only dry-run by default, but the user may require it.

### Option 5: Defer Scoped Pilot Execution

Meaning:

- keep current records and warnings visible
- do not execute dry-run or scoped source-authority pilot
- keep tree-native artifacts as operational source

### Option 6: Reject Scoped Pilot Execution

Meaning:

- stop the scoped pilot transition path
- retain the decision package and transition record as historical review artifacts
- keep tree-native artifacts as operational source

## Recommended Path

```text
Run dry-run / review-only scoped pilot first
```

Reason:

- it exercises the Graph-first workflow without changing source authority
- it can test whether Node/Edge/Tag parity, View Instance Manifest, Scope / Execution View, Approval Brief, and Control
  Node summaries are usable in practice
- it preserves tree-native fallback
- it keeps retained warnings visible
- it can identify whether scoped source-authority execution needs generated output, cleanup, or stronger rollback
  evidence before approval

## Evidence Required Per Mode

| Evidence / record                                    | Dry-run / review-only | Scoped source-authority pilot | Notes                                                                     |
| ---------------------------------------------------- | --------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| Manual read-model parity artifact                    | required              | required                      | Already present; remains read/alignment Evidence.                         |
| View Instance Manifest / 7 Core View coverage        | required              | required                      | Must show Scope / Execution View and retained warning visibility.         |
| Runtime fixture command Evidence                     | required              | required                      | Existing Vitest Evidence remains bounded fixture proof only.              |
| Approval Brief observation summary                   | required              | required                      | Dry-run can produce observation; authority pilot needs approval surface.  |
| Control Node summary                                 | required              | required                      | Decision/Evidence/Compatibility/Impact/Acceptance records remain visible. |
| Execution observation record                         | required              | required                      | Dry-run output is observation only; authority pilot output is stronger.   |
| Explicit source authority matrix                     | not required          | required                      | Required before any scoped source authority boundary change.              |
| Rollback/fallback Evidence                           | not required          | required                      | Dry-run needs boundary statement only; authority pilot needs evidence.    |
| Compatibility marking / retained warning disposition | required              | required                      | Cleanup can remain deferred only if explicitly accepted for the mode.     |
| Separate user approval for execution                 | required              | required                      | User must pick the mode. Scoped authority mode needs stronger approval.   |
| Generated builder / CLI-backed read-model output     | optional              | optional or prerequisite      | User may require it before either mode.                                   |

AI self-report is not Evidence for either mode.

## Approval Brief Draft

### Intent Understood

PBE is asking which execution mode should be used for the approved Todo Search limited pilot transition path.

### Result Summary

The recommended next action is a dry-run / review-only scoped pilot. It would exercise the manual Maintainability Graph
read-model, View Instance Manifest, 7 Core Views, Approval Brief, Control Node summary, and retained warning handling
without changing source authority.

### Verification Summary

| Check                                   | Current status     | Summary                                                                         |
| --------------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| Limited pilot decision approved         | present            | User approved bounded option on 2026-06-25.                                     |
| Source authority unchanged              | present            | Tree-native selected-slice artifacts remain operational source.                 |
| Read-model parity Evidence              | present            | Manual Node/Edge/Tag parity artifact and View Instance Manifest are reviewable. |
| Runtime fixture Evidence                | present / fresh    | Bounded Vitest Evidence exists for title + note/content behavior.               |
| Generated builder / CLI-backed output   | missing / optional | Not required for recommended dry-run unless user selects it as prerequisite.    |
| Public-doc cleanup                      | deferred warning   | ACEP task-card cleanup remains deferred and visible.                            |
| Scoped source-authority execution proof | not started        | Requires separate mode approval, source matrix, rollback/fallback Evidence.     |

### Remaining Judgment

The user must choose one execution mode:

- run dry-run / review-only scoped pilot first
- approve scoped source-authority pilot execution
- require generated builder / CLI-backed read-model first
- require public-doc cleanup first
- defer scoped pilot execution
- reject scoped pilot execution

### Approval Choice Candidates

- `Run dry-run / review-only scoped pilot first`
- `Approve scoped source-authority pilot execution`
- `Require generated builder / CLI-backed read-model first`
- `Require public-doc cleanup first`
- `Defer scoped pilot execution`
- `Reject scoped pilot execution`

### State Label

```text
Review with warning
```

Reason: the dry-run mode was selected and observed, but the next authority-bearing choice remains a user decision.

## Control Node Summary

| Candidate                                      | Family                       | Status                                                           | Reason                                                                                    |
| ---------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Execution mode selection                       | Decision Control Node        | Waiting for human                                                | User must choose dry-run, scoped authority pilot, prerequisite, deferral, or rejection.   |
| Manual parity / generated builder              | Evidence Control Node        | Manual accepted for dry-run; generated missing for repeatability | Manual parity is enough for dry-run review, but generated output may be required by user. |
| Public-doc cleanup                             | Compatibility Control Node   | Deferred / active warning                                        | ACEP task-card cleanup remains visible and may be prerequisite if user chooses.           |
| Scoped source authority change                 | Impact / Change Control Node | Not started                                                      | Only created/activated if user approves scoped source-authority pilot execution.          |
| Demo-support Acceptance with retained warnings | Acceptance Control Node      | Closed with warnings                                             | Acceptance remains demo-support and does not approve source authority change.             |

## Gate Self-Check

| Gate                           | Result | Notes                                                                                            |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| Non-Promotion Gate             | PASS   | This plan does not declare Graph-source promotion.                                               |
| Execution Mode Separation Gate | PASS   | Dry-run/review-only, scoped source-authority pilot, and full promotion are separated.            |
| Source Authority Boundary Gate | PASS   | Tree-native selected-slice artifacts remain current operational source.                          |
| User Approval Gate             | PASS   | Any execution mode selection still requires user choice; authority mode needs stronger approval. |
| Evidence Reality Gate          | PASS   | Evidence requirements point to observable artifacts, command output, or review records.          |
| Rollback / Compatibility Gate  | PASS   | Rollback/fallback/compatibility marking is required before any authority pilot.                  |
| Implementation Boundary Gate   | PASS   | No CLI, schema, runtime, validator, generator, migration, rollback, or cleanup is implemented.   |

## Final Non-Execution Statement

This plan does not execute scoped source-authority transition.

The dry-run / review-only observation is recorded separately.

This plan does not approve or execute full Graph-source promotion.

This plan does not change source authority.

The next step requires user selection of whether to approve actual scoped source-authority pilot execution with warnings,
require generated builder output first, require public-doc cleanup first, strengthen Evidence, defer, or reject the
scoped pilot.
