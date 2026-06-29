# Tree-Native Retirement Approval Package

Status: approval-package / no-retirement-executed / no-enforcement-change

## Purpose

This package prepares the user decision surface for moving tree-native artifacts from
compatibility/fallback/reference toward retired or deprecated status.

It does not retire, delete, deprecate, migrate, or enforce any artifact. It only records what would need approval,
what would remain fallback/reference, and why current readiness is different for Todo Search, Todo App PBE Run, and
repo-wide scope.

The machine-readable counterpart is
`examples/read-model-aggregate/graph-source-transition-status.json`.

## Shared Approval Criteria

A retirement approval package is not actionable unless all required criteria are visible:

| Criterion                             | Required signal                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| graph-source-backed generation stable | The configured slice generates from graph source with stable expected counts.                       |
| projection/parity accepted            | The slice has parity pass or an explicitly accepted structure-only status.                          |
| validate-all                          | Registry-backed `graph read-model validate --all --json` reports `aggregate-pass`.                  |
| E2E smoke                             | `npm run test:read-model:e2e` passes, including `intentReport`.                                     |
| manual and PR CI                      | Manual and PR informational CI observations have reviewed the same fields.                          |
| rollback/fallback                     | A rollback/fallback path exists and retained fallback/reference artifacts remain available.         |
| user/source boundary                  | User acceptance and source-authority boundaries are explicit.                                       |
| evidence visibility                   | No stale Evidence, hidden retained warning, blocking status, or decision-required status is hidden. |
| explicit approval                     | The user explicitly approves the exact retirement action, replacement, fallback, and review path.   |

## Todo Search Selected Slice

Current readiness: `approval-candidate-not-approved`

Todo Search is the closest configured slice because it is limited graph-source promoted and graph-source-backed for the
selected scope. Its readiness remains blocked by the missing explicit retirement approval.

| Field             | Status                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- |
| generation        | graph-source-backed, 40 nodes / 59 edges / 7 Core Views                                       |
| projection/parity | `projection-contract-pass`, `comparison-pass`, validator-backed `validation-pass`             |
| validate-all      | included in positive validate-all, aggregate-pass                                             |
| E2E               | E2E smoke passes and includes `intentReport`                                                  |
| manual/PR CI      | reviewed in manual and PR informational CI after graph-source-backed generation and E2E smoke |
| rollback path     | source-authority rollback/fallback plan restores tree-native selected-slice operational role  |
| user approval     | required before any tree-native selected-slice retirement/deprecation                         |

If approved later, the candidate action would retire or deprecate only the tree-native selected-slice
operational-source role for Todo Search read-model generation. The tree-native selected-slice artifacts, manual parity
records, CI/E2E evidence, and user acceptance records would remain retained fallback/reference unless the approval
explicitly says otherwise.

## Todo App PBE Run Structure-Only

Current readiness: `not-ready-structure-only`

Todo App PBE Run is confirmed graph-source-backed for the structure-only read-model slice, but this does not approve
source authority beyond `structure-only`.

| Field                 | Status                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------- |
| generation            | graph-source-backed, 22 nodes / 38 edges / 7 Core Views                                      |
| projection/validation | `projection-contract-pass`, validator-backed `validation-pass`                               |
| validate-all          | included in positive validate-all as confirmed structure-only projection contract            |
| E2E                   | E2E smoke passes and includes `intentReport`                                                 |
| manual/PR CI          | reviewed in manual and PR informational CI after confirmed structure-only graph-source state |
| rollback path         | canonical `.pbe` artifacts remain compatibility/fallback/reference                           |
| missing approval      | source authority beyond `structure-only` and explicit retirement approval                    |

No Todo App retirement/deprecation action should be requested from this package. The current safe role remains retained
compatibility/fallback/reference.

## Repo-Wide

Current readiness: `not-ready`

Repo-wide tree-native retirement is not ready. Configured read-model slices have strong local and CI Evidence, but
repo-wide source authority expansion, migration mechanics, artifact snapshots, fallback implementation, public
compatibility retirement, and user approval are not complete.

| Field                        | Status                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| configured-slice Evidence    | Todo Search and Todo App validate-all aggregate-pass                                      |
| E2E                          | local and CI-observed smoke includes transition status and `intentReport`                 |
| rollback/fallback            | plan exists, but repo-wide execution mechanics are not implemented                        |
| remaining fallback/reference | Product/Project/Work/Test/Evidence/Acceptance trees, compatibility views, execution packs |
| missing approval             | repo-wide retirement approval is not requestable yet                                      |

No repo-wide retirement/deprecation action should be requested from this package.

## User Approval Requirement

Codex, CI, validators, generated read-models, E2E smoke, and PR informational runs cannot self-approve retirement.

Any future retirement action must name:

- exact scope
- artifacts or roles to retire/deprecate
- replacement source/projection
- retained fallback/reference set
- rollback path
- stale-evidence and warning review point
- user approval record

## Current Recommendation

- Todo Search: approval candidate for a future narrowly scoped retirement/deprecation decision, but not approved now.
- Todo App: keep compatibility/fallback/reference; do not request retirement while it remains `structure-only`.
- Repo-wide: keep compatibility/fallback/reference; prepare a broader migration/retirement package only after separate
  source-authority and rollback mechanics are complete.
