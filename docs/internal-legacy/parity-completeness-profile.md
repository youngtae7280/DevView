# Parity And Completeness Profile

PBE v2.1 adds optional parity/completeness controls for projects where legacy parity, visual runtime behavior, or
hardware-dependent behavior matters.

This profile does not replace Product, Project, Work, Test, Evidence, or Acceptance trees. It adds derived control views
that make completion claims harder to overstate.

## When To Use

Use this profile when a project includes one or more of:

- legacy migration
- parity-critical UI or behavior
- UI-heavy desktop or web surfaces
- hardware-dependent capabilities
- repeated review feedback in the same failure category

Do not force this profile onto small non-UI tasks, typo fixes, or ordinary backend changes unless the user asks for
parity or surface completion control.

## Artifacts

```text
.pbe/control/legacy-control-inventory.json
.pbe/control/surface-completion-ledger.json
.pbe/control/hardware-readiness-ledger.json
.pbe/control/visual-verification-profile.json
.pbe/control/verification-miss-log.json
```

## Rules

### Legacy Inventory

For legacy migration or parity-critical work, PBE must inventory visible or enabled legacy controls before claiming
parity.

Inventory is not implementation scope by itself. Missing controls become Product, Work, Test, deferred, blocked, or
out-of-scope nodes through normal PBE scope rules.

Parity cannot be claimed when required legacy controls are still `missing`, `deferred`, `blocked`, or `unverified`
unless the gap is explicitly recorded as deferred, blocked, or out of scope.

Required legacy event handlers are part of parity. A visible control is not enough when the legacy behavior depends on a
click, toggle, timer, async callback, retry, cancel, busy state, or error handler.

### Surface Completion Ledger

Surface completion is a derived view that separates:

```text
technical_stable -> parity_reviewed -> product_accepted
```

Technical stability means implementation and basic validation passed. It does not mean legacy parity or user acceptance.

Parity reviewed means required inventory, visual/runtime checks, and evidence are present or explicitly marked not
runnable with risk notes.

Product accepted means the user accepted the Product branch through the Acceptance Tree.

Commands that open dialogs, popups, subdialogs, or secondary workflows must create child surface coverage. The command
can be `command_mapped`, but the opened surface needs its own controls, default values, enable/disable states, event
handlers, workflow behavior, and evidence before it can be called complete.

When something was not inspected, record it in `notChecked`. If it has `blocksCompletion: true`, it blocks
`technical_stable`, `parity_reviewed`, and `product_accepted`.

### Visual Verification Profile

Build and open smoke are minimum checks. They are not visual parity evidence.

When visual parity matters, VD should include checks such as:

- screenshot review
- popup visual review
- runtime coordinate check
- resize/DPI review
- clipped-control audit

If a check cannot be run, record the reason and add not-runnable evidence instead of silently treating the check as
passed.

### Hardware Readiness

Hardware-dependent features use four main states:

```text
not_implemented
implemented_user_testable
hardware_verification_pending
hardware_certified
```

Software implementation and official hardware certification are separate. `hardware_certified` requires explicit
certification evidence.

When hardware prevents live validation, PBE must use substitute evidence before closing software readiness: mock-backed
UI validation, fake read/result validation, UI automation with hardware disabled, or an explicit `manual_not_verified`
item that remains blocking.

### Verification Miss Log

When feedback reveals a verification gap, PBE records why the previous verification missed it.

If the same miss type repeats, PBE promotes the learning into the next validation contract instead of treating it as
another local patch.

`legacy_subdialog_control_miss` is a promotion-class miss. It should create or update child surface inventory, Test Tree
coverage, final coverage checks, and Not Checked reporting before similar work is submitted again.

Repeated failure promotion can add Test Tree nodes, Evidence requirements, Visual Verification checks, or stop
conditions. It must not silently expand implementation scope.

## Scope Safety

These artifacts may expand audit and verification scope, but they must not silently expand implementation scope.

If a parity or completion artifact reveals missing Product meaning, UX behavior, acceptance criteria, verification
strategy, or accepted-work drift, create a Change Node and route through Impact Tree and the relevant human gate.
