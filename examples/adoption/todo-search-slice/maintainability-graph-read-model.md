# Maintainability Graph Read-Model Parity Artifact

Status: manual Node/Edge/Tag parity artifact

This artifact refreshes the `Todo Search Adoption + Product Meaning Feedback` read-model parity output under
[graph-node-edge-tag-policy.md](../../../docs/concept/graph-node-edge-tag-policy.md). It shows that the selected-slice
tree-native artifacts can be interpreted as durable Graph nodes, durable semantic edges, and view-scoped tags for 7
Core Views.

It is not Graph-source promotion. It does not change source authority, does not mark tree-native artifacts as
projections, and does not implement a generated graph builder, CLI command, schema, runtime model, validator, migration,
or rollback command.

Tree-native selected-slice artifacts remain the current operational source.

## What Changed In This Refresh

The previous manual parity artifact used tree-parity-oriented fields such as `graphType` and relationship labels such
as `realizedByWork`, `verifiedBy`, and `evidencedBy`.

This refresh keeps those legacy meanings traceable but adds the new Graph-first responsibility split:

- durable targets use `nodeKind`
- durable semantic relationships use `edgeType`
- view membership uses `includedInViewIds`
- per-view role assignments use `viewRoles`
- flattened view-local role tags use `viewScopedTags`
- confidence and freshness/status are separate fields
- 7 Core View coverage is represented through `coreViewCoverage` and `view-instance-manifest.json`

`viewScopedTags` contains only the eight allowed role tags: `target`, `context`, `candidate`, `guard`, `required`,
`stale`, `blocked`, and `output`. Core View ids such as `behavior-view` or `scope-execution-view` are membership ids,
not tags, and are stored in `includedInViewIds` / `viewRoles` instead.

## Source Inputs

The read model is derived manually from reviewable sources:

- `product-tree.json`
- `project-tree.json`
- `work-tree.json`
- `test-tree.json`
- `evidence-tree.json`
- `acceptance-tree.json`
- `change-tree.json`
- `impact-tree.json`
- `product-patch-tree.json`
- `cycle-contract.md`
- `node-execution-contracts/wt-search-001.md`
- `runtime-evidence.md`
- `approval-brief.md`
- `evidence-exceptions.md`
- `examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md`
- `docs/concept/graph-node-edge-tag-policy.md`
- `docs/concept/view-tree-pack.md`

Machine-readable output:

```text
examples/adoption/todo-search-slice/maintainability-graph-read-model.json
```

View manifest:

```text
examples/adoption/todo-search-slice/view-instance-manifest.json
examples/adoption/todo-search-slice/view-instance-manifest.md
```

## Node Kind Mapping Summary

| Node kind       | Representative nodes                                                                                      | Status  | Notes                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `task`          | `TASK-TODO-SEARCH-PILOT`, `WT-SEARCH-001`                                                                 | present | Review task and selected Work node are durable task targets.                                |
| `requirement`   | `PT-SEARCH-001`, `AC-SEARCH-001`, `AC-SEARCH-002`, `AC-SEARCH-003`                                        | present | Product meaning and acceptance criteria remain tree-native source inputs.                   |
| `behavior`      | `BEH-SEARCH-TITLE-NOTE`, `BEH-EMPTY-QUERY`, `BEH-NO-RESULT`, `BEH-NON-SCOPE-GUARD`                        | present | Behavior nodes are derived from product criteria plus runtime fixture observations.         |
| `code`          | `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`, `CODE-RUNTIME-SEARCH-HELPER`, `CODE-RUNTIME-SEARCH-TEST` | present | Project boundaries are manual anchors; fixture files are observable code anchors.           |
| `data`          | `DATA-TODO-ITEM`                                                                                          | present | Fixture data shape includes title, note, content, tag, and due date.                        |
| `check`         | `TT-SEARCH-001`, `TT-SEARCH-002`, `TT-SEARCH-003`, `TT-SEARCH-004`                                        | present | Test Tree nodes are represented as Checks.                                                  |
| `evidence`      | `EV-SEARCH-TEST`, `EV-SEARCH-REVIEW`, `EV-SEARCH-NOTE-TEST`                                               | present | Evidence freshness is explicit; historical/visual Evidence remains partial or stale.        |
| `change`        | `CH-001`                                                                                                  | present | User-confirmed product meaning feedback.                                                    |
| `finding`       | `IM-SEARCH-001`, `FIND-*`, `CCN-ACEP-TASK-CARD-AUTHORITY-001`                                             | present | Impact, warnings, and compatibility caveats are visible findings/control candidates.        |
| `decision`      | `PP-001`, `AT-ROOT`, `DEC-SCOPED-PILOT-EXECUTION`                                                         | present | User confirmation, renewed Acceptance, and scoped pilot execution approval remain bounded.  |
| `document`      | `CYCLE-TODO-SEARCH`, `NEC-WT-SEARCH-001`, `AB-TODO-SEARCH`, `DOC-*`                                       | present | Contracts, briefs, parity check, and package docs are review records, not source authority. |
| `view-instance` | `VIEW-TODO-SEARCH-CORE-VIEWS`                                                                             | present | Manual 7 Core View projection manifest.                                                     |

