# Limited Pilot Transition Record

Status: limited-pilot-transition-record / approved-to-prepare / not-executed-as-full-promotion

## Document Purpose

This record documents the user's approval of the limited pilot promotion decision option for the Todo Search
representative slice.

It is a bounded transition record for the approved decision. It is not:

- full Graph-source promotion
- whole-PBE source authority change
- Maintainability Graph promotion to current operational source
- tree-native artifact retirement, deletion, or supersession
- public-doc cleanup
- CLI, schema, runtime, model, validator, generator, migration, or rollback implementation
- Codex/PBE self-approval

Tree-native selected-slice artifacts remain the current operational source. The manual Maintainability Graph read-model
parity artifact remains read/alignment Evidence for this record.

## User Approval Trace

| Field           | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Approval source | parent orchestration chat                                    |
| Approval date   | 2026-06-25                                                   |
| Approved option | `Approve limited pilot promotion decision`                   |
| Approved scope  | `examples/adoption/todo-search-slice` only                   |
| Non-approval    | Not full Graph-source promotion or broad source change       |
| Record effect   | Scoped pilot transition record may be prepared and reviewed. |

## Pilot Scope

### Primary Pilot Scope

```text
examples/adoption/todo-search-slice
```

The primary scope includes the `Todo Search Adoption + Product Meaning Feedback` selected slice:

- PP-001 title + note/content product meaning
- Product / Project / Work / Test / Evidence / Acceptance selected-slice artifacts
- Cycle Contract and Node Execution Contract support artifacts
- bounded runtime fixture Evidence
- renewed demo-support Acceptance with retained warnings
- manual Maintainability Graph Node/Edge/Tag read-model parity artifact
- View Instance Manifest for the 7 Core Views

### Supplemental Evidence Only

```text
examples/adoption/compatibility-mismatch-slice
```

The compatibility mismatch slice remains supporting Evidence for the compatibility path. It is not pilot source scope
and does not make public docs or compatibility artifacts source authority.

### Explicit Non-Scope

This limited pilot transition record does not include:

- full PBE promotion
- public-doc cleanup
- CLI/schema/runtime/model/validator/generator implementation
- generated graph builder or CLI-backed read-model output
- full Todo app implementation
- tree-native artifact retirement
- broad source authority change

## Source Authority Boundary

| Item                                             | Boundary                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Tree-native selected-slice artifacts             | Current operational source for the pilot scope.                                            |
| Maintainability Graph manual read-model artifact | Read/alignment Evidence accepted for the limited pilot decision; not source authority.     |
| View Instance Manifest                           | Task-scoped projection evidence; not source authority.                                     |
| Compatibility mismatch supplemental slice        | Supporting Evidence for compatibility warning; not pilot source scope.                     |
| Limited pilot transition record                  | Records approved preparation boundary; does not execute full source transition.            |
| Future generated builder / CLI output            | Later implementation or full-promotion repeatability question; not created by this record. |

No broad source authority change occurs in this record. Any later scoped source transition execution must be separately
reviewed, must preserve fallback/reference boundaries, and must not be inferred from this record alone.

## Evidence Accepted For Limited Pilot

The user approval accepts the following observable Evidence as sufficient for preparing the scoped limited pilot
transition record, with retained warnings:

| Evidence area                          | Artifact / record                                                                                                                                                                                                                 | Status for this record     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Actual runtime feasibility demo result | [actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md)                                                                                                                                            | accepted for pilot context |
| Strengthened selected-slice artifacts  | `examples/adoption/todo-search-slice/product-tree.json`, `project-tree.json`, `work-tree.json`, `test-tree.json`, `evidence-tree.json`, `acceptance-tree.json`, `change-tree.json`, `impact-tree.json`, contracts, Approval Brief | accepted for pilot context |
| PP-001 confirmation                    | `examples/adoption/todo-search-slice/product-patch-tree.json`, `change-tree.json`                                                                                                                                                 | accepted for pilot context |
| Runtime fixture Evidence               | `examples/adoption/todo-search-slice/runtime-evidence.md`, `runtime-fixture/todo-search.js`, `runtime-fixture/todo-search.test.js`                                                                                                | present / fresh            |
| Renewed Acceptance with warnings       | `examples/adoption/todo-search-slice/acceptance-tree.json`, `approval-brief.md`                                                                                                                                                   | accepted with warnings     |
| Node/Edge/Tag read-model parity        | `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`, `maintainability-graph-read-model.md`, `parity-check.md`                                                                                             | accepted for pilot context |
| View Instance Manifest                 | `examples/adoption/todo-search-slice/view-instance-manifest.json`, `view-instance-manifest.md`                                                                                                                                    | accepted for pilot context |
| Compatibility mismatch supplemental    | `examples/adoption/compatibility-mismatch-slice/*`                                                                                                                                                                                | supporting Evidence only   |
| Limited pilot decision package         | [limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md)                                                                                                                                        | approved option recorded   |

