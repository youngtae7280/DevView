# DevView UserPromptSubmit Advisory

Status: user-prompt-submit-advisory-generated
Mode: advisory (advisory-only, non-enforcing)
Additional context ready: true

## DevView Status

- Strict mode: disabled.
- Guided enforcement: disabled.
- Tool blocking: disabled.
- Codex execution is not triggered.

## Prompt

- Source: inline-prompt
- Preview: Add Todo App runtime evidence for the add button behavior without touching production source.

## Preflight

- Status: ready-from-preflight
- Terminal stage: instruction-pack-preview-generated-no-codex-execution

## Validation Chain

- Request IR schema-only validation
- graph-aware Request IR validation
- graph traversal plan
- selected graph slice
- Contract Compiler Input
- Instruction Pack preview

## Instruction Pack Summary

- Source: examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json
- Task: Add or strengthen evidence for the Todo App add button behavior without touching production source.

## Allowed Scope

- allowed-scope-tt-1: `examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json`
- allowed-scope-ev-1: `examples/valid/todo-app-pbe-run/.pbe/evidence/evidence-tree.json`, `examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt`

## Forbidden Scope And Non-goals

- forbidden-production-source-changes: `unresolved:production-source-changes`
- forbidden-graph-source-mutation: `examples/valid/todo-app-pbe-run/graph-source.json`
- forbidden-approval-or-acceptance-changes: `examples/valid/todo-app-pbe-run/.pbe/control/acceptance-tree.json`
- Do not treat this advisory context as approval.
- Do not mutate graph-source or apply graph deltas.
- Do not claim runtime Evidence satisfaction or equivalence proof.
- Do not enforce scope or CI from this preview.

## Required Evidence

- required-evidence-tt-1: `examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json`
- required-evidence-ev-1: `examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt`

## Output Requirements

- output-evidence-tt-1-status: Report selected evidence/check status for TT-1.
- output-evidence-ev-1-status: Report selected evidence/check status for EV-1.
- output-report-selected-slice-non-execution-boundary: Report that selected-slice contract input is not instruction pack generation, approval, runtime Evidence satisfaction, or enforcement.

## Stop Conditions

- stop-if-selected-slice-scope-expands: Contract input mapping requires nodes, edges, files, or product meaning outside the selected slice.
- stop-if-selected-evidence-unavailable: Selected evidence/check nodes cannot be reviewed or linked to command output.
- stop-if-selected-slice-source-authority-loss: Selected graph slice source authority cannot be traced back to graph-source/read-model nodes.

## Known Risks

- risk-im-001-scope-drift: Golden run includes a non-blocking analyzed change skeleton.

## Boundary

- This UserPromptSubmit advisory report summarizes DevView preflight context only. It does not install hooks, trust repositories, start active hook sessions, block Codex execution or tools, call an LLM/API, invoke providers, run validation or traversal, mutate graph-source, apply graph deltas, automate approval or human decisions, accept or satisfy Evidence, prove equivalence, enforce scope, or configure CI.