## Edge Mapping Summary

Durable semantic relationships are represented as `edgeType`, not tags.

| Edge type      | Representative edges                                                        | Meaning                                                        |
| -------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `targets`      | `E-TASK-TARGETS-REQ`, `E-WT-TARGETS-BEH-SEARCH`                             | Task/Work points to the requirement or behavior it addresses.  |
| `implements`   | `E-CODE-IMPLEMENTS-SEARCH`, `E-CODE-IMPLEMENTS-EMPTY`                       | Fixture helper implements bounded behavior.                    |
| `satisfies`    | `E-BEH-SEARCH-SATISFIES-AC1`, `E-BEH-EMPTY-SATISFIES-AC2`                   | Behavior satisfies acceptance criteria.                        |
| `reads`        | `E-CODE-READS-DATA`                                                         | Fixture helper reads Todo item fields.                         |
| `takes-input`  | `E-CODE-TAKES-INPUT-DATA`                                                   | Fixture helper consumes Todo items and query input.            |
| `returns`      | `E-CODE-RETURNS-DATA`                                                       | Fixture helper returns filtered Todo items.                    |
| `verifies`     | `E-TT-004-VERIFIES-SEARCH`, `E-TT-003-VERIFIES-NO-RESULT`                   | Check nodes verify behavior nodes.                             |
| `evidences`    | `E-EV-NOTE-EVIDENCES-TT004`, `E-EV-REVIEW-EVIDENCES-TT003`                  | Evidence nodes provide observable proof for Checks.            |
| `touches`      | `E-CH-TOUCHES-BEH-SEARCH`, `E-WT-TOUCHES-CODE`                              | Change/Work touches behavior or code anchors.                  |
| `reports-on`   | `E-IM-REPORTS-ON-CH`, `E-FIND-UI-REPORTS-ON-EV`                             | Findings and documents report impact, gaps, or warnings.       |
| `requires`     | `E-CYCLE-REQUIRES-WT`, `E-CYCLE-REQUIRES-EV`, `E-DEC-PENDING-REQUIRES-USER` | Contracts or decisions require Work/Evidence/user review.      |
| `invalidates`  | `E-CH-INVALIDATES-EV-HISTORICAL`, `E-CH-INVALIDATES-OLD-ACCEPTANCE`         | Change makes historical Evidence/Acceptance stale or reopened. |
| `preserves`    | `E-CH-PRESERVES-NON-SCOPE`, `E-NEC-PRESERVES-GUARD`                         | Change/contract preserves non-scope guard behavior.            |
| `approves`     | `E-PP-APPROVES-CH`, `E-AT-APPROVES-PT`                                      | User decision/Acceptance approves a change or product meaning. |
| `derives-view` | `E-VIEW-DERIVES-*`                                                          | View Instance derives projection from source nodes.            |

## View-Scoped Tag Summary

View-scoped tags are temporary roles inside a View Instance only.

This artifact separates view membership from view role tags:

- `includedInViewIds` records which Core View instances include the node.
- `viewRoles` records the node's allowed role tags per Core View id.
- `viewScopedTags` is a flat role-tag summary and never contains Core View ids.

Allowed tags used here:

```text
target, context, candidate, guard, required, stale, blocked, output
```

Examples:

