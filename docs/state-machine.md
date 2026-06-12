# PBE State Machine

PBE gates must not be skipped.

## States

```text
INIT
RPD_DONE
WAITING_UI_UX_CONFIRM
UI_UX_APPROVED
VISUAL_CONTRACT_READY
WPD_DONE
UI_SURFACE_INVENTORY_DONE
VD_DONE
WAITING_IMPLEMENTATION_SCOPE
SCOPE_SELECTED
ACEP_READY
ACEP_RUN_DONE
VISUAL_AUDIT_DONE
WAITING_REVIEW_RESULT
DONE
```

## Normal Flow

```text
INIT
-> RPD_DONE
-> WAITING_UI_UX_CONFIRM
-> UI_UX_APPROVED
-> VISUAL_CONTRACT_READY, when selected UI work changes visual appearance
-> WPD_DONE
-> UI_SURFACE_INVENTORY_DONE, when selected UI work changes visual appearance
-> VD_DONE
-> WAITING_IMPLEMENTATION_SCOPE
-> SCOPE_SELECTED
-> ACEP_READY
-> ACEP_RUN_DONE
-> VISUAL_AUDIT_DONE, when selected UI work changes visual appearance
-> WAITING_REVIEW_RESULT
-> DONE, when the user explicitly approves the slice, branch, or whole project
```

Pre-ACEP deterministic checkpoints do not create top-level states. While state
remains `SCOPE_SELECTED`, use:

```bash
pbe dependency audit complete
pbe plan execution complete
pbe coverage audit complete
pbe ux audit complete
```

These commands record `dependency_impact_audit`, `plan_execution`,
`coverage_audit`, and `ux_audit` in `autoflow.completedSteps`. `pbe acep ready`
must not pass until all four checkpoints are complete.

## Human Gates

`WAITING_UI_UX_CONFIRM` accepts:

- approve / continue -> `UI_UX_APPROVED`
- revise -> remain at gate
- ask -> remain at gate
- stop -> record the stop request without advancing downstream

`WAITING_IMPLEMENTATION_SCOPE` accepts:

- select_scope -> `SCOPE_SELECTED`
- select_full_scope -> `SCOPE_SELECTED`
- mark_deferred -> remain at gate
- ask_dependency_impact -> remain at gate
- stop -> record the stop request without advancing downstream

`WAITING_REVIEW_RESULT` accepts:

- approve / continue -> `DONE`, only when the user explicitly approves the reviewed branch or slice
- start next slice -> `WAITING_IMPLEMENTATION_SCOPE`
- revise -> bounded revision flow
- ask -> remain at gate
- stop -> record the stop request without advancing downstream

## Rules

- Required Foundation, Blocking Dependency, or High-Impact Future Module decisions are handled through the implementation scope gate and `lastFailure` records.
- `DONE` is used only after explicit user approval for the reviewed branch, slice, or whole project.
- `accepted` may exist as a delivery status, but only the user can set it and it must include explicit acceptance metadata.
- Any automatic step failure records `lastFailure`, keeps the last valid canonical state, and stops downstream progress.
- Legacy state names may be read as explicit migration aliases, but new artifacts must use the canonical states above.
