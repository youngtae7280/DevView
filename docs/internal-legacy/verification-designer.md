# Verification Designer

VD converts work design into verification design.

## Inputs

```text
.pbe/blueprint/requirement-tree.json
.pbe/blueprint/work-design.json
.pbe/blueprint/work-graph.json
.pbe/blueprint/work-roadmap.md
.pbe/blueprint/ui-ux-confirmation.md
```

## Outputs

```text
.pbe/blueprint/verification-design.json
.pbe/blueprint/verification-plan.md
.pbe/control/visual-verification-profile.json
.pbe/control/hardware-readiness-ledger.json
```

## WorkGraph Method

```text
WPD WorkGraph node
-> linked verification design
-> integration verification for integration nodes and parallel groups
-> root acceptance plan
```

VD should connect verification to WorkGraph nodes and WorkDesign entries. It must not assume RPD requirement nodes are
direct Codex task boundaries.

## UI/UX Verification

Confirmed UI/UX direction must become verification checks. UI verification should cover required elements, required
states, accessibility expectations, and evidence.

## Parity And Hardware Verification

When a project is legacy migration, parity-critical, UI-heavy, or hardware-dependent, VD should add profile-specific
checks without treating deferred work as current-slice failure.

Visual/runtime parity can include:

- screenshot review
- popup visual review
- runtime coordinate check
- resize/DPI review
- clipped-control audit

Hardware-dependent work should distinguish software implementation from hardware certification:

```text
not_implemented
implemented_user_testable
hardware_verification_pending
hardware_certified
```

`hardware_certified` requires explicit evidence. If visual or hardware checks cannot run, record not-runnable evidence
instead of silently passing the check.
