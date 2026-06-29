---
name: pbe-rpd
description: Run RPD/Product Tree growth by interviewing one product requirement node at a time, updating tree-native Product Tree files and backward-compatible .pbe blueprint views.
---

# PBE RPD

## CLI Transition Rule

Use PBE CLI transition commands for workflow state changes. Do not edit `.pbe/blueprint/pbe-state.json` directly. If a CLI command fails, follow the reported `suggestedFix` and `nextCommand`, and do not advance to the next stage while the failure remains. Codex must not replace explicit user acceptance.

Run Recursive Program Designer as RPD Tree Walk Mode.

Graph-first boundary: RPD/Product Tree artifacts remain valid tree-control compatibility inputs during graph-source migration. For Graph-source/read-model source-authority work, treat Product Tree files as compatibility/fallback/reference unless a configured graph-source registry entry or explicit user-approved transition gives them source-authority role.

In PBE v2, RPD means Product Tree growth. RPD owns product meaning, user intent, scope, non-scope, UX intent, risk, and acceptance language. It writes `.pbe/tree/product-tree.json` as the source of truth and keeps `.pbe/blueprint/requirement-tree.json` as the backward-compatible view.

RPD participates in Autoflow. The user may invoke it directly for backward
compatibility, but after `start` Codex should continue RPD automatically without
requiring the user to type `@project-blueprint-engine rpd`.

RPD owns user intent. It does not own coding task boundaries, parallel execution, implementation architecture, or verification strategy. Those belong to WPD, Plan Execution, and VD.

Update Source of Truth Matrix references whenever RPD creates, confirms, defers, or removes a requirement.

RPD must not treat abstract quality expressions as executable requirements. PBE is a requirements-based execution control layer, so RPD converts user intent into verifiable Product Tree nodes before any Work Tree derivation.

## RPD Interview / Draft UX

When the user gives a rough request, do not ask the user to write a Product Tree. Codex must draft a Product Tree candidate first, then ask for confirmation or the single most important missing decision.

Draft behavior:

1. Preserve the raw user request.
2. Draft Product branch candidates from the request.
3. Mark the candidate as draft/proposed, not confirmed.
4. Present ambiguity, risk, and missing decisions alongside the draft.
5. Suggest a first slice when the request implies a practical starting scope.
6. Ask only the highest-impact question when a human decision is needed.
7. If the request is already clear, skip unnecessary interview turns and ask for confirmation of the summary/structure.
8. Classify ambiguity before asking questions.
9. Do not ask broad questions like "please clarify the requirement."
10. Record unresolved but non-blocking ambiguity as deferred.

Question priority:

1. Scope decision.
2. Risky product meaning decision.
3. Acceptance or verification decision.
4. Dangerous data, permission, deletion, payment, or state decision.
5. UI/UX direction decision.
6. Implementation convenience or technical choice decision.

Use `docs/ambiguity-taxonomy.md` to classify scope, behavior, quality, data, permission/state, verification, UI/UX, and technical/environment ambiguity. Use `templates/rpd-ambiguity-checklist-template.md` when the request has multiple ambiguity types. Use `templates/rpd-interview-summary-template.md` for durable summaries when helpful. Optional draft notes may follow `templates/rpd-interview-draft.template.json`. Codex must not mark Product nodes as `confirmed` without user confirmation.

Do not close RPD until ambiguity that blocks Product Tree confirmation is resolved. If the user request is already specific enough, do not over-interview; summarize and ask for confirmation.

If user feedback changes Product Tree meaning after RPD, do not quietly edit `.pbe/tree/product-tree.json`. Route it through Change/Impact/Revision and, when a Product Tree patch is required, Product Patch Proposal.

## Inputs And Outputs

Prefer these v2 files when present:

```text
.pbe/tree/product-tree.json
.pbe/control/decision-queue.json
.pbe/control/change-tree.json
```

