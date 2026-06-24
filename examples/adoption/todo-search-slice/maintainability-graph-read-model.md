# Maintainability Graph Read-Model Parity Artifact

Status: manual equivalent parity artifact

This artifact shows how the `Todo Search Adoption + Product Meaning Feedback` selected-slice tree-native artifacts can
be read as a Maintainability Graph read/alignment model.

It is not Graph-source promotion. It does not change source authority, does not mark tree-native artifacts as
projections, and does not implement a generated graph builder, CLI command, schema, runtime model, or validator.

## What This Demonstrates

This read-model artifact demonstrates that the selected slice can be represented as graph-style nodes and edges while
preserving:

- Product intent and acceptance criteria
- Project / boundary nodes
- Work scope and file boundaries
- Test / Check nodes
- Evidence status and freshness
- Change and Impact history after `PP-001`
- renewed user Acceptance with warnings retained
- Cycle and Node Execution Contract boundaries
- compatibility warning / deferred cleanup visibility
- source-authority boundary

The machine-readable parity output is recorded in:

```text
examples/adoption/todo-search-slice/maintainability-graph-read-model.json
```

## Source Inputs

The read model is derived manually from these reviewable sources:

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

## Node Summary

| Graph area            | Representative nodes / records                                     | Parity status |
| --------------------- | ------------------------------------------------------------------ | ------------- |
| Product / intent      | `PT-SEARCH-001`, `AC-SEARCH-001`, `AC-SEARCH-002`, `AC-SEARCH-003` | present       |
| Project / boundary    | `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`                    | present       |
| Work                  | `WT-SEARCH-001`                                                    | present       |
| Test / Check          | `TT-SEARCH-001`, `TT-SEARCH-002`, `TT-SEARCH-003`, `TT-SEARCH-004` | present       |
| Evidence              | `EV-SEARCH-TEST`, `EV-SEARCH-REVIEW`, `EV-SEARCH-NOTE-TEST`        | present       |
| Acceptance            | `AT-ROOT`                                                          | present       |
| Product Patch         | `PP-001`                                                           | present       |
| Change / Impact       | `CH-001`, `IM-SEARCH-001`                                          | present       |
| Execution Contract    | `CYCLE-TODO-SEARCH`, `NEC-WT-SEARCH-001`                           | present       |
| Approval / Control    | `AB-TODO-SEARCH`, compatibility warning candidate                  | present       |
| Compatibility warning | `CCN-ACEP-TASK-CARD-AUTHORITY-001`                                 | present       |

## Edge Summary

The read model preserves the required edges:

| Required relationship                            | Parity status | Notes                                                                  |
| ------------------------------------------------ | ------------- | ---------------------------------------------------------------------- |
| Product -> Project                               | present       | Product node derives Todo surface/helper boundaries.                   |
| Product -> Work                                  | present       | `PT-SEARCH-001` maps to `WT-SEARCH-001`.                               |
| Project -> Work                                  | present       | Project boundary nodes realize the selected Work node.                 |
| Work -> Test                                     | present       | Work node links to title, empty-query, no-result, and note tests.      |
| Test -> Evidence                                 | present       | Fixture Evidence backs title, empty-query, and note/content checks.    |
| Evidence -> Acceptance                           | present       | `EV-SEARCH-NOTE-TEST` supports renewed Acceptance with warnings.       |
| Product Patch -> Change                          | present       | `PP-001` resolves the note/content product meaning change.             |
| Change -> Impact                                 | present       | `CH-001` is analyzed by `IM-SEARCH-001`.                               |
| Impact -> affected Work/Test/Evidence/Acceptance | present       | Affected nodes are classified, with partial UI Evidence retained.      |
| Contract -> Work/Test/Evidence boundaries        | present       | Cycle and Node contracts bound title + note/content scope.             |
| Approval Brief -> Acceptance / warnings          | present       | Approval Brief summarizes renewed Acceptance and retained warnings.    |
| Compatibility warning -> readiness review item   | present       | Supplemental ACEP task-card mismatch remains visible as deferred work. |

## Parity Checklist

| Check                                                              | Status  | Evidence                                                                |
| ------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------- |
| Product -> Project -> Work -> Test -> Evidence -> Acceptance trace | present | JSON read model plus source trees and Approval Brief.                   |
| Change / Impact stale-reopen history                               | present | `PP-001`, `CH-001`, `IM-SEARCH-001`, and affected node classifications. |
| Execution Contract boundary                                        | present | Cycle Contract and Node Execution Contract are represented as nodes.    |
| Approval Brief and user acceptance authority                       | present | `AB-TODO-SEARCH` points to `AT-ROOT`; user acceptance remains separate. |
| Compatibility warning / deferred cleanup                           | present | `CCN-ACEP-TASK-CARD-AUTHORITY-001` is included as warning reference.    |
| Source authority boundary                                          | present | Metadata states tree-native artifacts remain operational source.        |
| Generated graph builder                                            | missing | No generator/CLI/schema/runtime model is implemented.                   |
| UI screenshot/manual visual parity                                 | partial | No-result UI screenshot/manual visual evidence remains partial.         |

## Retained Warnings

| Warning                                                | Classification after this artifact                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Bounded fixture evidence, not full Todo app runtime    | acceptable warning                                                                                 |
| UI screenshot/manual visual evidence remains partial   | acceptable warning                                                                                 |
| Generated graph builder or CLI output is not available | later implementation requirement for full promotion; resolved for limited pilot by manual artifact |
| ACEP task-card public-doc cleanup deferred             | deferred cleanup                                                                                   |

## Blocker Resolution Judgment

This manual parity artifact resolves the prior read-model output blocker for limited pilot promotion decision
preparation because it provides an observable graph/read-model output with nodes, edges, parity status, retained
warnings, and source-authority boundary.

It does not resolve the full generated-builder question. Full promotion, repeatable CI validation, or automated graph
parity may still require a generated graph builder or CLI-backed read-model report.

## Why This Is Not Graph-Source Promotion

- The source inputs remain tree-native artifacts.
- This file is a read/alignment output only.
- No source model is changed.
- No tree-native artifact is marked as projection.
- No generated graph builder, CLI, schema, runtime model, validator, migration, or rollback command is implemented.
- User promotion approval is still required before any source authority change.

## Readiness Conclusion

For limited pilot promotion decision preparation:

```text
ready_with_warnings
```

For full promotion:

```text
not_ready_without_generator_or_full_parity_decision
```
