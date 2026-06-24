# Limited Pilot Promotion Decision Package

Status: decision package / user judgment surface

## Document Purpose

This document packages the evidence, warnings, boundaries, and choices needed for a user to decide whether to approve a
limited pilot promotion decision.

This document is not:

- a Graph-source promotion execution record
- a full Graph-source promotion decision
- a source authority change
- a generated graph builder, CLI, schema, runtime, model, validator, or migration design
- public-doc cleanup
- Acceptance closure by Codex/PBE

Codex/PBE is not the approver. A limited pilot promotion decision requires explicit user approval after the user reviews
the scope, Evidence, retained warnings, rollback/compatibility boundaries, and available choices in this package.

Current operational source remains tree-native artifacts until a later explicit user promotion decision changes that
authority.

## Decision Package Definition

A Limited Pilot Promotion Decision Package is a user-facing approval surface for deciding whether a bounded pilot slice
may proceed to the next source-transition decision step.

It exists after readiness review has found:

```text
ready for limited pilot promotion decision with warnings
```

It does not perform the pilot. It makes the pilot decision reviewable.

## Pilot Scope

### Primary Pilot Scope

The primary pilot scope is limited to:

```text
examples/adoption/todo-search-slice
```

That slice covers the representative demo-support lifecycle:

- Todo Search Adoption + Product Meaning Feedback
- `PP-001` product meaning expansion from title-only search to title + note/content search
- Product -> Project -> Work -> Test -> Evidence -> Acceptance trace
- Change / Impact stale-reopen handling
- Cycle Contract and Node Execution Contract boundary
- bounded runtime fixture Evidence
- renewed demo-support Acceptance with warnings retained
- manual Maintainability Graph read-model parity artifacts

### Supplemental Evidence Scope

The supplemental compatibility scope is:

```text
examples/adoption/compatibility-mismatch-slice
```

This supplemental slice demonstrates a real legacy/canonical compatibility mismatch path. It is supporting Evidence for
Compatibility Control Node handling and public-doc cleanup deferral. It is not the pilot source scope and does not make
the public docs or compatibility slice part of the pilot source authority.

### Explicit Non-Scope

The pilot scope does not include:

- the full PBE product
- all public docs
- `.pbe` runtime source authority
- CLI, schema, validator, runtime, model, or generated graph builder implementation
- public-doc cleanup
- full Todo app implementation
- full Graph-source promotion
- tree-native artifact retirement or supersession

## What Approval Means

If the user approves the limited pilot promotion decision, the approval means:

1. The user accepts this decision package as the judgment surface for the scoped pilot decision.
2. The user accepts that the primary pilot scope is limited to `examples/adoption/todo-search-slice`.
3. The user accepts that the compatibility mismatch supplemental slice is supporting Evidence only.
4. The user accepts that the Maintainability Graph manual read-model parity artifact is sufficient for the limited pilot
   decision target, with retained warnings.
5. A later bounded pilot transition record may be prepared for the selected pilot scope.
6. Retained warnings are acknowledged and carried into the pilot transition decision.
7. Tree-native artifacts remain current operational source until any later approved transition record explicitly changes
   authority within its scope.

## What Approval Does Not Mean

Approval of this package or the limited pilot decision does not mean:

- full Graph-source promotion
- whole-PBE source authority change
- immediate retirement, deletion, or supersession of tree-native artifacts
- generated graph builder, CLI-backed report, schema, validator, runtime, model, migration, or rollback implementation is
  complete
- ACEP task-card public-doc cleanup is complete
- compatibility views become source authority
- bounded fixture Evidence becomes full Todo app implementation proof
- UI screenshot/manual visual Evidence becomes complete
- user acceptance authority is replaced by Codex/PBE
- future source transition, rollback, or compatibility retirement may happen silently

## Evidence Summary

Evidence in this package is based on observable artifacts, linked records, command output, and reviewable files. AI
self-report is not Evidence.

