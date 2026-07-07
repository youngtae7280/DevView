# Human Gates

PBE automatically runs deterministic stages, but it stops when the next step requires product judgment.

## Gates

- `ui_ux_confirm`: approve or revise the UI/UX preview before UI implementation.
- `implementation_scope`: select the safe current slice after dependency impact analysis.
- `architecture_runway`: approve foundation work when the slice needs structural runway.
- `review_result`: inspect implementation results, evidence, failures, and risks.
- `next_slice_decision`: decide whether to start another slice or complete the project.

## Gate Report Rules

At a gate, PBE should report:

- current state
- why automation stopped
- what the user should inspect
- recommended response examples
- downstream stages that will run after approval

PBE should not show only "waiting". It should make the next human action obvious.

## Natural Language Mapping

Examples:

```text
"approve" -> approve
"looks good, continue" -> approve / continue
"defer settings to the next slice" -> mark_deferred
"fix the empty state copy" -> revise
"what is risky here?" -> ask
"stop" -> stop
```
