# Result Review

Result Review prepares Codex output for user review.

Result Review is an Autoflow human gate. Codex should explain what to inspect and accept natural-language approval,
revision requests, questions, status, or stop.

## Output

```text
.pbe/review/
  codex-final-report.md
  result-summary.md
  changed-files.md
  validation-results.md
  coverage-result.md
  ui-ux-evidence.md
  user-review-checklist.md
  user-feedback.md
  feedback-items.json
```

## Delivery Status

Codex may submit:

```text
submitted_for_review
```

Codex must not mark:

```text
accepted
```

Only the user can accept the result.

## User Guidance

At the gate, show:

- execution result
- failed tests
- coverage audit result
- UX audit result
- remaining risks
- items that may need rerun

If the user approves, complete Autoflow. If the user requests changes, map the feedback and run the bounded revision
workflow.
