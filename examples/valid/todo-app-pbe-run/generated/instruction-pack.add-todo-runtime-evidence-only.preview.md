# Frontend Instruction Pack

Status: instruction-pack-generated

## Task Summary

Add or strengthen evidence for the Todo App add button behavior without touching production source.

## Allowed Scope

- allowed-scope-tt-1: `examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json`
- allowed-scope-ev-1: `examples/valid/todo-app-pbe-run/.pbe/evidence/evidence-tree.json`, `examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt`

## Forbidden Scope

- forbidden-production-source-changes: `unresolved:production-source-changes`
- forbidden-graph-source-mutation: `examples/valid/todo-app-pbe-run/graph-source.json`
- forbidden-approval-or-acceptance-changes: `examples/valid/todo-app-pbe-run/.pbe/control/acceptance-tree.json`

## Required Evidence

- required-evidence-tt-1: `examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json`
- required-evidence-ev-1: `examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt`

## Stop Conditions

- stop-if-selected-slice-scope-expands: Contract input mapping requires nodes, edges, files, or product meaning outside the selected slice.
- stop-if-selected-evidence-unavailable: Selected evidence/check nodes cannot be reviewed or linked to command output.
- stop-if-selected-slice-source-authority-loss: Selected graph slice source authority cannot be traced back to graph-source/read-model nodes.

## Output Requirements

- output-evidence-tt-1-status: Report selected evidence/check status for TT-1.
- output-evidence-ev-1-status: Report selected evidence/check status for EV-1.
- output-report-selected-slice-non-execution-boundary: Report that selected-slice contract input is not instruction pack generation, approval, runtime Evidence satisfaction, or enforcement.

## Known Risks

- risk-im-001-scope-drift: Golden run includes a non-blocking analyzed change skeleton.

## Non-goals

- Do not modify forbidden-production-source-changes.
- Do not modify forbidden-graph-source-mutation.
- Do not modify forbidden-approval-or-acceptance-changes.
- Do not trigger Codex execution from this generator.
- Do not mutate graph-source.
- Do not apply graph deltas.
- Do not record approval, acceptance, or a human decision.
- Do not claim runtime Evidence satisfaction or equivalence proof.
- Do not enforce scope or CI.

## Boundary

- This pack is not approval.
- This pack does not trigger Codex execution.
- This pack does not mutate graph-source.
- This pack does not apply graph deltas.
- This pack does not satisfy runtime Evidence.
- This pack does not enforce scope or CI.
- This frontend Instruction Pack is generated from Contract Compiler Input only. It does not trigger Codex execution, does not mutate graph-source, does not apply graph deltas, does not approve work, does not record human decisions, does not satisfy runtime Evidence, does not prove equivalence, does not enforce scope, and does not configure CI required checks.
