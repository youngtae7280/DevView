# Graph-Source Health Report

Status: `graph-source-health-pass`

## Source Status

| Slice            | Source status                                                   | Projection                 | Counts                             | Retirement                                                                              |
| ---------------- | --------------------------------------------------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Todo Search      | `graph-source-backed`                                           | `projection-contract-pass` | 40 nodes / 59 edges / 7 Core Views | `deprecated-fallback-reference-not-deleted`; package `retirement-candidate-not-deleted` |
| Todo App PBE Run | `graph-source-backed` / `confirmed-structure-only-graph-source` | `projection-contract-pass` | 22 nodes / 38 edges / 7 Core Views | `not-retirement-ready`; package `not-ready-structure-only`                              |

## Evidence Status

| Surface                                 | Status                                                                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validate-all aggregate                  | `aggregate-pass` (2 slices)                                                                                                                                    |
| E2E smoke                               | `referenced-by-transition-status`; command `npm run test:read-model:e2e`                                                                                       |
| edgeIntent report                       | `intent-report-pass`; 2 edgeIntents / 2 claims / 12 classifications / 4 anchors                                                                                |
| Missing edgeIntent classifications      | `0`                                                                                                                                                            |
| Missing edgeIntent anchors              | `0`                                                                                                                                                            |
| Compiler Boundary MVP                   | `compiler-boundary-mvp-pass`                                                                                                                                   |
| Compiler task registry                  | `task-registry-pass`                                                                                                                                           |
| Execution contract schema               | `contract-schema-pass`                                                                                                                                         |
| Dry-run contract validator              | `contract-validator-pass`                                                                                                                                      |
| Dry-run contract                        | `dry-run-contract-pass`; `change-todo-search-whitespace-normalization-dogfood`; 3 checks / 2 evidence requirements                                             |
| Compiler Input Model MVP                | `compiler-input-model-pass`                                                                                                                                    |
| Compiler input schema                   | `compiler-input-schema-pass`                                                                                                                                   |
| Dry-run compiler input                  | `compiler-input-dry-run-pass`; `change-todo-search-whitespace-normalization-dogfood`; 3 graph artifacts / 3 policies / 2 evidence entries / 2 scope candidates |
| Contract Compiler Dry-Run v0.1          | `contract-compiler-dry-run-pass`                                                                                                                               |
| Compiled contract candidate             | `contract-candidate-pass`; `change-todo-search-whitespace-normalization-dogfood`; 4 checks / 2 evidence requirements                                           |
| Generated vs hand-written contract diff | `contract-diff-detected`; 10 differing fields; `examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json`                                  |

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
node dist/cli/index.js graph read-model report-compiler-boundary --json
node dist/cli/index.js graph read-model compile-contract --dry-run --json
node dist/cli/index.js graph read-model report-health --json --markdown examples/read-model-aggregate/generated/read-model-health-report-output.md
```
