# DevView Graph Update Proposal

Status: generated-from-graph-delta

Record: change.escape-html-symbol-stringification

## Changed Files

| File          | Additions | Deletions |
| ------------- | --------: | --------: |
| index.js      |         1 |         1 |
| test/index.js |         6 |         0 |

## Proposed Node Updates

| Node                                      | Current                             | Proposed                            |
| ----------------------------------------- | ----------------------------------- | ----------------------------------- |
| module.escape-html-function               | observed                            | observed                            |
| boundary.no-escape-rule-change            | active                              | active                              |
| change.escape-html-symbol-stringification | implemented-build-pass-runtime-pass | implemented-build-pass-runtime-pass |

## Edge Intent

- `edge.symbol-change-extends-coercion` [behavior-change, stringification]: Replacing concatenation coercion with String(value) is the narrow code path that supports Symbol input while preserving existing stringified outputs.
- `edge.symbol-change-guards-escaping` [non-goal, escape-rules]: The dogfood must not alter the match regex, replacement entities, public package metadata, dependencies, or upstream state.

## Boundaries

- Mutates graph-source: False
- Applies patch: False
- Requires review before apply: True
- Maintainer intent claimed: False
