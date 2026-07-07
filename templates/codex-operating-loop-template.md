# Codex Operating Loop

## For Each Task

1. Read the active Cycle Contract.
2. Read the task card.
3. Read the linked Node Execution Contract when present.
4. Confirm the task is inside the active Cycle Slice.
5. Inspect linked Product, Project, Work, and Test node IDs.
6. Inspect linked requirement IDs.
7. Inspect linked verification IDs.
8. Inspect linked UI/UX items if any.
9. Inspect approved UI/UX direction and non-scope for UI tasks.
10. Implement the smallest coherent change.
11. Add or update tests.
12. Run focused validation.
13. If UI changed, update UI/UX evidence notes.
14. Attach evidence to `.devview/evidence/evidence-tree.json` when available.
15. Update coverage notes.
16. Fix failures.
17. Move to the next task only when task acceptance criteria and evidence requirements are satisfied.

## Change Node Rule

Stop and create or request a Change Node when execution discovers a change to product meaning, scope, UX, risk, acceptance criteria, verification strategy, or excluded/deferred/out-of-scope nodes.

## Before Final Completion

1. Read the active Cycle Contract.
2. Read the traceability matrix.
3. Read the UI/UX evidence checklist.
4. Complete final coverage check.
5. Verify excluded nodes were not changed.
6. Run required validation.
7. Write final report only if technical completion criteria are satisfied.
8. Create Result Review Pack.
9. End as `submitted_for_review`, not `accepted`.

Codex must not mark the project complete if any requirement lacks a linked task, any task lacks verification without explanation, any verification item lacks evidence, or any required UI screen lacks state evidence without explanation.

Only the user can mark the result `accepted`.
