# Post-Promotion Observation Runbook

Status: limited-promotion-observation-policy / docs-only / no-workflow-change

## Purpose

This runbook defines how to observe the executed limited Graph-source promotion recorded in
[broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md).

The observed scope is only the Todo Search selected-slice authority surface. Maintainability Graph is the limited source
model for that promoted scope. Tree-native selected-slice artifacts remain maintained compatibility / fallback /
reference artifacts, and tree-native artifacts remain operational source outside explicitly promoted scopes.

## Observation Goals

| Goal                               | Observation rule                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Source boundary remains clear      | Promoted Todo Search graph-source scope must stay distinct from repo-wide source authority.                |
| Projection Evidence stays healthy  | Todo Search generated/manual parity, validation, validate-all, and aggregate Evidence should keep passing. |
| Fallback remains available         | Tree-native selected-slice artifacts must remain usable as compatibility / fallback / reference artifacts. |
| User acceptance remains user-owned | CI, validators, generated reports, and aggregate summaries must not accept product results.                |
| Todo App remains structure-only    | Todo App PBE Run must not be read as source-bearing or parity-backed.                                      |
| CI remains informational           | Manual and PR CI stay non-enforcing unless a separate enforcement decision is approved.                    |

## Execution-Health Criteria

A post-promotion observation is healthy when all of these remain true:

- Todo Search parity report remains `comparison-pass`.
- Todo Search validation remains `validation-pass`.
- Local `pbe graph read-model validate --all` remains `aggregate-pass`.
- Aggregate summary covers exactly the positive registry profiles unless a later registry change is approved.
- Todo App PBE Run remains `structure-only` with validation pass and no parity/pilot marker requirement.
- Retained warnings remain visible.
- Public docs and concept docs do not imply repo-wide promotion, tree-native retirement, or CI enforcement.
- No invalid fixture is added to the positive registry or CI workflow.

## Observation Log Template

Use this compact record for each post-promotion check:

| Field                     | Value                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Date / commit             |                                                                                          |
| Trigger                   | local / manual CI / PR informational / docs review                                       |
| Todo Search parity        |                                                                                          |
| Todo Search validation    |                                                                                          |
| Validate-all / aggregate  |                                                                                          |
| Todo App structure-only   |                                                                                          |
| Retained warnings visible |                                                                                          |
| Source boundary           | clear / ambiguous / blocked                                                              |
| Fallback/reference state  | available / stale / missing                                                              |
| Interpretation            | continue observation / fix docs / regenerate Evidence / rollback review / broader design |

## Escalation Criteria

Escalate to the rollback/fallback plan or a user decision when any of these occur:

- parity mismatch, validation blocked, aggregate blocked, or decision-required status
- stale or missing generated Evidence for the promoted Todo Search scope
- source boundary ambiguity between Maintainability Graph, generated projections, and fallback tree-native artifacts
- user acceptance authority confusion
- Todo App PBE Run read as source-authority-bearing
- invalid fixtures leaking into positive validate-all or CI
- public docs implying repo-wide Graph-source promotion or tree-native retirement
- repeated PR/manual CI failure that makes repeatability Evidence unreliable

## Recommended Observation Window

Initial post-promotion window:

```text
at least 3 healthy post-promotion observations or 1 week of normal graph/read-model changes, whichever comes first
```

If a blocker or boundary ambiguity appears, stop the window and use
[source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md) before broader work continues.

## Next Implementation Branch

Recommended next implementation branch:

```text
Graph source artifact/storage + projection generation
```

This branch should be designed and implemented separately from observation. It should define where the promoted graph
source record lives, how generated projections are produced, how tree-native fallback/reference artifacts remain
available, and how validation proves projection health.

The first decision surface for that branch is
[graph-source-artifact-storage-projection-design.md](graph-source-artifact-storage-projection-design.md).

## Non-Scope

This runbook does not:

- change workflow, CLI, code, tests, generated artifacts, registry entries, or examples
- execute repo-wide Graph-source promotion
- retire tree-native artifacts
- add required checks, branch protection, or CI enforcement
- promote Todo App PBE Run beyond `structure-only`
- add invalid fixtures to CI
- replace user acceptance