AI self-report is not Evidence for this record.

## Retained Warnings

The approval carries these warnings forward. It does not remove or downgrade them.

| Warning                                                      | Classification for limited pilot                             |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Bounded fixture Evidence is not full Todo app implementation | acceptable warning for limited pilot                         |
| UI screenshot/manual visual Evidence remains partial         | acceptable warning for limited pilot                         |
| Generated graph builder / CLI-backed output is still missing | later implementation requirement for full promotion or CI    |
| ACEP task-card public-doc cleanup is deferred                | deferred cleanup / Compatibility Control Node remains active |

## Rollback / Compatibility Boundary

No rollback is needed now because this record does not execute a full source switch.

Future scoped transition execution must:

- preserve tree-native selected-slice artifacts as fallback/reference until separately retired by explicit user approval
- keep compatibility views marked as views, not source authority
- preserve retained warnings and Evidence exceptions
- preserve user acceptance authority
- surface any source authority adjustment through Approval Brief or equivalent user judgment
- avoid silent rollback, fallback, compatibility retirement, or source promotion

If a later pilot execution fails, is deferred, or discovers mismatch, fallback remains to the current tree-native
selected-slice artifacts unless a separately approved transition record says otherwise.

## Control Node Summary

| Control record                                 | Family                       | Status after approval                       | Notes                                                                                        |
| ---------------------------------------------- | ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Limited pilot option                           | Decision Control Node        | resolved by user approval                   | User approved `Approve limited pilot promotion decision` on 2026-06-25.                      |
| Manual parity accepted for pilot               | Evidence Control Node        | accepted for limited pilot with warning     | Manual parity is sufficient for this bounded pilot decision; generated output remains later. |
| ACEP public-doc cleanup deferred               | Compatibility Control Node   | active / deferred cleanup                   | Cleanup is not performed here and remains visible.                                           |
| Actual scoped source transition execution      | Impact / Change Control Node | not started / deferred                      | Any execution that changes scoped authority must be separately reviewed.                     |
| Demo-support Acceptance with retained warnings | Acceptance Control Node      | closed for demo-support slice with warnings | This is not promotion approval and does not replace source-transition approval.              |

## Final Non-Promotion Statement

This record confirms that the user approved the limited pilot promotion decision option for the Todo Search selected
slice.

It does not promote Maintainability Graph.

It does not make Maintainability Graph the current operational source.

It does not retire tree-native artifacts.

It does not clean up public docs.

It does not implement a generator, CLI, schema, runtime model, validator, migration, or rollback command.

Any future scoped transition execution, full promotion, compatibility retirement, generated builder implementation, or
public-doc cleanup requires a separate task and the required user judgment.

## Next Planning Surface

[scoped-limited-pilot-transition-execution-plan.md](scoped-limited-pilot-transition-execution-plan.md) defines the next
mode-selection surface. It recommends a dry-run / review-only scoped pilot first, and it keeps scoped source-authority
pilot execution behind a separate explicit user approval gate.

The user selected the dry-run / review-only scoped pilot option on 2026-06-25. The review-only observation is recorded in
[dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md). That observation
does not change source authority and does not execute scoped source-authority pilot transition.

The user later approved scoped source-authority pilot preparation. The preparation package is recorded in
[scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md). It prepares
the next execution decision surface, but actual scoped source-authority execution remains unapproved.