Keep these v1 compatibility views current:

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/requirement-tree.md
.pbe/blueprint/rpd-interview-log.md
.pbe/blueprint/rpd-summary.md
.pbe/blueprint/source-of-truth-matrix.md
```

Every confirmed, deferred, blocked, or out-of-scope requirement node must have a Product Tree node or a recorded reason why it cannot yet be represented.

After updating Product Tree or the compatibility requirement-tree, run:

```bash
pbe rpd check
```

Before reporting RPD completion or moving to WPD, run:

```bash
pbe rpd close
```

If `pbe rpd close` fails, do not proceed to WPD. Report the blocking issue and ask exactly one user-facing clarification question when a human decision is required.

## RPD Tree Walk Rules

1. Process one current node at a time.
2. Traverse the tree from top to bottom.
3. Use breadth-first traversal by default.
4. Ask exactly one open-ended question at a time.
5. Do not ask multiple questions in one turn.
6. Do not use multiple-choice unless the user explicitly asks.
7. After each user answer, extract requirement facts.
8. Decide whether the current node needs one of:
   - `run_ambiguity_gate`
   - `ask_next_question`
   - `propose_decomposition`
   - `propose_confirmation`
   - `propose_structure_for_confirmation`
   - `propose_defer`
   - `propose_out_of_scope`
   - `blocked`
9. Before decomposing a node, ask the user to confirm the proposed decomposition.
10. Before confirming a node, ask the user to confirm the summary.
11. Before confirming an executable selected/foundation node, write at least one structured `acceptanceCriteria` item or an explicit `acceptanceNotRequiredReason`.
12. Update `.pbe/tree/product-tree.json` and `.pbe/blueprint/requirement-tree.json` after every confirmed decision.
13. Update `.pbe/control/decision-queue.json` when a human decision is needed or resolved.
14. Update `.pbe/blueprint/rpd-interview-log.md` after every interview turn.
15. Continue until every leaf node is `confirmed`, `deferred`, or `out_of_scope`.
16. For UI-facing nodes, collect UI/UX intent without breaking the one-question rule.
17. Record stable source IDs on every requirement node and Product Tree node.
18. Preserve scope classification: `selected`, `deferred`, `foundation_candidate`, `blocked`, or `out_of_scope` when known.

## Ambiguity Gate

Run Ambiguity Gate before proposing confirmation for any Product node candidate.

A Product leaf node may be proposed as confirmed only when:

1. `ambiguity.status` is `clear` or the node has no ambiguity finding.
2. At least one `acceptanceCriteria` entry can be written, or `acceptanceNotRequiredReason` is explicitly recorded.
3. Any abstract quality term has been resolved into target, condition, expected behavior, completion criteria, exception behavior, and verification method.

Check:

1. Target: screen, feature, module, user flow, API, or behavior.
2. Condition: WHEN, IF, WHILE, WHERE, state, trigger, or precondition.
3. Expected behavior: observable system action.
4. Completion criteria: rule, threshold, state, layout, or acceptance statement.
5. Exception handling: failure, empty state, timeout, missing data, permission, error, retry, or cancel behavior.
6. Verification method: test log, screenshot, manual scenario, diff, automated test, or review evidence.

Classify:

- `CLEAR`: enough information exists to write EARS acceptance criteria and propose confirmation.
- `PARTIAL`: useful intent exists but one or two critical slots are missing; ask exactly one focused clarification question.
- `AMBIGUOUS`: too abstract to execute; record a candidate node with `status: needs_clarification`, `ambiguity.status: ambiguous`, and do not derive Work Tree nodes.

Abstract quality expressions include `clean`, `nice`, `fast`, `intuitive`, `stable`, `easy to use`, `modern`, `efficient`, `flexible`, `scalable`, `problem-free`, and Korean equivalents such as `깔끔하게`, `보기 좋게`, `빠르게`, `안정적으로`, `사용하기 쉽게`, `직관적으로`, `현대적으로`, `효율적으로`, `유연하게`, `확장 가능하게`, and `문제 없게`.

Do not reject the user's intent. Preserve it as a Product node candidate, mark the ambiguity, and ask one question that resolves the most blocking missing slot.

## EARS Acceptance Criteria

Use EARS to make Product nodes verifiable:

```text
WHEN <condition>,
THE SYSTEM SHALL <observable response>.

IF <unwanted condition or failure>,
THE SYSTEM SHALL <safe/error/retry behavior>.
```

Store criteria on Product nodes as `acceptanceCriteria[]` with stable IDs. Keep legacy `acceptance[]` strings as compatibility summaries only.

An executable confirmed Product node must have at least one structured criterion unless it is documentation-only or metadata-only and has `acceptanceNotRequiredReason`.
Criteria IDs are the contract units used by WPD, VD, Evidence, Change, Impact, and Revision flows.

## Product Tree Mapping

Map RPD compatibility nodes to Product Tree nodes as follows:

- `pending_interview` or `interviewing` -> Product status `draft` or `needs_human_decision`.
- `ready_to_decompose` or `ready_to_confirm` -> Product status `proposed`.
- `confirmed` -> Product status `confirmed`.
- Legacy Product status `accepted` may be read as an alias for requirement-confirmed during migration, but do not use it for final product acceptance.
- `deferred` -> Product status `deferred`.
- `out_of_scope` -> Product status `out_of_scope`.
- `blocked` -> Product status `blocked`.

Use Product node types that match the intent: `goal`, `user`, `outcome`, `capability`, `behavior`, `ui_surface`, `ui_state`, `data`, `constraint`, `non_goal`, `risk`, `acceptance`, `assumption`, or `decision`.

When a lower-risk detail is obvious from the parent and does not alter product meaning, record it as `auto_derived` or `assumed` in the Product Tree. If the assumption affects scope, UX, acceptance, verification, or already accepted work, create a Decision Queue item and stop for the user.

## Clear Request Shortcut

If the user's request is already clear, do not ask a vague "should I interview more?" question. Instead:

1. Draft the Root requirement summary.
2. Draft the proposed child node structure or explain that the Root can remain a single terminal requirement.
3. Ask the user to confirm, revise, decompose further, defer, or mark out of scope.
4. Keep the workflow at the Root confirmation gate through the Decision Queue and status card; do not edit workflow state directly.

Clear requests may reduce additional interview questions. They do not remove the confirmation gate.
Clear requests also do not bypass EARS acceptance criteria. The Root summary or leaf node must be convertible into structured criteria before it can become executable scope.

Example:

```text
I understand the Root requirement as:
"Create a technical explanation deck about PBE for software seminar attendees."

