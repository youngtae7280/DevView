# Revision Pack

Revision Pack turns user feedback into bounded patch work.

## Input

```text
.pbe/review/user-feedback.md
.pbe/review/feedback-items.json
```

## Output

```text
.pbe/revisions/rev-001/
  00-revision-summary.md
  01-user-feedback.md
  02-affected-nodes.md
  03-revision-requirements.md
  04-revision-work-plan.md
  05-revision-verification-plan.md
  06-revision-task-cards/
  07-regression-checks.md
  08-review-checklist.md
  revision-result.md
  revision-manifest.json
```

## Rules

- Revision is not a full rewrite.
- Revision tasks must stay within affected requirement, task, UI/UX, and verification scope.
- `revision-manifest.json` must declare `allowedFiles`, `forbiddenFiles`, and `mustNotTouch` boundaries.
- Validator checks changed, staged, and untracked files against revision boundaries.
- Regression checks protect unaffected behavior.
- Scope expansion requires user approval.
- Each feedback-driven revision should record why previous verification missed the issue when the answer is knowable.
- Repeated miss types should become future validation contract requirements instead of repeated local patches.
- Surface re-audit may expand audit and verification scope, but implementation scope still remains bounded by affected
  Product/Project/Work/Test nodes and Change/Impact approval.
