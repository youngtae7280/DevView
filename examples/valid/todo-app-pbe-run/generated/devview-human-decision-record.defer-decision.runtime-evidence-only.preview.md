# DevView Human Decision Record

Status: `devview-human-decision-record-created`

| Field                      | Value                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Decision                   | `defer-decision`                                                                                                        |
| Decision kind              | `defer`                                                                                                                 |
| Approval status            | `not-approved`                                                                                                          |
| Proposal                   | `examples/valid/todo-app-pbe-run/generated/graph-delta-proposal.add-todo-runtime-evidence-only.preview.json`            |
| Proposal ID                | `proposal-only-preview-ch-001`                                                                                          |
| Review packet              | `examples/valid/todo-app-pbe-run/generated/graph-delta-human-review-packet.add-todo-runtime-evidence-only.preview.json` |
| Review packet completeness | `incomplete-review-items`                                                                                               |
| Reviewer                   | `human-reviewer`                                                                                                        |
| Decision source            | `explicit-cli-input`                                                                                                    |

## Rationale

Calibration defers approval; no graph-source mutation is authorized.

## Non-Execution Boundary

- Approved proposal state created: `false`
- Graph delta applied: `false`
- Graph-source mutated: `false`
- Runtime Evidence satisfied: `false`
- Equivalence proven: `false`
- Scope enforced: `false`
- CI enforcement enabled: `false`
