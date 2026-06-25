# Scoped Source-Authority Pilot Preparation Package

Status: scoped-source-authority-pilot-preparation-package / preparation-approved / followed-by-scoped-execution-record

## Document Purpose

This package prepares the next user decision for a possible scoped source-authority pilot in the Todo Search selected
slice.

It answers what would have to be true before source authority can change inside the bounded pilot scope. It does not
execute that change.

Follow-up status: the user later approved actual scoped source-authority pilot execution for the Todo Search selected
slice with generated Evidence. The execution is recorded in
[scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md). This preparation
package remains the prerequisite decision surface and does not become full Graph-source promotion.

This document is not:

- actual scoped source-authority pilot execution
- full Graph-source promotion
- Maintainability Graph promotion to current operational source
- tree-native artifact retirement, deletion, or supersession
- public-doc cleanup
- CLI/schema/runtime/model/validator/generator implementation
- generated graph builder implementation
- rollback command implementation
- Codex/PBE self-approval

## User Approval Trace

| Field                 | Value                                                    |
| --------------------- | -------------------------------------------------------- |
| Approval source       | parent orchestration chat                                |
| Approval date         | 2026-06-25                                               |
| Approved option       | `Proceed to scoped source-authority pilot preparation`   |
| Approval scope        | Preparation package only                                 |
| Explicit non-approval | actual scoped source-authority execution                 |
| Explicit non-approval | full Graph-source promotion                              |
| Explicit non-approval | source authority change                                  |
| Explicit non-approval | generated builder / CLI-backed read-model implementation |

The approval authorizes this preparation package only.

## Pilot Preparation Scope

### Primary Scope

```text
examples/adoption/todo-search-slice
```

The preparation package applies only to the Todo Search representative demo-support slice.

### Supplemental Evidence Only

```text
examples/adoption/compatibility-mismatch-slice
```

The compatibility mismatch slice remains supporting Evidence for compatibility warning handling. It is not pilot source
scope.

### Explicit Non-Scope

This package does not include:

- full PBE source transition
- full Graph-source promotion
- public-doc cleanup
- CLI/schema/runtime/model/validator/generator implementation
- generated graph builder implementation
- migration or rollback command implementation
- tree-native artifact retirement
- full Todo app implementation

## Candidate Source Authority Boundary

### Current Boundary

Current state remains unchanged:

- Tree-native selected-slice artifacts are the current operational source.
- The manual Maintainability Graph read-model is read/alignment Evidence.
- The View Instance Manifest is projection Evidence.
- Compatibility mismatch supplemental records are warning Evidence, not pilot source scope.
- Demo-support Acceptance is user-approved with warnings, but it is not source-transition approval.

### Candidate Boundary For Future Scoped Pilot Execution

A future scoped source-authority pilot could define a candidate boundary only inside
`examples/adoption/todo-search-slice`.

Two possible candidate standards remain:

| Candidate standard                                       | Meaning                                                                                                                    | Risk / consequence                                                                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Manual read-model as temporary pilot authority candidate | Treat `maintainability-graph-read-model.*` and `view-instance-manifest.*` as the scoped candidate source for pilot review. | Faster learning, but higher authority-confusion risk because no generator/CLI-backed repeatability exists.          |
| Generated builder / CLI-backed read-model required first | Keep manual artifacts as preparation Evidence only until repeatable generated output exists.                               | Slower, but safer for authority transition because the source/fallback/parity boundary can be mechanically checked. |

Preparation finding in this package:

```text
requires-generated-builder-first
```

The user selected that prerequisite after this package. The generated read-model Evidence requirement is recorded in
[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md). It is a requirement record
that led to bounded Todo Search generated output. The output is Evidence only and does not approve actual scoped
source-authority execution.

Reason:

- The dry-run result is `usable-with-warnings`, so the workflow is reviewable.
- Actual scoped source authority execution is stronger than review-only dry-run.
- Manual parity is acceptable as preparation Evidence, but it is not repeatable enough to be the default temporary
  authority candidate without an explicit user risk decision.
- Generated builder / CLI-backed output is the safer prerequisite before any authority-bearing execution.

