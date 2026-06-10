# RPD Tree Walk

RPD Tree Walk replaces the previous GUI node-selection UX.

Codex controls traversal and keeps state in `.pbe/blueprint/requirement-tree.json`.

## Core Rules

1. Process one current node at a time.
2. Traverse from top to bottom.
3. Use breadth-first traversal by default.
4. Ask exactly one open-ended question at a time.
5. Do not ask multiple questions in one turn.
6. Do not use multiple-choice unless the user explicitly asks.
7. Extract facts after every user answer.
8. Ask before decomposing.
9. Ask before confirming.
10. Update files after every confirmed decision.
11. For UI-facing nodes, collect UI/UX intent without asking more than one question at a time.

## UI/UX Fact Collection

When a node involves a screen, form, flow, notification, or visual state, Codex may collect:

- `uxIntent`
- `primaryUser`
- `primaryFlow`
- `screenStates`
- `responsivePriority`
- `accessibilityNotes`

UI/UX questions still follow the same rule: ask exactly one open-ended question at a time.

## Node Statuses

```text
pending_interview
interviewing
ready_to_decompose
ready_to_confirm
decomposed
confirmed
deferred
out_of_scope
blocked
```

Terminal statuses:

```text
confirmed
deferred
out_of_scope
```

## Completion

RPD is complete only when every leaf node is terminal and no node is `interviewing`, `ready_to_decompose`, or `blocked`.

At completion Codex updates:

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/requirement-tree.md
.pbe/blueprint/rpd-interview-log.md
.pbe/blueprint/rpd-summary.md
```
