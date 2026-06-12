# PBE Routing

PBE routing prevents Codex from treating an active PBE project as an ordinary
one-off coding request.

When `.pbe/` exists, Codex should inspect `.pbe/blueprint/pbe-state.json`
before implementation work. The Autoflow state decides whether Codex should
continue a deterministic step, stop at a human gate, repair a blocked step, or
answer an ordinary non-state-changing question.

For supported stage transitions, Codex should run the deterministic `pbe` CLI
transition command instead of hand-editing `.pbe/blueprint/pbe-state.json`.
The CLI validates artifacts and allowed transitions first, then writes state
history only when the transition is allowed.

## Routing Order

1. If the user asks for usage, explanation, or a conceptual review, answer normally.
2. If `.pbe/` exists and the user asks for code changes, inspect PBE state first.
3. If `currentGate` is active, stop and explain the gate.
4. If `lastFailure` is present and unresolved, stop and explain the failure and repair path.
5. If `nextStep` is deterministic, run that PBE step.
6. If the user explicitly asks for bypass, classify the request as `bypass`, `lite`, or `full`.
7. If no PBE state exists, use `@project-blueprint-engine start` to initialize PBE.

Common transition commands:

```bash
pbe rpd close
pbe ui approve
pbe wpd close
pbe vd close
pbe scope select
pbe acep ready
pbe execution complete
pbe review submit
pbe accept
```

## Deterministic Steps

```text
rpd
visual_reference_intake
design_system_derive
wpd
ui_surface_inventory
vd
dependency_impact_audit
plan_execution
coverage_audit
ux_audit
generate_acep
run_acep
visual_implementation_audit
```

## Human Gates

```text
ui_ux_confirm
implementation_scope
review_result
```

At a human gate, Codex should not ask the user to memorize internal commands.
It should explain why PBE stopped, what risk exists, what to inspect, and give
natural-language reply examples.

## Ordinary AI Answers

PBE routing does not mean every answer needs a status card. Do not use
`[PBE 상태 보고]` for ordinary usage help, conceptual explanations, or reviews
that do not report or change workflow state.

Use the state card for:

- PBE stage completion
- human gate arrival
- PBE status requests
- PBE failure reports
- workflow-changing approval, revision, scope, stop, or next-slice actions
