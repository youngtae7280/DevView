# Read-Model Parity Report

Status: comparison-pass

## Run Identity

- Compared at: 2026-06-25T07:13:38.339Z
- Command identity:
  `pbe graph read-model compare --generated examples/adoption/todo-search-slice/generated/generated-read-model.json --manual examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- Source commit: eaaee15

## Boundary

Comparison reports Evidence only and does not update source or manual artifacts.

This parity report does not promote Maintainability Graph, change source authority, approve scoped source-authority
execution, or retire tree-native artifacts.

## Summary

- Generated nodes: 40
- Manual nodes: 40
- Generated edges: 59
- Manual edges: 59
- Mismatches: 0
- Blocking: 0
- Decision required: 0

## Mismatches

| Severity | Category | Subject                 | Message              |
| -------- | -------- | ----------------------- | -------------------- |
| info     | none     | generated/manual parity | No mismatches found. |

## Control Node Candidates

- Evidence Control Node: resolved-for-generated-output - Generated/manual comparison produced no mismatch.

## Treatment Rules

- Mismatch never auto-fixes source artifacts.
- Mismatch never silently updates manual parity artifacts.
- Mismatch affecting source, acceptance, risk, or authority requires user judgment.
- Mismatch can create Evidence, Impact, Compatibility, or Decision Control Node candidates depending on severity.
