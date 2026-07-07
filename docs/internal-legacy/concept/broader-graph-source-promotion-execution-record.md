# Broader Graph-Source Promotion Execution Record

Status: limited-graph-source-promoted / user-approved-execution / fallback-retained

## Purpose

This record executes the limited promotion branch from
[broader-graph-source-promotion-decision-package.md](broader-graph-source-promotion-decision-package.md).

The user requested that graph conversion proceed after the preparation package reached 100% maturity. This is treated
as approval to execute a bounded Graph-source promotion under the prepared authority matrix and rollback/fallback plan.

This record is the authority-changing record for the limited scope below. It is not repo-wide tree retirement, CI
enforcement, required-check approval, invalid-fixture CI inclusion, Todo App promotion beyond `structure-only`, or
replacement of user-controlled acceptance.

## User Approval

Approval source:

```text
User requested that graph conversion proceed after preparation was complete.
```

Approval interpretation:

```text
approve limited Graph-source promotion execution using the prepared decision package
```

The approval is scoped by the existing decision package, public-doc cleanup records, authority matrix, and
rollback/fallback plan. It does not approve unrelated repo-wide retirement or enforcement work.

## Executed Scope

| Area                             | Executed authority result                                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promotion scope                  | Limited Graph-source promotion for the Todo Search selected-slice authority surface.                                                                                       |
| Promoted source model            | Maintainability Graph is the source model for approved Todo Search selected-slice graph relationships and Core View traversal semantics.                                   |
| Tree-native selected-slice files | Reclassified from current operational source to maintained compatibility / fallback / reference artifacts for the promoted Todo Search scope. They are not retired.        |
| Generated Todo Search read-model | Projection/Evidence artifact for the promoted limited graph-source scope. It remains generated Evidence and must not silently override source records or user judgment.    |
| Todo App DevView Run             | Remains `structure-only` Evidence only. It is not parity-backed, pilot-marker-backed, source-authority-bearing, or promoted.                                               |
| Positive read-model registry     | Remains execution metadata for non-enforcing validate-all Evidence. Registry inclusion is not source promotion by itself.                                                  |
| CI and PR informational Evidence | Remains non-enforcing repeatability Evidence. No required check, branch protection, merge blocking, or source authority consequence is added.                              |
| Cycle / Node Execution Contracts | Remain bounded execution authority. Source promotion does not authorize silent scope expansion or missing Evidence.                                                        |
| Acceptance authority             | Remains user-controlled. Graph-source promotion does not let Codex, CI, validators, or generated artifacts accept product results.                                         |
| Public-doc cleanup               | Batch A/B/C/D cleanup/review is accepted as sufficient for this limited execution branch. No broader waiver is created.                                                    |
| Rollback/fallback                | [source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md) is active as the fallback plan for this limited promotion; no rollback is needed. |

## State Change

Before this record:

```text
promotion-decision-package-ready / preparation-complete-with-user-decision-required
```

After this record:

```text
limited-graph-source-promoted
```

Meaning:

```text
Maintainability Graph is the approved source model for the bounded Todo Search selected-slice authority surface.
Tree-native selected-slice artifacts remain maintained compatibility / fallback / reference artifacts.
Repository-wide source authority remains unchanged outside the promoted scope.
```

## Authority Matrix After Execution

| Artifact family                         | Post-execution role for promoted scope                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Maintainability Graph                   | Limited source model for Todo Search selected-slice graph relationships and Core View traversal semantics.                |
| Product / Project / Work Trees          | Maintained compatibility / fallback / reference views for the promoted Todo Search scope.                                 |
| Test / Evidence / Acceptance Trees      | Maintained verification, evidence, and user-acceptance fallback/reference views; user acceptance remains user-controlled. |
| Generated read-model                    | Generated projection and Evidence surface over the limited promoted source model.                                         |
| View Instance Manifest                  | Projection/coverage Evidence for Core View traversal and view role separation.                                            |
| Parity / validation / aggregate reports | Evidence for drift, validation, and repeatability; not independent acceptance or enforcement.                             |
| CI evidence manifest                    | Non-enforcing repeatability Evidence.                                                                                     |
| ACEP execution pack / task-card views   | Compatibility/execution views over Cycle Contract and Node Execution Contract obligations.                                |
| Todo App DevView Run                    | Structure-only Evidence fixture; not source-bearing.                                                                      |

Outside the promoted Todo Search selected-slice scope, the existing tree-native source authority model remains in force
until another explicit promotion execution record changes that boundary.

## Guardrails

- No tree-native artifact is deleted, retired, or marked obsolete by this record.
- No generated artifact becomes independent user acceptance.
- No CI pass becomes a required check or merge gate.
- No invalid fixture is enrolled in the positive registry or CI workflow.
- No Todo App source-authority promotion is performed.
- No repo-wide Graph-source promotion is claimed.
- No future compatibility retirement is implied.
- Any conflict between promoted graph-source interpretation and fallback/reference artifacts must use the
  rollback/fallback plan and user judgment.

## Verification Expectations

This execution remains healthy only while these checks pass:

- local registry-backed `devview graph read-model validate --all`
- Todo Search generated/manual parity remains `comparison-pass`
- Todo Search validation remains `validation-pass`
- Todo App DevView Run remains `structure-only` and `validation-pass`
- aggregate summary remains reviewable, with retained warnings visible
- public-doc wording continues to distinguish source, projection, compatibility, Evidence, and user acceptance

If these checks fail, the rollback/fallback plan defines the stop, fallback, review, or recovery path.

Post-promotion observation details are recorded in
[post-promotion-observation-runbook.md](post-promotion-observation-runbook.md). That runbook defines the observation log
fields, escalation criteria, and the initial health window before the next graph source artifact/storage branch should
be treated as stable enough to begin.

## Non-Scope

This execution record does not:

- retire tree-native artifacts
- promote Todo App DevView Run beyond `structure-only`
- add CI enforcement, required checks, branch protection, push triggers, or schedule triggers
- add invalid fixtures to CI
- implement migration scripts or schema changes
- regenerate generated artifacts by itself
- replace user-controlled acceptance
- complete repo-wide Graph-source promotion

## Final Statement

Limited Graph-source promotion is now executed for the Todo Search selected-slice authority surface.

The preparation package is no longer merely waiting for a user decision for that limited branch. The selected branch has
been executed with fallback retained, compatibility views preserved, and repo-wide promotion still out of scope.
