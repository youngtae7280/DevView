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
8. Run Ambiguity Gate before confirmation.
9. Ask before decomposing.
10. Ask before confirming.
11. Write structured acceptance criteria before executable confirmation.
12. Update files after every confirmed decision.
13. For UI-facing nodes, collect UI/UX intent without asking more than one question at a time.

## Ambiguity Gate

RPD is not a transcription step. It converts user intent into executable Product Tree nodes.

Before confirmation, classify the current candidate as `CLEAR`, `PARTIAL`, or `AMBIGUOUS` using target, condition/state, expected behavior, completion criteria, exception handling, and verification method.

Abstract quality terms such as `clean`, `nice`, `fast`, `stable`, `intuitive`, `깔끔하게`, `보기 좋게`, `빠르게`, or `안정적으로` make the node `PARTIAL` or `AMBIGUOUS` unless the missing slots are resolved.

See [Ambiguity Gate](ambiguity-gate.md).

## EARS Acceptance Criteria

Confirmed executable Product nodes should include `acceptanceCriteria`:

```text
WHEN <condition>,
THE SYSTEM SHALL <observable response>.
```

Keep legacy `acceptance` strings as compatibility summaries. Use `acceptanceNotRequiredReason` only for non-executable document or metadata nodes.

See [EARS Acceptance Criteria](ears-acceptance-criteria.md).

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

Executable confirmed leaves must also have structured acceptance criteria or an explicit non-executable reason. Ambiguous or partial leaves do not unblock WPD.

At completion Codex updates:

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/requirement-tree.md
.pbe/blueprint/rpd-interview-log.md
.pbe/blueprint/rpd-summary.md
```
