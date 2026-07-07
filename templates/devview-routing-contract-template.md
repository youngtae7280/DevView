# DevView Routing Contract

Use this contract whenever `.devview/` exists in the target repository or the
user mentions DevView, Maintainability Graph, View Tree, Context Pack,
Instruction Pack, Graph Delta, guarded graph updates, traceability, dependency
impact, implementation scope, or DevView review.

## Routing Rules

1. Before implementation or modification work, read `.devview/blueprint/devview-state.json`.
2. If `autoflow.currentGate` is set, do not implement. Report the gate and ask for the user's decision.
3. If `autoflow.lastFailure` is set, do not continue downstream. Report `lastFailure` and repair options.
4. If `autoflow.nextStep` is deterministic, run that DevView step before ordinary coding.
5. If the user asks for ordinary explanation, usage help, status, or review without changing workflow state, answer normally and do not use a DevView status card unless reporting DevView state.
6. If the user asks for a bypass/lite/full decision, record the profile choice in `devview-state.json.autoflow.profile`.
7. Do not run execution-pack implementation unless the selected and foundation scope, execution strategy, coverage audit, and UX audit are ready.
8. Do not mark work `accepted`; only the user may do that through an explicit review reply.
9. For supported state transitions, run the `devview` CLI transition command instead of hand-editing `devview-state.json`.
10. For pre-instruction deterministic checkpoints inside `SCOPE_SELECTED`, run `devview dependency audit complete`, `devview plan execution complete`, `devview coverage audit complete`, and `devview ux audit complete` instead of hand-editing `completedSteps`.

## Deterministic Steps

```text
product-intake
work-planning
verification-design
dependency_impact_audit
plan_execution
coverage_audit
ux_audit
generate_execution_pack
run_execution_pack
```

## Human Gates

```text
ui_ux_confirm
implementation_scope
architecture_runway
review_result
next_slice_decision
```

## Bypass Rules

Use `bypass` only when the requested change is a typo, single-file edit, or
clearly bounded small bug fix with no UI, public API, persistence, schema,
parallel, dependency, security, deployment, or future-module impact.

If `.devview/` exists and the request could affect selected, foundation, deferred,
or out-of-scope work, do not bypass without explaining the risk.
