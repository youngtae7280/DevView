# Read-Model Parity Report

Status: comparison-warning

## Run Identity

- Compared at: 2026-06-25T03:55:22.670Z
- Command identity:
  `pbe graph read-model compare --generated examples/adoption/todo-search-slice/generated/generated-read-model.json --manual examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- Source commit: ba34953

## Boundary

Comparison reports Evidence only and does not update source or manual artifacts.

This parity report does not promote Maintainability Graph, change source authority, approve scoped source-authority
execution, or retire tree-native artifacts.

## Summary

- Generated nodes: 40
- Manual nodes: 40
- Generated edges: 59
- Manual edges: 59
- Mismatches: 5
- Blocking: 0
- Decision required: 0

## Mismatches

| Severity | Category                 | Subject                          | Message                                                  |
| -------- | ------------------------ | -------------------------------- | -------------------------------------------------------- |
| warning  | stale/freshness mismatch | AC-SEARCH-003                    | Generated freshness differs from manual parity artifact. |
| warning  | stale/freshness mismatch | TT-SEARCH-003                    | Generated freshness differs from manual parity artifact. |
| warning  | stale/freshness mismatch | CCN-ACEP-TASK-CARD-AUTHORITY-001 | Generated freshness differs from manual parity artifact. |
| warning  | stale/freshness mismatch | FIND-PARTIAL-UI                  | Generated freshness differs from manual parity artifact. |
| warning  | stale/freshness mismatch | FIND-ACEP-CLEANUP-DEFERRED       | Generated freshness differs from manual parity artifact. |

## Control Node Candidates

- Evidence Control Node: candidate - Generated/manual parity mismatch needs review before authority-bearing execution.

## Treatment Rules

- Mismatch never auto-fixes source artifacts.
- Mismatch never silently updates manual parity artifacts.
- Mismatch affecting source, acceptance, risk, or authority requires user judgment.
- Mismatch can create Evidence, Impact, Compatibility, or Decision Control Node candidates depending on severity.
