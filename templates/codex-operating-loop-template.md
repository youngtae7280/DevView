# Codex Operating Loop

## For Each Task

1. Read the task card.
2. Inspect linked requirement IDs.
3. Inspect linked verification IDs.
4. Inspect linked UI/UX items if any.
5. Inspect approved UI/UX direction and non-scope for UI tasks.
6. Implement the smallest coherent change.
7. Add or update tests.
8. Run focused validation.
9. If UI changed, update UI/UX evidence notes.
10. Update coverage notes.
11. Fix failures.
12. Move to the next task only when task acceptance criteria and evidence requirements are satisfied.

## Before Final Completion

1. Read the traceability matrix.
2. Read the UI/UX evidence checklist.
3. Complete final coverage check.
4. Run required validation.
5. Write final report only if technical completion criteria are satisfied.
6. Create Result Review Pack.
7. End as `submitted_for_review`, not `accepted`.

Codex must not mark the project complete if any requirement lacks a linked task, any task lacks verification without explanation, any verification item lacks evidence, or any required UI screen lacks state evidence without explanation.

Only the user can mark the result `accepted`.