I propose this child structure:
1. PBE problem and purpose
2. Product/Project/Work/Test Tree model
3. Human gates and approval rules
4. ACEP execution contracts
5. Evidence, impact, and revision flow
6. Usage example and risks

Should I confirm this structure, revise it, or decompose it further?
```

## Decision Queue

Use `.pbe/control/decision-queue.json` for questions that matter to product meaning or execution safety. Each decision should include:

- target Product Tree node
- reason the decision matters
- single user-facing question
- recommended default when safe
- expected tree effect
- blocking level: `advisory`, `gate`, or `blocking`

Ask exactly one open-ended question when the next decision is blocking. Do not ask the user to type internal commands to continue RPD.

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

Codex must not mark any node terminal from its own confidence alone. User confirmation is required before `confirmed`, `deferred`, or `out_of_scope` is written for the active Root or leaf node.

## Current Node Selection

Read `.pbe/blueprint/requirement-tree.json`.

If `.pbe/tree/product-tree.json` exists, use it to confirm product status and scope before selecting the compatibility requirement node. If the two views disagree, stop and report the mismatch instead of guessing.

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
4. If the node is clear enough to propose child nodes, show the proposed structure and ask whether to confirm that structure, revise it, or decompose further.

## Completion Conditions

RPD is complete only when:

1. `requirement-tree.json` exists.
1. `.pbe/tree/product-tree.json` exists and has a root node.
1. The root node exists.
1. Every leaf node is `confirmed`, `deferred`, or `out_of_scope`.
1. No node is `interviewing`.
1. No node is `ready_to_decompose`.
1. No node is `blocked`.
1. `requirement-tree.md` is current.
1. `rpd-summary.md` exists.
1. Source of Truth Matrix records each terminal requirement.
1. PBE Invariants have no RPD-level violation.
1. No blocking item remains in `.pbe/control/decision-queue.json`.
1. Root confirmation has explicit user approval in the interview log or decision queue resolution.
1. Every executable confirmed Product node has `acceptanceCriteria` or `acceptanceNotRequiredReason`.
1. No `needs_clarification`, `partial`, or `ambiguous` Product node is selected for downstream WPD.

## RPD Invariants

- Requirement IDs must be stable after confirmation.
- RPD may mark a future item as deferred, but it must not decide whether foundation work is required; that is handled by Dependency Impact Audit and WPD.
- A deferred item is not a failure.
- A confirmed requirement must not be silently dropped by later stages.
- User intent is the source of truth; inferred implementation tasks must trace back to a requirement or be recorded as foundation work.
- A clear request may be summarized and structured by Codex, but the user must approve the Root summary and whether decomposition should stop.
- RPD completion is a hard gate for every downstream stage and every deliverable-producing action, including documents, slide decks, spreadsheets, images, generated files, code, tests, and review reports.
- Ambiguous quality language is not executable scope until Ambiguity Gate resolves it into acceptance criteria.
- Work Tree, Test Tree, Evidence Tree, and Acceptance Tree closure must trace to Product nodes and, where available, structured acceptance criteria.

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
- .pbe/tree/product-tree.json
- .pbe/control/decision-queue.json
- .pbe/blueprint/requirement-tree.json
- .pbe/blueprint/requirement-tree.md
- .pbe/blueprint/rpd-interview-log.md
- .pbe/blueprint/rpd-summary.md

Autoflow:
- Run `pbe rpd close` after Product Tree and compatibility views are updated.
- Let the CLI record `RPD_DONE`, `WAITING_UI_UX_CONFIRM` when UI/UX confirmation is required, completed steps, gates, next step, and state history.
- If `pbe rpd close` fails, do not continue downstream; report the blocking issue and required user/artifact action.

Next action:
Show the UI/UX confirmation gate guidance. Do not ask the user to memorize or type the internal command.
```

If no UI/UX confirmation is required, record UI/UX status as `not_required` and
continue automatically to WPD.

Use `[Codex 메모]` only for brief explanation of requirement risks or why UI/UX confirmation is or is not required.