If the user explicitly accepts the manual authority-candidate risk, the package can support a later
`Approve actual scoped source-authority pilot execution with warnings` decision. That would still require a separate
Approval Brief, source boundary, fallback rule, and rollback/fallback gate.

## Source Authority Matrix

| Item                                             | Current role                                                     | Preparation role                                                 | Possible scoped execution role                                                                     | Fallback/reference role                                           | Retirement allowed?                               |
| ------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| Product selected-slice artifact                  | Current operational product source                               | Source input for intent/requirement nodes                        | Either remains fallback source or maps to scoped graph candidate after explicit execution approval | Primary fallback/reference for product meaning                    | No, not without later explicit user approval      |
| Project selected-slice artifact                  | Current operational boundary source                              | Source input for structure/boundary nodes                        | Either remains fallback source or maps to scoped graph candidate after explicit execution approval | Primary fallback/reference for project boundary                   | No, not without later explicit user approval      |
| Work selected-slice artifact                     | Current operational work source                                  | Source input for task/work nodes and scope boundary              | Either remains fallback source or maps to scoped graph candidate after explicit execution approval | Primary fallback/reference for executable responsibility          | No, not without later explicit user approval      |
| Test selected-slice artifact                     | Current Check source                                             | Source input for check nodes                                     | Either remains fallback source or maps to scoped graph candidate after explicit execution approval | Primary fallback/reference for verification obligations           | No, not without later explicit user approval      |
| Evidence selected-slice artifact                 | Current Evidence source                                          | Source input for evidence nodes and freshness status             | Either remains fallback source or maps to scoped graph candidate after explicit execution approval | Primary fallback/reference for proof and exceptions               | No, not without later explicit user approval      |
| Acceptance selected-slice artifact               | Current demo-support Acceptance record                           | Source input for acceptance/user-decision nodes                  | Must remain user-controlled; cannot be replaced by graph candidate                                 | Primary fallback/reference for accepted-with-warnings state       | No, not without later explicit user approval      |
| Maintainability Graph read-model parity artifact | Manual read/alignment Evidence                                   | Preparation Evidence; candidate only if user accepts manual risk | Possible temporary scoped candidate only after separate user approval or after generated output    | Reference for Node/Edge/Tag parity; not fallback source by itself | No; can be superseded by generated output later   |
| View Instance Manifest                           | Manual projection Evidence                                       | Preparation Evidence for 7 Core Views                            | Possible view/projection definition; not source authority by itself                                | Reference for review workflow and view membership                 | No; can be regenerated/replaced later             |
| Approval Brief                                   | User judgment surface                                            | Preparation and execution decision surface                       | Required approval surface before authority-bearing execution                                       | Review record; does not replace source or Acceptance Tree         | No                                                |
| Control Node summaries                           | Conceptual control records                                       | Preparation risk/decision/evidence/compatibility summary         | Required control visibility for execution                                                          | Reference for blockers, warnings, and decisions                   | No                                                |
| Compatibility mismatch supplemental slice        | Supporting compatibility Evidence                                | Compatibility warning input                                      | Warning/control input only; not pilot source scope                                                 | Reference for ACEP cleanup and compatibility caveat               | No; cleanup requires separate decision            |
| Runtime fixture Evidence                         | Bounded command Evidence                                         | Evidence gate input                                              | Supports behavior verification but not full app proof                                              | Reference for bounded title + note/content behavior               | No                                                |
| Public docs / ACEP docs                          | Public/compatibility documentation with deferred cleanup warning | Compatibility risk input                                         | Must not become pilot source; cleanup may be prerequisite if user requires it                      | Reference for compatibility mismatch and cleanup deferral         | No; cleanup/retirement requires separate decision |

## Execution Prerequisites

### Evidence Gate

| Requirement                           | Current status  | Notes                                                                                             |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| Runtime fixture command Evidence      | present / fresh | `npx vitest run examples/adoption/todo-search-slice/runtime-fixture` passes 1 file/6 tests.       |
| Node/Edge/Tag parity                  | present         | Manual read-model separates `nodeKind`, `edgeType`, and allowed `viewScopedTags`.                 |
| 7 Core View coverage                  | present         | Intent, Behavior, Structure, Scope/Execution, Impact, Verification, Evidence/Acceptance.          |
| Check/Evidence separation             | visible         | Checks and Evidence are separated through Test/Evidence artifacts and read-model edges.           |
| Retained warnings                     | visible         | Bounded fixture, UI visual partial, validator/CI repeatability open, public-doc cleanup deferred. |
| Generated builder / CLI-backed output | present         | Bounded Todo Search generated output exists; execution approval remains separate.                 |

