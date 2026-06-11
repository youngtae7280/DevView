# Change Rules

## Active Cycle

Cycle ID: {{cycleId}}

## Change Node Required When

- Product behavior changes outside the active Cycle Contract.
- UI flow, UI state, wording, or layout changes beyond approved UI/UX scope.
- API contract, permission, security, data model, migration, deployment, billing, or secret handling changes are discovered.
- Acceptance criteria or verification strategy changes.
- Excluded, deferred, blocked, or out-of-scope nodes need to be touched.
- Evidence from a completed node becomes stale or invalidated.

## Required Action

1. Stop implementation for the affected task.
2. Record or request a Change Node in `.pbe/control/change-tree.json`.
3. Map affected Product, Project, Work, Test, and Evidence nodes.
4. Update or request `.pbe/control/impact-tree.json`.
5. Resume only after the change is approved or the task is revised back inside the active cycle.

## Codex Must Not

- Silently edit accepted Product Tree scope.
- Mark Product branches as `accepted_done`.
- Implement deferred or out-of-scope behavior as foundation work.
- Continue after a required Change Node without recording the change.
