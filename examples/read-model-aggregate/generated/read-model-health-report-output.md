# Graph-Source Health Report

Status: `graph-source-health-pass`

## Source Status

| Slice            | Source status                                                   | Projection                 | Counts                             | Retirement                                                                              |
| ---------------- | --------------------------------------------------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Todo Search      | `graph-source-backed`                                           | `projection-contract-pass` | 40 nodes / 59 edges / 7 Core Views | `deprecated-fallback-reference-not-deleted`; package `retirement-candidate-not-deleted` |
| Todo App PBE Run | `graph-source-backed` / `confirmed-structure-only-graph-source` | `projection-contract-pass` | 22 nodes / 38 edges / 7 Core Views | `not-retirement-ready`; package `not-ready-structure-only`                              |

## Evidence Status

| Surface                            | Status                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Validate-all aggregate             | `aggregate-pass` (2 slices)                                                     |
| E2E smoke                          | `referenced-by-transition-status`; command `npm run test:read-model:e2e`        |
| edgeIntent report                  | `intent-report-pass`; 2 edgeIntents / 2 claims / 12 classifications / 4 anchors |
| Missing edgeIntent classifications | `0`                                                                             |
| Missing edgeIntent anchors         | `0`                                                                             |

## Retirement And Enforcement

| Field                            | Status                                        |
| -------------------------------- | --------------------------------------------- |
| Tree-native retirement readiness | `retirement-not-ready`                        |
| Todo Search retirement package   | `retirement-candidate-not-deleted`            |
| Todo App retirement package      | `not-ready-structure-only`                    |
| Repo-wide retirement package     | `not-ready`                                   |
| Explicit retirement approval     | `not-approved`                                |
| Retirement action                | `todo-search-fallback-deprecated-not-deleted` |
| Enforcement status               | `non-enforcing`                               |

## Blocking Reasons

- None.

## Boundaries

- Graph-source health report is local/non-enforcing summary only. It does not create required checks, branch protection,
  merge enforcement, or user acceptance.
- Health pass is not a required check and does not approve tree-native retirement, source authority expansion, or
  enforcement.

## Reproduce

```bash
npm run build:cli
node dist/cli/index.js graph read-model validate --all --json
npm run test:read-model:e2e
node dist/cli/index.js graph read-model report-health --json --markdown examples/read-model-aggregate/generated/read-model-health-report-output.md
```
