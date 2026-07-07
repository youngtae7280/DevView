# Limited Pilot Promotion Decision Package

Status: decision package / user-approved limited pilot option / transition record prepared

## Document Purpose

This document packages the evidence, warnings, boundaries, and choices used for the user's limited pilot promotion
decision. The user has now approved the `Approve limited pilot promotion decision` option for the bounded Todo Search
scope.

This document is not:

- a Graph-source promotion execution record
- a full Graph-source promotion decision
- a source authority change
- a generated graph builder, CLI, schema, runtime, model, validator, or migration design
- public-doc cleanup
- Acceptance closure by Codex/PBE

Codex/PBE is not the approver. The approved option came from the parent orchestration chat on 2026-06-25 after the user
reviewed the scope, Evidence, retained warnings, rollback/compatibility boundaries, and available choices in this
package.

Current operational source remains tree-native artifacts until a later explicit user promotion decision changes that
authority.

## Current Baseline Refresh Status

This package was originally prepared under the previous read-model parity baseline.

The relevant Todo Search read-model parity artifact has now been refreshed under the Graph-first Node/Edge/Tag baseline:

- `examples/internal-legacy/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/internal-legacy/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/internal-legacy/adoption/todo-search-slice/parity-check.md`
- `examples/internal-legacy/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/internal-legacy/adoption/todo-search-slice/view-instance-manifest.md`

Current state:

```text
Package state: User approved limited pilot option after Graph-first baseline refresh
Current action: Scoped pilot transition record prepared/recorded
Promotion state: Limited pilot decision approved for bounded Todo Search record only; full promotion remains not approved
```

## Decision Package Definition

A Limited Pilot Promotion Decision Package is a user-facing approval surface for deciding whether a bounded pilot slice
may proceed to the next source-transition decision step.

It exists after the earlier readiness review found that the limited pilot decision surface was reviewable with warnings.

It does not perform full promotion. The package has now been rechecked against
[graph-node-edge-tag-policy.md](graph-node-edge-tag-policy.md) through the refreshed Node/Edge/Tag parity artifact, and
the user selected the bounded limited pilot option.

The resulting bounded transition record is [limited-pilot-transition-record.md](limited-pilot-transition-record.md).

The user then selected the dry-run / review-only scoped pilot option. The observation is recorded in
[dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md) as
`usable-with-warnings`; it does not change source authority or approve scoped source-authority pilot execution.

The user also approved scoped source-authority pilot preparation. The preparation package is recorded in
[scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md). It
recommends generated builder / CLI-backed read-model output before authority-bearing execution unless the user explicitly
accepts manual-candidate risk for the bounded pilot.

The user selected the generated builder / CLI-backed Evidence prerequisite. The requirement is recorded in
[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md). It is not builder or CLI
implementation approval.

## Pilot Scope

### Primary Pilot Scope

The primary pilot scope is limited to:

