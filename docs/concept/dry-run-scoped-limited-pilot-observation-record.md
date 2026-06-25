# Dry-Run Scoped Limited Pilot Observation Record

Status: dry-run-scoped-limited-pilot-observation-record / review-only / source-authority-unchanged

## Document Purpose

This record observes the user-approved dry-run / review-only scoped pilot for the Todo Search limited pilot path.

It records whether the Graph-first read-model, View Instance Manifest, 7 Core Views, Approval Brief, Check/Evidence
records, and Control Node summary are usable as a review workflow for the selected slice.

It is not:

- source authority change
- scoped source-authority pilot execution
- full Graph-source promotion
- Maintainability Graph promotion to current operational source
- tree-native artifact retirement, deletion, or supersession
- public-doc cleanup
- CLI/schema/runtime/model/validator/generator implementation
- generated graph builder implementation
- Codex/PBE self-approval

## User Approval Trace

| Field           | Value                                          |
| --------------- | ---------------------------------------------- |
| Approval source | parent orchestration chat                      |
| Approval date   | 2026-06-25                                     |
| Approved option | `Run dry-run / review-only scoped pilot first` |
| Approval scope  | Review-only dry-run observation                |

This approval authorizes this observation record. It does not approve scoped source-authority pilot execution.

## Dry-Run Scope

### Primary Scope

```text
examples/adoption/todo-search-slice
```

The dry-run observes the Todo Search representative demo-support slice only.

### Supplemental Evidence Only

```text
examples/adoption/compatibility-mismatch-slice
```

The compatibility mismatch slice supports compatibility-path observation. It is not pilot source scope.

### Explicit Non-Scope

This dry-run does not include:

- source authority change
- scoped source-authority pilot execution
- full Graph-source promotion
- public-doc cleanup
- CLI/schema/runtime/model/validator/generator implementation
- migration or rollback command implementation
- tree-native artifact retirement
- full Todo app implementation

## Source Authority Boundary

| Item                                             | Dry-run role                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Tree-native selected-slice artifacts             | Current operational source for the selected slice.                           |
| Manual Maintainability Graph read-model artifact | Read/alignment Evidence for dry-run review; not source authority.            |
| View Instance Manifest                           | Projection Evidence for 7 Core Views; not source authority.                  |
| Dry-run observation record                       | Review-only observation; does not execute transition.                        |
| Compatibility mismatch supplemental slice        | Supporting Evidence for compatibility warning; not pilot source scope.       |
| Scoped source-authority pilot                    | Not started; requires a separate user approval and source boundary decision. |

## Observation Basis

The dry-run used reviewable artifacts, not AI self-report.

