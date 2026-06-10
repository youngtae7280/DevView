# Task Card: TASK-INTEGRATION-001

## Goal

Integrate all results from the declared parallel group and verify the combined behavior.

## Execution Strategy

Mode: integration

Parallel Group Integrated:
PG-001

Tasks Integrated:
- TASK-010
- TASK-011

Must Run After:
- TASK-010
- TASK-011

Must Run Before:
- final validation tasks

Conflict Risk:
medium

Expected Shared Files:
- none unless explicitly listed in the execution manifest

Forbidden Changes:
- new shared schema/type changes outside the group contract
- package or build configuration changes
- auth, permission, migration, payment, deployment, billing, or secret handling changes

Integration Required:
yes

Integration Task:
this task

## Requirement Links

- REQ-001

## Verification Links

- TEST-INT-001

## UI/UX Links

- None

## Parallel Group Integrated

PG-001

## Tasks Integrated

- TASK-010
- TASK-011

## Conflict Checks

- Check for file conflicts.
- Check for duplicated implementation.
- Check for incompatible assumptions between tasks.

## Shared Contract Checks

- Verify shared types, schemas, API contracts, validation helpers, and build configuration were not changed outside the declared scope.

## UI/UX Consistency Checks

- If UI changed, compare implementation with `07-ui-ux-confirmation.md` and `05-ui-ux-spec.json`.

## Validation Commands

```bash
# Add focused integration validation command here.
```

## Evidence Required

- Integrated changed files
- Conflict check notes
- Shared contract check notes
- Validation command output
- Traceability and coverage updates

## Integration Evidence

- Diffs reviewed:
- Files touched by group:
- Shared contracts checked:
- Duplicate implementations found:
- Routing/navigation checked:
- UI/UX consistency checked:
- Focused validation command:
- Broader validation command, if needed:
- Remaining risks:
- Decision: pass / needs-fix / blocked

## Remaining Risks

- Record unresolved risks or state `none`.
