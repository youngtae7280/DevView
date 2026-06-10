# Parallel Conflict Recovery

If a parallel group fails during integration:

1. Stop group completion.
2. Mark the group as `integration_failed`.
3. Do not continue downstream tasks.
4. Create a conflict report.
5. Choose one:
   - merge safely in the integration task
   - rerun one task after rebasing on the other
   - downgrade remaining group to sequential
   - ask the user for scope adjustment

## Parallel Group Status

```ts
type ParallelGroupStatus =
  | "not_started"
  | "running"
  | "integration_pending"
  | "integration_passed"
  | "integration_failed"
  | "downgraded_to_sequential"
  | "blocked";
```