### Authority Gate

Before actual scoped execution, PBE needs:

- exact scoped source boundary
- affected artifact list
- source/fallback precedence rule
- conflict rule between graph read-model and tree-native artifacts
- status labels for graph candidate, tree fallback, and compatibility views
- explicit rule that Acceptance Tree/user acceptance authority is not replaced

Preparation recommendation:

```text
Do not activate a graph/manual read-model source candidate until the user either requires generated output first or
explicitly accepts manual-candidate risk for a bounded pilot.
```

### Rollback / Fallback Gate

Before actual scoped execution, PBE needs:

- tree-native selected-slice snapshot/reference preserved
- fallback trigger categories
- rollback-not-needed condition for review-only mode
- rollback-ready condition for authority-bearing execution
- no silent rollback/fallback
- user-visible rollback/fallback decision surface

Current status:

```text
rollback-not-needed for preparation; rollback-ready not yet established for authority execution
```

### Compatibility Gate

Before actual scoped execution, PBE needs:

- ACEP task-card public-doc cleanup status explicitly accepted or required
- compatibility mismatch retained as visible warning if cleanup remains deferred
- compatibility view marking so supplemental evidence cannot become pilot source silently
- Control Node treatment for cleanup warning

Current status:

```text
compatibility warning visible; cleanup deferred; user decision still needed if cleanup should block execution
```

### Approval Gate

Before actual scoped execution:

- user approval is required
- Codex/PBE cannot self-approve
- demo-support Acceptance is not source-transition approval
- Approval Brief or equivalent user judgment surface must show Evidence, warnings, fallback, compatibility, and
  authority boundaries

Current status:

```text
preparation approved; execution not approved
```

## Preparation Finding

```text
requires-generated-builder-first
```

This is conservative. The dry-run demonstrates that manual artifacts are useful for review, but actual scoped source
authority execution should not default to manual parity as an active candidate source without either:

1. generated builder / CLI-backed read-model output, or
2. a separate user decision accepting manual-candidate risk for this bounded pilot.

## Recommended Next User Decision Surface

After this package, the user should choose one of:

1. `Approve actual scoped source-authority pilot execution with warnings`
2. `Require generated builder / CLI-backed read-model before execution`
3. `Require public-doc cleanup before execution`
4. `Strengthen evidence / run another dry-run`
5. `Defer scoped source-authority pilot`
6. `Reject scoped source-authority pilot`

Recommended option:

```text
Require generated builder / CLI-backed read-model before execution
```

Reason:

- It preserves the dry-run learning while reducing source-authority confusion.
- It gives the future execution approval a repeatable parity artifact instead of a manual-only candidate.
- It makes conflict/fallback checks more reviewable before any authority boundary changes.

If the user values a faster bounded pilot more than repeatability, option 1 can still be presented as a risk-accepted
choice, but it must be explicit.

## Approval Brief Draft

### Intent Understood

PBE is preparing the decision surface for a possible scoped source-authority pilot inside the Todo Search selected slice.

### Result Summary

The preparation package identifies current source authority, possible candidate authority, fallback/reference roles,
Evidence gates, rollback/fallback gates, compatibility gates, and user approval gates. It recommends generated builder /
CLI-backed read-model output before authority-bearing execution.

### Verification Summary

