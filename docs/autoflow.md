# Autoflow

Autoflow lets a user start Project Blueprint Engine once and then respond in natural language at the points that require human judgment.

## Flow

```text
start
-> rpd
-> ui ux confirm gate
-> wpd
-> vd
-> dependency impact audit
-> implementation scope gate
-> architecture runway gate, when needed
-> plan execution
-> coverage audit
-> ux audit
-> generate acep
-> run acep
-> review result gate
-> next slice decision
```

## Automatic Steps

These steps continue automatically after the previous step succeeds:

```text
rpd
wpd
vd
dependency impact audit
plan execution
coverage audit
ux audit
generate acep
run acep
```

RPD may still ask one requirement question at a time when information is missing. The user does not need to invoke the `rpd` command manually.

## Human Gates

Autoflow stops at:

```text
ui ux confirm
implementation scope
architecture runway
review result
next slice decision
```

At a gate, Codex should explain what the user should review and give natural-language examples for approval, revision, questions, status, or stop.

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
IDLE
-> STARTED
-> RPD_DONE
-> WAITING_UI_UX_CONFIRM
-> UI_UX_APPROVED
-> WPD_DONE
-> VD_DONE
-> DEPENDENCY_IMPACT_AUDITED
-> WAITING_IMPLEMENTATION_SCOPE
-> SCOPE_SELECTED
-> WAITING_ARCHITECTURE_RUNWAY_CONFIRM
-> ARCHITECTURE_RUNWAY_APPROVED
-> PLAN_EXECUTED
-> COVERAGE_AUDITED
-> UX_AUDITED
-> ACEP_GENERATED
-> ACEP_RUN_DONE
-> WAITING_REVIEW_RESULT
-> WAITING_NEXT_SLICE_DECISION
```

`SLICE_ACCEPTED`, `COMPLETED`, `BLOCKED`, and `STOPPED` are terminal or operational states.

`COMPLETED` is whole-project completion only.

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
