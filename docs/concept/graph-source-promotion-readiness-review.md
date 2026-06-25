# Graph-source Promotion Readiness Review

Status: readiness review report

## Document Purpose

This document reviews whether PBE is ready to ask for a future Graph-source promotion decision.

It classifies retained warnings, checks promotion prerequisites, and identifies blockers or remaining decisions after
the representative runtime feasibility demo was accepted with warnings.

This document is not:

- a Graph-source promotion decision
- a source authority change
- a migration plan
- a generated graph builder design
- a CLI, schema, runtime, or validator implementation
- public-doc cleanup
- full Todo app implementation

Current operational source remains tree-native artifacts. Maintainability Graph remains the canonical read/alignment
model and long-term source-model candidate until a separate explicit user promotion approval occurs.

## Review Basis

| Field                 | Value                                                                |
| --------------------- | -------------------------------------------------------------------- |
| Date                  | 2026-06-24                                                           |
| Repo path             | `C:\Users\ytkim\Desktop\kyt_work\Project Blueprint Engine Plugin`    |
| Basis commit          | `3983dee Record renewed acceptance for demo slice`                   |
| Review scope          | Graph-source promotion readiness, not promotion approval             |
| Representative slice  | `Todo Search Adoption + Product Meaning Feedback`                    |
| Supplemental slice    | `ACEP task-card-only authority wording` compatibility mismatch slice |
| Current source status | tree-native artifacts remain current operational source of truth     |
| Graph status          | Maintainability Graph remains read/alignment model and source target |

## Source References

This review uses the following observable sources:

- [maintainability-graph.md](maintainability-graph.md)
- [runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md)
- [representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md)
- [actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md)
- [source-transition-path.md](source-transition-path.md)
- [rollback-compatibility-strategy.md](rollback-compatibility-strategy.md)
- [legacy-compatibility-map.md](legacy-compatibility-map.md)
- [check-evidence-policy.md](check-evidence-policy.md)
- [control-node-policy.md](control-node-policy.md)
- [approval-brief.md](approval-brief.md)
- [graph-node-edge-tag-policy.md](graph-node-edge-tag-policy.md)
- [retrofit-graph-bootstrap.md](retrofit-graph-bootstrap.md)
- `examples/adoption/todo-search-slice/*`
- `examples/adoption/compatibility-mismatch-slice/*`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/adoption/todo-search-slice/parity-check.md`
- `examples/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.md`
- [limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md)
- [dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md)
- [scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md)

AI self-report is not Evidence for this review. Readiness findings are based on reviewable files, linked records,
passing fixture command Evidence, and explicit exception or warning records.

## Executive Recommendation

Historical recommendation before the Graph-first Node/Edge/Tag refresh: the limited pilot decision surface was
reviewable with warnings.

Current recommendation after the Graph-first Node/Edge/Tag refresh:

```text
ready for renewed limited pilot user decision with warnings
```

Current decision outcome after the user response:

```text
Approve limited pilot promotion decision
```

This outcome is bounded to `examples/adoption/todo-search-slice` and is recorded in
[limited-pilot-transition-record.md](limited-pilot-transition-record.md). It is not full Graph-source promotion and does
not change source authority.

Subsequent execution-mode outcome:

```text
Run dry-run / review-only scoped pilot first
```

The dry-run observation result is recorded as `usable-with-warnings` in
[dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md). It is
review-only and does not approve scoped source-authority pilot execution.

Preparation outcome:

```text
Proceed to scoped source-authority pilot preparation
```

The preparation package is recorded in
[scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md). It
recommends generated builder / CLI-backed read-model output before actual authority-bearing execution and does not
approve execution.

Generated read-model prerequisite outcome:

```text
Require generated builder / CLI-backed read-model before execution
```

The requirement is recorded in
[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md). It is not implementation
approval and does not create generated output.

Meaning:

- The representative lifecycle slice is demonstrated with retained warnings.
- The policy chain through Rollback / Compatibility Strategy is reviewable.
- A manual Node/Edge/Tag read-model parity artifact now makes the graph/read-model relationship reviewable for limited
  pilot decision preparation.
- The View Instance Manifest shows 7 Core View coverage, including Scope / Execution View.
- Limited pilot option approval is now granted for the bounded Todo Search transition record only.
- Full promotion still needs explicit user judgment about generated builder/repeatability, public-doc cleanup, and
  full-product/runtime parity.
- Graph-source promotion must not be approved or declared from this review alone.

Former blocking item in the earlier review cycle:

```text
Generated Maintainability Graph / read-model output is missing.
```

Updated status:

```text
resolved for limited pilot review by manual Node/Edge/Tag parity artifact
```

Evidence:

- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/adoption/todo-search-slice/parity-check.md`
- `examples/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.md`