| Evidence area                               | Observable artifact / record                                                                                                                                                                                                          | Status for package       | Decision relevance                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Actual representative demo result           | [actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md)                                                                                                                                                | present                  | Records representative demo result as demonstrated with retained warnings.                                           |
| Strengthened selected-slice artifacts       | `examples/adoption/todo-search-slice/product-tree.json`, `project-tree.json`, `work-tree.json`, `test-tree.json`, `evidence-tree.json`, `acceptance-tree.json`, `change-tree.json`, `impact-tree.json`, contracts, and approval brief | present                  | Makes Product -> Project -> Work -> Test -> Evidence -> Acceptance trace reviewable.                                 |
| Real compatibility mismatch supplement      | `examples/adoption/compatibility-mismatch-slice/*`                                                                                                                                                                                    | present                  | Demonstrates real ACEP task-card-only wording mismatch as bounded compatibility Evidence.                            |
| `PP-001` confirmation                       | `examples/adoption/todo-search-slice/product-patch-tree.json`, `change-tree.json`                                                                                                                                                     | present                  | Shows user-confirmed product meaning expansion to title + note/content search.                                       |
| Refreshed runtime fixture Evidence          | `examples/adoption/todo-search-slice/runtime-evidence.md`, `runtime-fixture/todo-search.js`, `runtime-fixture/todo-search.test.js`                                                                                                    | present / fresh          | Shows bounded title + note/content search behavior with Vitest command Evidence.                                     |
| Renewed user Acceptance                     | `examples/adoption/todo-search-slice/acceptance-tree.json`, `approval-brief.md`                                                                                                                                                       | present with warnings    | Records user-renewed demo-support Acceptance with warnings retained.                                                 |
| Maintainability Graph read-model parity     | `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`, `maintainability-graph-read-model.md`                                                                                                                    | present manual artifact  | Shows graph-style nodes, edges, parity status, warnings, and source-authority boundary for limited pilot readiness.  |
| Parity check                                | `examples/adoption/todo-search-slice/parity-check.md`                                                                                                                                                                                 | present                  | Judges the read-model output blocker resolved for limited pilot readiness with warning.                              |
| Graph-source Promotion Readiness Review     | [graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md)                                                                                                                                              | present                  | Records recommendation `ready for limited pilot promotion decision with warnings`.                                   |
| Generated builder / CLI-backed graph output | No generated builder or CLI-backed graph output exists.                                                                                                                                                                               | missing / later required | Not blocking this package, but a later implementation requirement for full promotion or repeatable CI-backed parity. |

## Retained Warnings Classification

Warnings remain visible. They are not removed by this decision package.

| Retained warning                                           | Classification for this package                                         | Meaning                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Bounded fixture Evidence, not full Todo app implementation | acceptable warning for limited pilot                                    | Sufficient for representative pilot discussion; not full product runtime parity.                                                |
| UI screenshot/manual visual Evidence partial               | acceptable warning for limited pilot                                    | Does not block source-model pilot decision by itself; still blocks any claim of complete UI/product visual parity.              |
| Generated graph builder / CLI-backed output missing        | later implementation requirement for full promotion or CI repeatability | Manual parity artifact is enough for limited pilot decision review, but not proof of repeatable generated graph infrastructure. |
| ACEP task-card public-doc cleanup deferred                 | deferred cleanup                                                        | Compatibility mismatch is bounded and visible; user may require cleanup before promotion or accept it as deferred.              |

## Decision Options

The user may choose one of these action labels.

