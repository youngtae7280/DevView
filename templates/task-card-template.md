# Task Card: TASK-001

## Goal

Describe the specific implementation goal.

## Execution Strategy

Mode:
sequential

Active Cycle:
CYCLE-001

Scope Class:
selected

WorkGraph Node IDs:
- WG-001

Product Tree Node IDs:
- PT-001

Project Tree Node IDs:
- PJ-001

Work Tree Node IDs:
- WT-001

Test Tree Node IDs:
- TT-001

Node Execution Contract:
- `.pbe/codex-execution-pack/11-node-execution-contracts/nec-task-001.md`

Parallel Group:
none

Can Run In Parallel With:
- none

Must Run After:
- none

Must Run Before:
- none

Conflict Risk:
medium

Expected Files:
- path/to/expected-file.ext

Expected Shared Files:
- none

Forbidden Files:
- none

Forbidden Changes:
- shared type/schema changes unless this task is explicitly the sequential foundation task
- package or build configuration changes unless explicitly in scope
- auth, permission, migration, payment, deployment, billing, or secret handling changes
- files owned by another task in the same parallel group

Integration Required:
no

Integration Task:
none

## Cycle Scope

Included in active cycle:
yes

Explicitly excluded nodes that must not be touched:
- none

Changes requiring a Change Node:
- product behavior not listed in this task
- UI flow or state not approved in the UI/UX contract
- API, permission, verification, or acceptance changes outside this task
- changes to deferred, blocked, or out-of-scope nodes

## Node Execution Contract

Read the linked Node Execution Contract before editing files. If it conflicts with this task card, stop and report the mismatch instead of guessing.

## Product Tree Links

- PT-001

## Project Tree Links

- PJ-001

## Work Tree Links

- WT-001

## Test Tree Links

- TT-001

## Requirement Links

- REQ-001

## WorkGraph Links

- WG-001

## Verification Links

- TEST-001-1

If verification cannot be linked yet, explain why and add the missing verification before final completion.

## UI/UX Links

- None

If this task changes UI, list the related `SCREEN-*` IDs from `05-ui-ux-spec.json`.

## Approved UI/UX Direction

- Required only for UI tasks.
- Must match `07-ui-ux-confirmation.md`.

## UI/UX Non-Scope

- Required only for UI tasks.
- Do not redesign confirmed flows outside this scope.

## UI/UX Evidence Required

- Required only for UI tasks.
- Include manual verification notes and screenshot path if available.

## UI/UX Confirmation Reference

- `.pbe/codex-execution-pack/07-ui-ux-confirmation.md`

## Scope

- Include only the behavior described by this task.

## Non-Scope

- Do not implement unrelated features.
- Do not change deployment, billing, secrets, or destructive data paths.

## Implementation Notes

- Keep changes focused.
- Follow existing repository conventions.

## Focused Validation

```bash
# Add the smallest useful validation command here.
```

## Evidence Required

- Changed files
- Test file path
- Test command output
- Validation summary
- UI manual verification note if UI changed

## Coverage Update Required

After completing this task, update or reference:

- `04-traceability-matrix.md`
- `04-traceability-matrix.json`
- `15-ui-ux-evidence-checklist.md` if UI changed
- `16-final-coverage-check.md`
- final report evidence notes
