# User Acceptance

Technical completion and user acceptance are separate.

## Codex-Owned Statuses

```text
implemented
verified
submitted_for_review
revision_requested
revision_in_progress
revision_verified
```

## User-Owned Status

```text
accepted
```

Codex must not set `accepted`.

When the user explicitly approves at the final Review Result gate, that user message is the acceptance action. PBE may
record Autoflow as `DONE` and store the approval in review artifacts.

## If The User Is Dissatisfied

1. Collect feedback.
2. Classify feedback.
3. Map feedback to affected requirement, task, UI/UX, and verification items.
4. Create a Revision Pack.
5. Run revision within affected scope.
6. Run regression checks.
7. Submit for review again.