These artifacts show durable node kinds, durable edge types, view-scoped tags, confidence/freshness separation, 7 Core
View coverage, retained warnings, and source-authority boundaries. They do not implement a generated graph builder and
do not justify full promotion by themselves.

## Readiness Prerequisite Status

| Prerequisite                                                                | Status             | Evidence / Reason                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concept policies complete through Rollback / Compatibility Strategy         | ready              | Approval Brief, Check/Evidence, Control Node, Legacy Compatibility, Runtime Feasibility, Source Transition, and Rollback policies are complete.                           |
| Representative demo slice selected                                          | ready              | `representative-runtime-feasibility-demo.md` selects `Todo Search Adoption + Product Meaning Feedback`.                                                                   |
| Actual representative demo result recorded                                  | ready              | `actual-runtime-feasibility-demo-result.md` records a manual Evidence pack and final `demonstrated` status with retained warnings.                                        |
| Missing Project/Contract/Change/Impact evidence strengthened                | ready              | Todo Search selected-slice support artifacts include Project Tree, Cycle Contract, Node Execution Contract, Change Tree, and Impact Tree snapshots.                       |
| Compatibility mismatch path demonstrated with real repo wording             | ready              | `examples/adoption/compatibility-mismatch-slice` records ACEP task-card-only authority wording and a Compatibility Control Node candidate.                                |
| PP-001 product meaning decision confirmed                                   | ready              | Product Patch and Change Tree record parent orchestration approval for title + note/content search on 2026-06-24.                                                         |
| Title + note/content runtime fixture Evidence present/fresh                 | ready              | `EV-SEARCH-NOTE-TEST` points to `runtime-evidence.md`; Vitest fixture command passed 1 file and 6 tests.                                                                  |
| Renewed user Acceptance approved with retained warnings                     | ready with warning | `acceptance-tree.json` records `renewed_acceptance_approved_with_warnings`; warnings remain carried to this readiness review.                                             |
| Source Transition Path defined                                              | ready              | `source-transition-path.md` defines stages, authority matrix, prerequisites, invariants, conflict handling, and promotion review surface.                                 |
| Rollback / Compatibility Strategy defined                                   | ready              | `rollback-compatibility-strategy.md` defines rollback/fallback, compatibility period, triggers, statuses, safety principles, and control records.                         |
| Source authority matrix available                                           | ready              | Source matrix is defined in Source Transition Path.                                                                                                                       |
| Graph-first Node/Edge/Tag baseline reflected in limited pilot parity        | ready              | `maintainability-graph-read-model.json` and `view-instance-manifest.json` now use `nodeKind`, `edgeType`, view-scoped tags, confidence/freshness split, and 7 Core Views. |
| Check/Evidence obligations visible                                          | ready              | Check/Evidence policy and demo artifacts distinguish Checks, Evidence, freshness, partial Evidence, and exceptions.                                                       |
| Approval Brief / Control Node handling visible                              | ready              | Todo Search Approval Brief, actual demo result, and compatibility supplemental slice expose user-relevant judgment/control points.                                        |
| Retained warnings classified                                                | ready              | This review classifies each retained warning below.                                                                                                                       |
| Generated graph/read-model output available or explicitly deferred/blocking | ready with warning | Manual equivalent read-model parity artifacts now exist. A generated builder/CLI output remains a later implementation requirement for full promotion or repeatability.   |
| Public-doc cleanup status classified                                        | ready with warning | ACEP task-card public-doc cleanup is classified as deferred cleanup with a Compatibility Control Node candidate and explicit readiness warning.                           |

## Retained Warnings Classification

