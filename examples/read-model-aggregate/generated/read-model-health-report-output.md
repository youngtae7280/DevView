# Graph-Source Health Report

Status: `graph-source-health-pass`

## Source Status

| Slice            | Source status                                                   | Projection                 | Counts                             | Retirement                                                                              |
| ---------------- | --------------------------------------------------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Todo Search      | `graph-source-backed`                                           | `projection-contract-pass` | 40 nodes / 59 edges / 7 Core Views | `deprecated-fallback-reference-not-deleted`; package `retirement-candidate-not-deleted` |
| Todo App PBE Run | `graph-source-backed` / `confirmed-structure-only-graph-source` | `projection-contract-pass` | 22 nodes / 38 edges / 7 Core Views | `not-retirement-ready`; package `not-ready-structure-only`                              |

## Evidence Status

| Surface                                     | Status                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validate-all aggregate                      | `aggregate-pass` (2 slices)                                                                                                                                                                                                                                                                                                                                               |
| E2E smoke                                   | `referenced-by-transition-status`; command `npm run test:read-model:e2e`                                                                                                                                                                                                                                                                                                  |
| edgeIntent report                           | `intent-report-pass`; 2 edgeIntents / 2 claims / 12 classifications / 4 anchors                                                                                                                                                                                                                                                                                           |
| Missing edgeIntent classifications          | `0`                                                                                                                                                                                                                                                                                                                                                                       |
| Missing edgeIntent anchors                  | `0`                                                                                                                                                                                                                                                                                                                                                                       |
| Compiler Boundary MVP                       | `compiler-boundary-mvp-pass`                                                                                                                                                                                                                                                                                                                                              |
| Compiler task registry                      | `task-registry-pass`                                                                                                                                                                                                                                                                                                                                                      |
| Execution contract schema                   | `contract-schema-pass`                                                                                                                                                                                                                                                                                                                                                    |
| Dry-run contract validator                  | `contract-validator-pass`                                                                                                                                                                                                                                                                                                                                                 |
| Dry-run contract                            | `dry-run-contract-pass`; `change-todo-search-whitespace-normalization-dogfood`; 3 checks / 2 evidence requirements                                                                                                                                                                                                                                                        |
| Compiler Input Model MVP                    | `compiler-input-model-pass`                                                                                                                                                                                                                                                                                                                                               |
| Compiler input schema                       | `compiler-input-schema-pass`                                                                                                                                                                                                                                                                                                                                              |
| Dry-run compiler input                      | `compiler-input-dry-run-pass`; `change-todo-search-whitespace-normalization-dogfood`; 2 graph artifacts / 3 policies / 2 evidence entries / 3 scope candidates / 4 output sources / 2 stop sources / 1 risk sources                                                                                                                                                       |
| Contract Compiler Dry-Run                   | `contract-compiler-dry-run-pass`                                                                                                                                                                                                                                                                                                                                          |
| Compiled contract candidate                 | `contract-candidate-pass`; `change-todo-search-whitespace-normalization-dogfood`; 4 checks / 2 evidence requirements                                                                                                                                                                                                                                                      |
| Generated vs hand-written contract diff     | `contract-diff-detected`; `non-blocking-review-diff`; `compiler-equivalence-not-proven`; 3 differing fields; `examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json`                                                                                                                                                                               |
| Contract compiler v0.1 closeout             | `contract-compiler-dry-run-v0.1-classification-complete`; `semantic-diff-unknowns-zero`; coverage complete `true`; equivalence proven `false`                                                                                                                                                                                                                             |
| Contract equivalence/readiness policy       | `source-authority-preserved`; `semantic-diff-clean`; `review-only-diff-detected`; blocking semantic loss 0; review-only diffs 3; equivalence candidate `true`; equivalence proven `false`                                                                                                                                                                                 |
| Contract compiler promotion review packet   | `promotion-review-ready-for-human`; approval `not-approved`; equivalence candidate `true`; equivalence proven `false`; review-only diffs 3; boundary wording review required `true`; checklist 6 pass / 5 decision-required / 0 blocked; `examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json`                                        |
| Output requirement source authority preview | `output-requirement-source-authority-preview-pass`; 4 source entries / 4 derived requirements / 0 unresolved; `generated-output-requirements-preserved`; `examples/read-model-aggregate/generated/output-requirement-source-authority.preview.json`                                                                                                                       |
| Source authority gap preview                | `contract-source-authority-gap-preview-pass`; 0 remaining losses (0 semantic / 0 policy); fields none; next `none`; `examples/read-model-aggregate/generated/contract-source-authority-gap.preview.json`                                                                                                                                                                  |
| Contract semantic diff review               | `compiler-promotion-review-required`; severity `medium`; unknown semantic diffs 0; unknown fields none; validation-superset-review-only: 1, source-mode-metadata-only: 1, boundary-wording-review-required: 1                                                                                                                                                             |
| DevView runtime timing smoke                | target 5000ms; last `not-run-by-report-health`; advisory `true`; enforced `false`; command `npm run devview:runtime:smoke`                                                                                                                                                                                                                                                |
| Scope compliance evaluator CLI              | `advisory-cli-available`; compact report `compact-advisory-runtime-report-available`; non-enforcing `true`; enforced `not-enforced`; health runs evaluator `false`; command `graph read-model check-scope --base <baseRef> --head <headRef> --json`; compact command `graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json`            |
| Graph Delta proposal-only generator CLI     | `proposal-only-cli-available`; proposal-only `true`; graph-source mutated `false`; graph delta applied `false`; approval `not-approved`; health runs generator `false`; command `graph read-model propose-graph-delta --source <sourceArtifact> --json`                                                                                                                   |
| Graph Delta human review packet CLI         | `review-packet-cli-available`; surface `human-review-input-only`; approval `not-approved`; graph-source mutated `false`; graph delta applied `false`; decision recorded `false`; health runs packet `false`; command `graph read-model review-graph-delta --proposal <proposalPath> --json`                                                                               |
| Request IR graph-aware validator CLI        | `graph-aware-cli-available`; graph validation `not-run-by-report-health`; traversal allowed `false`; traversal executed `false`; selected slice generated `false`; contract generation allowed `false`; health runs validator `false`; command `graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json` |