| Artifact                                                                                 | Role in observation                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`              | Manual Node/Edge/Tag read-model parity output.                   |
| `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`                | Human-readable read-model summary and retained warnings.         |
| `examples/adoption/todo-search-slice/view-instance-manifest.json`                        | 7 Core View membership and role-tag projection evidence.         |
| `examples/adoption/todo-search-slice/view-instance-manifest.md`                          | Human-readable View Instance Manifest.                           |
| `examples/adoption/todo-search-slice/parity-check.md`                                    | Node/Edge/Tag parity and limited-pilot readiness check.          |
| `examples/adoption/todo-search-slice/runtime-evidence.md`                                | Bounded Vitest command Evidence for title + note/content search. |
| `examples/adoption/todo-search-slice/product-tree.json`                                  | Product and acceptance meaning source input.                     |
| `examples/adoption/todo-search-slice/project-tree.json`                                  | Project/boundary source input.                                   |
| `examples/adoption/todo-search-slice/work-tree.json`                                     | Work responsibility source input.                                |
| `examples/adoption/todo-search-slice/test-tree.json`                                     | Check source input.                                              |
| `examples/adoption/todo-search-slice/evidence-tree.json`                                 | Evidence source input.                                           |
| `examples/adoption/todo-search-slice/acceptance-tree.json`                               | Demo-support Acceptance source input.                            |
| `examples/adoption/todo-search-slice/change-tree.json`                                   | PP-001 change source input.                                      |
| `examples/adoption/todo-search-slice/impact-tree.json`                                   | Impact/stale/reopen source input.                                |
| `examples/adoption/todo-search-slice/approval-brief.md`                                  | User-facing judgment summary input.                              |
| `examples/adoption/todo-search-slice/evidence-exceptions.md`                             | Missing/partial/deferred Evidence visibility.                    |
| `examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md`           | Supplemental Compatibility Control Node evidence.                |
| `examples/adoption/compatibility-mismatch-slice/legacy-compatibility-map-application.md` | Legacy/canonical mismatch interpretation evidence.               |

## Command Evidence

The runtime fixture command was rerun during this dry-run observation.

Command:

```bash
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
```

Observed result:

```text
1 test file passed
6 tests passed
```

This command Evidence is valid for the bounded representative fixture. It is not full Todo app implementation Evidence
and not generated graph-builder Evidence.

## 7 Core View Observation Matrix

| Core View                  | Source nodes / artifacts observed                                                                                   | What worked                                                                                  | Retained warning / gap                                                                  | Usable for dry-run |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------ |
| Intent View                | `TASK-TODO-SEARCH-PILOT`, `PT-SEARCH-001`, `AC-SEARCH-*`, `PP-001`, `AT-ROOT`, decision package / transition record | Product meaning, PP-001 confirmation, and user-renewed Acceptance are recoverable.           | Limited pilot approval is not source-authority approval.                                | yes                |
| Behavior View              | `BEH-SEARCH-TITLE-NOTE`, `BEH-EMPTY-QUERY`, `BEH-NO-RESULT`, `BEH-NON-SCOPE-GUARD`, runtime fixture files           | Title + note/content search, blank query behavior, no-result behavior, and guards are clear. | Fixture behavior is representative and not a full app runtime.                          | yes                |
| Structure View             | `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`, `CODE-RUNTIME-SEARCH-*`, `DATA-TODO-ITEM`, `work-tree.json`        | Code/data anchors and Work responsibility are visible enough for review.                     | Project/code anchors remain manual demo-support anchors.                                | yes                |
| Scope / Execution View     | `cycle-contract.md`, `node-execution-contracts/wt-search-001.md`, non-scope guard behavior, `FIND-GENERATED-*`      | Selected, deferred, out-of-scope, forbidden, required Evidence, and stop boundaries show up. | Generated builder remains missing for repeatability/full promotion.                     | yes                |
| Impact View                | `PP-001`, `CH-001`, `IM-SEARCH-001`, stale historical Evidence, refreshed fixture Evidence, compatibility warning   | Stale/reopen pressure and refreshed Evidence path are recoverable.                           | Actual scoped source-authority impact is not started.                                   | yes                |
| Verification View          | `TT-SEARCH-*`, `EV-SEARCH-*`, `runtime-evidence.md`, fixture command output                                         | Check/Evidence separation is visible and runtime fixture Evidence is present/fresh.          | UI screenshot/manual visual Evidence remains partial.                                   | yes                |
| Evidence / Acceptance View | `evidence-tree.json`, `acceptance-tree.json`, `approval-brief.md`, `evidence-exceptions.md`, compatibility Evidence | Evidence status, renewed Acceptance with warnings, and retained exceptions are reviewable.   | Acceptance is demo-support only and does not approve promotion/source authority change. | yes                |

## Workflow Observation Summary

| Workflow question                      | Observation                                                                                                      | Result               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------- |
| User request / task meaning recovery   | The read-model and Intent View recover `Todo Search Adoption + Product Meaning Feedback` and PP-001 meaning.     | usable               |
| Selected scope recovery                | Scope / Execution View exposes title + note/content scope and non-scope tag/date/fuzzy/server/saved search.      | usable               |
| Behavior and verification recovery     | Behavior View and Verification View link behavior nodes, Checks, fixture code, and Evidence.                     | usable               |
| Evidence and acceptance recovery       | Evidence / Acceptance View shows present/fresh fixture Evidence and user-renewed Acceptance with warnings.       | usable with warnings |
| Impact/stale/reopen recovery           | Impact View recovers PP-001 stale/reopen path and the refreshed Evidence update.                                 | usable               |
| Compatibility warning recovery         | Supplemental compatibility slice carries ACEP task-card cleanup deferral without making it pilot source scope.   | usable with warning  |
| Approval/control summary usability     | Approval Brief and Control Node candidates summarize user-relevant warnings without exposing all trace detail.   | usable               |
| Source authority boundary preservation | All observation artifacts continue to state that tree-native selected-slice artifacts remain operational source. | preserved            |

## Check / Evidence Observation

- AI self-report is not Evidence.
- Runtime fixture command Evidence is present/fresh for bounded title + note/content search.
- Manual read-model parity is Evidence for dry-run review, but not proof of generated builder or CLI-backed output.
- View Instance Manifest is projection Evidence for dry-run review, not source authority.
- Partial UI screenshot/manual visual Evidence remains a retained warning.
- ACEP task-card public-doc cleanup remains a deferred compatibility warning.
- Evidence exceptions remain visible and are not converted into proof.

## Control Node Observation

| Control area      | Observation                                                                                              | Dry-run status                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Decision          | Dry-run / review-only mode was selected by the user on 2026-06-25.                                       | resolved for this observation               |
| Evidence          | Manual parity is accepted for dry-run review; generated builder / CLI-backed output remains missing.     | active warning for repeatability/full scope |
| Compatibility     | ACEP task-card public-doc cleanup remains deferred and visible through supplemental compatibility slice. | deferred / active warning                   |
| Impact / Change   | Scoped source-authority change is not started; no authority-impact transition is executed.               | not started                                 |
| Acceptance        | Demo-support Acceptance is closed with retained warnings, but not promotion approval.                    | closed with warnings for demo slice only    |
| Source transition | Scoped source-authority pilot still requires separate approval and boundary evidence.                    | waiting for human decision                  |

## Dry-Run Result Classification

```text
usable-with-warnings
```

Reason:

- The manual read-model and View Instance Manifest are enough to reconstruct the selected-slice review workflow.
- The 7 Core Views expose product meaning, behavior, structure, scope/execution boundary, impact, verification, and
  evidence/acceptance.
- Runtime fixture Evidence is present/fresh for the bounded representative behavior.
- Retained warnings remain visible and materially limit any broader source-authority decision.

Warnings that remain:

- bounded fixture Evidence is not full Todo app implementation
- UI screenshot/manual visual Evidence is partial
- generated builder / CLI-backed read-model output is still missing
- ACEP task-card public-doc cleanup remains deferred
- scoped source-authority pilot execution has not started

## Next Decision Surface

After this dry-run, the user must choose one of the following before any next step changes authority or proceeds toward
execution:

1. `Proceed to scoped source-authority pilot preparation`
2. `Require generated builder / CLI-backed read-model first`
3. `Require public-doc cleanup first`
4. `Run another dry-run or strengthen evidence`
5. `Defer scoped source-authority pilot`
6. `Reject scoped source-authority pilot`

Recommended next discussion:

```text
Decide whether the usable-with-warnings dry-run is enough to begin scoped source-authority pilot preparation, or whether
generated builder output / public-doc cleanup should be required first.
```

This is a user decision. Codex/PBE cannot infer or self-approve it.

## Gate Self-Check

| Gate                           | Result | Notes                                                                                                 |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| Non-Promotion Gate             | PASS   | This record does not declare full Graph-source promotion or scoped source-authority execution.        |
| Execution Mode Separation Gate | PASS   | Dry-run observation, scoped source-authority pilot, and full promotion remain separate.               |
| Source Authority Boundary Gate | PASS   | Tree-native selected-slice artifacts remain current operational source.                               |
| User Approval Gate             | PASS   | The user selected dry-run only; the next authority-bearing step still needs explicit user judgment.   |
| Evidence Reality Gate          | PASS   | Observation points to reviewable files, command Evidence, and visible exceptions.                     |
| Rollback / Compatibility Gate  | PASS   | No rollback is needed because no source switch occurs; compatibility warnings are retained.           |
| Implementation Boundary Gate   | PASS   | No CLI, schema, runtime, validator, generator, migration, rollback, or public-doc cleanup is created. |

## Final Non-Promotion Statement

This dry-run observation does not execute scoped source-authority transition.

It does not promote Maintainability Graph, does not change current operational source, does not retire tree-native
artifacts, and does not approve full Graph-source promotion.

The next step requires an explicit user decision.
