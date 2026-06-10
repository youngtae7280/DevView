# Traceability

Traceability Matrix exists to stop Codex from losing requirements while implementing.

It links:

```text
Requirement -> Task -> Verification -> Evidence -> Coverage Status
```

## Files

```text
.pbe/codex-execution-pack/04-traceability-matrix.md
.pbe/codex-execution-pack/04-traceability-matrix.json
```

## Rules

- Every confirmed requirement must have at least one linked task.
- Every task must have linked verification or an explicit explanation.
- Every verification item must have required evidence.
- Pending coverage must be resolved, deferred with reason, or blocked with a stop condition.

## During ACEP Execution

Codex checks traceability before final completion. If a requirement, task, or verification item is disconnected, Codex continues working or stops with a clear reason.