- `BEH-NON-SCOPE-GUARD` is tagged `guard` inside Behavior and Scope / Execution Views.
- `TT-SEARCH-004` is tagged `required` inside Verification View.
- `EV-SEARCH-NOTE-TEST` is tagged `output` inside Evidence / Acceptance View.
- `FIND-GENERATED-BUILDER-MISSING` is tagged `blocked` inside Scope / Execution View for full promotion/repeatability.

The artifact does not use tags such as `implements`, `verifies`, `evidences`, `code.target`, or `test.required`.

## 7 Core View Coverage Matrix

| Core View                  | Coverage | Key node kinds                                                 | Key edge types                                      | Retained boundary                                                             |
| -------------------------- | -------- | -------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Intent View                | present  | `task`, `requirement`, `decision`, `document`                  | `targets`, `requires`, `approves`                   | Promotion decision remains user-controlled.                                   |
| Behavior View              | present  | `requirement`, `behavior`, `code`, `data`                      | `implements`, `satisfies`, `reads`, `takes-input`   | Fixture behavior is representative, not full app proof.                       |
| Structure View             | present  | `code`, `data`, `task`                                         | `touches`, `reads`, `targets`                       | Project/code anchors remain manual demo-support boundaries.                   |
| Scope / Execution View     | present  | `task`, `document`, `behavior`, `check`, `evidence`, `finding` | `requires`, `preserves`, `reports-on`               | Contracts expose selected/non-scope boundaries and generated-builder gap.     |
| Impact View                | present  | `decision`, `change`, `finding`, `evidence`, `task`            | `touches`, `invalidates`, `preserves`, `reports-on` | PP-001 stale/reopen and compatibility cleanup caveats remain visible.         |
| Verification View          | present  | `behavior`, `check`, `evidence`, `code`                        | `verifies`, `evidences`                             | UI visual evidence is partial even though runtime behavior evidence is fresh. |
| Evidence / Acceptance View | present  | `evidence`, `decision`, `document`, `finding`                  | `evidences`, `approves`, `reports-on`, `requires`   | Renewed Acceptance is recorded; limited pilot promotion approval is pending.  |

## Confidence / Freshness Split

The artifact separates confidence from freshness/status.

Examples:

- `EV-SEARCH-NOTE-TEST` has `confidence: tool-confirmed` and `freshnessStatus: fresh`.
- `AT-ROOT` has `confidence: user-confirmed` and `freshnessStatus: fresh`.
- `EV-SEARCH-TEST` has `confidence: tool-confirmed` and `freshnessStatus: stale`.
- `EV-SEARCH-REVIEW` has `confidence: inferred` and `freshnessStatus: stale`.

`stale` is never used as a confidence value.

## Retained Warnings

| Warning                                                | Classification after refresh                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| Bounded fixture Evidence, not full Todo app runtime    | acceptable warning for limited pilot                                    |
| UI screenshot/manual visual evidence remains partial   | acceptable warning for limited pilot                                    |
| Generated graph builder or CLI-backed output is absent | later implementation requirement for full promotion or CI repeatability |
| ACEP task-card public-doc cleanup deferred             | deferred cleanup                                                        |

## Remaining Gaps

- No generated graph builder or CLI-backed read-model output exists.
- UI screenshot/manual visual evidence remains partial.
- ACEP task-card public-doc cleanup remains deferred.
- Actual scoped limited pilot transition execution remains a separate task.

## Limited Pilot Readiness Judgment

```text
Node/Edge/Tag parity: demonstrated for limited pilot review with retained warnings
Limited pilot package: user approved bounded limited pilot option; transition record prepared
Full promotion: not ready without generated builder / broader parity decision
```

This means the previous Graph-first baseline refresh blocker is resolved for limited pilot review, and the bounded Todo
Search limited pilot option has been approved into `docs/concept/limited-pilot-transition-record.md`. It does not make
full promotion ready.

## Why This Is Not Graph-Source Promotion

- The source inputs remain tree-native artifacts.
- This file is a read/alignment output only.
- No source model is changed.
- No tree-native artifact is marked as projection.
- No generated graph builder, CLI, schema, runtime model, validator, migration, or rollback command is implemented.
- User promotion approval is still required before any source authority change.
