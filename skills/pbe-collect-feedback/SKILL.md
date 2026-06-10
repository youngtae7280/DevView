---
name: pbe-collect-feedback
description: Collect dissatisfied user feedback, classify it, and map it to affected requirements, tasks, UI/UX items, and verification items.
---

# PBE Collect Feedback

Use this skill when the user says the result is not acceptable, asks for changes, or gives review feedback after `submitted_for_review`.

In Autoflow, this skill runs automatically when the user gives a revision
request at the Review Result gate.

## Purpose

Turn user feedback into structured feedback items that can drive a bounded Revision Pack.

## Outputs

```text
.pbe/review/user-feedback.md
.pbe/review/feedback-items.json
```

## Feedback Types

Use one of:

```text
bug
missing_requirement
misinterpreted_requirement
ux_mismatch
visual_mismatch
scope_gap
performance_issue
content_copy_issue
accessibility_issue
other
```

## Mapping Rules

Each feedback item should map to affected artifacts:

- `affectedRequirementIds`
- `affectedTaskIds`
- `affectedUiUxIds`
- `affectedVerificationIds`

If mapping is impossible, provide an explanation and ask at most 1 to 3 clarification questions.

Do not reinterpret the entire project. Keep feedback scoped to the affected items.

## Autoflow

When feedback is mapped clearly:

- Set `pbe-state.json.autoflow.lastUserAction` to `revise`.
- Keep `autoflow.state` at `WAITING_REVIEW_RESULT` while revision is being prepared, or set `deliveryStatus` to `revision_requested`.
- Add or update downstream retry steps:
  - `create_revision_pack`
  - `run_revision`
  - `review_result`
- Continue automatically to `pbe-create-revision-pack`.

When mapping is unclear:

- Do not create revision tasks yet.
- Ask one concise clarification question.
- Keep the user at the Review Result gate.

## JSON Shape

```json
{
  "items": [
    {
      "id": "FB-001",
      "type": "ux_mismatch",
      "rawFeedback": "The screen feels too complicated.",
      "summary": "Simplify the default screen and move secondary inputs into an advanced section.",
      "affectedRequirementIds": ["REQ-001"],
      "affectedTaskIds": ["TASK-001"],
      "affectedUiUxIds": ["SCREEN-001"],
      "affectedVerificationIds": ["TEST-001-UX"],
      "severity": "medium",
      "needsClarification": false,
      "clarificationQuestions": [],
      "desiredOutcome": "Show only essential fields by default.",
      "status": "open"
    }
  ]
}
```

## Completion Report

Report with `[PBE 상태 보고]` first, following `templates/stage-completion-status-card-template.md`.

The state card must say whether feedback mapping is clear enough to continue automatically to Revision Pack creation or whether a clarification question is required.

Include:

- feedback item count
- affected scope
- clarification questions if needed
- next step: create revision pack, automatically when scope is clear
- recommended reply when clarification is needed

Use `[Codex 메모]` only for short mapping rationale.
