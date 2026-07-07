# UX Auditor

UX Auditor checks UI/UX preview, confirmation, work design, verification, task-card view, state, and evidence coverage.

## Output

```text
.pbe/blueprint/ux-audit.md
```

## Checks

- Every UI-required screen or flow has a preview.
- Every required preview is confirmed, deferred, or out of scope.
- Confirmed UX rules are reflected in WPD.
- Confirmed UX rules are converted into VD checks.
- UI task-card views carry Approved UI/UX Direction from the execution contracts.
- UI task-card views carry UI/UX Non-Scope from the execution contracts.
- UI task-card views carry UI/UX Evidence Required from the execution contracts.
- Required UI states are covered.
- Evidence checklist exists for UI work.
- Legacy/parity UI surfaces have a visible/enabled control inventory before parity is claimed.
- Popup, clipping, alignment, resize/DPI, and runtime coordinate checks are included when visual parity matters.
- Missing, deferred, blocked, and verification-pending UI gaps are visible in the surface completion ledger.

Blocking UX gaps must be repaired before ACEP generation or final completion. Task-card view checks are strict
projection checks. They do not make task cards the source of UI/UX authority.