```text
examples/internal-legacy/adoption/todo-search-slice
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
examples/internal-legacy/adoption/compatibility-mismatch-slice
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

The user-approved limited pilot promotion decision means:

1. The user accepts this decision package as the judgment surface for the scoped pilot decision.
2. The user accepts that the primary pilot scope is limited to `examples/internal-legacy/adoption/todo-search-slice`.
3. The user accepts that the compatibility mismatch supplemental slice is supporting Evidence only.
4. The user accepts that the Maintainability Graph manual read-model parity artifact is sufficient for the limited pilot
   decision target, with retained warnings.
5. A bounded pilot transition record may be prepared and recorded for the selected pilot scope.
6. Retained warnings are acknowledged and carried into the pilot transition decision.
7. Tree-native artifacts remain current operational source until any later approved transition record explicitly changes
   authority within its scope.

## What Approval Does Not Mean

Approval of this package option or the limited pilot decision does not mean:

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

| Evidence area                               | Observable artifact / record                                                                                                                                                                                                                          | Status for package      | Decision relevance                                                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actual representative demo result           | [actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md)                                                                                                                                                                | present                 | Records representative demo result as demonstrated with retained warnings.                                                                                         |
| Strengthened selected-slice artifacts       | `examples/internal-legacy/adoption/todo-search-slice/product-tree.json`, `project-tree.json`, `work-tree.json`, `test-tree.json`, `evidence-tree.json`, `acceptance-tree.json`, `change-tree.json`, `impact-tree.json`, contracts, and approval brief | present                 | Makes Product -> Project -> Work -> Test -> Evidence -> Acceptance trace reviewable.                                                                               |
| Real compatibility mismatch supplement      | `examples/internal-legacy/adoption/compatibility-mismatch-slice/*`                                                                                                                                                                                    | present                 | Demonstrates real ACEP task-card-only wording mismatch as bounded compatibility Evidence.                                                                          |
| `PP-001` confirmation                       | `examples/internal-legacy/adoption/todo-search-slice/product-patch-tree.json`, `change-tree.json`                                                                                                                                                     | present                 | Shows user-confirmed product meaning expansion to title + note/content search.                                                                                     |
| Refreshed runtime fixture Evidence          | `examples/internal-legacy/adoption/todo-search-slice/runtime-evidence.md`, `runtime-fixture/todo-search.js`, `runtime-fixture/todo-search.test.js`                                                                                                    | present / fresh         | Shows bounded title + note/content search behavior with Vitest command Evidence.                                                                                   |
| Renewed user Acceptance                     | `examples/internal-legacy/adoption/todo-search-slice/acceptance-tree.json`, `approval-brief.md`                                                                                                                                                       | present with warnings   | Records user-renewed demo-support Acceptance with warnings retained.                                                                                               |
| Maintainability Graph read-model parity     | `examples/internal-legacy/adoption/todo-search-slice/maintainability-graph-read-model.json`, `maintainability-graph-read-model.md`, `view-instance-manifest.json`, `view-instance-manifest.md`                                                        | present manual artifact | Shows `nodeKind`, `edgeType`, view-scoped tags, 7 Core Views, warnings, and source-authority boundary for limited pilot readiness.                                 |
| Parity check                                | `examples/internal-legacy/adoption/todo-search-slice/parity-check.md`                                                                                                                                                                                 | present                 | Judges Node/Edge/Tag parity demonstrated for limited pilot review with retained warnings.                                                                          |
| Graph-source Promotion Readiness Review     | [graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md)                                                                                                                                                              | present                 | Records the earlier recommendation and the refreshed status `ready for renewed limited pilot user decision with warnings`.                                         |
| Generated builder / CLI-backed graph output | Bounded Todo Search generated read-model output now exists under `examples/internal-legacy/adoption/todo-search-slice/generated/`.                                                                                                                    | present with warnings   | Supports scoped Evidence discussion; full promotion may still require broader/multi-slice validation, enforcement decisions, cleanup judgment, or explicit waiver. |

## Retained Warnings Classification

Warnings remain visible. They are not removed by this decision package.

| Retained warning                                           | Classification for this package                                         | Meaning                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Bounded fixture Evidence, not full Todo app implementation | acceptable warning for limited pilot                                    | Sufficient for representative pilot discussion; not full product runtime parity.                                                |
| UI screenshot/manual visual Evidence partial               | acceptable warning for limited pilot                                    | Does not block source-model pilot decision by itself; still blocks any claim of complete UI/product visual parity.              |
| Generated graph builder / CLI-backed output missing        | later implementation requirement for full promotion or CI repeatability | Manual parity artifact is enough for limited pilot decision review, but not proof of repeatable generated graph infrastructure. |
| ACEP task-card public-doc cleanup deferred                 | deferred cleanup                                                        | Compatibility mismatch is bounded and visible; user may require cleanup before promotion or accept it as deferred.              |

## Decision Options

The Graph-first baseline refresh became reviewable and the user selected option 1 on 2026-06-25.

| Option                                                         | Meaning                                                                                                 | Next effect                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Approve limited pilot promotion decision`                     | Approved by the user for the Todo Search selected slice only.                                           | Scoped pilot transition record is prepared/recorded; still no full promotion or broad source change.       |
| `Approve only decision-package readiness, not pilot promotion` | Confirm the package is ready and accurate, but do not approve the pilot promotion decision yet.         | Keep package accepted as review surface; leave promotion state `Decision required`.                        |
| `Require generated builder / CLI-backed read-model first`      | Historical alternative: require repeatable generated graph/read-model output before any pilot decision. | Not selected for the bounded pilot; remains possible prerequisite for full promotion or CI repeatability.  |
| `Require public-doc cleanup first`                             | Historical alternative: require ACEP task-card public-doc cleanup before any pilot decision.            | Not selected for the bounded pilot; cleanup remains deferred and visible.                                  |
| `Defer limited pilot decision`                                 | Postpone the pilot decision while keeping the package and warnings visible.                             | Keep source authority unchanged; record deferral as remaining judgment.                                    |
| `Reject limited pilot promotion`                               | Reject the scoped pilot promotion direction.                                                            | Do not prepare pilot transition record; maintain tree-native operational source and revisit strategy only. |

## Approval Brief State

Package state:

```text
User approved limited pilot option after Graph-first baseline refresh
```

Current action:

```text
Scoped pilot transition record prepared/recorded
```

Promotion state:

```text
Bounded limited pilot decision approved for Todo Search record only; full promotion remains not approved
```

Reason:

- This package preserves useful evidence and options from the earlier review cycle.
- The Graph-first Node/Edge/Tag parity artifact and View Instance Manifest are now refreshed for limited pilot review.
- The limited pilot promotion decision option has been approved for the bounded Todo Search scope.
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
| Limited pilot approval choice                 | Decision Control Node        | Resolved by user approval    | User approved option 1 on 2026-06-25 for the bounded Todo Search scope.                                   |
| Manual parity artifact accepted for pilot     | Evidence Control Node        | Ready with warning           | Manual read-model parity is present; generated builder remains a later requirement.                       |
| Generated builder / CLI-backed output missing | Evidence Control Node        | Deferred / later requirement | Full promotion or CI repeatability may require generated output.                                          |
| ACEP task-card public-doc cleanup deferred    | Compatibility Control Node   | Deferred cleanup             | Public wording mismatch remains bounded but not cleaned up.                                               |
| Demo-slice renewed Acceptance                 | Acceptance Control Node      | Closed with warnings         | User renewed Acceptance for the representative demo-support slice, not source promotion.                  |
| Potential source authority transition         | Impact / Change Control Node | Not started                  | Any later pilot transition may affect source/view roles and must be separately recorded before execution. |

## Remaining Open Questions

- Will the user require generated builder / CLI-backed read-model output before full promotion or CI repeatability?
- Will the user require ACEP task-card public-doc cleanup before full promotion?
- Will the user treat bounded fixture Evidence as enough for the limited pilot, while reserving full-product runtime
  proof for a later full promotion review?
- Will the user design the generated output surface first, approve a later builder implementation task, require
  public-doc cleanup, defer, accept manual-candidate risk, or reject the scoped pilot path?

## Gate Self-Check

| Gate                           | Result | Notes                                                                                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Non-Promotion Gate             | PASS   | This package does not declare promotion or source authority change.                                                           |
| Pilot Scope Clarity Gate       | PASS   | Primary pilot scope is limited to `examples/internal-legacy/adoption/todo-search-slice`; compatibility slice is supplemental. |
| Source Authority Boundary Gate | PASS   | Tree-native artifacts remain current operational source.                                                                      |
| Evidence Reality Gate          | PASS   | Evidence points to observable docs, selected-slice artifacts, command Evidence, and parity artifacts.                         |
| Warning Retention Gate         | PASS   | All retained warnings remain visible and classified.                                                                          |
| User Decision Clarity Gate     | PASS   | User options and their next effects are explicit.                                                                             |
| Graph-First Refresh Gate       | PASS   | Node/Edge/Tag parity artifact and View Instance Manifest are refreshed for limited pilot review.                              |
| Rollback / Compatibility Gate  | PASS   | Rollback/compatibility boundaries remain separate from this package and future approval.                                      |
| Implementation Boundary Gate   | PASS   | No CLI, schema, runtime, validator, generator, migration, public-doc cleanup, or full Todo app is added.                      |

## Final Non-Promotion Statement

This package remains the reviewed decision package refreshed under the Graph-first Node/Edge/Tag baseline.

It records user approval of the bounded limited pilot decision option and links to the later dry-run / review-only
observation.

It does not approve full Graph-source promotion.

It does not change source authority.

It does not supersede tree-native artifacts.

The next step must be a separate user decision about actual scoped source-authority pilot execution or prerequisites.
