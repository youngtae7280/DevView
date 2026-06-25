# Todo Search View Instance Manifest

Status: manual view-instance candidate

This manifest describes the 7 Core View projections used to review the `Todo Search Adoption + Product Meaning
Feedback` limited pilot slice under the Graph-first Node/Edge/Tag policy.

It is not source authority. It is not Graph-source promotion. It does not implement a renderer, generator, CLI, schema,
runtime model, or validator. Tree-native selected-slice artifacts remain the current operational source.

## Source References

- `maintainability-graph-read-model.json`
- `maintainability-graph-read-model.md`
- `docs/concept/graph-node-edge-tag-policy.md`
- `docs/concept/view-tree-pack.md`
- selected-slice tree-native artifacts under `examples/adoption/todo-search-slice/`

## Tag Boundary

The manifest uses only view-scoped tags:

```text
target, context, candidate, guard, required, stale, blocked, output
```

These tags describe a node's temporary role inside one view. Durable meaning is carried by edges such as `targets`,
`implements`, `verifies`, `evidences`, `invalidates`, `preserves`, `approves`, and `derives-view`.

View membership is separate from these tags. Each object in `viewInstances` is the membership record for that Core View
id. Its `viewScopedTags` map uses node ids as keys and allowed role tags as values; Core View ids such as
`behavior-view` and `scope-execution-view` are never tag values.

## 7 Core View Coverage

| View                       | Purpose                                                                                       | Coverage |
| -------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Intent View                | Product meaning, acceptance criteria, and pending limited pilot user decision                 | present  |
| Behavior View              | Title + note/content behavior, empty query behavior, no-result behavior, and non-scope guards | present  |
| Structure View             | Code/data/boundary anchors used by the selected slice                                         | present  |
| Scope / Execution View     | Cycle/Node Contract scope, forbidden behavior, required checks, and execution boundaries      | present  |
| Impact View                | PP-001 change, impact classification, stale/partial Evidence, and compatibility warning       | present  |
| Verification View          | Checks, behavior targets, and observable Evidence links                                       | present  |
| Evidence / Acceptance View | Evidence, renewed user Acceptance, retained warnings, and scoped pilot execution boundary     | present  |

## View Notes

### Intent View

The Intent View includes `TASK-TODO-SEARCH-PILOT`, `PT-SEARCH-001`, `AC-SEARCH-*`, `PP-001`, `AT-ROOT`,
`DEC-SCOPED-PILOT-EXECUTION`, the limited pilot decision package, and the limited pilot transition record. It shows
product meaning and the bounded user-approved scoped pilot without approving full promotion.

### Behavior View

The Behavior View includes behavior nodes for title + note/content matching, blank query restoration, no-result data
behavior, and tag/date non-scope guards. Runtime fixture code implements these behaviors through durable `implements`
and `preserves` edges.

### Structure View

The Structure View shows project/code/data anchors. Project boundary nodes remain manual demo-support anchors, not proof
of a complete Todo application.

### Scope / Execution View

The Scope / Execution View keeps Cycle Contract, Node Execution Contract, required tests/evidence, and forbidden
search targets visible. The generated-builder gap is tagged as `blocked` in this view only for full promotion or
repeatability, not as a blocker to manual limited pilot review.

### Impact View

The Impact View shows `PP-001`, `CH-001`, `IM-SEARCH-001`, historical evidence invalidation, refreshed fixture Evidence,
and compatibility cleanup deferral.

### Verification View

The Verification View shows Checks as `check` nodes, Evidence as `evidence` nodes, and durable `verifies` /
`evidences` edges. UI visual evidence remains partial.

### Evidence / Acceptance View

The Evidence / Acceptance View shows present/fresh runtime Evidence, renewed user Acceptance with retained warnings, and
the bounded limited pilot decision approval record. It does not close full promotion approval.

## Non-Promotion Statement

This manifest is a task-scoped projection candidate for review. It does not change source authority, does not mark
tree-native artifacts as projections, and does not approve limited pilot or full Graph-source promotion.