| Retained warning                                               | Classification                   | Promotion readiness meaning                                                                                                                                                                                      | Required next action                                                                                                                                           |
| -------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bounded fixture Evidence, not full Todo app implementation     | acceptable warning               | The bounded fixture is acceptable for representative lifecycle feasibility and limited pilot readiness discussion. It is not proof of full product runtime parity.                                               | Carry as a pilot/full distinction. Require full-product/runtime Evidence only if the user asks for full promotion confidence rather than limited pilot review. |
| UI screenshot/manual visual evidence partial                   | acceptable warning               | The representative source-model promotion question is not blocked by missing UI screenshot Evidence because behavior Evidence and warning state are visible. It remains a product/UI evidence gap.               | Keep visible as a retained warning. Require screenshot/manual visual Evidence before claiming full UI/product parity.                                          |
| Generated graph builder / repeatable read-model output missing | later implementation requirement | Manual Node/Edge/Tag parity artifacts resolve the read-model output blocker for limited pilot readiness discussion, but a generator or CLI-backed output may be required for full promotion or CI repeatability. | Decide whether full promotion requires generated output before approval.                                                                                       |
| ACEP task-card public-doc cleanup deferred                     | deferred cleanup                 | Existing policy bounds the mismatch, and supplemental Evidence makes it visible. Cleanup is not required to run this readiness review, but the user must accept or resolve the caveat for promotion.             | Carry the Compatibility Control Node candidate into promotion decision. Decide cleanup-before-promotion or accepted deferred cleanup.                          |

## Promotion Recommendation

This review does not recommend immediate full promotion.

It recommends:

```text
ready for renewed limited pilot user decision with warnings
```

Prepared decision surface:

- [limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md)

The package state is now `User approved limited pilot option after Graph-first baseline refresh`. The bounded transition
record is [limited-pilot-transition-record.md](limited-pilot-transition-record.md). Full promotion and broad source
authority change remain not approved.

Allowed next actions:

- use the bounded transition record for scoped pilot transition planning
- ask the user whether generated builder/repeatable graph output is required before full promotion
- ask the user whether ACEP public-doc cleanup may remain deferred for the promotion decision

Not allowed from this review:

- declaring Maintainability Graph the current operational source
- marking tree-native artifacts superseded
- treating the manual parity artifact as a generated builder or full-promotion proof
- treating demo-slice renewed Acceptance as source promotion approval

## Readiness Review Approval Brief

### Intent Understood

PBE is asking whether the Graph-source promotion process is ready for a user promotion decision, based on the
representative demo result and retained warning review.

### Result Summary

The representative demo slice is demonstrated with retained warnings. The compatibility mismatch path is supported by
real repository wording. PP-001 is confirmed, runtime fixture Evidence is present/fresh, and renewed demo-slice
Acceptance is user-approved with warnings retained.

### Verification Summary

| Check                                 | Status             | Summary                                                                                            |
| ------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| Representative lifecycle demonstrated | ready              | Product -> Project -> Work -> Test -> Evidence -> Acceptance is reviewable for the selected slice. |
| Source authority safety               | ready              | All updated artifacts preserve tree-native operational source authority.                           |
| Check/Evidence safety                 | ready              | AI self-report is excluded; command Evidence and exceptions are linked.                            |
| Compatibility mismatch visibility     | ready with warning | ACEP task-card-only wording is documented as a Compatibility Control Node candidate.               |
| Rollback / compatibility readiness    | ready with warning | Strategy exists, but no rollback or compatibility retirement mechanics are implemented.            |
| Manual graph/read-model parity output | ready with warning | Manual parity artifacts make the read-model relationship reviewable for limited pilot discussion.  |
| Generated graph builder / CLI output  | deferred           | Missing generated builder remains a later implementation requirement for full promotion or CI.     |
| Public-doc cleanup                    | deferred           | Cleanup is deferred and must be accepted as a caveat or resolved before promotion approval.        |

### Remaining Judgment

The user approved the bounded limited pilot option. Remaining judgment concerns whether to:

1. execute a later scoped pilot transition task and under what review criteria,
2. require generated graph builder / CLI output before full promotion,
3. defer or require ACEP task-card public-doc cleanup before full promotion, and
4. require full-product/runtime/UI Evidence before full promotion or only before full product parity claims.

### Approval Choice Candidates

- `Approve limited pilot promotion decision`
- `Approve only decision-package readiness, not pilot promotion`
- `Require generated graph builder before any promotion decision`
- `Require public-doc cleanup before promotion decision`
- `Defer limited pilot decision`
- `Reject limited pilot promotion`
- `Stop promotion readiness and continue concept/implementation hardening`

### State Label

```text
Decision required
```

