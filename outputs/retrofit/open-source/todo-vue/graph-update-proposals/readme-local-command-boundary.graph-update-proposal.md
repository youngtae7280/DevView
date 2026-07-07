# DevView Graph Update Proposal

Status: generated-from-graph-delta

Record: change.todo-vue-readme-local-command-boundary

## Changed Files

| File      | Additions | Deletions |
| --------- | --------: | --------: |
| README.md |         3 |         0 |

## Proposed Node Updates

| Node                                          | Current                   | Proposed                  |
| --------------------------------------------- | ------------------------- | ------------------------- |
| surface.readme-getting-started                | observed                  | observed                  |
| boundary.no-source-behavior-change            | active                    | active                    |
| change.todo-vue-readme-local-command-boundary | implemented-build-pending | implemented-build-pending |

## Edge Intent

- `edge.readme-drives-local-command-record` [change-driver, doc-only]: The selected local change can clarify README command flow while preserving source behavior and upstream boundaries.
- `edge.local-command-record-guards-upstream` [non-goal, upstream-boundary]: The local dogfood change must not become upstream approval, source-authority expansion, package-script change, or behavior change.

## Boundaries

- Mutates graph-source: False
- Applies patch: False
- Requires review before apply: True
- Maintainer intent claimed: False
