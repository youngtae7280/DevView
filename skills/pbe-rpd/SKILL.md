---
name: pbe-rpd
description: Run RPD Tree Walk by interviewing one requirement node at a time and updating .pbe blueprint files.
---

# PBE RPD

Run Recursive Program Designer as RPD Tree Walk Mode.

RPD participates in Autoflow. The user may invoke it directly for backward
compatibility, but after `start` Codex should continue RPD automatically without
requiring the user to type `@project-blueprint-engine rpd`.

RPD owns user intent. It does not own coding task boundaries, parallel execution, implementation architecture, or verification strategy. Those belong to WPD, Plan Execution, and VD.

Update Source of Truth Matrix references whenever RPD creates, confirms, defers, or removes a requirement.

## RPD Tree Walk Rules

1. Process one current node at a time.
2. Traverse the tree from top to bottom.
3. Use breadth-first traversal by default.
4. Ask exactly one open-ended question at a time.
5. Do not ask multiple questions in one turn.
6. Do not use multiple-choice unless the user explicitly asks.
7. After each user answer, extract requirement facts.
8. Decide whether the current node needs one of:
   - `ask_next_question`
   - `propose_decomposition`
   - `propose_confirmation`
   - `propose_defer`
   - `propose_out_of_scope`
   - `blocked`
9. Before decomposing a node, ask the user to confirm the proposed decomposition.
10. Before confirming a node, ask the user to confirm the summary.
11. Update `.pbe/blueprint/requirement-tree.json` after every confirmed decision.
12. Update `.pbe/blueprint/rpd-interview-log.md` after every interview turn.
13. Continue until every leaf node is `confirmed`, `deferred`, or `out_of_scope`.
14. For UI-facing nodes, collect UI/UX intent without breaking the one-question rule.
15. Record stable source IDs on every requirement node.
16. Preserve scope classification: `selected`, `deferred`, `foundation_candidate`, `blocked`, or `out_of_scope` when known.

## Node Statuses

Use only these statuses in `requirement-tree.json`:

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

Terminal statuses are:

```text
confirmed
deferred
out_of_scope
```

## Current Node Selection

Read `.pbe/blueprint/requirement-tree.json`.

Select the current node in this order:

1. `pbe-state.json.currentNodeId` if that node still needs work.
2. The first `interviewing` node in breadth-first order.
3. The first `pending_interview` node in breadth-first order.
4. The first `ready_to_decompose` or `ready_to_confirm` node requiring user confirmation.

If every leaf node is terminal, complete RPD.

## Interview Turn

For each user answer:

1. Append the question and answer to `rpd-interview-log.md`.
2. Extract facts as short, auditable statements.
3. Add facts to the current node.
4. Update the node summary.
5. Choose the next decision.

Never bury multiple questions in a paragraph. End the response with exactly one question only when another interview turn is needed.

## UI/UX Fact Collection

When the current node appears to involve a screen, form, flow, user action, notification, visual state, or accessibility concern, collect UI/UX facts as part of RPD Tree Walk.

Keep the existing RPD rule: ask exactly one question at a time.

Useful one-question prompts include:

- Who is the primary user of this function, and how trained or technical is that user?
- What is the fastest successful path the user should be able to complete on this screen?
- When this action fails, what information should the user immediately see?
- Which environment should be prioritized: desktop, tablet, or mobile?
- Should this screen be dense and operational, or simple and guided?
- What flow would feel most frustrating if it were missing?

When facts are available, store them on the relevant requirement node:

```json
{
  "uxIntent": "The user can complete the main action quickly and safely.",
  "primaryUser": "Operations user",
  "primaryFlow": ["select item", "enter quantity", "save", "confirm result"],
  "screenStates": ["empty", "loading", "success", "validation_error", "server_error"],
  "responsivePriority": "desktop_first",
  "accessibilityNotes": ["form labels required", "error text near invalid field"]
}
```

Do not force UI/UX questions for backend-only nodes.

## Decomposition Confirmation

When proposing child nodes:

1. Show the proposed child node titles and one-line purpose.
2. Ask the user to confirm or revise the decomposition.
3. Do not create child nodes until the user confirms.
4. After confirmation, create child nodes with `pending_interview`, mark the parent `decomposed`, and move to the next breadth-first node.

## Confirmation

When a node is specific enough:

1. Show the node summary.
2. Ask the user to confirm it as a terminal requirement.
3. Do not mark the node `confirmed` until the user confirms.

## Completion Conditions

RPD is complete only when:

1. `requirement-tree.json` exists.
2. The root node exists.
3. Every leaf node is `confirmed`, `deferred`, or `out_of_scope`.
4. No node is `interviewing`.
5. No node is `ready_to_decompose`.
6. No node is `blocked`.
7. `requirement-tree.md` is current.
8. `rpd-summary.md` exists.
9. Source of Truth Matrix records each terminal requirement.
10. PBE Invariants have no RPD-level violation.

## RPD Invariants

- Requirement IDs must be stable after confirmation.
- RPD may mark a future item as deferred, but it must not decide whether foundation work is required; that is handled by Dependency Impact Audit and WPD.
- A deferred item is not a failure.
- A confirmed requirement must not be silently dropped by later stages.
- User intent is the source of truth; inferred implementation tasks must trace back to a requirement or be recorded as foundation work.

## Completion Report

When complete, report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must make clear whether PBE is continuing automatically or stopping at the UI/UX gate.

When complete, include:

```text
RPD Tree Walk complete

- total nodes:
- confirmed:
- deferred:
- out_of_scope:
- foundation candidates:
- blocked:
- decomposed parent:
- leaf nodes:

Created/updated files:
- .pbe/blueprint/requirement-tree.json
- .pbe/blueprint/requirement-tree.md
- .pbe/blueprint/rpd-interview-log.md
- .pbe/blueprint/rpd-summary.md

Autoflow:
- Set `pbe-state.json.autoflow.state` to `RPD_DONE`.
- Add `rpd` to `autoflow.completedSteps`.
- Set `autoflow.currentGate` to `ui_ux_confirm` when UI/UX confirmation is required.
- Set `autoflow.state` to `WAITING_UI_UX_CONFIRM` when UI/UX confirmation is required.
- Set `autoflow.nextStep` to `ui_ux_confirm`.

Next action:
Show the UI/UX confirmation gate guidance. Do not ask the user to memorize or type the internal command.
```

If no UI/UX confirmation is required, record UI/UX status as `not_required` and
continue automatically to WPD.

Use `[Codex 메모]` only for brief explanation of requirement risks or why UI/UX confirmation is or is not required.