| Option                                                         | Meaning                                                                                                        | Next effect                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Approve limited pilot promotion decision`                     | Approve proceeding from this package into a scoped limited pilot promotion decision for the Todo Search slice. | Prepare the scoped pilot transition record; still do not perform full promotion or broad source change.    |
| `Approve only decision-package readiness, not pilot promotion` | Confirm the package is ready and accurate, but do not approve the pilot promotion decision yet.                | Keep package accepted as review surface; leave promotion state `Decision required`.                        |
| `Require generated builder / CLI-backed read-model first`      | Require repeatable generated graph/read-model output before any pilot promotion decision.                      | Block pilot decision until generated output or equivalent implementation Evidence exists.                  |
| `Require public-doc cleanup first`                             | Require ACEP task-card public-doc cleanup before any pilot promotion decision.                                 | Block pilot decision until cleanup Evidence and compatibility status are updated.                          |
| `Defer limited pilot decision`                                 | Postpone the pilot decision while keeping the package and warnings visible.                                    | Keep source authority unchanged; record deferral as remaining judgment.                                    |
| `Reject limited pilot promotion`                               | Reject the scoped pilot promotion direction.                                                                   | Do not prepare pilot transition record; maintain tree-native operational source and revisit strategy only. |

## Approval Brief State

Package state:

```text
Ready for approval
```

Promotion state:

```text
Decision required
```

Reason:

- This package is complete enough to ask the user for a decision.
- The limited pilot promotion decision itself has not been approved.
- Graph-source promotion has not been declared or executed.

## Rollback / Compatibility Boundary

Limited pilot approval, if granted later, must still preserve the Rollback / Compatibility Strategy boundary.

### Role Separation

| Artifact / view                           | Role in this package                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Tree-native selected-slice artifacts      | Current source inputs for the pilot evidence. They remain operational source for this phase.         |
| Manual read-model parity artifact         | Observable read/alignment Evidence. It is not source authority and not a generated builder.          |
| Compatibility mismatch supplemental slice | Evidence for compatibility warning/control handling. It is not pilot source authority.               |
| Compatibility views / legacy docs         | Review aids or cleanup candidates. They are not promoted source.                                     |
| Rollback / Compatibility Strategy         | Safety policy that must govern any later source authority change, fallback, rollback, or retirement. |

### Failure / Warning Handling

If the pilot is rejected, deferred, or later finds warning/blocker escalation:

- source authority stays tree-native unless an explicit approved transition record already changed a scoped authority
  boundary
- compatibility views remain marked and must not be silently deleted
- warning and exception records remain visible
- rollback/fallback cannot be performed by Codex/PBE self-approval
- any actual source authority adjustment must be surfaced through Approval Brief or an equivalent user judgment surface

### Non-Promotion Boundary

This package does not decide:

- post-promotion compatibility period duration
- compatibility artifact retirement
- rollback mechanics
- generated builder implementation
- full source transition path execution

## Control Node / Risk Summary

| Candidate                                     | Family                       | Status for package           | Reason                                                                                                    |
| --------------------------------------------- | ---------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Limited pilot approval choice                 | Decision Control Node        | Waiting for human            | User must choose whether to approve, defer, reject, or require prerequisites first.                       |
| Manual parity artifact accepted for pilot     | Evidence Control Node        | Ready with warning           | Manual read-model parity is present; generated builder remains a later requirement.                       |
| Generated builder / CLI-backed output missing | Evidence Control Node        | Deferred / later requirement | Full promotion or CI repeatability may require generated output.                                          |
| ACEP task-card public-doc cleanup deferred    | Compatibility Control Node   | Deferred cleanup             | Public wording mismatch remains bounded but not cleaned up.                                               |
| Demo-slice renewed Acceptance                 | Acceptance Control Node      | Closed with warnings         | User renewed Acceptance for the representative demo-support slice, not source promotion.                  |
| Potential source authority transition         | Impact / Change Control Node | Not started                  | Any later pilot transition may affect source/view roles and must be separately recorded before execution. |

## Remaining Open Questions

- Will the user approve the limited pilot promotion decision?
- Will the user approve only this decision-package readiness without pilot promotion?
- Will the user require generated builder / CLI-backed read-model output before any pilot decision?
- Will the user require ACEP task-card public-doc cleanup before any pilot decision?
- Will the user treat bounded fixture Evidence as enough for the limited pilot, while reserving full-product runtime
  proof for a later full promotion review?

## Gate Self-Check

| Gate                           | Result | Notes                                                                                                         |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| Non-Promotion Gate             | PASS   | This package does not declare promotion or source authority change.                                           |
| Pilot Scope Clarity Gate       | PASS   | Primary pilot scope is limited to `examples/adoption/todo-search-slice`; compatibility slice is supplemental. |
| Source Authority Boundary Gate | PASS   | Tree-native artifacts remain current operational source.                                                      |
| Evidence Reality Gate          | PASS   | Evidence points to observable docs, selected-slice artifacts, command Evidence, and parity artifacts.         |
| Warning Retention Gate         | PASS   | All retained warnings remain visible and classified.                                                          |
| User Decision Clarity Gate     | PASS   | User options and their next effects are explicit.                                                             |
| Rollback / Compatibility Gate  | PASS   | Rollback/compatibility boundaries remain separate from this package and future approval.                      |
| Implementation Boundary Gate   | PASS   | No CLI, schema, runtime, validator, generator, migration, public-doc cleanup, or full Todo app is added.      |

## Final Non-Promotion Statement

This package is ready for user approval as a decision package.

It does not approve limited pilot promotion.

It does not approve full Graph-source promotion.

It does not change source authority.

It does not supersede tree-native artifacts.

The next step must be a user decision using one of the action labels in this package.