| Check                                      | Status           | Summary                                                                                               |
| ------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| Dry-run observation completed              | present          | `dry-run-scoped-limited-pilot-observation-record.md` is `usable-with-warnings`.                       |
| Runtime fixture Evidence                   | present / fresh  | Bounded Vitest command passes title + note/content behavior checks.                                   |
| Node/Edge/Tag parity                       | present          | Manual read-model and View Instance Manifest are reviewable.                                          |
| Source authority unchanged                 | present          | Tree-native selected-slice artifacts remain operational source.                                       |
| CLI-backed output design                   | present          | `cli-backed-read-model-evidence-output-design.md` defines the output and comparison surface.          |
| Generated builder / CLI-backed output      | present          | Bounded Todo Search generated output exists; validator/CI and execution approval remain separate.     |
| Generated/manual comparison warning review | complete         | The five freshness warnings were reviewed; the current parity report is `comparison-pass`.            |
| Rollback/fallback readiness                | partial          | Not needed for preparation; not ready for authority execution without boundary and fallback Evidence. |
| Compatibility cleanup                      | deferred warning | ACEP task-card public-doc cleanup remains deferred and visible.                                       |
| Actual scoped authority execution approval | resolved         | User approved bounded Todo Search scoped pilot execution; see the execution record.                   |

### Remaining Judgment

The user selected generated builder / CLI-backed read-model Evidence as a prerequisite, selected design-first work, and
approved the bounded implementation task. Generated Evidence now exists for Todo Search, and the user approved the
bounded scoped pilot execution. The next judgment is whether to observe/review the pilot, require validator/CI backing,
require cleanup first, prepare broader promotion review, rollback/defer, or keep the pilot bounded.

### Approval Choice Candidates

- `Observe / review scoped source-authority pilot`
- `Require validator/CI-backed read-model Evidence before execution`
- `Require public-doc cleanup before execution`
- `Prepare broader Graph-source promotion review`
- `Rollback / defer scoped source-authority pilot`

### State Label

```text
Decision required
```

Reason: preparation, output design, bounded generated Evidence, and scoped pilot execution are recorded, but next-phase
review or broader promotion remains unapproved.

## Control Node Summary

| Control record                        | Family                       | Status                          | Reason                                                                                     |
| ------------------------------------- | ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| Preparation selected                  | Decision Control Node        | resolved                        | User approved scoped source-authority pilot preparation on 2026-06-25.                     |
| Output design selected                | Decision Control Node        | resolved                        | User selected CLI-backed Evidence output design first; the design is now recorded.         |
| Actual execution decision             | Decision Control Node        | resolved                        | User approved bounded Todo Search scoped pilot execution on 2026-06-25.                    |
| Manual parity / generated builder     | Evidence Control Node        | generated present with warnings | Bounded generated output supports review; validator/CI and execution approval remain open. |
| Public-doc cleanup                    | Compatibility Control Node   | deferred / active warning       | ACEP task-card cleanup remains visible and may be prerequisite if user chooses.            |
| Scoped source authority change        | Impact / Change Control Node | executed in bounded scope       | Recorded separately in the scoped pilot execution record.                                  |
| Demo-support Acceptance with warnings | Acceptance Control Node      | closed with warnings            | It supports demo review but is not source-transition approval.                             |
| Rollback/fallback readiness           | Evidence / Decision Control  | partial                         | No rollback is needed now; rollback-ready status is not established for execution.         |

## Gate Self-Check

| Gate                                    | Result | Notes                                                                                                  |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Non-Promotion Gate                      | PASS   | This package does not declare Graph-source promotion.                                                  |
| Preparation / Execution Separation Gate | PASS   | Preparation approval and actual scoped execution approval are separate.                                |
| Source Authority Boundary Gate          | PASS   | Tree-native selected-slice artifacts remain current operational source.                                |
| Evidence Reality Gate                   | PASS   | Evidence points to reviewable artifacts, command Evidence, parity records, and visible warnings.       |
| Rollback / Fallback Gate                | PASS   | Rollback is not needed for preparation; execution needs fallback conditions before approval.           |
| Compatibility Gate                      | PASS   | ACEP cleanup remains deferred and visible; supplemental compatibility slice is not pilot source scope. |
| User Approval Gate                      | PASS   | Actual scoped execution requires a future explicit user decision.                                      |
| Implementation Boundary Gate            | PASS   | No CLI, schema, runtime, validator, generator, migration, rollback, or cleanup is implemented.         |

## Final Non-Execution Statement

This package does not execute scoped source-authority transition.

It does not promote Maintainability Graph, does not change current operational source, does not retire tree-native
artifacts, and does not approve full Graph-source promotion.

The next step requires an explicit user decision.
