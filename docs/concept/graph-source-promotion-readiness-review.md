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

The user later approved actual scoped source-authority pilot execution for the Todo Search selected slice only after
generated Evidence and `comparison-pass` parity were recorded. That execution is documented in
[scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md). This readiness
review still does not approve full Graph-source promotion or repository-wide source authority change.

The subsequent scoped pilot review is documented in
[scoped-source-authority-pilot-review.md](scoped-source-authority-pilot-review.md). It passes with retained warnings and
keeps the pilot safe to observe in the bounded Todo Search scope, but it still does not authorize broader promotion,
validator/CI enforcement, public-doc cleanup, or tree-native artifact retirement.

Active observation criteria are documented in
[scoped-source-authority-pilot-active-observation.md](scoped-source-authority-pilot-active-observation.md). This keeps the
pilot active with retained warnings and leaves full-promotion readiness as a separate future review.

[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md) now defines how
validator-backed and CI-backed read-model Evidence could support broader execution/enforcement or full-promotion review
later. The scoped Todo Search validator-backed Evidence command is now implemented and produces `validation-pass` for
the current bounded pilot artifacts. Reviewed manual CI-backed Evidence now exists for run `28151296796`, while CI
enforcement remains unimplemented and does not follow from this review automatically.

[ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md) now defines the
CI workflow integration surface for read-model Evidence. The first implementation is a non-enforcing manual
`workflow_dispatch` workflow for Todo Search only. It does not make CI required, add PR/push triggers, or change source
authority. Run `28151296796` provides reviewed CI-backed Evidence for the Todo Search selected slice.

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

CLI-backed output design outcome:

```text
Prepare CLI-backed evidence output design first
```

The design is recorded in
[cli-backed-read-model-evidence-output-design.md](cli-backed-read-model-evidence-output-design.md). It defines future
command/surface candidates, generated output artifacts, comparison reports, mismatch categories, and status labels. It
does not implement CLI, builder, parser, validator/CI, or generated output.

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

| Prerequisite                                                                | Status             | Evidence / Reason                                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concept policies complete through Rollback / Compatibility Strategy         | ready              | Approval Brief, Check/Evidence, Control Node, Legacy Compatibility, Runtime Feasibility, Source Transition, and Rollback policies are complete.                                                                           |
| Representative demo slice selected                                          | ready              | `representative-runtime-feasibility-demo.md` selects `Todo Search Adoption + Product Meaning Feedback`.                                                                                                                   |
| Actual representative demo result recorded                                  | ready              | `actual-runtime-feasibility-demo-result.md` records a manual Evidence pack and final `demonstrated` status with retained warnings.                                                                                        |
| Missing Project/Contract/Change/Impact evidence strengthened                | ready              | Todo Search selected-slice support artifacts include Project Tree, Cycle Contract, Node Execution Contract, Change Tree, and Impact Tree snapshots.                                                                       |
| Compatibility mismatch path demonstrated with real repo wording             | ready              | `examples/adoption/compatibility-mismatch-slice` records ACEP task-card-only authority wording and a Compatibility Control Node candidate.                                                                                |
| PP-001 product meaning decision confirmed                                   | ready              | Product Patch and Change Tree record parent orchestration approval for title + note/content search on 2026-06-24.                                                                                                         |
| Title + note/content runtime fixture Evidence present/fresh                 | ready              | `EV-SEARCH-NOTE-TEST` points to `runtime-evidence.md`; Vitest fixture command passed 1 file and 6 tests.                                                                                                                  |
| Renewed user Acceptance approved with retained warnings                     | ready with warning | `acceptance-tree.json` records `renewed_acceptance_approved_with_warnings`; warnings remain carried to this readiness review.                                                                                             |
| Source Transition Path defined                                              | ready              | `source-transition-path.md` defines stages, authority matrix, prerequisites, invariants, conflict handling, and promotion review surface.                                                                                 |
| Rollback / Compatibility Strategy defined                                   | ready              | `rollback-compatibility-strategy.md` defines rollback/fallback, compatibility period, triggers, statuses, safety principles, and control records.                                                                         |
| Source authority matrix available                                           | ready              | Source matrix is defined in Source Transition Path.                                                                                                                                                                       |
| Graph-first Node/Edge/Tag baseline reflected in limited pilot parity        | ready              | `maintainability-graph-read-model.json` and `view-instance-manifest.json` now use `nodeKind`, `edgeType`, view-scoped tags, confidence/freshness split, and 7 Core Views.                                                 |
| Check/Evidence obligations visible                                          | ready              | Check/Evidence policy and demo artifacts distinguish Checks, Evidence, freshness, partial Evidence, and exceptions.                                                                                                       |
| Approval Brief / Control Node handling visible                              | ready              | Todo Search Approval Brief, actual demo result, and compatibility supplemental slice expose user-relevant judgment/control points.                                                                                        |
| Retained warnings classified                                                | ready              | This review classifies each retained warning below.                                                                                                                                                                       |
| Generated graph/read-model output available or explicitly deferred/blocking | ready with warning | Bounded Todo Search generated output, local validator-backed Evidence, and reviewed CI-backed Evidence exist. Full promotion may still require broader/multi-slice validation, enforcement decisions, or explicit waiver. |
| Public-doc cleanup status classified                                        | ready with warning | ACEP task-card public-doc cleanup is classified as deferred cleanup with a Compatibility Control Node candidate and explicit readiness warning.                                                                           |

