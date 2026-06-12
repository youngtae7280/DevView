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

## Visual Design Contract

- Required only for visual UI tasks.
- Visual reference: `.pbe/blueprint/visual-reference.json`
- Theme spec: `.pbe/blueprint/ui-theme-spec.md`
- Visual source:
- Waiver:

## Design Token Source

- `.pbe/blueprint/design-tokens.json`
- Token groups required: colors, spacing, radius, typography, border, shadow, motion

## Component Style Contract

- `.pbe/blueprint/component-style-contract.json`
- Shared components changed:
- Local exceptions:

## UI Surface Inventory

- `.pbe/control/ui-surface-inventory.json`
- Surface IDs:
- Required visual states:

## Visual Non-Scope

- Do not change visual behavior outside selected/foundation UI surfaces.
- Do not remove controls for visual simplification.
- Do not introduce non-token colors, spacing, radius, shadows, typography, or motion unless explicitly recorded as an exception.

## Screenshot Evidence Required

- Required screenshots/manual notes:
- Evidence Tree node IDs:
- Stale evidence replacement required:

## Visual Deviation Rule

- Record every visual deviation with disposition: user_accepted, revise_required, deferred, out_of_scope, or waived.
- Stop before review if a required visual deviation has no disposition.

## Parity / Completion References

- Surface completion IDs:
- Legacy inventory IDs:
- Visual verification profile IDs:
- Hardware readiness IDs:
- Verification miss IDs:

Use these only when the parity/completeness profile is active. They may require audit, evidence, or validation updates, but they do not expand implementation scope unless the Cycle Contract or an approved Change Node includes that work.

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
- Visual Design Contract compliance note if visual UI changed
- Screenshot/manual visual evidence if visual UI changed
- Legacy inventory comparison if parity is claimed
- Visual/runtime evidence if visual parity is required
- Hardware readiness or certification evidence if hardware-dependent

## Coverage Update Required

After completing this task, update or reference:

- `04-traceability-matrix.md`
- `04-traceability-matrix.json`
- `15-ui-ux-evidence-checklist.md` if UI changed
- `16-final-coverage-check.md`
- final report evidence notes