Reason: the Graph-first Node/Edge/Tag baseline refresh is complete, the user approved the bounded limited pilot option,
and the user selected dry-run / review-only observation. Full promotion, broad source authority change, and actual
scoped transition execution remain separate.

## Control Node / Risk Classification

| Candidate Control Node                         | Family                       | Status label                                 | Reason                                                                                                                                  | Approval Brief visibility                                               |
| ---------------------------------------------- | ---------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Accept bounded fixture Evidence for readiness  | Decision Control Node        | Resolved for limited pilot / warning remains | User accepted bounded fixture Evidence for limited pilot decision context; full runtime proof may still be required for full promotion. | Show in transition record and full-promotion review.                    |
| Manual read-model parity artifact present      | Evidence Control Node        | Resolved for limited pilot / warning remains | Manual parity output exists; generated builder output remains a later implementation requirement.                                       | Show as warning and full-promotion caveat.                              |
| UI screenshot/manual visual Evidence partial   | Evidence Control Node        | Active warning                               | UI proof remains partial but does not block source-model readiness by itself.                                                           | Show as warning if full product/UI parity is in scope.                  |
| ACEP public-doc cleanup deferred               | Compatibility Control Node   | Active / Deferred cleanup                    | Real wording mismatch is bounded by compatibility policy but remains a public-doc cleanup caveat.                                       | Show in promotion readiness and promotion decision review.              |
| Demo slice renewed Acceptance closed           | Acceptance Control Node      | Closed with warnings                         | User approved renewed demo-support Acceptance with warnings retained.                                                                   | Show as closed demo-slice acceptance, not promotion approval.           |
| Source authority transition affects tree views | Impact / Change Control Node | Deferred                                     | Any actual source transition would affect tree-native artifacts, projections, compatibility views, and rollback needs.                  | Show only if user asks to prepare an actual promotion decision package. |

## Remaining Blockers / Decisions

### Limited Pilot Promotion Decision State

- No blocker remains for the bounded limited pilot transition record.
- Limited pilot option approval is recorded for the Todo Search selected slice only.
- Full promotion approval and actual scoped transition execution remain separate and must not be inferred from this review.

### Full Promotion / Repeatability Blocker

- Generated graph builder or CLI-backed read-model output is still missing.

### Decisions Needed Before Promotion Approval

- Whether to design the generated output surface first, approve a later builder implementation task, require public-doc
  cleanup before generated work, defer, accept manual-candidate risk, or reject the scoped pilot path.
- Whether full promotion requires generated graph/read-model output as a future CLI-backed report or generated artifact.
- Whether bounded fixture Evidence is enough for the pilot decision surface.
- Whether ACEP task-card public-doc cleanup must happen before promotion approval or may remain deferred with an
  explicit compatibility caveat.
- Whether full-product/runtime/UI Evidence is required before promotion approval or only before full product parity
  claims.

## Gate Self-Check

| Gate                         | Result | Notes                                                                                                           |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Non-Promotion Gate           | PASS   | This review does not promote Maintainability Graph or change source authority.                                  |
| Warning Classification Gate  | PASS   | All retained warnings are classified as blocker, acceptable warning, deferred cleanup, or later requirement.    |
| Evidence Reality Gate        | PASS   | Findings cite existing docs, selected-slice artifacts, compatibility slice records, and command Evidence.       |
| Source Authority Safety Gate | PASS   | Tree-native artifacts remain current operational source.                                                        |
| Approval Boundary Gate       | PASS   | Readiness review, promotion decision, and promotion approval remain separate.                                   |
| Control Node Visibility Gate | PASS   | Decision, Evidence, Compatibility, Acceptance, and Impact/Change control candidates are identified.             |
| Gap Honesty Gate             | PASS   | Generated builder output, public-doc cleanup, full-product Evidence, and pilot/full distinction remain visible. |
| Implementation Boundary Gate | PASS   | No CLI, schema, runtime, model, validator, migration, generated builder, or full Todo implementation is added.  |

## Final Non-Promotion Statement

This readiness review does not approve Graph-source promotion.

This readiness review does not change source authority.

This readiness review does not make Maintainability Graph the current operational source.

This readiness review does not supersede tree-native artifacts.

Tree-native artifacts remain the operational source of truth until a later promotion decision receives explicit user
approval after blockers, warnings, and compatibility caveats are reviewed.
