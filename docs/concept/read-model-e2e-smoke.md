# Read-Model E2E Smoke

Status: local-smoke-implemented / ci-observation-integrated / manual-and-pr-ci-reviewed / non-enforcing /
no-promotion-change

## Purpose

`npm run test:read-model:e2e` is a local dogfood smoke for the current configured Graph-source transition. It copies the
read-model examples into a temporary workspace, runs the CLI against that workspace, and removes the temporary files after
the run so the repository's generated artifacts do not churn.

The non-enforcing `PBE Read-Model Evidence` workflow now also runs the smoke and writes
`examples/read-model-aggregate/generated/read-model-e2e-smoke-output.json` as an uploaded observation artifact.

Manual workflow run `28223860233` reviewed the CI observation path after integration. The artifact manifest recorded
`e2eSmokeStatus: e2e-smoke-pass`, and the uploaded `read-model-e2e-smoke-output.json` confirmed Todo Search 40/59/7
with `projection-contract-pass`, Todo App 22/38/7 with `projection-contract-pass`, validate-all `aggregate-pass`, and
separate candidate observation `candidate-observation-pass`.

Manual workflow run `28348764191` reviewed the same E2E artifact after `report-intent` coverage was added. The uploaded
E2E output recorded `intentReport.status: intent-report-pass`, native/retrofit fixture summaries, nonzero
edgeIntent/claim/classification/anchor counts, and zero missing classification/anchor counts.

PR #12 run `28348903718` reviewed the same `intentReport` visibility through the non-enforcing
`pull_request-informational` path. The smoke PR was closed without merge, and the remote/local smoke branch plus temp
artifact download were cleaned up.

PR #8 run `28224088829` then reviewed the same E2E smoke visibility through the non-enforcing
`pull_request-informational` path. The smoke PR was closed without merge, and the remote/local smoke branch plus temp
artifact download were cleaned up.

The smoke checks:

- Todo Search graph-source-backed generation, 40 nodes / 59 edges / 7 Core Views
- Todo Search parity and validation pass
- Todo Search projection contract status `projection-contract-pass`
- Todo App PBE Run structure-only generation and validation, 22 nodes / 38 edges / 7 Core Views
- Todo App positive validate-all projection status `projection-contract-pass`
- registry-backed `graph read-model validate --all --json` status `aggregate-pass`
- `examples/read-model-aggregate/graph-source-transition-status.json` source roles and no-retirement/no-enforcement
  boundaries
- tree-native retirement readiness criteria/status: overall `retirement-not-ready`, Todo Search
  `closer-but-not-retirement-ready`, and Todo App `not-retirement-ready`
- tree-native retirement approval package statuses: Todo Search `approval-candidate-not-approved`, Todo App
  `not-ready-structure-only`, and repo-wide `not-ready`
- candidate observation status `candidate-observation-pass` as separate report-only metadata
- local `graph read-model report-intent --json` status `intent-report-pass`, with native/retrofit fixture summaries,
  nonzero edgeIntent/claim/classification/anchor counts, and zero missing classification/anchor counts

## Boundary

This local smoke is Evidence only. It does not add CI enforcement, required checks, repo-wide Graph-source promotion,
tree-native retirement, invalid fixture CI, or Todo App source-authority promotion.
