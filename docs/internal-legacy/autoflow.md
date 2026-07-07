# Autoflow

Autoflow lets a user start Project Blueprint Engine once and then respond in natural language at the points that require
human judgment.

## Flow

```text
start
-> rpd
-> ui ux confirm gate
-> visual reference intake, when selected UI work changes visual appearance
-> design system derive, when visual work is selected
-> wpd
-> ui surface inventory, when visual work is selected
-> vd
-> dependency impact audit
-> implementation scope gate
-> plan execution
-> coverage audit
-> ux audit
-> generate acep
-> run acep
-> visual implementation audit, when visual work is selected
-> review result gate
```

## Automatic Steps

These steps continue automatically after the previous step succeeds:

```text
rpd
visual reference intake
design system derive
wpd
ui surface inventory
vd
dependency impact audit
plan execution
coverage audit
ux audit
generate acep
run acep
visual implementation audit
```

RPD may still ask one requirement question at a time when information is missing. The user does not need to invoke the
`rpd` command manually.

## Human Gates

Autoflow stops at:

```text
ui ux confirm
implementation scope
review result
```

At a gate, Codex should explain what the user should review and give natural-language examples for approval, revision,
questions, status, or stop.

## Response Format

For stage completion, gate arrival, failure, and status requests, PBE must answer with:

```text
[PBE 상태 보고]
```

first. Free-form explanation belongs under:

```text
[Codex 메모]
```

This prevents the official workflow status from being mixed with ordinary AI commentary.

Every active human gate must include a `추천 답변`.

## Natural Language Mapping

```text
"approve" -> approve
"looks good" -> approve
"continue" -> approve / continue
"select scope: ..." -> select_scope
"full scope" -> select_full_scope
"defer ..." -> mark_deferred
"foundation first" -> mark_foundation
"what is the dependency impact?" -> ask_dependency_impact
"fix ..." -> revise
"review the risk" -> ask
"current status" -> status
"stop" -> stop
"complete current slice" -> complete_current_slice
"start next slice" -> start_next_slice
"complete project" -> complete_project
```

## State Model

```text
INIT
-> RPD_DONE
-> WAITING_UI_UX_CONFIRM
-> UI_UX_APPROVED
-> VISUAL_CONTRACT_READY
-> WPD_DONE
-> UI_SURFACE_INVENTORY_DONE
-> VD_DONE
-> WAITING_IMPLEMENTATION_SCOPE
-> SCOPE_SELECTED
-> ACEP_READY
-> EXECUTION_IN_PROGRESS
-> ACEP_RUN_DONE
-> VISUAL_AUDIT_DONE
-> WAITING_REVIEW_RESULT
-> ACCEPTED
-> DONE
```

Inside `SCOPE_SELECTED`, deterministic pre-ACEP work is tracked as checkpoints, not as new top-level states:

```text
dependency_impact_audit
-> plan_execution
-> coverage_audit
-> ux_audit
-> generate_acep
```

Use the matching CLI commands to record those checkpoints. Do not hand-edit `completedSteps`.

Visual states are skipped only when selected work does not change visual appearance or has an explicit not-required or
waiver record.

`DONE` requires explicit user approval. Automatic failures do not move to a canonical `BLOCKED` state; they keep the
last valid state and record `lastFailure`.

## Failure Behavior

If an automatic step fails, Autoflow stops and reports:

- failed step
- reason
- what the user should inspect
- whether the issue looks user-fixable or retryable
- downstream steps that will be retried after repair

Autoflow must not continue to the next deterministic step while blocked.

## Backward Compatibility

Existing step commands remain supported. They should update `autoflow` state consistently when used manually.