## Retained Warnings Classification

| Retained warning                                           | Classification                   | Promotion readiness meaning                                                                                                                                                                          | Required next action                                                                                                                                                          |
| ---------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bounded fixture Evidence, not full Todo app implementation | acceptable warning               | The bounded fixture is acceptable for representative lifecycle feasibility and limited pilot readiness discussion. It is not proof of full product runtime parity.                                   | Carry as a pilot/full distinction. Require full-product/runtime Evidence only if the user asks for full promotion confidence rather than limited pilot review.                |
| UI screenshot/manual visual evidence partial               | acceptable warning               | The representative source-model promotion question is not blocked by missing UI screenshot Evidence because behavior Evidence and warning state are visible. It remains a product/UI evidence gap.   | Keep visible as a retained warning. Require screenshot/manual visual Evidence before claiming full UI/product parity.                                                         |
| CI-backed read-model Evidence / enforcement missing        | later implementation requirement | Generated read-model output, parity comparison, local validator-backed Evidence, and reviewed CI-backed Evidence exist for Todo Search. CI enforcement and broader scope remain unapproved.          | Decide whether to keep observing, design PR informational triggers, design enforcement policy, broaden validation, clean up public docs, or prepare broader promotion review. |
| ACEP task-card public-doc cleanup deferred                 | deferred cleanup                 | Existing policy bounds the mismatch, and supplemental Evidence makes it visible. Cleanup is not required to run this readiness review, but the user must accept or resolve the caveat for promotion. | Carry the Compatibility Control Node candidate into promotion decision. Decide cleanup-before-promotion or accepted deferred cleanup.                                         |

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

| Check                                           | Status             | Summary                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Representative lifecycle demonstrated           | ready              | Product -> Project -> Work -> Test -> Evidence -> Acceptance is reviewable for the selected slice.                                                                                            |
| Source authority safety                         | ready              | All updated artifacts preserve tree-native operational source authority.                                                                                                                      |
| Check/Evidence safety                           | ready              | AI self-report is excluded; command Evidence and exceptions are linked.                                                                                                                       |
| Compatibility mismatch visibility               | ready with warning | ACEP task-card-only wording is documented as a Compatibility Control Node candidate.                                                                                                          |
| Rollback / compatibility readiness              | ready with warning | Strategy exists, but no rollback or compatibility retirement mechanics are implemented.                                                                                                       |
| Manual graph/read-model parity output           | ready with warning | Manual parity artifacts make the read-model relationship reviewable for limited pilot discussion.                                                                                             |
| Generated / validator-backed / CI-backed output | ready with warning | Generated output, local validator-backed Evidence, and reviewed non-enforcing CI-backed Evidence exist for Todo Search; broader/multi-slice coverage and enforcement remain future decisions. |
| Public-doc cleanup                              | deferred           | Cleanup is deferred and must be accepted as a caveat or resolved before promotion approval.                                                                                                   |

### Remaining Judgment

The user approved the bounded limited pilot option, dry-run, bounded scoped execution, active observation, and local
validator-backed Evidence. Remaining judgment concerns whether to:

1. keep observing the reviewed non-enforcing manual CI workflow artifact, design PR informational triggers, design
   enforcement policy, or prepare multi-slice validation,
2. defer or require ACEP task-card public-doc cleanup before full promotion,
3. require full-product/runtime/UI Evidence before full promotion or only before full product parity claims, and
4. prepare broader promotion review inputs or keep observing the scoped pilot.

### Approval Choice Candidates

- `Keep scoped pilot active and observe with validator-backed and CI-backed Evidence`
- `Design PR informational trigger`
- `Design CI enforcement / required check policy`
- `Require public-doc cleanup before promotion decision`
- `Prepare broader Graph-source promotion review inputs`
- `Rollback / defer scoped pilot`
- `Stop promotion readiness and continue concept/implementation hardening`