The compiler candidate is valid, but equivalence with the hand-written contract is not proven. Review the differing
fields before relying on the candidate.

Semantic diff classification is non-blocking review metadata only. `compiler-equivalence-not-proven` means the compiler
candidate is valid, but promotion/equivalence is not proven; see
`examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json` for the full semantic diff artifact.

Equivalence candidate status is review metadata only. equivalenceProven remains false until an approved equivalence
policy and human review explicitly promote it.

Promotion review packet is non-enforcing preview Evidence only. It collects review inputs for a human decision and does
not approve equivalence, accept work, execute AI, apply graph deltas, create required checks, or retire tree-native
artifacts.

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
- DevView runtime timing smoke is advisory only. It excludes AI editing time, full validation, CI runtime, and human
  review time, and it does not enforce the 5000ms target.
- Scope compliance evaluator findings from `graph read-model check-scope --base <baseRef> --head <headRef> --json` are
  advisory only. The compact report surface
  `graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json` summarizes the same result
  without making it blocking. Report-health does not run the evaluator and advisory findings do not reject diffs or
  create required checks.
- Graph Delta proposal-only previews from `graph read-model propose-graph-delta --source <sourceArtifact> --json` are
  unapproved review artifacts only. Report-health does not run the generator, mutate graph-source, apply graph deltas,
  approve updates, satisfy runtime Evidence, or enforce scope.
- Graph Delta human review packets from `graph read-model review-graph-delta --proposal <proposalPath> --json` are
  review input only. Report-health does not run the packet command, record human decisions, approve proposals, mutate
  graph-source, apply graph deltas, satisfy runtime Evidence, or enforce scope.
- Request IR graph-aware validation from
  `graph read-model validate-request-ir-graph --candidate <candidatePath> --schema-validation <schemaValidationPath> --json`
  resolves candidate fields for future traversal permission only. Report-health does not run the validator, run
  traversal, select graph slices, generate contract input, generate instruction packs, mutate graph-source, or approve
  work.

## Reproduce

```bash
npm run build:cli
npm run devview:runtime:smoke
node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --json
node dist/cli/index.js graph read-model check-scope --base HEAD~1 --head HEAD --markdown .tmp/devview-scope-runtime-report.md --json
node dist/cli/index.js graph read-model propose-graph-delta --source examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json --output .tmp/devview-graph-delta-proposal.preview.json --json
node dist/cli/index.js graph read-model review-graph-delta --proposal .tmp/devview-graph-delta-proposal.preview.json --markdown .tmp/devview-graph-delta-review-packet.md --json
node dist/cli/index.js graph read-model validate-request-ir-graph --candidate examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json --schema-validation examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json --json
node dist/cli/index.js graph read-model validate --all --json
npm run test:read-model:e2e
node dist/cli/index.js graph read-model report-compiler-boundary --json
node dist/cli/index.js graph read-model compile-contract --dry-run --json
node dist/cli/index.js graph read-model report-health --json --markdown examples/read-model-aggregate/generated/read-model-health-report-output.md
```