### State Label

```text
Decision required
```

Reason: the Graph-first Node/Edge/Tag baseline refresh, bounded scoped execution, active observation, and local
validator-backed Evidence are recorded. Full promotion, broad source authority change, CI enforcement, and public-doc
cleanup remain separate.

## Control Node / Risk Classification

| Candidate Control Node                                    | Family                       | Status label                                            | Reason                                                                                                                                  | Approval Brief visibility                                               |
| --------------------------------------------------------- | ---------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Accept bounded fixture Evidence for readiness             | Decision Control Node        | Resolved for limited pilot / warning remains            | User accepted bounded fixture Evidence for limited pilot decision context; full runtime proof may still be required for full promotion. | Show in transition record and full-promotion review.                    |
| Generated / validator-backed / CI-backed Evidence present | Evidence Control Node        | Resolved for scoped pilot / enforcement warning remains | Generated output, parity report, local validation report, and reviewed CI-backed artifact exist; enforcement remains unapproved.        | Show as Evidence and full-promotion/enforcement caveat.                 |
| UI screenshot/manual visual Evidence partial              | Evidence Control Node        | Active warning                                          | UI proof remains partial but does not block source-model readiness by itself.                                                           | Show as warning if full product/UI parity is in scope.                  |
| ACEP public-doc cleanup deferred                          | Compatibility Control Node   | Active / Deferred cleanup                               | Real wording mismatch is bounded by compatibility policy but remains a public-doc cleanup caveat.                                       | Show in promotion readiness and promotion decision review.              |
| Demo slice renewed Acceptance closed                      | Acceptance Control Node      | Closed with warnings                                    | User approved renewed demo-support Acceptance with warnings retained.                                                                   | Show as closed demo-slice acceptance, not promotion approval.           |
| Source authority transition affects tree views            | Impact / Change Control Node | Deferred                                                | Any actual source transition would affect tree-native artifacts, projections, compatibility views, and rollback needs.                  | Show only if user asks to prepare an actual promotion decision package. |

## Remaining Blockers / Decisions

### Limited Pilot Promotion Decision State

- No blocker remains for the bounded limited pilot transition record.
- Limited pilot option approval is recorded for the Todo Search selected slice only.
- Full promotion approval, CI enforcement, public-doc cleanup, and scope expansion remain separate and must not be
  inferred from this review.

### Full Promotion / Repeatability Question

- Generated graph builder, CLI-backed parity, and local validator-backed Evidence now exist for the Todo Search scoped
  pilot.
- Broader/multi-slice validation, CI enforcement, and full-promotion waiver policy remain future questions.

### Decisions Needed Before Promotion Approval

- Whether full promotion requires CI-backed graph/read-model Evidence or an explicit user waiver.
- Whether bounded fixture Evidence is enough for the pilot decision surface.
- Whether ACEP task-card public-doc cleanup must happen before promotion approval or may remain deferred with an
  explicit compatibility caveat.
- Whether full-product/runtime/UI Evidence is required before promotion approval or only before full product parity
  claims.

## Gate Self-Check

| Gate                         | Result | Notes                                                                                                                                    |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Non-Promotion Gate           | PASS   | This review does not promote Maintainability Graph or change source authority.                                                           |
| Warning Classification Gate  | PASS   | All retained warnings are classified as blocker, acceptable warning, deferred cleanup, or later requirement.                             |
| Evidence Reality Gate        | PASS   | Findings cite existing docs, selected-slice artifacts, compatibility slice records, and command Evidence.                                |
| Source Authority Safety Gate | PASS   | Tree-native artifacts remain current operational source.                                                                                 |
| Approval Boundary Gate       | PASS   | Readiness review, promotion decision, and promotion approval remain separate.                                                            |
| Control Node Visibility Gate | PASS   | Decision, Evidence, Compatibility, Acceptance, and Impact/Change control candidates are identified.                                      |
| Gap Honesty Gate             | PASS   | CI-backed Evidence, public-doc cleanup, full-product Evidence, and pilot/full distinction remain visible.                                |
| Implementation Boundary Gate | PASS   | Scoped builder and validator exist for Todo Search only; no CI, schema, runtime, model, migration, or full Todo implementation is added. |

## Final Non-Promotion Statement

This readiness review does not approve Graph-source promotion.

This readiness review does not change source authority.

This readiness review does not make Maintainability Graph the current operational source.

This readiness review does not supersede tree-native artifacts.

Tree-native artifacts remain the operational source of truth until a later promotion decision receives explicit user
approval after blockers, warnings, and compatibility caveats are reviewed.
